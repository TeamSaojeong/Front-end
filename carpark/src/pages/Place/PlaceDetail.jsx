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
  getPredict,
  subscribeAlert,
  getParkingStatus,
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

  const placeId = placeFromSession?.id ?? placeIdFromParam ?? null;

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  const [isAvailable, setIsAvailable] = useState(true);
  const [pred, setPred] = useState(null);

  const startUse = () => {
    if (!placeId) return;
    navigate("/paypage", {
      state: {
        parkingId: placeId,
        lotName: detail?.name ?? "주차장",
      },
    });
  };

  const [primary, setPrimary] = useState({
    disabled: false,
    label: "주차장 이용하기",
    onClick: startUse,
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!placeId) return;
      setLoading(true);
      setError("");
      try {
        const { data } = await getPublicDetail(placeId);
        if (!mounted) return;

        const normalized = {
          id: data.id ?? data.parkingId ?? placeId,
          name: data.name ?? placeFromSession?.name ?? "주차 장소",
          distanceKm:
            data.distanceMeters != null
              ? data.distanceMeters / 1000
              : data.distanceKm ?? placeFromSession?.distanceKm ?? null,
          etaMin:
            data.etaMin ?? data.etaMinutes ?? placeFromSession?.etaMin ?? null,
          pricePer10m:
            data.pricePer10m ?? data.price ?? placeFromSession?.price ?? 0,
          address: data.address ?? placeFromSession?.address ?? "",
          availableTimes:
            data.availableTimes ??
            data.openHours ??
            placeFromSession?.available ??
            "00:00 ~ 00:00  |  00:00 ~ 00:00",
          note: data.note ?? placeFromSession?.note ?? "",
          lat: data.lat ?? data.latitude ?? placeFromSession?.lat ?? null,
          lng: data.lng ?? data.longitude ?? placeFromSession?.lng ?? null,
          available: data.available ?? true,
        };

        setDetail(normalized);
        setIsAvailable(!!normalized.available);
        setPrimary({
          disabled: !normalized.available,
          label: normalized.available ? "주차장 이용하기" : "이용 중...",
          onClick: normalized.available ? startUse : undefined,
        });
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
        const ui = mapStatusToUI(data?.data ?? data);
        setIsAvailable(ui.isAvailable);
        setPrimary({
          disabled: !ui.isAvailable,
          label: ui.isAvailable ? "주차장 이용하기" : "이용 중...",
          onClick: ui.isAvailable ? startUse : undefined,
        });
      } catch {
        // 폴백: 기존 상태 유지
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

  const openRoute = () => {
    const lat = detail?.lat;
    const lng = detail?.lng;
    if (lat == null || lng == null) {
      alert("목적지 좌표가 없어 경로를 열 수 없습니다.");
      return;
    }
    navigate("/MapRoute", {
      state: {
        dest: { lat, lng },
        name: detail?.name,
        address: detail?.address,
      },
    });
  };

  const onSubscribeAlert = async () => {
    if (!placeId) return;
    try {
      await subscribeAlert(placeId);
      alert("알림이 설정되었습니다.");
    } catch {
      alert("알림 설정에 실패했습니다.");
    }
  };

  const onPredict = async () => {
    if (!placeId) return;
    try {
      const { data } = await getPredict(placeId, 10);
      setPred(data);
    } catch {
      alert("혼잡도 예측을 불러오지 못했습니다.");
    }
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
      {/* 상단바 */}
      <div className="pub-topbar">
        <button className="pub-close" onClick={goBack} aria-label="닫기">
          ✕
        </button>
        <button
          className="pub-alarm"
          onClick={onSubscribeAlert}
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

      {pred && (
        <div className="pub-soon-notice">
          예측: <strong>{JSON.stringify(pred)}</strong>
        </div>
      )}

      {/* 정보 칩 */}
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

      {/* 주소 */}
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
        <pre className="pub-note">{note}</pre>
      </section>

      {/* 하단 버튼 */}
      <div className="pub-actions">
        <button className="pub-btn pub-btn-outline" onClick={openRoute}>
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
        <button className="pub-btn pub-btn-ghost" onClick={onPredict}>
          혼잡도 예측
        </button>
      </div>
    </div>
  );
}
