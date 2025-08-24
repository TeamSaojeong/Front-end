// src/pages/Home.jsx
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomSheet from "../components/BottomSheet";
import "../Styles/app-frame.css";
import Mapmenu from "../components/Mapmenu";
import Aiforecast from "../components/Aiforecast";
import "../Styles/map-poi.css";
import OutModal from "../components/Modal/OutModal";
import { useMyParkings } from "../store/MyParkings";
import { useWatchedIds } from "../utils/mapUtils";
import { useKakaoMap } from "../hooks/useKakaoMap";
import { useOutModal } from "../hooks/useOutModal";

const getUserKey = () => localStorage.getItem("userKey") || "guest";

export default function Home() {
  const wrapRef = useRef(null);
  const mapEl = useRef(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const navigate = useNavigate();
  const myParks = useMyParkings((s) => s.items);
  const userKey = getUserKey();
  const watchedIds = useWatchedIds(userKey);

  // KakaoMap 훅 사용 
  const {
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
  } = useKakaoMap(mapEl, myParks);

  // OutModal 훅 사용 (places 전달)
  const modalHandlers = useOutModal(places);

  // 주기적으로 모달 관련 처리
  React.useEffect(() => {
    const interval = setInterval(() => {
      modalHandlers.checkNotifications();
      modalHandlers.showTestOutModal();
      
      // 모달 표시 후 잠시 기다린 다음 지도 다시 렌더링 (말풍선 업데이트)
      setTimeout(() => {
        if (mapRef.current) {
          const c = mapRef.current.getCenter();
          if (c) {
            // 현재 위치에서 다시 페치하여 말풍선 업데이트
            window.dispatchEvent(new CustomEvent('refreshMap', {
              detail: { lat: c.getLat(), lng: c.getLng() }
            }));
          }
        }
      }, 100);
    }, 10_000);

    return () => clearInterval(interval);
  }, [modalHandlers, mapRef]);

  // places 변경 시 모달 체크
  React.useEffect(() => {
    if (places.length > 0) {
      modalHandlers.maybeOpenOutModal(places, watchedIds);
    }
  }, [places, watchedIds, modalHandlers]);

  // 모달에서 상세 페이지로 이동
  const goDetailFromModal = () => {
    modalHandlers.setModalOpen(false);
    if (!modalHandlers.modalPlace?.id) return;
    const path =
      String(modalHandlers.modalPlace.type || "").toUpperCase() === "PRIVATE"
        ? `/pv/place/${modalHandlers.modalPlace.id}`
        : `/place/${modalHandlers.modalPlace.id}`;
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
        isOpen={modalHandlers.modalOpen}
        minutesAgo={modalHandlers.modalMinutes}
        placeId={modalHandlers.modalPlace.id}
        placeName={modalHandlers.modalPlace.name}
        onClose={() => modalHandlers.setModalOpen(false)}
        onViewDetail={goDetailFromModal}
      />
    </div>
  );
}