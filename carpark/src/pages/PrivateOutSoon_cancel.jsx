import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/PrivateOutSoon_cancel.css";

import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import infoyellow_icon from "../Assets/info-yellow.svg";

import PointModal from "../components/Modal/PointModal";

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

export default function PrivateOutSoon_cancel() {
  const navigate = useNavigate();
  const { state } = useLocation() || {};

  const placeName = state?.placeName ?? "콘하스 DDP 앞 주차장";

  // 전달된 시간 정보 사용 (없으면 placeholder)
  const startAt = useMemo(
    () => (state?.startAt ? new Date(state.startAt) : null),
    [state?.startAt]
  );
  const endAt = useMemo(
    () => (state?.endAt ? new Date(state.endAt) : null),
    [state?.endAt]
  );

  const [open, setOpen] = useState(state?.openModal ?? true);

  // 남은 시간 체크 → 만료 시 /parkingend 로 이동
  useEffect(() => {
    if (!endAt) return;
    const tick = setInterval(() => {
      if (Date.now() >= endAt.getTime()) {
        clearInterval(tick);
        navigate("/parkingend", { replace: true });
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [endAt, navigate]);

  return (
    <div className="privatecancel-container">
      <div className="privatecancel-header">
        <div className="privatecancel-text">
          {placeName}
          <br />
          이용중...
        </div>
      </div>

      <div className="privatecancel-time-box">
        <div className="privatecancel-time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="privatecancel-time-text">
            {startAt && endAt
              ? `${formatHHMM(startAt)} ~ ${formatHHMM(endAt)} (${formatDiff(
                  startAt,
                  endAt
                )})`
              : "00:00 ~ 00:00 (—)"}
          </span>
        </div>
      </div>

      <div className="privatecancel-notice-box">
        <div className="privatecancel-notice-inner">
          <img src={infoyellow_icon} alt="안내 아이콘" className="info-icon" />
          <div className="privatecancel-notice-text">
            <p className="privatecancel-info-text1">
              출차하시기 전에 ‘곧 나감’도 잊지 말아주세요!
            </p>
            <p className="privatecancel-info-text2">
              곧 나감 누르시고, 포인트 받아가세요!
            </p>
          </div>
        </div>
      </div>

      <div className="privatecancel-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="privatecancel-button-section">
        {/* ‘곧 나감’은 이미 눌렀으므로 항상 비활성화 */}
        <button
          className="privatecancel-outsoon is-disabled"
          disabled
          aria-disabled="true"
          tabIndex={-1}
          title="이미 ‘곧 나감’을 눌렀습니다"
        >
          곧 나감
        </button>
      </div>

      <PointModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
