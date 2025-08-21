// src/pages/Place/PvPlaceDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../../Styles/Place/PlaceDetail.css";

import reportIcon from "../../Assets/report.svg";
import pinIcon from "../../Assets/emptypin.svg";
import moneyIcon from "../../Assets/money.svg";
import copyIcon from "../../Assets/copy.svg";
import alarmIcon from "../../Assets/alarm.svg";

import {
  getPrivateDetail,
  getParkingStatus,
  subscribeAlert,
  getPrivateImage,
} from "../../apis/parking";
import { mapStatusToUI } from "../../utils/parkingStatus";
import { useMyParkings } from "../../store/MyParkings";

const toNum = (v) => (v == null || v === "" ? null : Number(v));

export default function PvPlaceDetail() {
  const navigate = useNavigate();
  const { placeId } = useParams();
  const location = useLocation();
  const myParks = useMyParkings((s) => s.items);

  const fromSession = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("selectedPlace");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isLocal =
    !!location.state?.place?.isLocal ||
    !!fromSession?.isLocal ||
    !!myParks.find(
      (p) => String(p.id) === String(placeId) && p.origin === "local"
    );

  const localItem = isLocal
    ? myParks.find((p) => String(p.id) === String(placeId))
    : null;

  const sessionLat = toNum(fromSession?.lat);
  const sessionLng = toNum(fromSession?.lng);

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  useEffect(() => {
    return () => {
      if (imageUrl?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(imageUrl);
        } catch {}
      }
    };
  }, [imageUrl]);

  const [primary, setPrimary] = useState({
    disabled: false,
    label: "주차장 이용하기",
    onClick: () => {},
  });

  useEffect(() => {
    let mounted = true;

    async function loadRemote() {
      setLoading(true);
      setError("");
      try {
        const { data } = await getPrivateDetail(placeId);
        if (!mounted) return;

        const d = data?.data ?? data ?? {};
        const lat = toNum(d?.lat ?? d?.y) ?? sessionLat ?? null;
        const lng = toNum(d?.lng ?? d?.x) ?? sessionLng ?? null;

        const normalized = {
          id: d.id ?? d.parkingId ?? placeId,
          name: d.name ?? fromSession?.name ?? "주차 장소",
          distanceKm: d.distanceKm ?? fromSession?.distanceKm ?? null,
          etaMin: d.etaMin ?? fromSession?.etaMin ?? null,
          pricePer10m: d.charge ?? fromSession?.price ?? 0,
          address: d.address ?? fromSession?.address ?? "",
          availableTimes: Array.isArray(d.operateTimes)
            ? d.operateTimes.map((t) => `${t.start} ~ ${t.end}`).join("  |  ")
            : fromSession?.availableTimes ?? "00:00 ~ 00:00",
          note:
            d.content ??
            d.description ??
            d.desc ??
            fromSession?.content ??
            fromSession?.note ??
            "",
          lat,
          lng,
          _flags: { isLocal: false },
        };
        setDetail(normalized);

        // 서버 이미지
        try {
          const imgRes = await getPrivateImage(normalized.id);
          if (imgRes?.data && mounted) {
            const url = URL.createObjectURL(imgRes.data);
            setImageUrl((prev) => {
              if (prev?.startsWith("blob:")) {
                try {
                  URL.revokeObjectURL(prev);
                } catch {}
              }
              return url;
            });
          }
        } catch {}
      } catch (e) {
        if (!mounted) return;
        setError(
          e?.response?.data?.message || "상세 정보를 불러오지 못했습니다."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    function loadLocal() {
      setLoading(true);
      setError("");

      const src = localItem || fromSession || {};
      const lat = toNum(src.lat) ?? sessionLat ?? null;
      const lng = toNum(src.lng) ?? sessionLng ?? null;

      const normalized = {
        id: src.id ?? placeId,
        name: src.name ?? "내 주차장",
        distanceKm: null,
        etaMin: null,
        pricePer10m: Number(src.charge ?? src.price ?? 0),
        address: src.address ?? "",
        availableTimes: Array.isArray(src.operateTimes)
          ? src.operateTimes.map((t) => `${t.start} ~ ${t.end}`).join("  |  ")
          : fromSession?.availableTimes ?? "00:00 ~ 00:00",
        note:
          src.content ??
          src.description ??
          src.desc ??
          fromSession?.content ??
          fromSession?.note ??
          "",
        lat,
        lng,
        _flags: { isLocal: true },
      };
      setDetail(normalized);

      // 로컬/세션 이미지
      if (src.imageUrl) setImageUrl(src.imageUrl);

      setLoading(false);

      setPrimary({
        disabled: false,
        label: "주차장 이용하기",
        onClick: startUse,
      });
    }

    if (!placeId) {
      setError("장소 식별자가 없어 상세를 불러올 수 없습니다.");
      setLoading(false);
      return;
    }

    if (isLocal) loadLocal();
    else loadRemote();

    return () => {
      mounted = false;
    };
  }, [placeId, isLocal]); // eslint-disable-line

  useEffect(() => {
    if (!placeId || isLocal) return;
    let mounted = true;

    async function pullStatus() {
      try {
        const { data } = await getParkingStatus(placeId);
        const ui = mapStatusToUI(data?.data);
        if (!mounted) return;
        setPrimary({
          disabled: !ui.isAvailable,
          label: ui.isAvailable ? "주차장 이용하기" : "이용 중...",
          onClick: ui.isAvailable ? startUse : undefined,
        });
      } catch {
        if (!mounted) return;
        setPrimary({
          disabled: false,
          label: "주차장 이용하기",
          onClick: startUse,
        });
      }
    }

    pullStatus();
    const timer = setInterval(pullStatus, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [placeId, isLocal]);

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

  const startUse = () => {
    const targetLat = toNum(detail?.lat) ?? sessionLat ?? null;
    const targetLng = toNum(detail?.lng) ?? sessionLng ?? null;

    if (
      targetLat == null ||
      Number.isNaN(targetLat) ||
      targetLng == null ||
      Number.isNaN(targetLng)
    ) {
      alert("목적지 좌표가 없어 진행할 수 없습니다.");
      return;
    }

    navigate(
      {
        pathname: "/nfc",
        search: `?placeId=${encodeURIComponent(placeId ?? "")}`,
      },
      {
        state: {
          prefetched: true,
          placeId,
          placeName: detail?.name,
          address: detail?.address,
          openRangesText: detail?.availableTimes,
          isLocal: !!detail?._flags?.isLocal,
        },
      }
    );
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

        {!isLocal && (
          <>
            <button
              className="pub-alarm"
              onClick={async () => {
                try {
                  await subscribeAlert(placeId);
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
          </>
        )}
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
        <h2 className="pub-section-title">주차 장소 사진</h2>
        <div className="pub-photo-box" role="img" aria-label="주차 장소 사진">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="주차 장소"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 12,
              }}
            />
          ) : (
            <div className="pub-photo-placeholder">🖼️</div>
          )}
        </div>

        <h2 className="pub-section-title" style={{ marginTop: 4 }}>
          주차 장소 설명
        </h2>
        <pre className="pub-note">{note || "-"}</pre>
      </section>

      <div className="pub-actions">
        <button
          className="pub-btn pub-btn-outline"
          onClick={() => {
            const targetLat = toNum(detail?.lat) ?? sessionLat ?? null;
            const targetLng = toNum(detail?.lng) ?? sessionLng ?? null;
            if (
              targetLat == null ||
              Number.isNaN(targetLat) ||
              targetLng == null ||
              Number.isNaN(targetLng)
            ) {
              alert("목적지 좌표가 없어 경로를 열 수 없습니다.");
              return;
            }
            navigate("/MapRoute", {
              state: {
                dest: { lat: targetLat, lng: targetLng },
                name: detail.name,
                address: detail.address,
                placeId,
                isPrivate: true,
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
