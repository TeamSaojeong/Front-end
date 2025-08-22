import React from "react";
import Right from "../Assets/right.svg";
import "../Styles/Aiforecast.css";

import parkIcon from "../Assets/parking-sign.svg";

export default function AIForecastCard({ onClick }) {
  return (
    <button className="aif-box" onClick={onClick} aria-label="AI 주차 예보 열기">
      <div className="aif-box-left">
        <img className="aif-icon small" src={parkIcon} alt="" />
      </div>

      <div className="aif-box-text">
        <div className="aif-title">AI 주차 예보</div>
        <div className="aif-sub"><span className="aif-sub-point">AI 분석</span>을 통해 미리 <span className="aif-sub-point">혼잡도</span>를 체크해보세요!</div>
      </div>

      <span className="aif-chevron" aria-hidden="true">
        <img src={Right}/>
      </span>
    </button>
  );
}
