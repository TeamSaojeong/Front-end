// src/pages/Place/PvPlaceDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../../Styles/Place/PlaceDetail.css";

import reportIcon from "../../Assets/report.svg";
import pinIcon from "../../Assets/emptypin.svg";
import moneyIcon from "../../Assets/money.svg";
import copyIcon from "../../Assets/copy.svg";
import alarmIcon from "../../Assets/alarm.svg";
import alarmFilledIcon from "../../Assets/alarm1.svg";

import {
  getPrivateDetail,
  getParkingStatus,
  subscribeAlert,
  unsubscribeAlert,
  getPrivateImage,
} from "../../apis/parking";
import { mapStatusToUI } from "../../utils/parkingStatus";
import { useMyParkings } from "../../store/MyParkings";

const toNum = (v) => (v == null || v === "" ? null : Number(v));
const normalizeId = (id) => String(id ?? "").replace(/^kakao:/i, "");

/** 사용자별 로컬 키 (동일 브라우저 내 다른 계정 분리용) */
const getUserKey = () => localStorage.getItem("userKey") || "guest";
const lsk = (key) => `watchedPlaceIds__${key}`;
const readWatched = (userKey = getUserKey()) => {
  try {
    const raw = localStorage.getItem(lsk(userKey));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map((x) => normalizeId(x)) : [];
  } catch {
    return [];
  }
};
const saveWatched = (ids, userKey = getUserKey()) => {
  try {
    localStorage.setItem(lsk(userKey), JSON.stringify(ids));
  } catch {}
};
const addWatched = (id, userKey = getUserKey()) => {
  const set = new Set(readWatched(userKey));
  set.add(normalizeId(id));
  saveWatched([...set], userKey);
};

// 거리 계산 함수 (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // 소수점 첫째 자리까지
};

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
  
  const userKey = getUserKey();
  const externalId = normalizeId(placeId);

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  
  /** 처음 진입 시: 로컬 기억값을 우선으로 아이콘 상태 결정 */
  const [isSubscribed, setIsSubscribed] = useState(() =>
    readWatched(userKey).includes(externalId)
  );

  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('위치 가져오기 실패:', error);
          // 캐시된 위치 사용
          try {
            const cached = JSON.parse(localStorage.getItem("lastKnownLoc") || "{}");
            if (cached.lat && cached.lng) {
              setCurrentLocation({ lat: cached.lat, lng: cached.lng });
            }
          } catch {}
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

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

        // 현재 위치 기준 거리 계산
        const calculatedDistance = currentLocation && lat && lng 
          ? calculateDistance(currentLocation.lat, currentLocation.lng, lat, lng)
          : null;

        const normalized = {
          id: d.id ?? d.parkingId ?? placeId,
          name: d.name ?? d.parkingName ?? d.placeName ?? fromSession?.name ?? "주차 장소",
          distanceKm: calculatedDistance ?? d.distanceKm ?? fromSession?.distanceKm ?? null,
          etaMin: d.etaMin ?? fromSession?.etaMin ?? null,
          pricePer10m:
            d.charge != null
              ? Number(d.charge)
              : fromSession?.price != null
              ? Number(fromSession.price)
              : 0,
          address: d.address ?? fromSession?.address ?? "",
          availableTimes: Array.isArray(d.operateTimes)
            ? d.operateTimes.map((t) => `${t.start} ~ ${t.end}`).join("  |  ")
            : fromSession?.operateTimes
            ? fromSession.operateTimes
                .map((t) => `${t.start} ~ ${t.end}`)
                .join("  |  ")
            : "00:00 ~ 00:00",
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

    async function loadLocal() {
      setLoading(true);
      setError("");

      const src = localItem || fromSession || {};
      const lat = toNum(src.lat) ?? sessionLat ?? null;
      const lng = toNum(src.lng) ?? sessionLng ?? null;

      // 현재 위치 기준 거리 계산
      const calculatedDistance = currentLocation && lat && lng 
        ? calculateDistance(currentLocation.lat, currentLocation.lng, lat, lng)
        : null;

      const normalized = {
        id: src.id ?? placeId,
        name: src.name ?? "내 주차장",
        distanceKm: calculatedDistance,
        etaMin: null,
        pricePer10m:
          src.charge != null
            ? Number(src.charge)
            : src.price != null
            ? Number(src.price)
            : 0,
        address: src.address ?? "",
        availableTimes: Array.isArray(src.operateTimes)
          ? src.operateTimes.map((t) => `${t.start} ~ ${t.end}`).join("  |  ")
          : fromSession?.operateTimes
          ? fromSession.operateTimes
              .map((t) => `${t.start} ~ ${t.end}`)
              .join("  |  ")
          : "00:00 ~ 00:00",
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

      // 이미지 로드 우선순위: 로컬 → 서버
      console.log("[PvPlaceDetail] 이미지 로드 시작:", {
        id: normalized.id,
        hasLocalImage: !!src.imageUrl,
        hasLocalFile: !!src.image
      });

      // 1. 로컬 URL이 있는 경우
      if (src.imageUrl) {
        setImageUrl(src.imageUrl);
        console.log("[PvPlaceDetail] 로컬 URL 사용:", src.imageUrl);
      }
      // 2. 로컬 File 객체가 있는 경우 
      else if (src.image instanceof File) {
        const url = URL.createObjectURL(src.image);
        setImageUrl(url);
        console.log("[PvPlaceDetail] 로컬 File 객체 사용");
      }
      // 3. 서버에서 이미지 가져오기 (실제 등록된 주차장만)
      else if (String(normalized.id) && !String(normalized.id).startsWith('temp_')) {
        try {
          console.log("[PvPlaceDetail] 서버 이미지 요청:", normalized.id);
          const imgRes = await getPrivateImage(normalized.id);
          if (imgRes?.data) {
            const url = URL.createObjectURL(imgRes.data);
            setImageUrl(url);
            console.log("[PvPlaceDetail] 서버에서 이미지 로드 성공");
          }
        } catch (error) {
          // 404는 정상 (이미지 없음), 다른 오류만 경고
          if (error?.response?.status === 404) {
            console.log("[PvPlaceDetail] 서버에 이미지 없음 (404) - 정상");
          } else {
            console.warn("[PvPlaceDetail] 서버 이미지 로드 실패:", error?.message);
          }
        }
      } else {
        console.log("[PvPlaceDetail] 이미지 로드 건너뜀 (임시 ID 또는 ID 없음)");
      }

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

    if (isLocal) {
      loadLocal();
    } else {
      loadRemote();
    }

    return () => {
      mounted = false;
    };
  }, [placeId, isLocal, currentLocation]); // currentLocation 추가

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
    const timer = setInterval(pullStatus, 3000); // 3초마다 확인
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

    console.log('PvPlaceDetail에서 NFC로 전달하는 정보:', {
      placeId,
      placeName: detail?.name,
      address: detail?.address,
      openRangesText: detail?.availableTimes,
      isLocal: !!detail?._flags?.isLocal,
      lat: targetLat,
      lng: targetLng,
      pricePer10Min: Math.round((detail?.pricePer10m || 0) / 10) * 10,
    });
    
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
          lat: targetLat,
          lng: targetLng,
          pricePer10Min: Math.round((detail?.pricePer10m || 0) / 10) * 10, // 10분당 가격으로 변환
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
                if (!placeId) {
                  alert("주차장 정보를 불러올 수 없어 알림을 설정할 수 없습니다.");
                  return;
                }

                try {
                  if (isSubscribed) {
                    // 알림 해지 - alertId 필요
                    const alertIdsKey = `alertIds__${userKey}`;
                    const alertIds = JSON.parse(localStorage.getItem(alertIdsKey) || "{}");
                    const alertId = alertIds[externalId];
                    
                    if (alertId) {
                      await unsubscribeAlert({ alertId });
                      
                      // 로컬에서 제거
                      const watchedIds = readWatched(userKey).filter(id => id !== externalId);
                      saveWatched(watchedIds, userKey);
                      
                      const nameKey = "watchedPlaceNames__" + userKey;
                      const names = JSON.parse(localStorage.getItem(nameKey) || "{}");
                      delete names[externalId];
                      localStorage.setItem(nameKey, JSON.stringify(names));
                      
                      // alertId도 제거
                      delete alertIds[externalId];
                      localStorage.setItem(alertIdsKey, JSON.stringify(alertIds));
                      
                      setIsSubscribed(false);
                      alert("알림이 해지되었습니다.");
                    } else {
                      alert("알림 ID를 찾을 수 없어 해지할 수 없습니다.");
                    }
                  } else {
                    // 알림 등록
                    console.log('개인주차장 알림 등록 파라미터:', { provider: "kakao", externalId, parkingId: placeId });
                    const alertResponse = await subscribeAlert({ 
                      provider: "kakao", 
                      externalId,
                      parkingId: placeId 
                    });
                    const alertId = alertResponse?.data?.data?.id;
                    
                    console.log('POST /api/alerts response:', alertResponse);
                    console.log('extracted alertId:', alertId);
                    
                    addWatched(externalId, userKey);

                    const nameKey = "watchedPlaceNames__" + userKey;
                    const names = JSON.parse(localStorage.getItem(nameKey) || "{}");
                    names[externalId] = detail?.name || "개인 주차장";
                    localStorage.setItem(nameKey, JSON.stringify(names));

                    // alertId 저장
                    if (alertId) {
                      const alertIdsKey = `alertIds__${userKey}`;
                      const alertIds = JSON.parse(localStorage.getItem(alertIdsKey) || "{}");
                      alertIds[externalId] = alertId;
                      localStorage.setItem(alertIdsKey, JSON.stringify(alertIds));
                    }

                    setIsSubscribed(true);
                    alert("알림이 설정되었습니다.");
                  }
                } catch (e) {
                  if (e?.response?.status === 401) {
                    alert("세션이 만료되었습니다. 다시 로그인해 주세요.");
                    try {
                      localStorage.removeItem("accessToken");
                    } catch {}
                    navigate("/login", { state: { from: location.pathname } });
                    return;
                  }
                  alert(e?.response?.data?.message || "처리 중 오류가 발생했어요.");
                }
              }}
              aria-label={isSubscribed ? "알림 해지" : "알림 설정"}
              title={isSubscribed ? "알림 해지" : "알림 설정"}
            >
              <img src={isSubscribed ? alarmFilledIcon : alarmIcon} alt="알림" />
            </button>
            <button
              className="pub-bell"
              onClick={() => navigate("/report", {
                state: {
                  placeId: placeId,
                  placeName: detail?.name || "내 주차장",
                  address: detail?.address || "",
                  isPrivate: true
                }
              })}
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
              <strong>{distanceKm ?? "-"}km</strong>
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
