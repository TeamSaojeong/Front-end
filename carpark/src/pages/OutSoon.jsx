// src/pages/OutSoon.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/OutSoon.css";

import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import info_icon from "../Assets/info.svg";
import { postSoonOut } from "../apis/parking";

const ITEM_H = 44;
const TOL_MIN = 0.5;

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

// ===== helpers =====
const readSelectedPlace = () => {
  try {
    const raw = sessionStorage.getItem("selectedPlace");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
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

export default function OutSoon() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const selectedPlace = useMemo(readSelectedPlace, []);
  const placeName = state?.placeName ?? selectedPlace?.name ?? "주차장";
  const placeId = state?.placeId ?? selectedPlace?.id ?? placeName;
  const address = state?.address ?? selectedPlace?.address ?? "";
  const provider = "kakao";

  const inUseByOther = !!state?.inUseByOther;

  const now0 = useMemo(() => new Date(), []);

  // 데모 기본값: 시작=30분 전, 종료=현재+11분
  const [startAt] = useState(() =>
    state?.startAt
      ? new Date(state.startAt)
      : new Date(now0.getTime() - 30 * 60 * 1000)
  );
  const [endAt, setEndAt] = useState(() =>
    state?.endAt
      ? new Date(state.endAt)
      : new Date(now0.getTime() + 11 * 60 * 1000)
  );

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const minsLeft = Math.max(0, (endAt.getTime() - now) / 60000);

  const near10 = Math.abs(minsLeft - 10) <= TOL_MIN;
  const near5 = Math.abs(minsLeft - 5) <= TOL_MIN;
  const canPressOutSoon = inUseByOther && (near10 || near5);

  const pressedKey = useMemo(
    () => `outsoon-pressed-${placeId}-${startAt.getTime()}`,
    [placeId, startAt]
  );
  const [pressedOutSoon, setPressedOutSoon] = useState(() => {
    try {
      return sessionStorage.getItem(pressedKey) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      setPressedOutSoon(sessionStorage.getItem(pressedKey) === "1");
    } catch {}
  }, [pressedKey]);

  const bubbleMinuteLabel = near5 ? "5분" : "10분";

  // ===== 연장 바텀시트 =====
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => [0, 10, 20, 30, 40, 50], []);
  const [open, setOpen] = useState(false);
  const [extH, setExtH] = useState(0);
  const [extM, setExtM] = useState(0);
  const wheelHRef = useRef(null);
  const wheelMRef = useRef(null);
  const scrollTimerH = useRef(null);
  const scrollTimerM = useRef(null);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      if (wheelHRef.current) wheelHRef.current.scrollTop = extH * ITEM_H;
      if (wheelMRef.current) {
        const idx = Math.max(0, minutes.indexOf(extM));
        wheelMRef.current.scrollTop = idx * ITEM_H;
      }
    });
  }, [open, extH, extM, minutes]);

  const snap = (el, idx) =>
    el?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  const onScroll = (type) => (e) => {
    const el = e.currentTarget;
    const rawIdx = el.scrollTop / ITEM_H;
    const idx = Math.round(rawIdx);
    if (type === "h") {
      if (scrollTimerH.current) clearTimeout(scrollTimerH.current);
      scrollTimerH.current = setTimeout(() => {
        const safe = Math.min(Math.max(idx, 0), hours.length - 1);
        snap(el, safe);
        setExtH(hours[safe]);
      }, 100);
    } else {
      if (scrollTimerM.current) clearTimeout(scrollTimerM.current);
      scrollTimerM.current = setTimeout(() => {
        const safe = Math.min(Math.max(idx, 0), minutes.length - 1);
        snap(el, safe);
        setExtM(minutes[safe]);
      }, 100);
    }
  };

  const totalMinutes = extH * 60 + extM;
  const disabledExtend = totalMinutes === 0;
  const selectedText = `${extH}시간 ${pad2(extM)}분 연장`;

  const applyExtend = () => {
    if (disabledExtend) return;
    const next = new Date(endAt);
    next.setHours(next.getHours() + extH);
    next.setMinutes(next.getMinutes() + extM);
    setEndAt(next);
    setOpen(false);
    setExtH(0);
    setExtM(0);
  };

  // ===== 위치 얻기 (타임아웃/캐시/장소좌표 폴백) =====
  const fallbackFromPlace = selectedPlace
    ? { lat: selectedPlace.lat, lng: selectedPlace.lng }
    : null;

  const getCoords = () =>
    new Promise((resolve, reject) => {
      const cached = getCachedLoc() || fallbackFromPlace;

      if (!navigator.geolocation) {
        return cached
          ? resolve({ ...cached, _source: "fallback:no-geo" })
          : reject(new Error("geolocation unsupported"));
      }

      const hardTimeout = setTimeout(() => {
        if (cached) return resolve({ ...cached, _source: "fallback:timeout" });
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
            return resolve({
              ...cached,
              _source: `fallback:error:${err?.code}`,
            });
          reject(err);
        },
        { enableHighAccuracy: false, timeout: 7000, maximumAge: 60_000 }
      );
    });

  const normalizeId = (id) => String(id ?? "").replace(/^kakao:/i, "");

  // ===== 곧 나감 전송 =====
  const onPressOutSoon = async () => {
    if (!canPressOutSoon) return;

    setPressedOutSoon(true);
    try {
      sessionStorage.setItem(pressedKey, "1");
    } catch {}

    try {
      const { lat, lng } = await getCoords();
      const minute = near5 ? 5 : 10;

      const payload = {
        lat,
        lng,
        minute,
        provider,
        externalId: normalizeId(placeId), // kakao id
        placeName,
        address,
      };

      await postSoonOut(payload);

      // 🔔 같은 주차장을 구독한 다른 사용자들에게 알림 시뮬레이션
      try {
        // 현재 사용자 키
        const currentUserKey = localStorage.getItem("userKey") || "guest";
        console.log(`[알림] 현재 사용자: ${currentUserKey}`);
        
        // 모든 사용자 키 찾기 (실제로는 서버에서 처리해야 함)
        const allUserKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("watchedPlaceIds__")) {
            const userKey = key.replace("watchedPlaceIds__", "");
            if (userKey !== currentUserKey) {
              allUserKeys.push(userKey);
            }
          }
        }
        
        console.log(`[알림] 발견된 다른 사용자들:`, allUserKeys);
        
        // 각 사용자가 이 주차장을 구독하고 있는지 확인
        allUserKeys.forEach(userKey => {
          const watchedIdsKey = `watchedPlaceIds__${userKey}`;
          const watchedNamesKey = `watchedPlaceNames__${userKey}`;
          
          try {
            const watchedIds = JSON.parse(localStorage.getItem(watchedIdsKey) || "[]");
            const watchedNames = JSON.parse(localStorage.getItem(watchedNamesKey) || "{}");
            
            console.log(`[알림] 사용자 ${userKey}의 구독 정보:`, {
              watchedIds,
              watchedNames,
              currentPlaceId: normalizeId(placeId)
            });
            
            // 이 주차장을 구독하고 있는지 확인
            if (watchedIds.includes(normalizeId(placeId))) {
              console.log(`[알림] 사용자 ${userKey}가 이 주차장을 구독하고 있음!`);
              
              // 알림 데이터 생성
              const notificationData = {
                id: Date.now() + Math.random(), // 고유 ID
                type: 'SOON_OUT',
                parkingId: normalizeId(placeId),
                placeName: watchedNames[normalizeId(placeId)] || placeName,
                minutesAgo: minute,
                timestamp: Date.now(),
                targetUserKey: userKey
              };
              
              console.log(`[알림] 생성된 알림 데이터:`, notificationData);
              
              // 해당 사용자의 알림 목록에 추가
              const notificationsKey = `pendingNotifications__${userKey}`;
              const existingNotifications = JSON.parse(localStorage.getItem(notificationsKey) || "[]");
              existingNotifications.push(notificationData);
              localStorage.setItem(notificationsKey, JSON.stringify(existingNotifications));
              
              console.log(`[알림] 사용자 ${userKey}의 알림 목록에 추가됨:`, {
                key: notificationsKey,
                count: existingNotifications.length,
                notifications: existingNotifications
              });
              
              console.log(`[알림] 사용자 ${userKey}에게 ${placeName} 곧 나감 알림 전송 완료`);
            } else {
              console.log(`[알림] 사용자 ${userKey}는 이 주차장을 구독하지 않음`);
            }
          } catch (error) {
            console.error(`[알림] 사용자 ${userKey} 알림 처리 실패:`, error);
          }
        });
        
        // 개발 중에만 로그 출력 (테스트 알림은 제거)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[알림] 개발 모드: 현재 사용자 ${currentUserKey}에게는 테스트 알림을 추가하지 않음`);
        }
        
      } catch (error) {
        console.error("[알림] 알림 시뮬레이션 실패:", error);
      }

      // ✅ cancel 화면/자동 종료를 위해 시간 & 장소를 함께 전달 + 세션에도 저장
      const startISO = startAt.toISOString();
      const endISO = endAt.toISOString();
      try {
        sessionStorage.setItem(
          "parkingSession",
          JSON.stringify({ placeName, startAt: startISO, endAt: endISO })
        );
      } catch {}

      navigate("/outsoon_cancel", {
        state: {
          openModal: true,
          placeName,
          startAt: startISO,
          endAt: endISO,
        },
      });
    } catch (e) {
      console.error("[soonout] failed", e);
      alert("‘곧 나감’ 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setPressedOutSoon(false);
      try {
        sessionStorage.removeItem(pressedKey);
      } catch {}
    }
  };

  // 사용 중이 아니라면 CTA만
  if (!inUseByOther) {
    return (
      <div className="outsoon-container">
        <div className="outsoon-header">
          <div className="outsoon-text">
            {placeName}
            <br />
          </div>
        </div>

        <div className="outsoon-car-section" style={{ marginTop: 16 }}>
          <img src={car_icon} alt="자동차 아이콘" />
        </div>

        <div className="outsoon-button-section" style={{ marginTop: 24 }}>
          <button
            className="outsoon-extend"
            onClick={() => navigate(-1)}
            title="뒤로"
          >
            뒤로가기
          </button>

          <button
            className="outsoon-outsoon"
            onClick={() =>
              alert("주차장 이용하기 (결제/예약 플로우 연결 예정)")
            }
          >
            주차장 이용하기
          </button>
        </div>
      </div>
    );
  }

  // ===== '다른 사용자가 이용 중' 화면 =====
  return (
    <div className="outsoon-container">
      <div className="outsoon-header">
        <div className="outsoon-text">
          {placeName}
          <br />
          이용중...
        </div>
      </div>

      <div className="outsoon-time-box">
        <div className="outsoon-time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="outsoon-time-text">
            {formatHHMM(startAt)} ~ {formatHHMM(endAt)} (
            {formatDiff(startAt, endAt)})
          </span>
        </div>
      </div>

      <div className="outsoon-notice-box">
        <div className="outsoon-notice-inner">
          <img src={info_icon} alt="안내 아이콘" className="info-icon" />
          <div className="outsoon-notice-text">
            <p className="outsoon-info-text1">
              출차 전에 ‘곧 나감’을 눌러주세요!
            </p>
            <p className="outsoon-info-text2">
              {canPressOutSoon
                ? "지금 ‘곧 나감’을 누르시면 포인트를 받을 수 있어요!"
                : "‘곧 나감’은 10분/5분 전에만 활성화됩니다."}
            </p>
          </div>
        </div>
      </div>

      <div className="outsoon-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="outsoon-button-section">
        <button className="outsoon-extend" onClick={() => setOpen(true)}>
          연장하기
        </button>

        <div className="outsoon-bubble-container">
          {!pressedOutSoon && (
            <div
              className="outsoon-bubble-box"
              role="status"
              aria-live="polite"
            >
              <span className="outsoon-bubble-text">
                주차 마감 시간{" "}
                <strong>{bubbleMinuteLabel} 전에 '곧 나감'</strong> 버튼을
                눌러주세요
              </span>
            </div>
          )}

          <button
            className={`outsoon-outsoon ${
              canPressOutSoon ? "" : "is-disabled"
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

      {open && (
        <>
          <div className="extend-backdrop" onClick={() => setOpen(false)} />
          <div className="extend-sheet" role="dialog" aria-modal="true">
            <div className="extend-handle" />
            <div className="extend-title">얼만큼 더 이용하실 계획이실까요?</div>
            <div className="extend-sub">
              연장한 시간에 맞춰 알림을 보내 드릴게요!
            </div>
            <div className="extend-selected">{selectedText}</div>

            <div className="ext-wheel-wrap">
              <div
                className="ext-wheel"
                ref={wheelHRef}
                onScroll={onScroll("h")}
                aria-label="시간 선택"
              >
                <div className="ext-spacer" />
                {hours.map((hh) => (
                  <div
                    className={`ext-item ${hh === extH ? "active" : ""}`}
                    key={hh}
                  >
                    {hh}
                  </div>
                ))}
                <div className="ext-spacer" />
              </div>
              <div className="ext-colon">:</div>
              <div
                className="ext-wheel"
                ref={wheelMRef}
                onScroll={onScroll("m")}
                aria-label="분 선택"
              >
                <div className="ext-spacer" />
                {minutes.map((mm) => (
                  <div
                    className={`ext-item ${mm === extM ? "active" : ""}`}
                    key={mm}
                  >
                    {pad2(mm)}
                  </div>
                ))}
                <div className="ext-spacer" />
              </div>
              <div className="ext-guide ext-guide-top" />
              <div className="ext-guide ext-guide-bot" />
            </div>

            <button
              className={`extend-apply ${disabledExtend ? "is-disabled" : ""}`}
              disabled={disabledExtend}
              onClick={applyExtend}
            >
              연장하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}
