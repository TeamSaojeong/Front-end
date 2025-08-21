import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/OutSoon_cancel.css";

import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import info_icon from "../Assets/info.svg";

import PointModal from "../components/Modal/PointModal";

const pad2 = (n) => String(n).padStart(2, "0");
const fmtHHMM = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const fmtDiff = (start, end) => {
  const ms = Math.max(0, end.getTime() - start.getTime());
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0 && mm > 0) return `${h}시간 ${mm}분`;
  if (h > 0) return `${h}시간`;
  return `${mm}분`;
};

const readSelectedPlace = () => {
  try {
    const raw = sessionStorage.getItem("selectedPlace");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const readParkingSession = () => {
  try {
    const raw = sessionStorage.getItem("parkingSession");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const OutSoon_cancel = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // modal open
  const [open, setOpen] = useState(state?.openModal ?? true);

  // placeName
  const selectedPlace = useMemo(readSelectedPlace, []);
  const placeName = state?.placeName ?? selectedPlace?.name ?? "주차장";

  // 시간 정보: state → 세션 복구 → 간이 fallback
  const session = readParkingSession();
  const startAtRaw = state?.startAt ?? session?.startAt ?? null;
  const endAtRaw = state?.endAt ?? session?.endAt ?? null;

  const [startAt] = useState(() =>
    startAtRaw ? new Date(startAtRaw) : new Date(Date.now() - 30 * 60 * 1000)
  );
  const [endAt] = useState(() =>
    endAtRaw ? new Date(endAtRaw) : new Date(Date.now() + 10 * 60 * 1000)
  );

  // 세션에 저장(새로고침 대비)
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "parkingSession",
        JSON.stringify({
          placeName,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        })
      );
    } catch {}
  }, [placeName, startAt, endAt]);

  // 시간이 끝나면 자동 이동
  useEffect(() => {
    const tick = () => {
      if (Date.now() >= endAt.getTime()) {
        navigate("/parkingend", { replace: true });
      }
    };
    // 즉시 한 번 체크 후, 초 단위 폴링
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endAt, navigate]);

  // 곧나감 이후 화면이므로 연장 불가
  const extendDisabled = true;

  return (
    <div className="outsoon-cancel-container">
      <div className="outsoon-cancel-header">
        <div className="outsoon-cancel-text">
          {placeName}
          <br />
          이용중...
        </div>
      </div>

      <div className="outsoon-cancel-time-box">
        <div className="outsoon-cancel-time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="outsoon-cancel-time-text">
            {fmtHHMM(startAt)} ~ {fmtHHMM(endAt)} ({fmtDiff(startAt, endAt)})
          </span>
        </div>
      </div>

      <div className="outsoon-cancel-notice-box">
        <div className="outsoon-cancel-notice-inner">
          <img src={info_icon} alt="안내 아이콘" className="info-icon" />
          <div className="outsoon-cancel-notice-text">
            <p className="outsoon-cancel-info-text1">
              출차하시기 전에 ‘곧 나감’도 잊지 말아주세요!
            </p>
            <p className="outsoon-cancel-info-text2">
              곧 나감 누르시고, 포인트 받아가세요!
            </p>
          </div>
        </div>
      </div>

      <div className="outsoon-cancel-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="outsoon-cancel-button-section">
        <button
          className={`outsoon-cancel-extend ${
            extendDisabled ? "is-disabled" : ""
          }`}
          disabled={extendDisabled}
          aria-disabled={extendDisabled}
          title={
            extendDisabled ? "‘곧 나감’ 이후에는 연장할 수 없어요" : "연장하기"
          }
        >
          연장하기
        </button>

        <button
          className="outsoon-cancel-outsoon-cancel is-disabled"
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
};

export default OutSoon_cancel;
