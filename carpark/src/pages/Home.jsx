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
import reset from "../Assets/reset.svg";

const SDK_SRC =
  "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false&libraries=services";

const params = new URLSearchParams(window.location.search);
const useMock =
  params.get("mock") === "1" ||
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_USE_MOCK === "1") ||
  process.env.REACT_APP_USE_MOCK === "1";

const normalizeId = (id) => String(id ?? "").replace(/^kakao:/i, "");

/** 로컬 저장 유틸 */
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
const near = (a, b) => {
  if (!a || !b) return false;
  const dLat = Math.abs(a.lat - b.lat);
  const dLng = Math.abs(a.lng - b.lng);
  return dLat < 0.0003 && dLng < 0.0003; // ~30m
};

/** 내가 알림 등록한 장소들 */
const getUserKey = () => localStorage.getItem("userKey") || "guest";
const LSK = (key) => `watchedPlaceIds__${key}`;
const useWatchedIds = (userKey = getUserKey()) => {
  const read = () => {
    try {
      const raw = localStorage.getItem(LSK(userKey));
      const arr = raw ? JSON.parse(raw) : [];
      return (Array.isArray(arr) ? arr : []).map((x) => normalizeId(x));
    } catch {
      return [];
    }
  };
  const [ids, setIds] = useState(read);
  useEffect(() => {
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

/* ===========================
   양재 더미(4개)
   =========================== */
const YANGJAE = { lat: 37.484722, lng: 127.034722 };
const distKm = (a, b) => {
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
const isNearYangjae = (lat, lng, radiusKm = 2.5) =>
  distKm({ lat, lng }, YANGJAE) <= radiusKm;

const forceYangjae =
  new URLSearchParams(window.location.search).get("yangjae") === "1";

const getYangjaeDummies = () => [
  {
    id: "pv-dummy-yg-1",
    kakaoId: "pv-dummy-yg-1",
    name: "양재동 화훼공판장 주차장",
    address: "서울 서초구 양재동 232-4",
    lat: 37.4849,
    lng: 127.0362,
    price: 500,
    charge: 500,
    operateTimes: [{ start: "00:00", end: "24:00" }],
    note: "",
    type: "PRIVATE",
    isLocal: true,
    _localOnly: true,
    distanceKm: null,
    etaMin: null,
    leavingSoon: false,
  },
  {
    id: "pv-dummy-yg-2",
    kakaoId: "pv-dummy-yg-2",
    name: "양재근린공원주차장",
    address: "서울 서초구 양재동 244-2",
    lat: 37.4716,
    lng: 127.0414,
    price: 800,
    charge: 800,
    operateTimes: [{ start: "00:00", end: "24:00" }],
    note: "",
    type: "PRIVATE",
    isLocal: true,
    _localOnly: true,
    distanceKm: null,
    etaMin: null,
    leavingSoon: false,
  },
  {
    id: "pv-dummy-yg-3",
    kakaoId: "pv-dummy-yg-3",
    name: "양재동부동산중개 앞 주차장(구간162)",
    address: "서울 서초구 강남대로8길 69",
    lat: 37.469,
    lng: 127.0441,
    price: 300,
    charge: 300,
    operateTimes: [{ start: "00:00", end: "24:00" }],
    note: "",
    type: "PRIVATE",
    isLocal: true,
    _localOnly: true,
    distanceKm: null,
    etaMin: null,
    leavingSoon: false,
  },
  {
    id: "pv-dummy-yg-4",
    kakaoId: "pv-dummy-yg-4",
    name: "양재빌리지 앞 주차장 (구획 23-6)",
    address: "서울 서초구 마방로2길 15-15",
    lat: 37.4735,
    lng: 127.0401,
    price: 300,
    charge: 300,
    operateTimes: [{ start: "00:00", end: "24:00" }],
    note: "",
    type: "PRIVATE",
    isLocal: true,
    _localOnly: true,
    distanceKm: null,
    etaMin: null,
    leavingSoon: false,
  },
];

const uniqueById = (arr) => {
  const m = new Map();
  arr.forEach((x) => {
    const key = String(x.id);
    if (!m.has(key)) m.set(key, x);
  });
  return Array.from(m.values());
};

export default function Home() {
  const wrapRef = useRef(null);
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const loadingRef = useRef(false);
  const myLocOverlayRef = useRef(null);
  const pollRef = useRef(null); // 폴링 타이머
  const lastSoonMapRef = useRef({}); // { [placeId]: lastShownTs }

  const cached0 = getCachedLoc() ?? { lat: 37.5665, lng: 126.978 };
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
  const myParks = useMyParkings((s) => s.items);
  const userKey = getUserKey();
  const watchedIds = useWatchedIds(userKey);

  const isPrivate = (p) => String(p?.type || "").toUpperCase() === "PRIVATE";

  const onSelectPlace = (p) => {
    const payload = {
      ...p,
      kakaoId: p.kakaoId ?? p.id,
      lat: p.lat,
      lon: p.lng,
      lng: p.lng,
      imageUrl: p.imageUrl || p.image || null,
      isLocal: !!p.isLocal,
      operateTimes: Array.isArray(p.operateTimes) ? p.operateTimes : undefined,
    };
    try {
      sessionStorage.setItem("selectedPlace", JSON.stringify(payload));
    } catch {}

    setSelectedId(p.id);
    updateBubbleStyles(p.id);

    setTimeout(() => {
      // ID 검증 및 디버깅
      console.log('클릭된 주차장 정보:', { id: p.id, name: p.name, isPrivate: isPrivate(p) });
      
      if (!p.id || String(p.id).trim() === '') {
        console.error('주차장 ID가 없습니다:', p);
        alert('주차장 정보에 오류가 있습니다. 다시 시도해주세요.');
        return;
      }
      
      const path = isPrivate(p) ? `/pv/place/${p.id}` : `/place/${p.id}`;
      console.log('이동할 경로:', path);
      
      navigate(path, {
        state: {
          place: payload,
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
      ensurePolling(); // ✅ 초기화 후 폴링 시작
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
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== 위치 감지 & 즉시 캐시 표시 → GPS 갱신 ===== */
  const detectAndLoad = () => {
    const cached = getCachedLoc();
    const base = cached ?? center;
    recenterMap(base.lat, base.lng);
    showMyLocation(base.lat, base.lng);
    syncAndFetch(base.lat, base.lng);

    if (!navigator.geolocation) return;
    let settled = false;
    const hard = setTimeout(() => (settled = true), 4000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        clearTimeout(hard);
        console.log('위치 권한 허용됨:', pos.coords);
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCachedLoc(loc.lat, loc.lng);
        if (!near(base, loc)) {
          setCenter(loc);
          recenterMap(loc.lat, loc.lng);
          showMyLocation(loc.lat, loc.lng);
          syncAndFetch(loc.lat, loc.lng);
        }
      },
      (error) => {
        console.error('위치 권한 오류:', error);
        console.log('위치 권한 오류 코드:', error.code);
        console.log('위치 권한 오류 메시지:', error.message);
        clearTimeout(hard);
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

      const label =
        p.price == null || Number.isNaN(Number(p.price)) || Number(p.price) === 0
          ? "P"
          : `₩ ${Number(p.price).toLocaleString()}원`;
      chip.textContent = label;

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
        rows = [];
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
          const computed =
            unitMin && unitPrice
              ? Math.round((unitPrice * 10) / unitMin)
              : r.price != null
              ? Number(r.price)
              : null;
          return {
            id,
            kakaoId: id,
            name: r.placeName ?? r.name ?? "주차장",
            lat: y,
            lng: x,
            price: computed,
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

      console.log('지도 표시 조건 체크:', myParks?.map(m => ({
        id: m.id,
        name: m.name,
        enabled: m.enabled,
        lat: m.lat,
        lng: m.lng,
        latType: typeof m.lat,
        lngType: typeof m.lng,
        canShow: m.enabled && typeof m.lat === "number" && typeof m.lng === "number"
      })));

      const mine = (myParks || [])
        .filter(
          (m) =>
            m.enabled && typeof m.lat === "number" && typeof m.lng === "number"
        )
        .map((m) => {
          // 현재 위치에서 주차장까지의 거리 계산
          const distance = distKm({ lat, lng }, { lat: m.lat, lng: m.lng });
          
          return {
            id: String(m.id),
            kakaoId: String(m.id),
            name: m.name || "내 주차장",
            lat: m.lat,
            lng: m.lng,
            price: m.charge != null ? Number(m.charge) : null,
            address: m.address || "",
            content: m.content || "",
            imageUrl: m.imageUrl || null,
            type: "PRIVATE",
            distanceKm: Math.round(distance * 10) / 10, // 소수점 첫째 자리까지
            etaMin: null, // 시간 정보는 제거
            leavingSoon: false,
            _localOnly: m.origin === "local",
          };
        });

      const yg =
        forceYangjae || isNearYangjae(lat, lng) ? getYangjaeDummies() : [];

      const merged = uniqueById([...yg, ...mine, ...rows]);

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

  // === 모달 오픈 & 폴링 유틸 ===
  const openSoonModalFor = (placeId, placeName, minute = 5) => {
    const nowTs = Date.now();
    const lastTs = lastSoonMapRef.current[String(placeId)] || 0;
    if (nowTs - lastTs < 90 * 1000) return; // 90초 이내 중복 방지
    lastSoonMapRef.current[String(placeId)] = nowTs;

    const p = places.find((x) => normalizeId(x.id) === String(placeId));
    const name = p?.name || placeName || "주차장";
    const type = p?.type || "PUBLIC";

    setModalPlace({ id: String(placeId), name, type });
    setModalMinutes(minute || 5);
    setModalOpen(true);
  };

  const ensurePolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      const c = mapRef.current?.getCenter?.();
      if (!c) return;
      fetchNearby(c.getLat(), c.getLng());
      
      // 실시간 알림 확인
      checkNotifications();
    }, 10_000);
  };
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // 실시간 알림 확인
  const checkNotifications = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch('https://api.parkhere.store/api/alerts/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return;

      const result = await response.json();
      const notifications = result.data || [];

      // 새로운 알림이 있으면 OutModal 표시
      notifications.forEach(notification => {
        if (notification.type === 'SOON_OUT') {
          console.log('실시간 알림 수신:', notification);
          openSoonModalFor(
            notification.parkingId, 
            notification.placeName, 
            notification.minutesAgo || 5
          );
        }
      });

    } catch (error) {
      console.error('알림 확인 실패:', error);
    }
  };

  const maybeOpenOutModal = (rows) => {
    if (!watchedIds?.length) return;
    const hit = rows.find(
      (p) => watchedIds.includes(normalizeId(p.id)) && p.leavingSoon
    );
    if (hit) openSoonModalFor(normalizeId(hit.id), hit.name, 5);
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

  useEffect(() => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    if (!c) return;
    fetchNearby(c.getLat(), c.getLng());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myParks]);

  return (
    <div ref={wrapRef} className="map-wrap">
      <div ref={mapEl} className="map-fill" />
      <Mapmenu />
      <Aiforecast />

      {showRequery && !isSheetOpen && (
        <button className="requery-btn" onClick={requeryHere}>
          <img src={reset} className="requery-img"/>
          <span className="requery-text">여기에서 다시 검색</span>
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
        placeId={modalPlace.id}
        placeName={modalPlace.name}
        onClose={() => setModalOpen(false)}
        onViewDetail={goDetailFromModal}
      />
    </div>
  );
}
