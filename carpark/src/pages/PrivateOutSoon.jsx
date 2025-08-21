import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/PrivateOutSoon.css";

import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import infoyellow_icon from "../Assets/info-yellow.svg";

import { postSoonOut } from "../apis/parking";

const TOL_SEC = 30; // 10/5분 '근처' 허용 오차(±30초)

const pad2 = (n) => String(n).padStart(2, "0");
const formatHHMM = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const formatDiff = (start, end) => {
  const ms = Math.max(0, end.getTime() - start.getTime());
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0 && mm > 0) return `${h}시간 ${mm}분`;
  if (h > 0) return `${h}시간`;
  return `${mm}분`;
};

// 선택된 장소 세션에서 읽기
const readSelectedPlace = () => {
  try {
    const raw = sessionStorage.getItem("selectedPlace");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// 마지막 좌표 캐시
const getCachedLoc = () => {
  try {
    const raw = localStorage.getItem("lastKnownLoc");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const setCachedLoc = (lat, lng) => {
  try {
    localStorage.setItem(
      "lastKnownLoc",
      JSON.stringify({ lat, lng, ts: Date.now() })
    );
  } catch {}
};

// 8초 내 GPS 실패 시 캐시/장소 좌표로 폴백
const getCoords = (fallback) =>
  new Promise((resolve, reject) => {
    const cached = getCachedLoc() || fallback;

    if (!navigator.geolocation) {
      return cached
        ? resolve({ ...cached, _source: "no-geo" })
        : reject(new Error("no geolocation"));
    }

    const hardTimeout = setTimeout(() => {
      if (cached) return resolve({ ...cached, _source: "timeout" });
      reject(Object.assign(new Error("geo timeout"), { code: 3 }));
    }, 8000);

    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(hardTimeout);
        const coords = { lat: p.coords.latitude, lng: p.coords.longitude };
        setCachedLoc(coords.lat, coords.lng);
        resolve({ ...coords, _source: "gps" });
      },
      (err) => {
        clearTimeout(hardTimeout);
        if (cached)
          return resolve({ ...cached, _source: `error:${err?.code}` });
        reject(err);
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60_000 }
    );
  });

export default function PrivateOutSoon() {
  const navigate = useNavigate();
  const { state } = useLocation() || {};

  const selectedPlace = useMemo(readSelectedPlace, []);
  const placeName =
    state?.placeName ?? selectedPlace?.name ?? "콘하스 DDP 앞 주차장";
  const placeId = state?.placeId ?? selectedPlace?.id ?? placeName;
  const address = state?.address ?? selectedPlace?.address ?? "";

  // 데모 기본값: 시작=30분 전, 종료=현재+11분(10분 테스트 용)
  const now0 = useMemo(() => new Date(), []);
  const [startAt] = useState(() =>
    state?.startAt
      ? new Date(state.startAt)
      : new Date(now0.getTime() - 30 * 60 * 1000)
  );
  const [endAt] = useState(() =>
    state?.endAt
      ? new Date(state.endAt)
      : new Date(now0.getTime() + 11 * 60 * 1000)
  );

  // 남은시간 1초 갱신
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // 10/5분 근처 판별
  const endMs = endAt.getTime();
  const isNear = (min) =>
    Math.abs(now - (endMs - min * 60 * 1000)) <= TOL_SEC * 1000;
  const near10 = isNear(10);
  const near5 = isNear(5);
  const canPressOutSoon = near10 || near5;
  const bubbleMinuteLabel = near5 ? "5분" : "10분";

  // 세션 기준 '누름' 유지
  const pressedKey = `priv-outsoon-pressed-${placeId}-${startAt.getTime()}`;
  const [pressed, setPressed] = useState(() => {
    try {
      return sessionStorage.getItem(pressedKey) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      setPressed(sessionStorage.getItem(pressedKey) === "1");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressedKey]);

  // 곧나감 전송(개인 주차장: provider=private, parkingId 사용)
  const onPressOutSoon = async () => {
    if (!canPressOutSoon) return;

    setPressed(true);
    try {
      sessionStorage.setItem(pressedKey, "1");
    } catch {}

    try {
      const fallback =
        selectedPlace?.lat && selectedPlace?.lng
          ? { lat: selectedPlace.lat, lng: selectedPlace.lng }
          : null;
      const { lat, lng } = await getCoords(fallback);
      const minute = near5 ? 5 : 10;

      const payload = {
        lat,
        lng,
        minute,
        provider: "private",
        parkingId: placeId, // ← private은 parkingId로 보냄
        placeName,
        address,
      };

      await postSoonOut(payload);
      navigate("/privateoutsoon_cancel", {
        state: {
          openModal: true,
          placeName,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        },
      });
    } catch (e) {
      console.error("[private soonout] failed", e);
      alert("‘곧 나감’ 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setPressed(false);
      try {
        sessionStorage.removeItem(pressedKey);
      } catch {}
    }
  };

  return (
    <div className="private-container">
      <div className="private-header">
        <div className="private-text">
          {placeName}
          <br />
          이용중...
        </div>
      </div>

      <div className="private-time-box">
        <div className="private-time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="private-time-text">
            {formatHHMM(startAt)} ~ {formatHHMM(endAt)} (
            {formatDiff(startAt, endAt)})
          </span>
        </div>
      </div>

      <div className="private-notice-box">
        <div className="private-notice-inner">
          <img
            src={infoyellow_icon}
            alt="안내 아이콘"
            className="infoyellow-icon"
          />
          <div className="private-notice-text">
            <p className="private-info-text1">
              출차하시기 전에 ‘곧 나감’도 잊지 말아주세요!
            </p>
            <p className="private-info-text2">
              {canPressOutSoon
                ? "지금 ‘곧 나감’을 누르시면 포인트를 받을 수 있어요!"
                : "‘곧 나감’은 10분/5분 전에만 활성화됩니다."}
            </p>
          </div>
        </div>
      </div>

      <div className="private-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="private-button-section">
        <div className="private-bubble-container">
          {!pressed && (
            <div
              className="private-bubble-box"
              role="status"
              aria-live="polite"
            >
              <span className="private-bubble-text">
                주차 마감 시간{" "}
                <strong>{bubbleMinuteLabel} 전에 '곧 나감'</strong> 버튼을
                눌러주세요!
              </span>
            </div>
          )}

          <button
            className={`private-outsoon ${
              canPressOutSoon ? "active" : "is-disabled"
            }`}
            onClick={onPressOutSoon}
            disabled={!canPressOutSoon}
            aria-disabled={!canPressOutSoon}
            title={!canPressOutSoon ? "10분/5분 전만 가능" : "곧 나감"}
          >
            곧 나감
          </button>
        </div>
      </div>
    </div>
  );
}
