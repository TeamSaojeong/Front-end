import React from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/OutSoon_10m.css";

import arrow from "../Assets/arrow.png";
import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import info_icon from "../Assets/info.svg";

const OutSoon_10m = () => {
  const navigate = useNavigate();

  return (
    <div className="outsoon-10m-container">
      <img
        src={arrow}
        alt="뒤로가기"
        className="back-arrow"
        onClick={() => navigate(-1)}
      />
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
          <span className="outsoon-10m-time-text">00:00 ~ 00:00 (3시간 20분)</span>
        </div>
      </div>

      <div className="outsoon-10m-notice-box">
        <div className="outsoon-10m-notice-inner">
          <img src={info_icon} alt="안내 아이콘" className="info-icon" />
          <div className="outsoon-10m-notice-text">
            <p className="outsoon-10m-info-text1">
              출차하시기 전에 ‘곧 나감’도 잊지 말아주세요!
            </p>
            <p className="outsoon-10m-info-text2">곧 나감 누르시고, 포인트 받아가세요!</p>
          </div>
        </div>
      </div>

      <div className="outsoon-10m-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="outsoon-10m-button-section">
        <button className="outsoon-10m-extend" onClick={() => navigate("/login")}>
          연장하기
        </button>
        <div className="outsoon-10m-bubble-container">
          <div className="outsoon-10m-bubble-box">
            <span className="outsoon-10m-bubble-text">
              주차 마감 시간 <strong>10분 전에 '곧 나감'</strong> 버튼을
              눌러주세요
            </span>
          </div>
          <button className="outsoon-10m-outsoon-10m" onClick={() => navigate("/login")}>
            {/*아직 누르면 작동하진않음 */}곧 나감
          </button>
        </div>
      </div>
    </div>
  );
};
export default OutSoon_10m;
