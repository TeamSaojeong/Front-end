import React from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/ParkingPlaceManage.css";
import backIcon from "../Assets/arrow.png";
import { useMyParkings } from "../store/MyParkings";

export default function ParkingPlaceManage() {
  const navigate = useNavigate();

  const places = useMyParkings((s) => s.items);
  const toggleEnabled = useMyParkings((s) => s.toggleEnabled);

  const edit = (id) => {
    // 추후 수정 페이지 연결
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

      <ul className="ppm-list">
        {(places || []).map((p) => (
          <li key={p.id} className="ppm-item">
            <div className="ppm-left">
              <div className={`ppm-name ${!p.enabled ? "disabled" : ""}`}>
                {p.name || "내 주차장"}
              </div>
              <button
                className={`ppm-edit ${!p.enabled ? "disabled" : ""}`}
                onClick={() => edit(p.id)}
              >
                수정하기 <span className="ppm-chevron">›</span>
              </button>
            </div>

            <label className={`ppm-switch ${p.enabled ? "on" : "off"}`}>
              <input
                type="checkbox"
                checked={!!p.enabled}
                onChange={() => toggleEnabled(p.id)}
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
