import React from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/PrivateOutSoon_cancel.css";

import arrow from "../Assets/arrow.png";
import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import infoyellow_icon from "../Assets/info-yellow.svg";

const PrivateOutSoon_cancel = () => {
  const navigate = useNavigate();

  return (
    <div className="container-outsoon-cancel">
      <img
        src={arrow}
        alt="뒤로가기"
        className="back-arrow"
        onClick={() => navigate(-1)}
      />
      <div className="header">
        <div className="text">
          콘하스 DDP 앞 주차장
          <br />
          이용중...
        </div>
      </div>

      <div className="time-box">
        <div className="time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="time-text">00:00 ~ 00:00 (3시간 20분)</span>
        </div>
      </div>

      <div className="notice-box">
        <div className="notice-inner">
          <img
            src={infoyellow_icon}
            alt="안내 아이콘"
            className="infoyellow_icon"
          />
          <div className="notice-text">
            <p className="info-text1">
              출차하시기 전에 ‘곧 나감’도 잊지 말아주세요!
            </p>
            <p className="info-text2">곧 나감 누르시고, 포인트 받아가세요!</p>
          </div>
        </div>
      </div>

      <div className="car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="button-section">
        <button className="extend" onClick={() => navigate("/login")}>
          연장하기
        </button>
        <div className="bubble-container">
          <div className="bubble-box">
            <span className="bubble-text">
              주차 마감 시간 <strong>10분 전에 '곧 나감'</strong> 버튼을
              눌러주세요
            </span>
          </div>
          <button className="outsoon-cancel" onClick={() => navigate("/login")}>
            곧 나감
          </button>
        </div>
      </div>
    </div>
  );
};
export default PrivateOutSoon_cancel;
