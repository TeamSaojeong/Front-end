// src/utils/mapUtils.js
import React from "react";

const normalizeId = (id) => String(id ?? "").replace(/^kakao:/i, "");

// 양재AT센터 고정 위치 (정확한 좌표)
const FIXED_LOCATION = { lat: 37.468358, lng: 127.039229 };

// 거리 계산 함수
export const distKm = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** 로컬 저장 유틸 - 양재AT센터로 고정 */
export const getCachedLoc = () => {
  // 항상 양재AT센터 위치 반환
  return FIXED_LOCATION;
};

export const setCachedLoc = (lat, lng) => {
  try {
    localStorage.setItem(
      "lastKnownLoc",
      JSON.stringify({ lat, lng, ts: Date.now() })
    );
  } catch {}
};

export const near = (a, b) => {
  if (!a || !b) return false;
  const dLat = Math.abs(a.lat - b.lat);
  const dLng = Math.abs(a.lng - b.lng);
  return dLat < 0.0003 && dLng < 0.0003; // ~30m
};

/** 내가 알림 등록한 장소들 관리 */
export const getUserKey = () => localStorage.getItem("userKey") || "guest";
const LSK = (key) => `watchedPlaceIds__${key}`;

export const useWatchedIds = (userKey = getUserKey()) => {
  const [ids, setIds] = React.useState(() => {
    try {
      const raw = localStorage.getItem(LSK(userKey));
      const arr = raw ? JSON.parse(raw) : [];
      return (Array.isArray(arr) ? arr : []).map((x) => normalizeId(x));
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LSK(userKey)) {
        try {
          const next = e.newValue ? JSON.parse(e.newValue) : [];
          setIds((Array.isArray(next) ? next : []).map((x) => normalizeId(x)));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userKey]);

  return ids;
};

// 터치 클릭 핸들러
export const attachTouchClick = (el, onTap) => {
  let sx = 0,
    sy = 0,
    moved = false;
  const THRESH = 8;
  
  const ts = (e) => {
    moved = false;
    const t = e.touches?.[0];
    if (!t) return;
    sx = t.clientX;
    sy = t.clientY;
  };
  
  const tm = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    if (
      Math.abs(t.clientX - sx) > THRESH ||
      Math.abs(t.clientY - sy) > THRESH
    ) {
      moved = true;
    }
  };
  
  const te = () => {
    if (!moved) onTap();
  };
  
  el.addEventListener("touchstart", ts, { passive: true });
  el.addEventListener("touchmove", tm, { passive: true });
  el.addEventListener("touchend", te);
  el.addEventListener("click", onTap);
};

// 내 위치 표시
export const showMyLocation = (mapRef, myLocOverlayRef, lat, lng) => {
  const kakao = window.kakao;
  if (!mapRef.current) return;
  
  const el = document.createElement("div");
  el.className = "my-loc-dot";
  
  if (myLocOverlayRef.current) myLocOverlayRef.current.setMap(null);
  
  myLocOverlayRef.current = new kakao.maps.CustomOverlay({
    position: new kakao.maps.LatLng(lat, lng),
    content: el,
    yAnchor: 0.5,
    zIndex: 9999,
    clickable: false,
  });
  
  myLocOverlayRef.current.setMap(mapRef.current);
};

// 지도 중심 이동
export const recenterMap = (mapRef, lat, lng) => {
  const kakao = window.kakao;
  if (!mapRef.current || !kakao?.maps) return;
  mapRef.current.setCenter(new kakao.maps.LatLng(lat, lng));
};

export default {
  getCachedLoc,
  setCachedLoc,
  near,
  distKm,
  getUserKey,
  useWatchedIds,
  attachTouchClick,
  showMyLocation,
  recenterMap,
};
