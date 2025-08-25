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
  const [isSheetOpen, setIsSheetOpen] = useState(true);

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

  // 10초마다 테스트 모달 표시 (단순화된 버전)
  React.useEffect(() => {
    console.log('[디버그] 10초 모달 타이머 시작');
    
    const showModal = () => {
      console.log('[디버그] 10초 타이머 실행 - 모달 표시 시도');
      console.log('[디버그] modalHandlers:', modalHandlers);
      console.log('[디버그] places 개수:', places.length);
      
      if (modalHandlers && modalHandlers.showTestOutModal) {
        modalHandlers.showTestOutModal();
      } else {
        console.warn('[디버그] modalHandlers.showTestOutModal이 없습니다');
      }
      
      // 말풍선 업데이트
      setTimeout(() => {
        if (mapRef.current) {
          const c = mapRef.current.getCenter();
          if (c) {
            window.dispatchEvent(new CustomEvent('refreshMap', {
              detail: { lat: c.getLat(), lng: c.getLng() }
            }));
          }
        }
      }, 100);
    };

    // 첫 번째 모달은 10초 후에 표시 (빠른 테스트용)
    const firstTimeout = setTimeout(showModal, 12_000);
    
    // 이후 10초마다 반복
    const interval = setInterval(showModal, 15_000);

    return () => {
      console.log('[디버그] 10초 모달 타이머 정리');
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, [modalHandlers, places, mapRef]);

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
      <Aiforecast onClick={() => navigate('/aipredict')} />

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
}//수정 체크
