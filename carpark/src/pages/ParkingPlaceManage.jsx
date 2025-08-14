import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/ParkingPlaceManage.css";
import backIcon from "../Assets/arrow.png";

export default function ParkingPlaceManage() {
  const navigate = useNavigate();

  // 임의 데이터
  const [places, setPlaces] = useState([
    { id: 1, name: "주차장소 이름", enabled: true },
    { id: 2, name: "주차장소 이름", enabled: true },
    { id: 3, name: "주차장소 이름", enabled: false },
  ]);

  const toggle = (id) =>
    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );

  const edit = (id) => {
    // 나중에 여기에 '수정하기' 누르면 뜨는 페이지 등록
    alert(`수정하기: ID ${id}`);
  };

  return (
    <div className="ppm-wrap">
      <header className="ppm-top">
        <button
          className="ppm-back"
          onClick={() => navigate("/home")}
          aria-label="뒤로가기"
        >
          <img src={backIcon} alt="" />
        </button>
        <h1 className="ppm-title">주차 장소 관리</h1>
      </header>

      {/* 리스트 */}
      <ul className="ppm-list">
        {places.map((p) => (
          <li key={p.id} className="ppm-item">
            <div className="ppm-left">
              <div className={`ppm-name ${!p.enabled ? "disabled" : ""}`}>
                {p.name}
              </div>
              <button
                className={`ppm-edit ${!p.enabled ? "disabled" : ""}`}
                onClick={() => edit(p.id)}
              >
                수정하기 <span className="ppm-chevron">›</span>
              </button>
            </div>

            {/* 토글 */}
            <label className={`ppm-switch ${p.enabled ? "on" : "off"}`}>
              <input
                type="checkbox"
                checked={p.enabled}
                onChange={() => toggle(p.id)}
                aria-label={`${p.name} 사용 여부`}
              />
              <span className="ppm-knob" />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
