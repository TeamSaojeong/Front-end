// src/pages/Home.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomSheet from "../components/BottomSheet";
import "../Styles/app-frame.css";
import Mapmenu from "../components/Mapmenu";
import Aiforecast from "../components/Aiforecast";
import greenFire from "../Assets/greenfire.svg";
import "../Styles/map-poi.css";
import OutModal from "../components/Modal/OutModal";
import { getNearby } from "../apis/parking";
import { postMyLocation } from "../apis/location";

const SDK_SRC =
  "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false";

// (옵션) ?mock=1 또는 환경변수로 목 모드
const params = new URLSearchParams(window.location.search);
const useMock =
  params.get("mock") === "1" ||
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_USE_MOCK === "1") ||
  process.env.REACT_APP_USE_MOCK === "1";

const MOCK_PLACES = [
  {
    id: "1021815417",
    kakaoId: "1021815417",
    name: "모의 주차장 A",
    lat: 37.5667,
    lng: 126.9784,
    distanceKm: 0.4,
    etaMin: 3,
    price: 0,
    address: "서울특별시 중구 세종대로 110",
    type: "PUBLIC",
    leavingSoon: true,
  },
];

function getWatchedIds() {
  try {
    const raw = localStorage.getItem("watchedPlaceIds");
    if (raw) return JSON.parse(raw);
  } catch {}
  return ["1021815417"];
}

// 좌표 캐시 유틸
const getCachedLoc = () => {
  try {
    const raw = localStorage.getItem("lastKnownLoc");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const setCachedLoc = (lat, lng) => {
  try {
    localStorage.setItem(
      "lastKnownLoc",
      JSON.stringify({ lat, lng, ts: Date.now() })
    );
  } catch {}
};

// 1) 빠른 좌표 폴백: 1.5초 내 미수신 시 캐시/지도중심 사용
const getFastCoords = (fallback) =>
  new Promise((resolve) => {
    const cached = getCachedLoc();
    const timer = setTimeout(() => resolve(cached || fallback), 1500);
    if (!navigator.geolocation) return; // 타이머가 해결

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCachedLoc(lat, lng);
        resolve({ lat, lng });
      },
      () => {
        clearTimeout(timer);
        resolve(cached || fallback);
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 60_000 }
    );
  });

// 2) nearby 5초 타임아웃 + AbortController
async function fetchNearbyWithTimeout({
  lat,
  lng,
  useMockFlag,
  setPlaces,
  renderBubbles,
  setShowRequery,
  maybeOpenOutModal,
  setIsLoading,
  setErrorMsg,
  overlaysRef,
  setSelectedId,
  loadingRef,
}) {
  if (loadingRef.current) return;
  loadingRef.current = true;
  setIsLoading(true);
  setErrorMsg("");
  setSelectedId(null);
  overlaysRef.current.forEach((o) => o.overlay?.setMap(null));
  overlaysRef.current = [];

  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort("timeout"), 5000);

  try {
    let rows;
    if (useMockFlag) {
      rows = MOCK_PLACES;
    } else {
      const { data } = await getNearby(lat, lng, { signal: ctrl.signal });
      const rowsRaw = Array.isArray(data)
        ? data
        : data?.data ?? data?.items ?? [];
      rows = rowsRaw.map((r, idx) => {
        const id =
          r.id ?? r.kakaoId ?? r.placeId ?? r.parkingId ?? String(idx + 1);
        const x = r.x ?? r.lon ?? r.longitude ?? r.lng;
        const y = r.y ?? r.lat ?? r.latitude;
        const unitMin = r.timerate ?? r.timeRate ?? null;
        const unitPrice = r.addrate ?? r.addRate ?? null;
        const price =
          unitMin && unitPrice
            ? Math.round((unitPrice * 10) / unitMin)
            : r.price ?? 0;
        return {
          id,
          kakaoId: id, // ✅ 상세 요청용
          name: r.placeName ?? r.name ?? "주차장",
          lat: y,
          lng: x,
          price,
          address: r.addressName ?? r.address ?? "",
          type: (r.type || r.category || "PUBLIC").toUpperCase(),
          distanceKm:
            r.distance != null
              ? Number(r.distance) / 1000
              : r.distanceMeters != null
              ? r.distanceMeters / 1000
              : r.distanceKm,
          etaMin: r.etaMin ?? r.etaMinutes,
          leavingSoon: !!(r.leavingSoon ?? r.soonOut ?? r.isSoonOut),
        };
      });
    }

    setPlaces(rows);
    renderBubbles(rows);
    setShowRequery(false);
    maybeOpenOutModal(rows);
  } catch (e) {
    const msg =
      e?.message === "timeout" || e?.name === "CanceledError"
        ? "추천 서버 응답이 느려요. 잠시 후 다시 시도해 주세요."
        : e?.response?.data?.message ||
          e?.message ||
          "주변 주차장 조회에 실패했습니다.";
    setErrorMsg(msg);
  } finally {
    clearTimeout(timeoutId);
    setIsLoading(false);
    loadingRef.current = false;
  }
}

export default function Home() {
  const wrapRef = useRef(null);
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const abortRef = useRef(null);
  const overlaysRef = useRef([]);
  const loadingRef = useRef(false);
  const myLocOverlayRef = useRef(null);

  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [showRequery, setShowRequery] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlace, setModalPlace] = useState({
    id: null,
    name: "",
    type: "",
  });
  const [modalMinutes, setModalMinutes] = useState(5);

  const navigate = useNavigate();
  const { state: navState } = useLocation();

  const isPrivate = (p) => String(p?.type || "").toUpperCase() === "PRIVATE";

  const onSelectPlace = (p) => {
    // ✅ kakaoId, 좌표 보존 (상세 API에 필요)
    const payload = {
      ...p,
      kakaoId: p.kakaoId ?? p.id,
      lat: p.lat,
      lon: p.lng,
      lng: p.lng,
    };
    try {
      sessionStorage.setItem("selectedPlace", JSON.stringify(payload));
    } catch {}

    setSelectedId(p.id);
    updateBubbleStyles(p.id);

    setTimeout(() => {
      const path = isPrivate(p) ? `/pv/place/${p.id}` : `/place/${p.id}`;
      navigate(path, { state: { place: payload } });
    }, 120);
  };

  // 지도 초기화
  useEffect(() => {
    const init = () => {
      const kakao = window.kakao;
      if (!mapEl.current || mapRef.current) return;

      // 터치 조작 허용
      mapEl.current.style.touchAction = "manipulation";
      mapEl.current.style.webkitUserSelect = "none";

      const map = new kakao.maps.Map(mapEl.current, {
        center: new kakao.maps.LatLng(center.lat, center.lng),
        level: 4,
        draggable: true,
        scrollwheel: true,
      });
      map.setDraggable(true);
      map.setZoomable(true);
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

  // 다른 화면에서 복귀 시 자동 재탐지
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshFromCurrentPosition();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // MapRoute 등에서 { state:{ recenter:true } }로 돌아오면 즉시 재조회
  useEffect(() => {
    if (navState?.recenter) {
      refreshFromCurrentPosition();
    }
  }, [navState?.recenter]);

  const detectAndLoad = async () => {
    const fallback = mapRef.current
      ? {
          lat: mapRef.current.getCenter().getLat(),
          lng: mapRef.current.getCenter().getLng(),
        }
      : center;
    setIsLoading(true);
    const { lat, lng } = await getFastCoords(fallback);
    setCenter({ lat, lng });
    recenterMap(lat, lng);
    showMyLocation(lat, lng);
    await syncAndFetch(lat, lng);
  };

  const syncAndFetch = async (lat, lng) => {
    postMyLocation({ lat, lng }).catch(() => {}); // fire-and-forget
    await fetchNearbyWithTimeout({
      lat,
      lng,
      useMockFlag: useMock,
      setPlaces,
      renderBubbles,
      setShowRequery,
      maybeOpenOutModal,
      setIsLoading,
      setErrorMsg,
      overlaysRef,
      setSelectedId,
      loadingRef,
    });
  };

  const recenterMap = (lat, lng) => {
    const kakao = window.kakao;
    if (!mapRef.current || !kakao?.maps) return;
    mapRef.current.setCenter(new kakao.maps.LatLng(lat, lng));
  };

  const attachTouchClick = (el, onTap) => {
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

  const showMyLocation = (lat, lng) => {
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

  const renderBubbles = (rows) => {
    const kakao = window.kakao;
    if (!mapRef.current) return;

    rows.forEach((p) => {
      if (!p.lat || !p.lng) return;

      const chip = document.createElement("div");
      chip.className = "poi-chip";
      if (p.id === selectedId) chip.classList.add("poi-chip--selected");
      chip.textContent = `₩ ${(p.price ?? 0).toLocaleString()}원`;
      attachTouchClick(chip, () => onSelectPlace(p));

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
        badge.innerHTML = `<img src="${greenFire}" alt="" /><span>곧 나감</span>`;
        attachTouchClick(badge, () => onSelectPlace(p));
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
        });
      }
    });
  };

  const updateBubbleStyles = (selId = selectedId) => {
    overlaysRef.current.forEach(({ id, el }) => {
      if (!el || !el.classList?.contains("poi-chip")) return;
      el.classList.toggle("poi-chip--selected", id === selId);
    });
  };

  const maybeOpenOutModal = (rows) => {
    const watched = getWatchedIds();
    const hit = rows.find((p) => watched.includes(p.id) && p.leavingSoon);
    if (hit) {
      setModalPlace({ id: hit.id, name: hit.name, type: hit.type });
      setModalMinutes(5);
      setModalOpen(true);
    }
  };

  const refreshFromCurrentPosition = async () => {
    const fallback = mapRef.current
      ? {
          lat: mapRef.current.getCenter().getLat(),
          lng: mapRef.current.getCenter().getLng(),
        }
      : center;
    setIsLoading(true);
    const { lat, lng } = await getFastCoords(fallback);
    setCenter({ lat, lng });
    recenterMap(lat, lng);
    showMyLocation(lat, lng);
    await syncAndFetch(lat, lng);
  };

  const requeryHere = () => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    setCenter({ lat: c.getLat(), lng: c.getLng() });
    syncAndFetch(c.getLat(), c.getLng());
  };

  const goDetailFromModal = () => {
    setModalOpen(false);
    if (!modalPlace?.id) return;
    const path =
      String(modalPlace.type || "").toUpperCase() === "PRIVATE"
        ? `/pv/place/${modalPlace.id}`
        : `/place/${modalPlace.id}`;
    navigate(path, { state: { from: "modal" } });
  };

  return (
    <div ref={wrapRef} className="map-wrap">
      <div ref={mapEl} className="map-fill" />
      <Mapmenu />
      <Aiforecast />

      {showRequery && !isSheetOpen && (
        <button className="requery-btn" onClick={requeryHere}>
          여기에서 다시 검색
        </button>
      )}

      <BottomSheet
        hostRef={wrapRef}
        places={places}
        isLoading={isLoading}
        errorMsg={errorMsg}
        onRefreshHere={refreshFromCurrentPosition}
        onSelectPlace={onSelectPlace}
        onOpenChange={setIsSheetOpen}
      />

      <OutModal
        isOpen={modalOpen}
        minutesAgo={modalMinutes}
        placeName={modalPlace.name}
        onClose={() => setModalOpen(false)}
        onViewDetail={goDetailFromModal}
      />
    </div>
  );
}
