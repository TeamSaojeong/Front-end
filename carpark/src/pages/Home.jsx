// src/pages/Home.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomSheet from "../components/BottomSheet";
import "../Styles/app-frame.css";
import Mapmenu from "../components/Mapmenu";
import Aiforecast from "../components/Aiforecast";
import "../Styles/map-poi.css";
import OutModal from "../components/Modal/OutModal";
import { getNearby, getAllPrivateParkings } from "../apis/parking";
import { postMyLocation } from "../apis/location";
import { useMyParkings } from "../store/MyParkings";
import { useWatchedIds } from "../utils/mapUtils";

// ⚡ main 코드 기반 통합: seongwon 의 useKakaoMap/useOutModal 대신 직접 로직 사용
// (필요하면 hooks 내부 로직 재사용 가능)

export default function Home() {
  const wrapRef = useRef(null);
  const mapEl = useRef(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showRequery, setShowRequery] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const navigate = useNavigate();
  const myParks = useMyParkings((s) => s.items);
  const getCurrentUser = useMyParkings((s) => s.getCurrentUser);
  const watchedIds = useWatchedIds(localStorage.getItem("userKey") || "guest");

  // === 서버 + 로컬 모든 사용자 주차장 로드 ===
  const [allUserParkings, setAllUserParkings] = useState([]);
  const fetchAllUserParkingsRef = useRef(null);

  const fetchAllUserParkings = async () => {
    if (fetchAllUserParkingsRef.current) return fetchAllUserParkingsRef.current;

    fetchAllUserParkingsRef.current = (async () => {
      try {
        const serverResponse = await getAllPrivateParkings();
        const serverParkings = serverResponse?.data?.data || [];

        // 로컬 데이터 수집
        const allLocal = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("my-parkings")) {
            try {
              const parsed = JSON.parse(localStorage.getItem(key));
              if (parsed?.state?.items) {
                allLocal.push(...parsed.state.items.filter((p) => p.enabled));
              }
            } catch {}
          }
        }

        // 서버데이터 정규화
        const normalized = serverParkings.map((p) => ({
          id: String(p.parkingId),
          name: p.parkingName,
          lat: p.lat,
          lng: p.lng,
          enabled: p.operate,
          type: "PRIVATE",
          isFromServer: true,
        }));

        const merged = [...allLocal];
        normalized.forEach((s) => {
          if (!merged.find((m) => m.id === s.id)) merged.push(s);
        });

        setAllUserParkings(merged);
        return merged;
      } catch (err) {
        console.error("[Home] 모든 주차장 로드 실패", err);
        setAllUserParkings([...myParks]);
        return [...myParks];
      } finally {
        fetchAllUserParkingsRef.current = null;
      }
    })();

    return fetchAllUserParkingsRef.current;
  };

  // === 주차장 선택 ===
  const onSelectPlace = (p) => {
    try {
      sessionStorage.setItem("selectedPlace", JSON.stringify(p));
    } catch {}
    setSelectedId(p.id);
  };

  // === OutModal 제어 ===
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlace, setModalPlace] = useState({});
  const [modalMinutes, setModalMinutes] = useState(5);

  const openSoonModalFor = (placeId, placeName, minute = 5) => {
    setModalPlace({ id: String(placeId), name: placeName, type: "PUBLIC" });
    setModalMinutes(minute);
    setModalOpen(true);
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

  // === 위치 및 주변 주차장 로딩 ===
  const fetchNearby = async (lat, lng) => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const { data } = await getNearby(lat, lng);
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setPlaces(rows);
    } catch (e) {
      setErrorMsg(e?.message || "주변 주차장 조회 실패");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!mapEl.current) return;
    // 임시: 하드코딩된 위치 기준으로 fetchNearby 실행
    fetchNearby(37.484, 127.034); // 양재 근처
  }, []);

  return (
    <div ref={wrapRef} className="map-wrap">
      <div ref={mapEl} className="map-fill" />
      <Mapmenu />
      <Aiforecast />

      {showRequery && !isSheetOpen && (
        <button className="requery-btn" onClick={() => fetchNearby(37.484, 127.034)}>
          여기에서 다시 검색
        </button>
      )}

      <BottomSheet
        hostRef={wrapRef}
        places={places}
        isLoading={isLoading}
        errorMsg={errorMsg}
        onRefreshHere={() => fetchNearby(37.484, 127.034)}
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
