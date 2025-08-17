// 지도 불러오는 부분 GPT 사용

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/app-frame.css";
import "../../Styles/Nfc/MapRoute.css";

const SDK_SRC =
  "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false";

export default function MapRoute() {
  const navigate = useNavigate();
  const { state } = useLocation(); // { dest, name }

  // refs
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const polylinesRef = useRef([]);
  const myLocOverlayRef = useRef(null);

  // state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  // OSRM(프론트 호출)
  const fetchRoute = async (origin, dest) => {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.lng},${origin.lat};${dest.lng},${dest.lat}` +
      `?overview=full&geometries=geojson`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`OSRM ${resp.status}`);
    const json = await resp.json();
    const coords = json?.routes?.[0]?.geometry?.coordinates ?? [];
    return coords.map(([lng, lat]) => ({ lat, lng }));
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
      const coords = await fetchRoute(origin, dest);
      drawRoute(coords);

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

  return (
    <div className="map-wrap">
      <button
        className="map-top-back"
        onClick={() => navigate(-1)}
        aria-label="뒤로가기"
      >
        ←
      </button>
      <div ref={mapEl} className="map-fill" />
      {isLoading && <div className="map-toast">경로 불러오는 중…</div>}
      {!!errorMsg && <div className="map-toast error">{errorMsg}</div>}
    </div>
  );
}
