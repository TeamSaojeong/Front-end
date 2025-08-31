// src/hooks/useOutModal.js
import { useState, useRef } from "react";

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
    checkNotifications,
    maybeOpenOutModal,
  };
};
