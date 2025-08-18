// src/pages/Nfc/OutSoon_10m.jsx (파일명은 실제 경로에 맞게)
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/OutSoon_10m.css";

import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import info_icon from "../Assets/info.svg";

const OutSoon_10m = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // 종료 시각: 라우터 state로 받거나(ISO string) 없으면 테스트용 17분 뒤
  const endAt = useMemo(() => {
    const s = state?.endAt
      ? new Date(state.endAt)
      : new Date(Date.now() + 17 * 60 * 1000);
    return s;
  }, [state]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const minsLeft = Math.max(0, (endAt.getTime() - now) / 60000);

  // 10분/5분 "주변"만 허용 (±30초 허용)
  const inWindow = (target, tol = 0.5) => Math.abs(minsLeft - target) <= tol;
  const canPressOutSoon = inWindow(10, 0.5) || inWindow(5, 0.5);

  const goOutSoonCancel = () => {
    // 취소 페이지에서 모달 자동 오픈 신호
    navigate("/outsoon_cancel", { state: { openModal: true } });
  };

  return (
    <div className="outsoon-10m-container">
      <div className="outsoon-10m-header">
        <div className="outsoon-10m-text">
          콘하스 DDP 앞 주차장
          <br />
          이용중...
        </div>
      </div>

      <div className="outsoon-10m-time-box">
        <div className="outsoon-10m-time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="outsoon-10m-time-text">
            00:00 ~ 00:00 (남은 {Math.floor(minsLeft)}분)
          </span>
        </div>
      </div>

      <div className="outsoon-10m-notice-box">
        <div className="outsoon-10m-notice-inner">
          <img src={info_icon} alt="안내 아이콘" className="info-icon" />
          <div className="outsoon-10m-notice-text">
            <p className="outsoon-10m-info-text1">
              출차하시기 전에 ‘곧 나감’도 잊지 말아주세요!
            </p>
            <p className="outsoon-10m-info-text2">
              곧 나감은 <strong>10분 전</strong>과 <strong>5분 전</strong>에만
              활성화됩니다.
            </p>
          </div>
        </div>
      </div>

      <div className="outsoon-10m-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="outsoon-10m-button-section">
        <button
          className="outsoon-10m-extend"
          onClick={() => navigate("/login")}
        >
          연장하기
        </button>

        <div className="outsoon-10m-bubble-container">
          <div className="outsoon-10m-bubble-box">
            <span className="outsoon-10m-bubble-text">
              주차 마감 시간 <strong>10분 / 5분 전</strong>에 ‘곧 나감’을
              눌러주세요
            </span>
          </div>

          <button
            className="outsoon-10m-outsoon-10m"
            onClick={goOutSoonCancel}
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
};

export default OutSoon_10m;
