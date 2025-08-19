// src/pages/Home.jsx
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

const SDK_SRC =
  "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false";

// (예시) 알림 등록한 주차장 불러오기
function getWatchedIds() {
  try {
    const raw = localStorage.getItem("watchedPlaceIds");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [1]; // 기본 예시
}

export default function Home() {
  const wrapRef = useRef(null);
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const abortRef = useRef(null);
  const markersRef = useRef([]); // 현재는 미사용, 남겨둠
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
      s.onload = () => window.kakao.maps.load(init);
      document.head.appendChild(s);
    }

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== 위치 탐지 + 데이터 로드 =====
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

  // 내 위치 점
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
    });
    myLocOverlayRef.current.setMap(mapRef.current);
  };

  // 버블 렌더
  const renderBubbles = (rows) => {
    const kakao = window.kakao;
    if (!mapRef.current) return;

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
          <img src="${greenFire}" alt="" />
          <span>곧 나감</span>
        `;
        badge.addEventListener("click", () => onSelectPlace(p));

        const badgeOv = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(p.lat, p.lng),
          content: badge,
          yAnchor: 1.55,
          zIndex: 6,
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

  // 모달 오픈 조건
  const maybeOpenOutModal = (rows) => {
    const watched = getWatchedIds();
    const hit = rows.find((p) => watched.includes(p.id) && p.leavingSoon);
    if (hit) {
      setModalPlace({ id: hit.id, name: hit.name, type: hit.type });
      setModalMinutes(5);
      setModalOpen(true);
    }
  };

  // ===== 주차장 불러오기 (API 연동) =====
  const fetchNearby = async (lat, lng) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setErrorMsg("");
    setSelectedId(null);

    // 기존 오버레이 정리
    overlaysRef.current.forEach((o) => o.overlay?.setMap(null));
    overlaysRef.current = [];

    try {
      const { data } = await getNearby(lat, lng);

      // 응답 → UI 모델 변환 (필드명은 서버 실데이터에 맞춰 필요 시 수정)
      const rowsRaw = Array.isArray(data) ? data : data?.items ?? [];
      const rows = rowsRaw.map((r) => ({
        id: r.id ?? r.parkingId,
        name: r.name,
        lat: r.lat ?? r.latitude,
        lng: r.lng ?? r.longitude,
        price: r.pricePer10m ?? r.price ?? 0,
        address: r.address,
        type: (r.type || r.category || "PUBLIC").toUpperCase(),
        distanceKm:
          r.distanceMeters != null ? r.distanceMeters / 1000 : r.distanceKm,
        etaMin: r.etaMin ?? r.etaMinutes,
        leavingSoon: !!(r.leavingSoon ?? r.soonOut ?? r.isSoonOut),
      }));

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
    }
  };

  const refreshFromCurrentPosition = () => {
    if (!navigator.geolocation) {
      if (mapRef.current) {
        const c = mapRef.current.getCenter();
        fetchNearby(c.getLat(), c.getLng());
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
        }
      }
    );
  };

  const requeryHere = () => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    fetchNearby(c.getLat(), c.getLng());
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
