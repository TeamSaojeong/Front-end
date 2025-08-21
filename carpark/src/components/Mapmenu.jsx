import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Mapmenu.css";
import parkherelogo from "../Assets/phlogo.png";
import { useParkingForm } from "../store/ParkingForm";

export default function MapMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const resetForm = useParkingForm((s) => s.reset);

  return (
    <>
      {!open && (
        <button
          className="menu-fab"
          onClick={() => setOpen(true)}
          aria-label="메뉴 열기"
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      )}

      <div
        className={`menu-backdrop ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />

      <aside className={`menu-drawer ${open ? "open" : ""}`}>
        <header className="menu-header">
          <img className="menu-logo" src={parkherelogo} alt="" />
          <button
            className="menu-close"
            onClick={() => setOpen(false)}
            aria-label="닫기"
          >
            ×
          </button>
        </header>

        <div className="menu-body">
          <h1 className="menu-hello">
            안녕하세요,
            <br />
            <strong>홍길동</strong>님!
          </h1>

          <div className="menu-section">
            <div className="menu-section-title">주차 장소</div>

            {/* ✅ 등록 진입 : 폼/세션 초기화 후 시작 */}
            <button
              className="menu-row"
              onClick={() => {
                // 이전 등록 잔여값(특히 lat/lng, 이미지) 제거
                resetForm();
                sessionStorage.clear();
                setOpen(false);
                navigate("/confirm");
              }}
            >
              주차 장소 등록<span className="chev">›</span>
            </button>

            <button
              className="menu-row"
              onClick={() => {
                setOpen(false);
                navigate("/parkingplacemanage");
              }}
            >
              주차 장소 관리<span className="chev">›</span>
            </button>
          </div>

          <hr className="menu-divider" />

          <div className="menu-section">
            <div className="menu-section-title">서비스 이용</div>
            <button className="menu-row danger">
              로그아웃<span className="chev">›</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
