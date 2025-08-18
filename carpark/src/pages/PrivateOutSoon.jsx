import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/PrivateOutSoon.css";

import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import infoyellow_icon from "../Assets/info-yellow.svg";

const TOL_SEC = 30; // 10분/5분 '근처' 허용 오차(±30초)

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

export default function PrivateOutSoon() {
  const navigate = useNavigate();
  const { state } = useLocation() || {};

  const placeName = state?.placeName ?? "콘하스 DDP 앞 주차장";
  const placeKey = state?.placeId ?? placeName; // 세션 키

  // 데모 기본값: 시작=30분 전, 종료=현재+11분
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

  // 남은 시간 갱신
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const endMs = endAt.getTime();
  const isNear = (min) =>
    Math.abs(now - (endMs - min * 60 * 1000)) <= TOL_SEC * 1000;

  const near10 = isNear(10);
  const near5 = isNear(5);
  const canPressOutSoon = near10 || near5;

  // 말풍선: '곧 나감' 누를 때까지 유지
  const [pressed, setPressed] = useState(() => {
    try {
      return sessionStorage.getItem(`priv-outsoon-pressed-${placeKey}`) === "1";
    } catch {
      return false;
    }
  });
  const bubbleMinuteLabel = near5 ? "5분" : "10분";

  const onPressOutSoon = () => {
    if (!canPressOutSoon) return;
    setPressed(true);
    try {
      sessionStorage.setItem(`priv-outsoon-pressed-${placeKey}`, "1");
    } catch {}
    // 실제 플로우 연결 (취소/출차 안내 페이지)
    navigate("/privateoutsoon_cancel", { state: { openModal: true } });
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
