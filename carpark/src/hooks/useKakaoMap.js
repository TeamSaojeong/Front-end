// src/hooks/useKakaoMap.js
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import greenFire from "../Assets/greenfire.svg";
import { 
  getCachedLoc, 
  setCachedLoc, 
  near, 
  attachTouchClick, 
  showMyLocation, 
  recenterMap 
} from "../utils/mapUtils";
import { getNearby } from "../apis/parking";
import { postMyLocation } from "../apis/location";
import { 
  getYangjaeDummies, 
  getSeochoGangnamDummies, 
  isNearYangjae, 
  isNearSeochoGangnam, 
  forceYangjae, 
  forceSeochoGangnam, 
  uniqueById,
  distKm 
} from "../utils/dummyData";

const SDK_SRC = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false&libraries=services";

const params = new URLSearchParams(window.location.search);
const useMock =
  params.get("mock") === "1" ||
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_USE_MOCK === "1") ||
  process.env.REACT_APP_USE_MOCK === "1";

export const useKakaoMap = (mapEl, myParks) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const loadingRef = useRef(false);
  const myLocOverlayRef = useRef(null);
  const pollRef = useRef(null);

  const fixedLocation = getCachedLoc(); // 양재AT센터 고정 위치
  const [center, setCenter] = useState(fixedLocation);
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showRequery, setShowRequery] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

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
      console.log('클릭된 주차장 정보:', { id: p.id, name: p.name, isPrivate: isPrivate(p) });
      
      if (!p.id || String(p.id).trim() === '') {
        console.error('주차장 ID가 없습니다:', p);
        alert('주차장 정보에 오류가 있습니다. 다시 시도해주세요.');
        return;
      }
      
      // 더미 데이터인 경우 공용 주차장 상세 페이지로 이동
      const isDummyData = String(p.id).startsWith('pub-dummy-') || String(p.id).startsWith('pv-dummy-') || String(p.id).startsWith('prv-dummy-');
      const path = isDummyData ? `/place/${p.id}` : (isPrivate(p) ? `/pv/place/${p.id}` : `/place/${p.id}`);
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

  // 카카오 지도 초기화
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
      kakao.maps.event.addListener(map, "zoom_changed", () => setShowRequery(true));

      detectAndLoad();
      ensurePolling();
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
      const fixedLoc = getCachedLoc(); // 양재AT센터 고정 위치
      console.log('화면 전환: 양재AT센터 고정 위치 사용:', fixedLoc);
      setCenter(fixedLoc);
      recenterMap(mapRef, fixedLoc.lat, fixedLoc.lng);
      showMyLocation(mapRef, myLocOverlayRef, fixedLoc.lat, fixedLoc.lng);
      detectAndLoad();
    };
    
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    
    // 커스텀 이벤트 리스너 추가 (모달 표시 후 지도 갱신용)
    const onRefreshMap = (event) => {
      const { lat, lng } = event.detail;
      fetchNearby(lat, lng);
    };
    window.addEventListener("refreshMap", onRefreshMap);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("refreshMap", onRefreshMap);
      stopPolling();
    };
  }, []);

  // 위치 감지 - 양재AT센터 고정 위치 사용
  const detectAndLoad = () => {
    const fixedLoc = getCachedLoc(); // 항상 양재AT센터 위치 반환
    console.log('고정 위치 사용 (양재AT센터):', fixedLoc);
    
    setCenter(fixedLoc);
    recenterMap(mapRef, fixedLoc.lat, fixedLoc.lng);
    showMyLocation(mapRef, myLocOverlayRef, fixedLoc.lat, fixedLoc.lng);
    syncAndFetch(fixedLoc.lat, fixedLoc.lng);
  };

  const syncAndFetch = async (lat, lng) => {
    try {
      setCachedLoc(lat, lng);
      await postMyLocation({ lat, lng });
    } catch {}
    await fetchNearby(lat, lng);
  };

  const renderBubbles = (rows) => {
    const kakao = window.kakao;
    if (!mapRef.current) return;

    console.log('[디버그] renderBubbles 호출됨. 렌더링할 주차장 수:', rows.length);
    
    let renderedCount = 0;
    rows.forEach((p) => {
      if (!p.lat || !p.lng) {
        console.log('[디버그] 좌표 없음:', p.name);
        return;
      }
      renderedCount++;

      if (p.leavingSoon) {
        // leavingSoon이 true인 경우 가격 말풍선 대신 불꽃 말풍선만 표시
        console.log('[디버그] 초록색 말풍선 생성:', p.name, p.id);
        const badge = document.createElement("div");
        badge.className = "poi-leaving-badge";
        badge.innerHTML = `<img src="${greenFire}" alt="" /><span>곧 나감</span>`;
        attachTouchClick(badge, () => onSelectPlace(p));
        
        const badgeOv = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(p.lat, p.lng),
          content: badge,
          yAnchor: 1.1,
          zIndex: 6,
          clickable: true,
        });
        badgeOv.setMap(mapRef.current);
        overlaysRef.current.push({
          id: p.id,
          el: badge,
          overlay: badgeOv,
          place: p,
        });
      } else {
        // leavingSoon이 false인 경우 기존 가격 말풍선 표시
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
      }
    });
    
    console.log('[디버그] 실제 렌더링된 말풍선 수:', renderedCount);
    console.log('[디버그] 현재 overlays 총 개수:', overlaysRef.current.length);
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
    
    console.log('[디버그] 기존 오버레이 제거 중. 제거할 개수:', overlaysRef.current.length);
    overlaysRef.current.forEach((o) => o.overlay?.setMap(null));
    overlaysRef.current = [];

    try {
      let rows;
      if (useMock) {
        rows = [];
      } else {
        const { data } = await getNearby(lat, lng);
        const rowsRaw = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
        rows = rowsRaw.map((r, idx) => {
          const id = r.id ?? r.kakaoId ?? r.placeId ?? r.parkingId ?? String(idx + 1);
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

      const mine = (myParks || [])
        .filter((m) => m.enabled && typeof m.lat === "number" && typeof m.lng === "number")
        .map((m) => {
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
            distanceKm: Math.round(distance * 10) / 10,
            etaMin: null,
            leavingSoon: false,
            _localOnly: m.origin === "local",
          };
        });

      // 더미 데이터 항상 표시 (디버깅용)
      const yg = getYangjaeDummies().map(dummy => ({
        ...dummy,
        distanceKm: Math.round(distKm({ lat, lng }, { lat: dummy.lat, lng: dummy.lng }) * 10) / 10
      }));
      const sg = getSeochoGangnamDummies().map(dummy => ({
        ...dummy,
        distanceKm: Math.round(distKm({ lat, lng }, { lat: dummy.lat, lng: dummy.lng }) * 10) / 10
      }));
      
      console.log('[디버그] 더미 데이터 개수:', {
        yangjaeDummies: yg.length,
        seochoGangnamDummies: sg.length,
        myParks: mine.length,
        apiRows: rows.length
      });
      
      console.log('[디버그] 교창 앞 주차장 확인:', sg.find(p => p.id === 'pub-dummy-gn-4'));

      const merged = uniqueById([...yg, ...sg, ...mine, ...rows]);
      
      console.log('[디버그] 병합 후 총 주차장 개수:', merged.length);
      console.log('[디버그] 병합된 주차장 이름들:', merged.map(p => p.name));
      console.log('[디버그] leavingSoon이 true인 주차장들:', merged.filter(p => p.leavingSoon).map(p => ({ name: p.name, id: p.id })));

      setPlaces(merged);
      renderBubbles(merged);
      setShowRequery(false);
    } catch (e) {
      const code = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "주변 주차장 조회에 실패했습니다.";
      setErrorMsg(`[${code ?? "ERR"}] ${msg}`);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const ensurePolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      const c = mapRef.current?.getCenter?.();
      if (!c) return;
      fetchNearby(c.getLat(), c.getLng());
    }, 10_000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const refreshFromCurrentPosition = () => {
    // 항상 양재AT센터 고정 위치 사용
    const fixedLoc = getCachedLoc();
    console.log('새로고침: 양재AT센터 고정 위치 사용:', fixedLoc);
    
    setIsLoading(true);
    setCenter(fixedLoc);
    recenterMap(mapRef, fixedLoc.lat, fixedLoc.lng);
    showMyLocation(mapRef, myLocOverlayRef, fixedLoc.lat, fixedLoc.lng);
    syncAndFetch(fixedLoc.lat, fixedLoc.lng);
    setIsLoading(false);
  };

  const requeryHere = () => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    setCenter({ lat: c.getLat(), lng: c.getLng() });
    
    // "다시 검색" 버튼에서는 "곧 나감" 상태를 초기화
    window.dummyLeavingSoonIds = [];
    console.log('[다시 검색] "곧 나감" 상태 초기화');
    
    syncAndFetch(c.getLat(), c.getLng());
  };

  // myParks 변경 시 다시 로드
  useEffect(() => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    if (!c) return;
    fetchNearby(c.getLat(), c.getLng());
  }, [myParks]);

  return {
    mapRef,
    places,
    isLoading,
    errorMsg,
    showRequery,
    selectedId,
    onSelectPlace,
    refreshFromCurrentPosition,
    requeryHere,
    updateBubbleStyles,
  };
};
