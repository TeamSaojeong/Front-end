// src/pages/Place/PvPlaceDetail.jsx
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

import {
  getPrivateDetail,
  getParkingStatus,
  subscribeAlert,
} from "../../apis/parking";
import { mapStatusToUI } from "../../utils/parkingStatus";

export default function PvPlaceDetail() {
  const navigate = useNavigate();
  const { placeId: placeIdFromParam } = useParams();
  const [alarmOn, setAlarmOn] = useState(false);

  const placeFromSession = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("selectedPlace");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const placeId = placeFromSession?.id ?? placeIdFromParam ?? null;

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  const [queueOpen, setQueueOpen] = useState(false);
  const [leavingEtaMin, setLeavingEtaMin] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);

  const [primary, setPrimary] = useState({
    disabled: false,
    label: "주차장 이용하기",
    onClick: () => {},
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!placeId) return;
      setLoading(true);
      setError("");
      try {
        const { data } = await getPrivateDetail(placeId);
        if (!mounted) return;
        const d = data?.data ?? data;
        const normalized = {
          id: d.id ?? d.parkingId ?? placeId,
          name: d.name ?? placeFromSession?.name ?? "개인 주차장",
          distanceKm:
            d.distanceMeters != null
              ? d.distanceMeters / 1000
              : d.distanceKm ?? placeFromSession?.distanceKm ?? null,
          etaMin: d.etaMin ?? d.etaMinutes ?? placeFromSession?.etaMin ?? null,
          pricePer10m: d.pricePer10m ?? d.price ?? placeFromSession?.price ?? 0,
          address: d.address ?? placeFromSession?.address ?? "",
          availableTimes:
            d.availableTimes ??
            d.openHours ??
            placeFromSession?.available ??
            "00:00 ~ 24:00",
          note: d.note ?? placeFromSession?.note ?? "",
          lat: d.lat ?? d.latitude ?? placeFromSession?.lat ?? null,
          lng: d.lng ?? d.longitude ?? placeFromSession?.lng ?? null,
        };
        setDetail(normalized);
      } catch (e) {
        if (!mounted) return;
        setError(
          e?.response?.data?.message || "상세 정보를 불러오지 못했습니다."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function pullStatus() {
      if (!placeId) return;
      try {
        const { data } = await getParkingStatus(placeId);
        const ui = mapStatusToUI(data?.data);
        setIsAvailable(ui.isAvailable);
        setQueueOpen(ui.queueOpen);
        setLeavingEtaMin(ui.leavingEtaMin);

        // 개인: 항상 시간선택 화면으로 이동
        setPrimary({
          disabled: ui.primaryDisabled,
          label: ui.queueOpen
            ? "미리 대기하기"
            : ui.isAvailable
            ? "주차장 이용하기"
            : "이용 중...",
          onClick: ui.primaryDisabled
            ? undefined
            : () =>
                navigate("/pv/time-select", {
                  state: {
                    parkingId: placeId,
                    name: detail?.name,
                    address: detail?.address,
                  },
                }),
        });
      } catch {
        // 실패 시에도 시간선택으로 이동 가능하게
        setPrimary({
          disabled: false,
          label: "주차장 이용하기",
          onClick: () =>
            navigate("/pv/time-select", {
              state: {
                parkingId: placeId,
                name: detail?.name,
                address: detail?.address,
              },
            }),
        });
      }
    }

    load();
    pullStatus();
    const timer = setInterval(pullStatus, 10_000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  const goBack = () => navigate(-1);

  const copyAddress = async () => {
    const text = detail?.address || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert("주소가 복사되었습니다.");
    } catch {
      alert("복사에 실패했습니다.");
    }
  };

  const etaText =
    typeof leavingEtaMin === "number"
      ? `${Math.max(0, leavingEtaMin)}분`
      : "잠시";

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

  if (error) {
    return (
      <div className="pd-wrap">
        <div className="pd-topbar">
          <button className="pd-close" onClick={goBack} aria-label="닫기">
            ✕
          </button>
        </div>
        <h1 className="pd-title">오류</h1>
        <p style={{ padding: "0 24px" }}>{error}</p>
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

  return (
    <div className="pd-wrap">
      <div className="pd-topbar">
        <button className="pd-close" onClick={goBack} aria-label="닫기">
          ✕
        </button>

        <button
          className="pd-alarm"
          onClick={async () => {
            try {
              await subscribeAlert(placeId);
              setAlarmOn(true);
              alert("알림이 설정되었습니다.");
            } catch {
              alert("알림 설정에 실패했습니다.");
            }
          }}
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

      <div className="pd-chips">
        <div className="pd-chip">
          <div className="pd-chip-icon">
            <img src={pinIcon} alt="위치" />
          </div>
          <div className="pd-chip-text">
            <strong>{distanceKm ?? "-"}km</strong>&nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>{etaMin ?? "-"}분</strong>
            <div className="pd-chip-sub">주차 장소까지</div>
          </div>
        </div>

        <div className="pd-chip">
          <div className="pd-chip-icon">
            <img src={moneyIcon} alt="요금" />
          </div>
          <div className="pd-chip-text">
            <strong>{Number(pricePer10m || 0).toLocaleString()}원</strong>
            <div className="pd-chip-sub">10분당 주차 비용</div>
          </div>
        </div>
      </div>

      <section className="pd-section">
        <h2 className="pd-section-title">주차 장소와 가장 근접한 위치</h2>
        <div className="pd-address-row">
          <div className="pd-address">{address || "-"}</div>
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

      <section className="pd-section">
        <h2 className="pd-section-title">주차 가능 시간</h2>
        <div className="pd-times">{availableTimes}</div>
      </section>

      <section className="pd-section">
        <h2 className="pd-section-title">주차 장소 설명</h2>
        <div className="pd-photo-box" role="img" aria-label="주차 장소 사진">
          <div className="pd-photo-placeholder">🖼️</div>
        </div>
        <pre className="pd-note">{note}</pre>
      </section>

      <div className="pd-actions">
        <button
          className="pd-btn pd-btn-outline"
          onClick={() => {
            if (!detail?.lat || !detail?.lng) {
              alert("목적지 좌표가 없어 경로를 열 수 없습니다.");
              return;
            }
            navigate("/MapRoute", {
              state: {
                dest: { lat: detail.lat, lng: detail.lng },
                name: detail.name,
                address: detail.address,
              },
            });
          }}
        >
          경로 안내 보기
        </button>

        <div className="pd-bubble-container">
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
            } ${primary.disabled ? "in-use" : ""}`}
            disabled={primary.disabled}
            onClick={primary.onClick}
          >
            {primary.label}
          </button>
        </div>
      </div>
    </div>
  );
}
