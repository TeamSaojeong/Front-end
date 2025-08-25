// src/hooks/useOutModal.js
import { useState, useRef } from "react";
import { getSeochoGangnamDummies } from "../utils/dummyData";

const normalizeId = (id) => String(id ?? "").replace(/^kakao:/i, "");

export const useOutModal = (places) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlace, setModalPlace] = useState({
    id: null,
    name: "",
    type: "",
  });
  const [modalMinutes, setModalMinutes] = useState(5);
  const lastSoonMapRef = useRef({}); // { [placeId]: lastShownTs }

  // === 모달 오픈 & 폴링 유틸 ===
  const openSoonModalFor = (placeId, placeName, minute = 10) => {
    const nowTs = Date.now();
    const lastTs = lastSoonMapRef.current[String(placeId)] || 0;
    if (nowTs - lastTs < 90 * 1000) return; // 90초 이내 중복 방지
    lastSoonMapRef.current[String(placeId)] = nowTs;

    const p = places.find((x) => normalizeId(x.id) === String(placeId));
    const name = p?.name || placeName || "주차장";
    const type = p?.type || "PUBLIC";

    setModalPlace({ id: String(placeId), name, type });
    setModalMinutes(10); // 10분으로 고정
    setModalOpen(true);
  };

  // === 테스트용 OutModal 표시 ===
  const showTestOutModal = () => {
    console.log('[테스트] showTestOutModal 호출됨');
    console.log('[테스트] 현재 modalOpen 상태:', modalOpen);
    console.log('[테스트] places 개수:', places.length);
    
    // 모달이 이미 열려있으면 건너뛰기
    if (modalOpen) {
      console.log('[테스트] 모달이 이미 열려있어서 건너뜀');
      return;
    }
    
    // "교창 앞 주차장 (구간 182)"에 "곧 나감" 상태 적용
    const targetParkingId = "pub-dummy-gn-4"; // 교창 앞 주차장 ID
    window.dummyLeavingSoonIds = [targetParkingId];
    
    console.log('[테스트] "교창 앞 주차장 (구간 182)"에 "곧 나감" 상태 적용');
    
    // 해당 주차장을 찾아서 모달 표시
    const targetPlace = places.find(p => p.id === targetParkingId);
    console.log('[테스트] 찾은 targetPlace:', targetPlace);
    
    if (targetPlace) {
      console.log(`[테스트] OutModal 표시: ${targetPlace.name} (10분 전)`);
      
      setModalPlace({ 
        id: String(targetPlace.id), 
        name: targetPlace.name, 
        type: targetPlace.type || "PUBLIC" 
      });
      setModalMinutes(10);
      setModalOpen(true);
      console.log('[테스트] 모달 상태 설정 완료');
    } else {
      // 교창 앞 주차장이 없으면 기본 정보로 표시
      console.log('[테스트] OutModal 표시: 교창 앞 주차장 (기본)');
      
      setModalPlace({ 
        id: targetParkingId, 
        name: "교창 앞 주차장 (구간 182)", 
        type: "PUBLIC" 
      });
      setModalMinutes(10);
      setModalOpen(true);
      console.log('[테스트] 기본 모달 상태 설정 완료');
    }
  };

  // 더미 데이터에 "곧 나감" 상태를 랜덤하게 추가하는 함수
  const addLeavingSoonToDummies = () => {
    // 전역으로 더미 데이터 수정을 위한 임시 변수
    window.dummyLeavingSoonIds = [];
    
    const dummyData = getSeochoGangnamDummies();
    // 30% 확률로 주차장들에 "곧 나감" 상태 추가
    dummyData.forEach(parking => {
      if (Math.random() < 0.3) { // 30% 확률
        window.dummyLeavingSoonIds.push(parking.id);
        console.log(`[더미] "${parking.name}"에 "곧 나감" 상태 추가`);
      }
    });
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
            10
          );
        }
      });

    } catch (error) {
      console.error('알림 확인 실패:', error);
    }
  };

  const maybeOpenOutModal = (rows, watchedIds) => {
    if (!watchedIds?.length) return;
    const hit = rows.find(
      (p) => watchedIds.includes(normalizeId(p.id)) && p.leavingSoon
    );
    if (hit) openSoonModalFor(normalizeId(hit.id), hit.name, 10);
  };

  return {
    modalOpen,
    modalPlace,
    modalMinutes,
    setModalOpen,
    openSoonModalFor,
    showTestOutModal,
    addLeavingSoonToDummies,
    checkNotifications,
    maybeOpenOutModal,
  };
};
