import React from "react";
import "../Styles/Aiforecast.css";

import parkIcon from "../Assets/parking-sign.svg";

export default function AIForecastCard({ onClick }) {
  return (
    <button className="ai-box" onClick={onClick} aria-label="AI 주차 예보 열기">
      <div className="ai-box-left">
        <img className="ai-icon small" src={parkIcon} alt="" />
      </div>

      <div className="ai-box-text">
        <div className="ai-title">AI 주차 예보</div>
        <div className="ai-sub">AI 분석을 통해 미리 혼잡도를 체크해보세요!</div>
      </div>

      <span className="ai-chevron" aria-hidden="true">
        ›
      </span>
    </button>
  );
}
