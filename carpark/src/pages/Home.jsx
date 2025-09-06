// src/pages/Home.jsx
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomSheet from "../components/BottomSheet";
import "../Styles/app-frame.css";
import Mapmenu from "../components/Mapmenu";
import Aiforecast from "../components/Aiforecast";
import "../Styles/map-poi.css";
import OutModal from "../components/Modal/OutModal";
import NotificationListener from "../components/NotificationListener";
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

  // KakaoMap 훅 사용 (내부적으로 getnearby 호출) 
  const {
    mapRef,
    places, //getNearby로 가져온 주차장 목록 
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

  // places 변경 시 모달 체크
  React.useEffect(() => {
    if (places.length > 0) {
      modalHandlers.maybeOpenOutModal(places, watchedIds);
    }
  }, [places, watchedIds, modalHandlers]);

  // 바텀 시트에서 주차장 선택 시 처리
  const handleSelectPlace = (place) => {
    // 바텀 시트 닫기
    setIsSheetOpen(false);
    // 기존 onSelectPlace 호출
    onSelectPlace(place);
  };

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

      {/* 주변 주차장 목록을 바텀시트에 표시시 */}
      <BottomSheet
        hostRef={wrapRef}
        places={places} //getNearby 결과
        isLoading={isLoading}
        errorMsg={errorMsg}
        onRefreshHere={refreshFromCurrentPosition}
        onSelectPlace={handleSelectPlace}
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

      {/* 푸시 알림 리스너 추가 */}
      <NotificationListener />
    </div>
  );
}//수정 체크
