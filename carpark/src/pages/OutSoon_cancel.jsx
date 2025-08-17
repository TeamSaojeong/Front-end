import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/OutSoon_cancel.css";

import arrow from "../Assets/arrow.png";
import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import info_icon from "../Assets/info.svg";

import PointModal from "../components/Modal/PointModal";

const OutSoon_cancel = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [open, setOpen] = useState(state?.openModal ?? true);

  useEffect(() => {
    if (state?.openModal) setOpen(true);
  }, [state]);

  return (
    <div className="outsoon-cancel-container">

      <div className="outsoon-cancel-header">
        <div className="outsoon-cancel-text">
          콘하스 DDP 앞 주차장
          <br />
          이용중...
        </div>
      </div>

      <div className="outsoon-cancel-time-box">
        <div className="outsoon-cancel-time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="outsoon-cancel-time-text">
            00:00 ~ 00:00 (3시간 20분)
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
          className="outsoon-cancel-extend"
          onClick={() => navigate("/login")}
        >
          연장하기
        </button>

        <div className="outsoon-cancel-bubble-container">
          <div className="outsoon-cancel-bubble-box"></div>

          <button
            className="outsoon-cancel-outsoon-cancel"
            onClick={() => navigate("/login")}
          >
            곧 나감
          </button>
        </div>
      </div>

      <PointModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default OutSoon_cancel;
