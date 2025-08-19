import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../Styles/Place/PlaceDetail.css";

import reportIcon from "../../Assets/report.svg";
import pinIcon from "../../Assets/emptypin.svg";
import moneyIcon from "../../Assets/money.svg";
import copyIcon from "../../Assets/copy.svg";
import alarmIcon from "../../Assets/alarm.svg";

export default function PlaceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const place = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("selectedPlace");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const placeId = place?.id ?? id;
  const title = place?.name ?? "주차 장소 이름";
  const distanceKm = place?.distanceKm ?? 24;
  const etaMin = place?.etaMin ?? 36;
  const pricePer10m = place?.price ?? 0;
  const nearestAddress =
    place?.address ?? "서울특별시 성북구 삼선교로 16길 116";
  const availableTimes = place?.available ?? "00:00 ~ 00:00  |  00:00 ~ 00:00";
  const shortNote = place?.note ?? "노란색 기둥 오른편\n(주차 장소 간략 설명)";

  const [leavingEtaMin, setLeavingEtaMin] = useState(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true); // ✅ 이용 가능 여부

  useEffect(() => {
    let timer;
    const fetchStatus = async () => {
      try {
        const r = await fetch(`/api/parking/places/${placeId}/leaving-soon`);
        if (!r.ok) throw new Error("status");
        const j = await r.json();
        setQueueOpen(!!j?.queueOpen);
        setLeavingEtaMin(
          typeof j?.etaMin === "number" ? Math.max(0, j.etaMin) : null
        );
        setIsAvailable(j?.available ?? true); // ✅ 서버의 이용 가능여부
      } catch {}
    };
    if (placeId) {
      fetchStatus();
      timer = setInterval(fetchStatus, 10_000);
    }
    return () => clearInterval(timer);
  }, [placeId]);

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
    const lat = place?.lat ?? place?.latitude ?? null;
    const lng = place?.lng ?? place?.longitude ?? null;
    if (lat == null || lng == null) {
      alert("목적지 좌표가 없어 경로를 열 수 없습니다.");
      return;
    }
    navigate("/maproute", {
      state: { dest: { lat, lng }, name: title, address: nearestAddress },
    });
  };

  const joinWait = async () => {
    try {
      const r = await fetch(`/api/parking/places/${placeId}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "detail" }),
      });
      if (!r.ok) throw new Error();
      alert("대기 등록이 완료되었습니다.");
    } catch {
      alert("대기 등록에 실패했습니다.");
    }
  };

  const startUse = () => {
    alert("주차장 이용하기 시작! (추후 결제/예약 플로우 연결)");
  };

  // 버튼 상태/액션
  const primaryDisabled = !isAvailable;
  const primaryLabel = primaryDisabled
    ? "이용 중..."
    : queueOpen
    ? "미리 대기하기"
    : "주차장 이용하기";
  const primaryOnClick = primaryDisabled
    ? undefined
    : queueOpen
    ? joinWait
    : startUse;

  return (
    <div className="pub-wrap">
      {/* 상단바 */}
      <div className="pub-topbar">
        <button className="pub-close" onClick={goBack} aria-label="닫기">
          ✕
        </button>
        <button
          className="pub-alarm"
          onClick={() => alert("알림 설정 준비 중")}
          aria-label="알림"
        >
          <img src={alarmIcon} alt="알림" />
        </button>
        <button
          className="pub-bell"
          onClick={() => alert("신고하기 준비 중")}
          aria-label="신고하기"
        >
          <img src={reportIcon} alt="신고" />
        </button>
      </div>

      <h1 className="pub-title">{title}</h1>

      {/* ✅ 이용 가능할 때만 곧나감 상단 배너 표시 */}
      {queueOpen && isAvailable && (
        <div className="pub-soon-notice">
          이전 이용자가 <strong>{leavingEtaMin ?? "잠시"}분 뒤</strong> 나갈
          예정이에요!
        </div>
      )}

      {/* 정보 칩 169×68 */}
      <div className="pub-chips">
        <div className="pub-chip">
          <div className="pub-chip-icon">
            <img src={pinIcon} alt="위치" />
          </div>
          <div className="pub-chip-text">
            <div className="pub-chip-value">
              <strong>{distanceKm}km</strong>&nbsp;&nbsp;|&nbsp;&nbsp;
              <strong>{etaMin}분</strong>
            </div>
            <div className="pub-chip-sub">주차 장소까지</div>
          </div>
        </div>

        <div className="pub-chip">
          <div className="pub-chip-icon">
            <img src={moneyIcon} alt="요금" />
          </div>
          <div className="pub-chip-text">
            <div className="pub-chip-value">
              <strong>{pricePer10m.toLocaleString()}원</strong>
            </div>
            <div className="pub-chip-sub">10분당 주차 비용</div>
          </div>
        </div>
      </div>

      {/* 주소 */}
      <section className="pub-section">
        <h2 className="pub-section-title">주차 장소와 가장 근접한 위치</h2>
        <div className="pub-address-row">
          <div className="pub-address">{nearestAddress}</div>
          <button
            className="pub-copy-btn"
            onClick={copyAddress}
            aria-label="주소 복사"
            title="주소 복사"
          >
            <img src={copyIcon} alt="복사" />
          </button>
        </div>
      </section>

      {/* 시간 */}
      <section className="pub-section">
        <h2 className="pub-section-title">주차 가능 시간</h2>
        <div className="pub-times">{availableTimes}</div>
      </section>

      {/* 사진 + 설명 */}
      <section className="pub-section">
        <h2 className="pub-section-title">주차 장소 설명</h2>
        <div className="pub-photo-box" role="img" aria-label="주차 장소 사진">
          <div className="pub-photo-placeholder">🖼️</div>
        </div>
        <pre className="pub-note">{shortNote}</pre>
      </section>

      {/* 하단 버튼 */}
      <div className="pub-actions">
        <button className="pub-btn pub-btn-outline" onClick={openRoute}>
          경로 안내 보기
        </button>
        <button
          className={`pub-btn pub-btn-primary ${
            primaryDisabled ? "in-use" : ""
          }`}
          disabled={primaryDisabled}
          onClick={primaryOnClick}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
