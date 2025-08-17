import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../Styles/PlaceDetail.css";

import reportIcon from "../Assets/report.svg";
import pinIcon from "../Assets/emptypin.svg";
import moneyIcon from "../Assets/money.svg";
import copyIcon from "../Assets/copy.svg";

export default function PlaceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  // (목) 세션에서 클릭된 주차장 정보 복원
  const place = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("selectedPlace");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const title = place?.name ?? "주차 장소 이름";
  const distanceKm = place?.distanceKm ?? 24;
  const etaMin = place?.etaMin ?? 36;
  const pricePer10m = place?.price ?? 0;

  const nearestAddress =
    place?.address ?? "서울특별시 성북구 삼선교로 16길 116"; // 임시
  const availableTimes = place?.available ?? "00:00 ~ 00:00 | 00:00 ~ 00:00"; // 임시
  const shortNote = place?.note ?? "노란색 기둥 오른편\n(주차 장소 간략 설명)"; // 임시

  const goBack = () => navigate(-1);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(nearestAddress);
      alert("주소가 복사되었습니다.");
    } catch {
      alert("복사에 실패했습니다.");
    }
  };

  const openRoute = () => {
    const q = encodeURIComponent(nearestAddress);
    window.open(`https://map.kakao.com/?q=${q}`, "_blank");
  };

  const startUse = () => {
    alert("주차장 이용하기 시작! (추후 결제/예약 플로우 연결)");
  };

  return (
    <div className="pd-wrap">
      {/* 상단바 */}
      <div className="pd-topbar">
        <button className="pd-close" onClick={goBack} aria-label="닫기">
          ✕
        </button>
        <button
          className="pd-bell"
          onClick={() => alert("신고하기 준비 중")}
          aria-label="신고하기"
        >
          <img src={reportIcon} alt="신고" />
        </button>
      </div>

      <h1 className="pd-title">{title}</h1>

      {/* 정보 칩 */}
      <div className="pd-chips">
        <div className="pd-chip">
          <div className="pd-chip-icon">
            <img src={pinIcon} alt="위치" />
          </div>
          <div className="pd-chip-text">
            <strong>{distanceKm}km</strong>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>{etaMin}분</strong>
            <div className="pd-chip-sub">주차 장소까지</div>
          </div>
        </div>

        <div className="pd-chip">
          <div className="pd-chip-icon">
            <img src={moneyIcon} alt="요금" />
          </div>
          <div className="pd-chip-text">
            <strong>{pricePer10m.toLocaleString()}원</strong>
            <div className="pd-chip-sub">10분당 주차 비용</div>
          </div>
        </div>
      </div>

      {/* 주소 */}
      <section className="pd-section">
        <h2 className="pd-section-title">주차 장소과 가장 근접한 위치</h2>
        <div className="pd-address-row">
          <div className="pd-address">{nearestAddress}</div>
          <button
            className="pd-copy-btn"
            onClick={copyAddress}
            aria-label="주소 복사"
          >
            <img src={copyIcon} alt="복사" />
          </button>
        </div>
      </section>

      {/* 시간 */}
      <section className="pd-section">
        <h2 className="pd-section-title">주차 가능 시간</h2>
        <div className="pd-times">{availableTimes}</div>
      </section>

      {/* 사진 + 설명 */}
      <section className="pd-section">
        <h2 className="pd-section-title">주차 장소 설명</h2>
        <div className="pd-photo-box" role="img" aria-label="주차 장소 사진">
          <div className="pd-photo-placeholder">🖼️</div>
        </div>
        <pre className="pd-note">{shortNote}</pre>
      </section>

      {/* 하단 버튼 */}
      <div className="pd-actions">
        <button className="pd-btn pd-btn-outline" onClick={openRoute}>
          경로 안내 보기
        </button>
        <button className="pd-btn pd-btn-primary" onClick={startUse}>
          주차장 이용하기
        </button>
      </div>
    </div>
  );
}
