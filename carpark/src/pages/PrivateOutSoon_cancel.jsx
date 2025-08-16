import React from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/PrivateOutSoon_cancel.css";

import arrow from "../Assets/arrow.png";
import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import infoyellow_icon from "../Assets/info-yellow.svg";

const PrivateOutSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="privatecancel-container">
      <img
        src={arrow}
        alt="뒤로가기"
        className="back-arrow"
        onClick={() => navigate(-1)}
      />

      <div className="privatecancel-header">
        <div className="privatecancel-text">
          콘하스 DDP 앞 주차장
          <br />
          이용중...
        </div>
      </div>

      <div className="privatecancel-time-box">
        <div className="privatecancel-time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="privatecancel-time-text">00:00 ~ 00:00 (3시간 20분)</span>
        </div>
      </div>

      <div className="privatecancel-notice-box">
        <div className="privatecancel-notice-inner">
          <img src={infoyellow_icon} alt="안내 아이콘" className="info-icon" />
          <div className="privatecancel-notice-text">
            <p className="privatecancel-info-text1">
              출차하시기 전에 ‘곧 나감’도 잊지 말아주세요!
            </p>
            <p className="privatecancel-info-text2">곧 나감 누르시고, 포인트 받아가세요!</p>
          </div>
        </div>
      </div>

      <div className="privatecancel-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="privatecancel-button-section">
        <button
          className="privatecancel-outsoon"
          onClick={() => navigate("/login")}
        >
          곧 나감
        </button>
      </div>
    </div>
  );
};

export default PrivateOutSoon;
