// src/pages/Nfc/MapRoute.jsx
// 지도 불러오기 + 상단/하단 UI + OSRM 거리/시간 + 상단 카드 클릭 시 상세로 이동
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/Nfc/MapRoute.css";

import pinIcon from "../../Assets/emptypin.svg";
import orangeLcIcon from "../../Assets/orangelc.svg";

const SDK_SRC =
  "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false";

export default function MapRoute() {
  const navigate = useNavigate();
  // state 예시: { dest:{lat,lng}, name, address, placeId, isPrivate }
  const { state } = useLocation();

  // refs
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const polylinesRef = useRef([]);
  const myLocOverlayRef = useRef(null);

  // state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [routeMeta, setRouteMeta] = useState({
    distanceKm: null,
    durationMin: null,
  });

  // ===== Kakao Map init =====
  useEffect(() => {
    const init = () => {
      const kakao = window.kakao;
      if (!mapEl.current || mapRef.current) return;

      const centerLat = state?.dest?.lat ?? 37.5665;
      const centerLng = state?.dest?.lng ?? 126.978;
      const map = new kakao.maps.Map(mapEl.current, {
        center: new kakao.maps.LatLng(centerLat, centerLng),
        level: 4,
      });
      mapRef.current = map;

      if (state?.dest?.lat && state?.dest?.lng) {
        showRouteTo(state.dest.lat, state.dest.lng);
      } else {
        setErrorMsg("목적지 좌표가 없습니다.");
      }
    };

    if (window.kakao?.maps) {
      window.kakao.maps.load(init);
    } else {
      const s = document.createElement("script");
      s.src = SDK_SRC;
      s.async = true;
      s.id = "kakao-map-sdk";
      s.onload = () => window.kakao.maps.load(init);
      document.head.appendChild(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ===== helpers =====
  const clearPolylines = () => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
  };

  const drawRoute = (coords) => {
    const kakao = window.kakao;
    if (!mapRef.current || !kakao?.maps) return;

    const path = coords.map((c) => new kakao.maps.LatLng(c.lat, c.lng));

    clearPolylines();
    const polyline = new kakao.maps.Polyline({
      path,
      strokeWeight: 6,
      strokeColor: "#3B82F6",
      strokeOpacity: 0.9,
      strokeStyle: "solid",
    });
    polyline.setMap(mapRef.current);
    polylinesRef.current.push(polyline);

    const bounds = new kakao.maps.LatLngBounds();
    path.forEach((pt) => bounds.extend(pt));
    mapRef.current.setBounds(bounds);
  };

  const showMyLocation = (lat, lng) => {
    const kakao = window.kakao;
    if (!mapRef.current || !kakao?.maps) return;

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

  // OSRM(프론트 호출) — 경로/거리/시간 동시 반환
  const fetchRoute = async (origin, dest) => {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.lng},${origin.lat};${dest.lng},${dest.lat}` +
      `?overview=full&geometries=geojson`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`OSRM ${resp.status}`);
    const json = await resp.json();

    const route = json?.routes?.[0];
    const coords = route?.geometry?.coordinates ?? [];
    const distanceMeters = route?.distance ?? null; // m
    const durationSeconds = route?.duration ?? null; // s

    const path = coords.map(([lng, lat]) => ({ lat, lng }));
    return {
      coords: path,
      distanceKm:
        typeof distanceMeters === "number" ? distanceMeters / 1000 : null,
      durationMin:
        typeof durationSeconds === "number" ? durationSeconds / 60 : null,
    };
  };

  const showRouteTo = async (destLat, destLng) => {
    const dest = { lat: destLat, lng: destLng };

    const origin = await new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 37.554722, lng: 126.970833 }); // 서울역
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: 37.554722, lng: 126.970833 }),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    });

    try {
      setIsLoading(true);
      setErrorMsg("");
      showMyLocation(origin.lat, origin.lng);

      const { coords, distanceKm, durationMin } = await fetchRoute(
        origin,
        dest
      );
      drawRoute(coords);
      setRouteMeta({
        distanceKm,
        durationMin,
      });

      // 목적지 마커
      const kakao = window.kakao;
      new kakao.maps.Marker({
        position: new kakao.maps.LatLng(dest.lat, dest.lng),
        map: mapRef.current,
      });
    } catch (e) {
      console.warn("경로 조회 실패:", e);
      setErrorMsg("경로를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const fmtMeta = () => {
    const d =
      routeMeta.distanceKm != null
        ? `${routeMeta.distanceKm.toFixed(1)}km`
        : "—km";
    const t =
      routeMeta.durationMin != null
        ? `${Math.round(routeMeta.durationMin)}분 남음`
        : "—분";
    return `${d} · ${t}`;
  };

  // 상단 카드 클릭 → 상세 페이지로
  const goToDetail = () => {
    const pid = state?.placeId ?? state?.id;
    if (!pid) {
      navigate(-1);
      return;
    }
    const path = state?.isPrivate ? `/pv/place/${pid}` : `/place/${pid}`;
    navigate(path, { state });
  };

  return (
    <div className="map-wrap">
      {/* 상단 정보 카드 (클릭 시 상세로 이동) */}
      <div
        className="route-topcard"
        onClick={goToDetail}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" ? goToDetail() : null)}
        style={{ cursor: "pointer" }}
      >
        <div className="route-left">
          <img src={orangeLcIcon} alt="" className="route-pin" />
          <div className="route-texts">
            <div className="route-title">{state?.name ?? "주차 장소 이름"}</div>
            <div className="route-sub">
              <img src={pinIcon} alt="" className="route-sub-icon" />
              <span>{fmtMeta()}</span>
            </div>
          </div>
        </div>
        <div className="route-chevron" aria-hidden>
          ›
        </div>
      </div>

      {/* 뒤로가기 */}
      <button
        className="map-top-back"
        onClick={() => navigate(-1)}
        aria-label="뒤로가기"
      >
        ←
      </button>

      {/* 지도 */}
      <div ref={mapEl} className="map-fill" />

      {/* 하단 종료 버튼 */}
      <div className="route-endbar">
        <button
          className="route-endbtn"
          onClick={() => navigate("/home", { replace: true })}
        >
          경로 안내 종료
        </button>
      </div>

      {/* 상태 토스트 */}
      {isLoading && <div className="map-toast">경로 불러오는 중…</div>}
      {!!errorMsg && <div className="map-toast error">{errorMsg}</div>}
    </div>
  );
}
