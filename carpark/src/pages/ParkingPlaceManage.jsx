// src/pages/ParkingPlaceManage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/ParkingPlaceManage.css";
import backIcon from "../Assets/arrow.png";
import { useMyParkings } from "../store/MyParkings";
import { useParkingForm } from "../store/ParkingForm";

export default function ParkingPlaceManage() {
  const navigate = useNavigate();

  const places = useMyParkings((s) => s.items);
  const toggleEnabled = useMyParkings((s) => s.toggleEnabled);
  const remove = useMyParkings((s) => s.remove);
  const loadFromPlace = useParkingForm((s) => s.loadFromPlace);

  const edit = (p) => {
    loadFromPlace(p); // ✅ 기존 데이터 주입
    navigate("/name"); // ✅ 등록 첫 단계로 이동
  };

  const removeWatched = (id) => {
    try {
      const raw = localStorage.getItem("watchedPlaceIds");
      const ids = raw ? JSON.parse(raw) : [];
      const next = ids.filter((x) => String(x) !== String(id));
      localStorage.setItem("watchedPlaceIds", JSON.stringify(next));
    } catch {}
  };

  const onDelete = (p) => {
    if (!window.confirm(`'${p.name || "(이름 없음)"}'을(를) 삭제할까요?`))
      return;
    remove(p.id);
    removeWatched(p.id);
    // 선택된 상세 정리
    try {
      const raw = sessionStorage.getItem("selectedPlace");
      const sp = raw ? JSON.parse(raw) : null;
      if (sp && String(sp.id) === String(p.id)) {
        sessionStorage.removeItem("selectedPlace");
      }
    } catch {}
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
        {(places || []).map((p) => {
          const hasCoord =
            typeof p.lat === "number" && typeof p.lng === "number";
          return (
            <li key={p.id} className="ppm-item">
              <div className="ppm-left">
                <div className={`ppm-name ${!p.enabled ? "disabled" : ""}`}>
                  {p.name?.trim() || `(이름 없음 #${p.id})`}
                  {!hasCoord && <span className="ppm-badge">좌표 없음</span>}
                </div>

                <div className="ppm-actions">
                  <button
                    className={`ppm-edit ${!p.enabled ? "disabled" : ""}`}
                    onClick={() => edit(p)}
                    type="button"
                  >
                    수정하기 <span className="ppm-chevron">›</span>
                  </button>

                  <button
                    className="ppm-delete"
                    onClick={() => onDelete(p)}
                    type="button"
                    aria-label={`${p.name} 삭제`}
                  >
                    삭제
                  </button>
                </div>
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
          );
        })}
      </ul>
    </div>
  );
}
