import React from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/ParkingEnd.css";

import arrow from "../Assets/arrow.png";
import clock_icon from "../Assets/clock.svg";
import backcar_icon from "../Assets/backcar.svg";

const ParkingEnd = () => {
  const navigate = useNavigate();

  return (
    <div className="parkingend-container">
      <img
        src={arrow}
        alt="뒤로가기"
        className="back-arrow"
        onClick={() => navigate(-1)}
      />

      <div className="parkingend-header">
        <div className="parkingend-text">
          주차 이용 종료
          <br />
          <p>
            주차 이용 시간 종료되었습니다!
            <br />
            다음 이용자를 위해 출차를 부탁드립니다.
          </p>
        </div>
      </div>

      <div className="car-section">
        <img src={backcar_icon} alt="자동차 아이콘" />
      </div>

      <div className="parkingendl-button-section">
        <button
          className="parkingend-outcomplete"
          onClick={() => navigate("/login")}
        >
          출차 완료
        </button>
      </div>
    </div>
  );
};

export default ParkingEnd;
