import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../Styles/Place/PvPlaceDetail.css";

import reportIcon from "../../Assets/report.svg";
import pinIcon from "../../Assets/emptypin.svg";
import moneyIcon from "../../Assets/money.svg";
import copyIcon from "../../Assets/copy.svg";
import alarmIcon from "../../Assets/alarm.svg";
import alarmIconOn from "../../Assets/alarm1.svg";
import out5m from "../../Assets/out5m.svg";

export default function PvPlaceDetail() {
  const navigate = useNavigate();
  const params = useParams();
  const [alarmOn, setAlarmOn] = useState(false);

  // 어떤 키로 오든 첫 번째 파라미터 사용
  const idFromParam =
    params?.id ?? params?.placeId ?? Object.values(params ?? {})[0] ?? null;

  const placeFromSession = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("selectedPlace");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // placeId가 없어도 dummy로 강제 세팅 → 항상 테스트 가능
  const placeId = placeFromSession?.id ?? idFromParam ?? "dummy-1";

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  // 실시간 상태
  const [queueOpen, setQueueOpen] = useState(false); // 대기열 열림(곧 나감)
  const [leavingEtaMin, setLeavingEtaMin] = useState(null); // 곧 나감까지 남은 분
  const [isAvailable, setIsAvailable] = useState(true); // ✅ 이용 가능 여부

  // ✅ 테스트용 더미 데이터 주입
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const fake = {
        id: placeId,
        name: "테스트 개인 주차장",
        distanceKm: 2.4,
        etaMin: 6,
        pricePer10m: 500,
        address: "서울특별시 성북구 삼선교로 16길 116",
        availableTimes: "00:00 ~ 24:00",
        note: "노란색 기둥 오른편\n(주차 장소 간략 설명)",
        lat: 37.58,
        lng: 127.01,
        queueOpen: true,
        leavingEtaMin: 5,
        available: false, // ✅ 자리 없음 → “이용 중...”
      };
      setDetail(fake);
      setQueueOpen(!!fake.queueOpen);
      setLeavingEtaMin(
        typeof fake.leavingEtaMin === "number"
          ? Math.max(0, fake.leavingEtaMin)
          : null
      );
      setIsAvailable(fake.available ?? true);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [placeId]);

  // (실서비스 시) 주기 갱신 예시
  // useEffect(() => {
  //   let interval;
  //   async function fetchStatus() {
  //     try {
  //       const r = await fetch(`/api/parking/places/${placeId}/leaving-soon`);
  //       if (!r.ok) throw new Error("status");
  //       const j = await r.json();
  //       setQueueOpen(!!j?.queueOpen);
  //       setLeavingEtaMin(typeof j?.etaMin === "number" ? Math.max(0, j.etaMin) : null);
  //       setIsAvailable(j?.available ?? true);
  //     } catch {}
  //   }
  //   if (placeId) {
  //     fetchStatus();
  //     interval = setInterval(fetchStatus, 10_000);
  //   }
  //   return () => clearInterval(interval);
  // }, [placeId]);

  const goBack = () => navigate(-1);

  const copyAddress = async () => {
    if (!detail?.address) return;
    try {
      await navigator.clipboard.writeText(detail.address);
      alert("주소가 복사되었습니다.");
    } catch {
      alert("복사에 실패했습니다.");
    }
  };

  const openRoute = () => {
    if (!detail?.lat || !detail?.lng) {
      alert("목적지 좌표가 없어 경로를 열 수 없습니다.");
      return;
    }
    navigate("/maproute", {
      state: {
        dest: { lat: detail.lat, lng: detail.lng },
        name: detail.name,
        address: detail.address,
      },
    });
  };

  const joinWait = () => alert("대기 등록 완료! (테스트)");
  const startUse = () => alert("주차장 이용 시작! (테스트)");

  if (loading) {
    return (
      <div className="pd-wrap">
        <div className="pd-topbar">
          <button className="pd-close" onClick={goBack} aria-label="닫기">
            ✕
          </button>
        </div>
        <h1 className="pd-title">불러오는 중…</h1>
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="pd-wrap">
        <div className="pd-topbar">
          <button className="pd-close" onClick={goBack} aria-label="닫기">
            ✕
          </button>
        </div>
        <h1 className="pd-title">데이터가 없습니다.</h1>
      </div>
    );
  }

  const {
    name,
    distanceKm,
    etaMin,
    pricePer10m,
    address,
    availableTimes,
    note,
  } = detail;

  const etaText =
    typeof leavingEtaMin === "number"
      ? `${Math.max(0, leavingEtaMin)}분`
      : "잠시";

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
    <div className="pd-wrap">
      {/* 상단바 */}
      <div className="pd-topbar">
        <button className="pd-close" onClick={goBack} aria-label="닫기">
          ✕
        </button>

        <button
          className="pd-alarm"
          onClick={() => setAlarmOn((v) => !v)}
          aria-pressed={alarmOn}
          aria-label={alarmOn ? "알림 켜짐" : "알림 꺼짐"}
          title={alarmOn ? "알림 켜짐" : "알림 꺼짐"}
        >
          <img src={alarmIconOn && alarmOn ? alarmIconOn : alarmIcon} alt="" />
        </button>
        <button
          className="pd-bell"
          onClick={() => alert("신고하기 준비 중")}
          aria-label="신고하기"
        >
          <img src={reportIcon} alt="신고" />
        </button>
      </div>

      <h1 className="pd-title">{name}</h1>

      {/* 정보 칩 */}
      <div className="pd-chips">
        <div className="pd-chip">
          <div className="pd-chip-icon">
            <img src={pinIcon} alt="위치" />
          </div>
          <div className="pd-chip-text">
            <strong>{distanceKm}km</strong>&nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>{etaMin}분</strong>
            <div className="pd-chip-sub">주차 장소까지</div>
          </div>
        </div>

        <div className="pd-chip">
          <div className="pd-chip-icon">
            <img src={moneyIcon} alt="요금" />
          </div>
          <div className="pd-chip-text">
            <strong>{Number(pricePer10m).toLocaleString()}원</strong>
            <div className="pd-chip-sub">10분당 주차 비용</div>
          </div>
        </div>
      </div>

      {/* 주소 */}
      <section className="pd-section">
        <h2 className="pd-section-title">주차 장소와 가장 근접한 위치</h2>
        <div className="pd-address-row">
          <div className="pd-address">{address}</div>
          <button
            className="pd-copy-btn"
            onClick={copyAddress}
            aria-label="주소 복사"
            title="주소 복사"
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
        <pre className="pd-note">{note}</pre>
      </section>

      {/* 하단 버튼 + 말풍선(곧 나감) */}
      <div className="pd-actions">
        <button className="pd-btn pd-btn-outline" onClick={openRoute}>
          경로 안내 보기
        </button>

        <div className="pd-bubble-container">
          {/* ✅ 이용 가능할 때만 곧나감 말풍선 표시 */}
          {queueOpen && isAvailable && (
            <div className="pd-bubble-box" role="status" aria-live="polite">
              <img src={out5m} alt="" className="pd-bubble-icon" />
              <span className="pd-bubble-text">
                이전 이용자가 <strong>{etaText}</strong> 뒤 곧 나갈 예정이에요!
              </span>
            </div>
          )}

          <button
            className={`pd-btn pd-btn-primary ${
              queueOpen ? "pd-btn-wait" : ""
            } ${primaryDisabled ? "in-use" : ""}`} // ← 추가
            disabled={primaryDisabled}
            onClick={primaryOnClick}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
