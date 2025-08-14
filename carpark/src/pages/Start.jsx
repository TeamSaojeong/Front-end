import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Start.css";

import mainpic from "../Assets/main_logo_text.png";
import car_icon from "../Assets/car.png";

const Start = () => {
  const navigate = useNavigate();

  return (
    <div className="start-container">
      <div className="start-header">
        <img src={mainpic} alt="메인 로고" />
      </div>

      <div className="start-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="Nowstart" onClick={() => navigate("/login")}>
        바로 시작하기
      </div>

      <div className="start-notyet-customer" onClick={() => navigate("/signup")}>
        아직 회원이 아니신가요? <span>회원가입</span>
      </div>
    </div>
  );
};
export default Start;
