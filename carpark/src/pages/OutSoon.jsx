import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/OutSoon.css";

import arrow from "../Assets/arrow.png";
import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import info_icon from "../Assets/info.svg";

const OutSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="outsoon-container">
      <img
        src={arrow}
        alt="뒤로가기"
        className="back-arrow"
        onClick={() => navigate(-1)}
      />
      <div className="outsoon-header">
        <div className="outsoon-text">
          콘하스 DDP 앞 주차장
          <br />
          이용중...
        </div>
      </div>

      <div className="outsoon-time-box">
        <div className="outsoon-time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="outsoon-time-text">00:00 ~ 00:00 (3시간 20분)</span>
        </div>
      </div>

      <div className="outsoon-notice-box">
        <div className="outsoon-notice-inner">
          <img src={info_icon} alt="안내 아이콘" className="info-icon" />
          <div className="outsoon-notice-text">
            <p className="outsoon-info-text1">
              출차하시기 전에 ‘곧 나감’도 잊지 말아주세요!
            </p>
            <p className="outsoon-info-text2">
              곧 나감 누르시고, 포인트 받아가세요!
            </p>
          </div>
        </div>
      </div>

      <div className="outsoon-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="outsoon-button-section">
        <button className="outsoon-extend" onClick={() => navigate("/login")}>
          연장하기
        </button>
        <div className="outsoon-bubble-container">
          <div className="outsoon-bubble-box">
            <span className="outsoon-bubble-text">
              주차 마감 시간 <strong>10분 전에 '곧 나감'</strong> 버튼을
              눌러주세요
            </span>
          </div>
          <button
            className="outsoon-outsoon"
            onClick={() => navigate("/login")}
          >
            곧 나감
          </button>
        </div>
      </div>
    </div>
  );
};
export default OutSoon;
