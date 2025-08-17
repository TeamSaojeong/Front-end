import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Pay/PayComplete.css";

import arrow from "../../Assets/arrow.png";
import car_icon from "../../Assets/paycomplete.svg";
import clock_icon from "../../Assets/clock.svg";

const PayComplete = () => {
  const navigate = useNavigate();

  return (
    <div className="paycomplete-container">
      <div className="paycomplete-header">
        <div className="paycomplete-text">
          결제완료
          <br />
          <p>
            정상적으로 결제가 완료되었습니다.
            <br />
            자동으로 화면이 넘어갈 예정입니다.
          </p>
        </div>
      </div>

      <div className="paycomplete-time-box">
        <div className="paycomplete-time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="paycomplete-time-text">
            00:00 ~ 00:00 (3시간 20분)
          </span>
        </div>
      </div>

      <div className="paycomplete-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="paycomplete-button-section">
        <button
          className="paycomplete-outsoon"
          onClick={() => navigate("/login")}
        >
          주차를 해주세요!
        </button>
      </div>
    </div>
  );
};
export default PayComplete;
