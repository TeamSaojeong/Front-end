import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomSheet from "../components/BottomSheet";
import "../Styles/app-frame.css";
import Mapmenu from "../components/Mapmenu";
import Aiforecast from "../components/Aiforecast";
import greenFire from "../Assets/greenfire.svg";
import "../Styles/map-poi.css";

const SDK_SRC =
  "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false";

const params = new URLSearchParams(window.location.search);
const useMock =
  params.get("mock") === "1" ||
  import.meta?.env?.VITE_USE_MOCK === "1" ||
  process.env.REACT_APP_USE_MOCK === "1";

const MOCK_PLACES = [
  {
    id: 1,
    name: "모의 주차장 A",
    lat: 37.5667,
    lng: 126.9784,
    distanceKm: 0.4,
    etaMin: 3,
    price: 0,
    address: "서울특별시 중구 세종대로 110",
    type: "PRIVATE",
    leavingSoon: true,
  },
  {
    id: 2,
    name: "모의 주차장 B",
    lat: 37.5659,
    lng: 126.9769,
    distanceKm: 0.6,
    etaMin: 5,
    price: 1000,
    address: "서울특별시 중구 태평로1가",
    type: "PUBLIC",
    leavingSoon: false,
  },
];

export default function Home() {
  const wrapRef = useRef(null);
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const abortRef = useRef(null);
  const markersRef = useRef([]);
  const overlaysRef = useRef([]);
  const loadingRef = useRef(false);
  const myLocOverlayRef = useRef(null);

  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [showRequery, setShowRequery] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false); // ✅ 시트 열림 상태
  const [selectedId, setSelectedId] = useState(null);

  const navigate = useNavigate();

  const isPrivate = (place) =>
    String(place?.type || "").toUpperCase() === "PRIVATE";

  const onSelectPlace = (p) => {
    try {
      sessionStorage.setItem("selectedPlace", JSON.stringify(p));
    } catch {}
    setSelectedId(p.id);
    updateBubbleStyles(p.id);

    const go = () =>
      isPrivate(p)
        ? navigate(`/pv/place/${p.id}`, { state: { place: p } })
        : navigate(`/place/${p.id}`, { state: { place: p } });
    setTimeout(go, 120);
  };

  useEffect(() => {
    const init = () => {
      const kakao = window.kakao;
      if (!mapEl.current || mapRef.current) return;

      const centerLatLng = new kakao.maps.LatLng(center.lat, center.lng);
      const map = new kakao.maps.Map(mapEl.current, {
        center: centerLatLng,
        level: 4,
      });
      mapRef.current = map;

      kakao.maps.event.addListener(map, "dragend", () => setShowRequery(true));
      kakao.maps.event.addListener(map, "zoom_changed", () =>
        setShowRequery(true)
      );

      detectAndLoad();
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

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectAndLoad = () => {
    if (!navigator.geolocation) {
      fetchNearby(center.lat, center.lng);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCenter({ lat, lng });
        recenterMap(lat, lng);
        showMyLocation(lat, lng);
        fetchNearby(lat, lng);
      },
      () => fetchNearby(center.lat, center.lng),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
  };

  const recenterMap = (lat, lng) => {
    const kakao = window.kakao;
    if (!mapRef.current || !kakao?.maps) return;
    mapRef.current.setCenter(new kakao.maps.LatLng(lat, lng));
  };

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m?.setMap?.(null));
    markersRef.current = [];
  };
  const clearOverlays = () => {
    overlaysRef.current.forEach((item) =>
      item?.overlay?.setMap ? item.overlay.setMap(null) : item?.setMap?.(null)
    );
    overlaysRef.current = [];
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

  const renderBubbles = (rows) => {
    const kakao = window.kakao;
    if (!mapRef.current || !kakao?.maps) return;

    rows.forEach((p) => {
      if (!p.lat || !p.lng) return;

      const chip = document.createElement("div");
      chip.className = "poi-chip";
      if (p.id === selectedId) chip.classList.add("poi-chip--selected");
      chip.textContent = `₩ ${(p.price ?? 0).toLocaleString()}원`;
      chip.addEventListener("click", () => onSelectPlace(p));

      const chipOv = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(p.lat, p.lng),
        content: chip,
        yAnchor: 1.1,
        zIndex: 5,
        clickable: true,
      });
      chipOv.setMap(mapRef.current);
      overlaysRef.current.push({
        id: p.id,
        el: chip,
        overlay: chipOv,
        place: p,
      });

      if (p.leavingSoon) {
        const badge = document.createElement("div");
        badge.className = "poi-leaving-badge";
        badge.innerHTML = `
          <img src="${greenFire}" alt="" class="poi-leaving-badge__icon" />
          <span class="poi-leaving-badge__text">곧 나감</span>
        `;
        badge.addEventListener("click", () => onSelectPlace(p));

        const badgeOv = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(p.lat, p.lng),
          content: badge,
          yAnchor: 1.55,
          zIndex: 6,
          clickable: true,
        });
        badgeOv.setMap(mapRef.current);
        overlaysRef.current.push({
          id: `${p.id}-badge`,
          el: badge,
          overlay: badgeOv,
          place: p,
        });
      }
    });
  };

  const updateBubbleStyles = (selId = selectedId) => {
    overlaysRef.current.forEach(({ id, el }) => {
      if (!el) return;
      el.classList.toggle("poi-chip--selected", id === selId);
    });
  };

  const fetchNearby = async (lat, lng) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setErrorMsg("");
    setSelectedId(null);
    clearMarkers();
    clearOverlays();

    try {
      if (useMock) {
        setPlaces(MOCK_PLACES);
        renderBubbles(MOCK_PLACES);
        setShowRequery(false);
        return;
      }

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const resp = await fetch(`/api/parking/nearby?lat=${lat}&lng=${lng}`, {
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
        method: "GET",
      });

      if (!resp.ok) throw new Error(`API ${resp.status}`);

      const json = await resp.json();

      const rows = (json?.data ?? json?.results ?? json ?? []).map(
        (it, idx) => {
          const id = it.id ?? it.parkingId ?? idx + 1;
          const name = it.name ?? it.parkingName ?? it.title ?? "이름없음";
          const latV = it.lat ?? it.latitude ?? it.y ?? null;
          const lngV = it.lng ?? it.longitude ?? it.x ?? null;
          const distanceKm =
            it.distanceKm ?? it.distance_km ?? it.distance ?? null;
          const etaMin = it.etaMin ?? it.eta_min ?? null;
          const price = it.price ?? it.fee ?? 0;
          const address = it.address ?? it.road_address ?? it.addr ?? "";
          const type = it.type ?? it.category ?? it.kind ?? null;
          const leavingSoon =
            it.leavingSoon ??
            it.queueOpen ??
            it.isLeavingSoon ??
            typeof it.leaving_eta_min === "number";

          return {
            id,
            name,
            lat: latV,
            lng: lngV,
            distanceKm,
            etaMin,
            price,
            address,
            type,
            leavingSoon,
          };
        }
      );

      setPlaces(rows);
      renderBubbles(rows);
      setShowRequery(false);
    } catch (e) {
      if (e.name !== "AbortError") {
        console.warn("주차장 조회 실패:", e?.message || e);
        setErrorMsg("서버가 준비 중이거나 일시적으로 응답하지 않습니다.");
      }
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const refreshFromCurrentPosition = () => {
    if (!navigator.geolocation) {
      if (mapRef.current) {
        const c = mapRef.current.getCenter();
        fetchNearby(c.getLat(), c.getLng());
      } else {
        fetchNearby(center.lat, center.lng);
      }
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCenter({ lat, lng });
        recenterMap(lat, lng);
        showMyLocation(lat, lng);
        fetchNearby(lat, lng);
      },
      () => {
        if (mapRef.current) {
          const c = mapRef.current.getCenter();
          fetchNearby(c.getLat(), c.getLng());
        } else {
          fetchNearby(center.lat, center.lng);
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
  };

  const requeryHere = () => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    setCenter({ lat: c.getLat(), lng: c.getLng() });
    fetchNearby(c.getLat(), c.getLng());
  };

  return (
    <div ref={wrapRef} className="map-wrap">
      <div ref={mapEl} className="map-fill" />

      <Mapmenu />
      <Aiforecast onClick={() => console.log("AI 예보 클릭")} />

      {/* ✅ 바텀시트가 내려가 있을 때만 노출 */}
      {showRequery && !isSheetOpen && (
        <button
          className="requery-btn"
          onClick={requeryHere}
          disabled={isLoading}
          aria-busy={isLoading ? "true" : "false"}
        >
          <span className="requery-icon" aria-hidden>
            ↻
          </span>
          {isLoading ? "검색 중…" : "여기에서 다시 검색"}
        </button>
      )}

      <BottomSheet
        hostRef={wrapRef}
        places={places}
        isLoading={isLoading}
        errorMsg={errorMsg}
        onRefreshHere={refreshFromCurrentPosition}
        onSelectPlace={onSelectPlace}
        onOpenChange={setIsSheetOpen} // ✅ 열림 상태 반영
      />
    </div>
  );
}
