import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

// (예시) 알림 등록한 주차장 불러오기
function getWatchedIds() {
  try {
    const raw = localStorage.getItem("watchedPlaceIds");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [1];
}

export default function Home() {
  const wrapRef = useRef(null);
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const abortRef = useRef(null);
  const markersRef = useRef([]); // 현재 미사용
  const overlaysRef = useRef([]); // [{ id, el, overlay, place }]
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

  // ===== 지도 초기화 =====
  useEffect(() => {
    const init = () => {
      const kakao = window.kakao;
      if (!mapEl.current || mapRef.current) return;

      mapEl.current.style.touchAction = "none";
      mapEl.current.style.webkitUserSelect = "none";

      const centerLatLng = new kakao.maps.LatLng(center.lat, center.lng);
      const map = new kakao.maps.Map(mapEl.current, {
        center: centerLatLng,
        level: 4,
        draggable: true, // ← 터치/마우스 드래그 허용
        scrollwheel: true, // ← 핀치/휠 줌 허용
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

  // ===== 위치 탐지 + 서버 업로드 + 데이터 로드 =====
  const detectAndLoad = () => {
    if (!navigator.geolocation) {
      syncAndFetch(center.lat, center.lng);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCenter({ lat, lng });
        recenterMap(lat, lng);
        showMyLocation(lat, lng);
        syncAndFetch(lat, lng);
      },
      () => syncAndFetch(center.lat, center.lng),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
  };

  // 서버에 내 위치 업로드 후 주변 조회
  const syncAndFetch = async (lat, lng) => {
    try {
      await postMyLocation({ lat, lng }); // 헤더에 토큰 필요
    } catch {}
    await fetchNearby(lat, lng);
  };

  const recenterMap = (lat, lng) => {
    const kakao = window.kakao;
    if (!mapRef.current || !kakao?.maps) return;
    mapRef.current.setCenter(new kakao.maps.LatLng(lat, lng));
  };

  // ===== 터치 드래그와 탭 구분(오버레이용) =====
  const attachTouchClick = (el, onTap) => {
    let sx = 0,
      sy = 0,
      moved = false;
    const THRESH = 8; // px

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
        moved = true; // 드래그 → 탭 취소
      }
    };
    const te = () => {
      if (!moved) onTap();
    };

    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchmove", tm, { passive: true });
    el.addEventListener("touchend", te);
    el.addEventListener("click", onTap); // 데스크톱
  };

  // 내 위치(파란 점)
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

  // 주차장 버블 렌더
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
        badge.innerHTML = `
          <img src="${greenFire}" alt="" />
          <span>곧 나감</span>
        `;
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

  // ===== API: 주변 주차장 =====
  const fetchNearby = async (lat, lng) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setErrorMsg("");
    setSelectedId(null);
    overlaysRef.current.forEach((o) => o.overlay?.setMap(null));
    overlaysRef.current = [];

    try {
      if (useMock) {
        setPlaces(MOCK_PLACES);
        renderBubbles(MOCK_PLACES);
        setShowRequery(false);
        return;
      }

      const { data } = await getNearby(lat, lng); // 서버: lat,lon 포맷 사용

      const rowsRaw = Array.isArray(data)
        ? data
        : data?.data ?? data?.items ?? [];
      const rows = rowsRaw.map((r, idx) => {
        // 카카오 POI 필드 매핑 (x:lng, y:lat), 요금 환산
        const unitMin = r.timerate ?? r.timeRate ?? null;
        const unitPrice = r.addrate ?? r.addRate ?? null;
        const pricePer10 =
          unitMin && unitPrice
            ? Math.round((unitPrice * 10) / unitMin)
            : unitPrice ?? 0;

        return {
          id: r.id ?? r.parkingId ?? idx + 1,
          name: r.placeName ?? r.name ?? "주차장",
          lat: r.y ?? r.lat ?? r.latitude,
          lng: r.x ?? r.lng ?? r.longitude,
          price: pricePer10,
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

      setPlaces(rows);
      renderBubbles(rows);
      setShowRequery(false);
      maybeOpenOutModal(rows);
    } catch (e) {
      const code = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "주변 주차장 조회에 실패했습니다.";
      setErrorMsg(`[${code ?? "ERR"}] ${msg}`);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  // “곧 나감” 모달 자동 오픈
  const maybeOpenOutModal = (rows) => {
    const watched = getWatchedIds();
    const hit = rows.find((p) => watched.includes(p.id) && p.leavingSoon);
    if (hit) {
      setModalPlace({ id: hit.id, name: hit.name, type: hit.type });
      setModalMinutes(5);
      setModalOpen(true);
    }
  };

  const refreshFromCurrentPosition = () => {
    if (!navigator.geolocation) {
      if (mapRef.current) {
        const c = mapRef.current.getCenter();
        syncAndFetch(c.getLat(), c.getLng());
      } else {
        syncAndFetch(center.lat, center.lng);
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
        syncAndFetch(lat, lng);
      },
      () => {
        if (mapRef.current) {
          const c = mapRef.current.getCenter();
          syncAndFetch(c.getLat(), c.getLng());
        } else {
          syncAndFetch(center.lat, center.lng);
        }
      }
    );
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
