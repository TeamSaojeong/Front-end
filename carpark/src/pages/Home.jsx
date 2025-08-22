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
import { useMyParkings } from "../store/MyParkings";

const SDK_SRC =
  "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false&libraries=services";

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

/* ===== 위치 캐시 유틸 ===== */
const getCachedLoc = () => {
  try {
    const raw = localStorage.getItem("lastKnownLoc");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};
const setCachedLoc = (lat, lng) => {
  try {
    localStorage.setItem(
      "lastKnownLoc",
      JSON.stringify({ lat, lng, ts: Date.now() })
    );
  } catch {}
};
// 두 좌표가 거의 같은지(중복 fetch 방지)
const near = (a, b) => {
  if (!a || !b) return false;
  const dLat = Math.abs(a.lat - b.lat);
  const dLng = Math.abs(a.lng - b.lng);
  return dLat < 0.0003 && dLng < 0.0003; // 대략 30m
};

export default function Home() {
  const wrapRef = useRef(null);
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const loadingRef = useRef(false);
  const myLocOverlayRef = useRef(null);

  const cached0 = getCachedLoc() ?? { lat: 37.5665, lng: 126.978 }; // ← 캐시 우선
  const [center, setCenter] = useState(cached0);

  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
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
  const myParks = useMyParkings((s) => s.items); // ✅ 내 주차장

  const isPrivate = (p) => String(p?.type || "").toUpperCase() === "PRIVATE";

  const onSelectPlace = (p) => {
    // ✅ 선택된 장소 세션 저장(상세에서 바로 사용)
    const payload = {
      ...p,
      kakaoId: p.kakaoId ?? p.id,
      lat: p.lat,
      lon: p.lng,
      lng: p.lng,
      imageUrl: p.imageUrl || p.image || null,
    };
    try {
      sessionStorage.setItem("selectedPlace", JSON.stringify(payload));
    } catch {}

    setSelectedId(p.id);
    updateBubbleStyles(p.id);

    // ✅ PRIVATE이면 PvPlaceDetail, 아니면 PlaceDetail
    setTimeout(() => {
      const path = isPrivate(p) ? `/pv/place/${p.id}` : `/place/${p.id}`;
      navigate(path, {
        state: {
          place: payload,
          // (선택) 상세에서 표기/분기용 플래그
          localOnly: !!p._localOnly,
          isMine: isPrivate(p),
        },
      });
    }, 120);
  };

  /* ===== Kakao Map init ===== */
  useEffect(() => {
    const init = () => {
      const kakao = window.kakao;
      if (!mapEl.current || mapRef.current) return;

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

    // 화면 복귀 시에도 캐시 위치로 복구 후 부드럽게 갱신
    const onVisible = () => {
      const c = getCachedLoc();
      if (c) {
        setCenter(c);
        recenterMap(c.lat, c.lng);
        showMyLocation(c.lat, c.lng);
      }
      detectAndLoad();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== 위치 감지 & 즉시 캐시 표시 → GPS 갱신 ===== */
  const detectAndLoad = () => {
    const cached = getCachedLoc();

    // 1) 캐시나 현재 center로 즉시 표시/조회
    const base = cached ?? center;
    recenterMap(base.lat, base.lng);
    showMyLocation(base.lat, base.lng);
    syncAndFetch(base.lat, base.lng);

    // 2) GPS로 갱신 (짧은 타임아웃 + 실패 시 캐시 유지)
    if (!navigator.geolocation) return;
    let settled = false;
    const hard = setTimeout(() => (settled = true), 4000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        clearTimeout(hard);
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCachedLoc(loc.lat, loc.lng);

        if (!near(base, loc)) {
          setCenter(loc);
          recenterMap(loc.lat, loc.lng);
          showMyLocation(loc.lat, loc.lng);
          syncAndFetch(loc.lat, loc.lng);
        }
      },
      () => {
        clearTimeout(hard);
        // 실패해도 캐시로 이미 표시 중
      },
      { enableHighAccuracy: false, timeout: 3500, maximumAge: 120000 }
    );
  };

  const syncAndFetch = async (lat, lng) => {
    try {
      setCachedLoc(lat, lng);
      await postMyLocation({ lat, lng });
    } catch {}
    await fetchNearby(lat, lng);
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

  const fetchNearby = async (lat, lng) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setErrorMsg("");
    setSelectedId(null);
    overlaysRef.current.forEach((o) => o.overlay?.setMap(null));
    overlaysRef.current = [];

    try {
      let rows;
      if (useMock) {
        rows = MOCK_PLACES;
      } else {
        const { data } = await getNearby(lat, lng);
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
            kakaoId: id,
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

      // ✅ 내 주차장 합치기 (위치 없는 건 제외)
      const mine = (myParks || [])
        .filter(
          (m) =>
            m.enabled && typeof m.lat === "number" && typeof m.lng === "number"
        )
        .map((m) => ({
          id: String(m.id),
          kakaoId: String(m.id),
          name: m.name || "내 주차장",
          lat: m.lat,
          lng: m.lng,
          price: Number(m.charge || 0),
          address: m.address || "",
          content: m.content || "",
          imageUrl: m.imageUrl || null, //이미지 넣어줌
          type: "PRIVATE",
          distanceKm: null,
          etaMin: null,
          leavingSoon: false,
          _localOnly: m.origin === "local",
        }));

      // 중복 제거 (서버 우선)
      const byId = new Map();
      rows.forEach((r) => byId.set(String(r.id), r));
      mine.forEach((m) => {
        const key = String(m.id);
        if (!byId.has(key)) byId.set(key, m);
      });

      const merged = Array.from(byId.values());

      setPlaces(merged);
      renderBubbles(merged);
      setShowRequery(false);
      maybeOpenOutModal(merged);
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
    const fallback = () => {
      const c = mapRef.current?.getCenter?.()
        ? {
            lat: mapRef.current.getCenter().getLat(),
            lng: mapRef.current.getCenter().getLng(),
          }
        : getCachedLoc() ?? center;
      setCenter(c);
      recenterMap(c.lat, c.lng);
      showMyLocation(c.lat, c.lng);
      syncAndFetch(c.lat, c.lng);
    };

    if (!navigator.geolocation) return fallback();

    setIsLoading(true);
    let done = false;
    const to = setTimeout(() => {
      if (done) return;
      done = true;
      fallback();
    }, 2500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (done) return;
        done = true;
        clearTimeout(to);
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCachedLoc(loc.lat, loc.lng);
        setCenter(loc);
        recenterMap(loc.lat, loc.lng);
        showMyLocation(loc.lat, loc.lng);
        syncAndFetch(loc.lat, loc.lng);
      },
      () => {
        if (done) return;
        done = true;
        clearTimeout(to);
        fallback();
      },
      { enableHighAccuracy: true, timeout: 2000, maximumAge: 60000 }
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
