// src/pages/Place/PlaceDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../Styles/Place/PlaceDetail.css";

import reportIcon from "../../Assets/report.svg";
import pinIcon from "../../Assets/emptypin.svg";
import moneyIcon from "../../Assets/money.svg";
import copyIcon from "../../Assets/copy.svg";
import alarmIcon from "../../Assets/alarm.svg";

import {
  getPublicDetail,
  getParkingStatus,
  subscribeAlert,
} from "../../apis/parking";
import { mapStatusToUI } from "../../utils/parkingStatus";

export default function PlaceDetail() {
  const navigate = useNavigate();
  const { placeId: placeIdFromParam } = useParams();

  const placeFromSession = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("selectedPlace");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // kakaoId / 좌표가 세션에 있어야 상세 가능(백엔드 스펙)
  const kakaoId = placeFromSession?.id ?? placeIdFromParam ?? null;
  const lat = placeFromSession?.lat ?? null;
  const lon = placeFromSession?.lng ?? null;

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  const [isAvailable, setIsAvailable] = useState(true);
  const [primary, setPrimary] = useState({
    disabled: false,
    label: "주차장 이용하기",
    onClick: () => {},
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      // 좌표/카카오ID 없으면 상세 불가
      if (!kakaoId || lat == null || lon == null) {
        setError("좌표 정보가 없어 상세를 불러올 수 없습니다.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const { data } = await getPublicDetail(kakaoId, lat, lon);
        if (!mounted) return;

        const d = data?.data ?? data; // 백엔드 응답 래핑 대응
        const normalized = {
          id: d.id ?? d.parkingId ?? kakaoId,
          name: d.placeName ?? d.name ?? placeFromSession?.name ?? "주차 장소",
          distanceKm:
            d.distanceMeters != null
              ? d.distanceMeters / 1000
              : d.distanceKm ?? placeFromSession?.distanceKm ?? null,
          etaMin: d.etaMin ?? d.etaMinutes ?? placeFromSession?.etaMin ?? null,
          pricePer10m:
            d.timerate && d.addrate
              ? Math.round((d.addrate * 10) / d.timerate)
              : placeFromSession?.price ?? 0,
          address:
            d.addressName ?? d.address ?? placeFromSession?.address ?? "",
          availableTimes:
            d.availableTimes ??
            d.openHours ??
            placeFromSession?.available ??
            "00:00 ~ 00:00  |  00:00 ~ 00:00",
          note: d.note ?? placeFromSession?.note ?? "",
          lat: d.y ?? d.lat ?? d.latitude ?? lat,
          lng: d.x ?? d.lon ?? d.lng ?? d.longitude ?? lon,
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
      if (!kakaoId) return;
      try {
        const { data } = await getParkingStatus(kakaoId);
        const ui = mapStatusToUI(data?.data);
        setIsAvailable(ui.isAvailable);
        setPrimary({
          disabled: !ui.isAvailable,
          label: ui.isAvailable ? "주차장 이용하기" : "이용 중...",
          onClick: ui.isAvailable ? startUse : undefined,
        });
      } catch {
        // 상태 실패 시 버튼은 기본값(이용하기) 유지
        setPrimary({
          disabled: false,
          label: "주차장 이용하기",
          onClick: startUse,
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
  }, [kakaoId, lat, lon]);

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

  // 공영: NFC 플로우로 진입
  const startUse = () => {
    if (!detail?.lat || !detail?.lng) {
      alert("목적지 좌표가 없어 진행할 수 없습니다.");
      return;
    }
    navigate("/nfc", {
      state: {
        dest: { lat: detail.lat, lng: detail.lng },
        name: detail.name,
        address: detail.address,
        parkingId: kakaoId,
      },
    });
  };

  if (loading) {
    return (
      <div className="pub-wrap">
        <div className="pub-topbar">
          <button className="pub-close" onClick={goBack} aria-label="닫기">
            ✕
          </button>
        </div>
        <h1 className="pub-title">불러오는 중…</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pub-wrap">
        <div className="pub-topbar">
          <button className="pub-close" onClick={goBack} aria-label="닫기">
            ✕
          </button>
        </div>
        <h1 className="pub-title">오류</h1>
        <p style={{ padding: "0 24px" }}>{error}</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="pub-wrap">
        <div className="pub-topbar">
          <button className="pub-close" onClick={goBack} aria-label="닫기">
            ✕
          </button>
        </div>
        <h1 className="pub-title">데이터가 없습니다.</h1>
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
    <div className="pub-wrap">
      <div className="pub-topbar">
        <button className="pub-close" onClick={goBack} aria-label="닫기">
          ✕
        </button>
        <button
          className="pub-alarm"
          onClick={async () => {
            try {
              await subscribeAlert(kakaoId);
              alert("알림이 설정되었습니다.");
            } catch {
              alert("알림 설정에 실패했습니다.");
            }
          }}
          aria-label="알림"
          title="알림 설정"
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

      <h1 className="pub-title">{name || "주차 장소"}</h1>

      <div className="pub-chips">
        <div className="pub-chip">
          <div className="pub-chip-icon">
            <img src={pinIcon} alt="위치" />
          </div>
          <div className="pub-chip-text">
            <div className="pub-chip-value">
              <strong>{distanceKm ?? "-"}km</strong>&nbsp;&nbsp;|&nbsp;&nbsp;
              <strong>{etaMin ?? "-"}분</strong>
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
              <strong>{Number(pricePer10m || 0).toLocaleString()}원</strong>
            </div>
            <div className="pub-chip-sub">10분당 주차 비용</div>
          </div>
        </div>
      </div>

      <section className="pub-section">
        <h2 className="pub-section-title">주차 장소와 가장 근접한 위치</h2>
        <div className="pub-address-row">
          <div className="pub-address">{address || "-"}</div>
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

      <section className="pub-section">
        <h2 className="pub-section-title">주차 가능 시간</h2>
        <div className="pub-times">{availableTimes}</div>
      </section>

      <section className="pub-section">
        <h2 className="pub-section-title">주차 장소 설명</h2>
        <div className="pub-photo-box" role="img" aria-label="주차 장소 사진">
          <div className="pub-photo-placeholder">🖼️</div>
        </div>
        <pre className="pub-note">{note}</pre>
      </section>

      <div className="pub-actions">
        <button
          className="pub-btn pub-btn-outline"
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

        <button
          className={`pub-btn pub-btn-primary ${
            primary.disabled ? "in-use" : ""
          }`}
          disabled={primary.disabled}
          onClick={primary.onClick}
        >
          {primary.label}
        </button>
      </div>
    </div>
  );
}
