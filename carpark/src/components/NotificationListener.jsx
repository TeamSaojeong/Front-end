import React, { useEffect, useRef, useState } from 'react';
import OutModal from './Modal/OutModal';
import { useNotificationStore } from '../store/NotificationStore';

export default function NotificationListener() {
  const { notifications, addNotification, removeNotification } = useNotificationStore();
  const pollingIntervalRef = useRef(null);
  const [isPolling, setIsPolling] = useState(false);

  // 디버깅: notifications 상태 변화 추적 (알림이 있을 때만)
  useEffect(() => {
    if (notifications.length > 0) {
      console.log(`[상태] 알림 개수 변경: ${notifications.length}개`, notifications);
    }
  }, [notifications]);

  // 폴링으로 알림 확인
  const checkNotifications = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      // 세션 스토리지에서 pendingNotifications 확인 (탭별 독립)
      const currentUserKey = sessionStorage.getItem("userKey") || localStorage.getItem("userKey") || "guest";
      const notificationsKey = `pendingNotifications__${currentUserKey}`;
      
      console.log(`[폴링] 사용자 ${currentUserKey}의 알림 확인 중...`);
      console.log(`[폴링] 확인할 키: ${notificationsKey}`);
      
      try {
        // sessionStorage 우선, 없으면 localStorage 확인
        const pendingNotifications = JSON.parse(
          sessionStorage.getItem(notificationsKey) || 
          localStorage.getItem(notificationsKey) || 
          "[]"
        );
        // 알림이 있을 때만 로그 출력
        if (pendingNotifications.length > 0) {
          console.log(`[폴링] 발견된 알림:`, pendingNotifications);
        }
        
        if (pendingNotifications.length > 0) {
          // 새로운 알림이 있으면 추가
          pendingNotifications.forEach(notification => {
            // 이미 표시된 알림인지 확인
            const isDuplicate = notifications.some(existing => 
              existing.id === notification.id
            );
            
            console.log(`[폴링] 알림 ${notification.id} 처리 중...`, {
              isDuplicate,
              existingCount: notifications.length,
              notification
            });
            
            if (!isDuplicate) {
              console.log(`[폴링] 새 알림 추가 시도:`, notification);
              addNotification({
                id: notification.id,
                type: notification.type,
                parkingId: notification.parkingId,
                placeName: notification.placeName,
                minutesAgo: notification.minutesAgo || 10,
                timestamp: notification.timestamp
              });
              
              // 즉시 상태 확인
              setTimeout(() => {
                const currentState = useNotificationStore.getState();
                console.log(`[폴링] addNotification 후 즉시 상태 확인:`, {
                  notifications: currentState.notifications,
                  count: currentState.notifications.length
                });
              }, 0);
            } else {
              console.log(`[폴링] 중복 알림 무시:`, notification.id);
            }
          });
          
          // 처리된 알림은 세션 스토리지에서 제거
          sessionStorage.removeItem(notificationsKey);
          localStorage.removeItem(notificationsKey);
          
          console.log(`[폴링] ${pendingNotifications.length}개의 새 알림 처리 완료`);
        }
        // else는 제거 (새 알림이 없을 때는 로그 출력하지 않음)
      } catch (error) {
        console.error('[폴링] 로컬 알림 처리 실패:', error);
      }

      // 현재는 서버 알림 API가 구현되지 않음
      // TODO: 서버에서 실제 알림 API 구현 필요
      // 예: GET /api/alerts/notifications

      // console.log(`[폴링] 현재 알림 개수: ${notifications.length}`);
    } catch (error) {
      console.error('[폴링] 알림 확인 실패:', error);
    }
  };

  // 폴링 시작
  const startPolling = () => {
    if (isPolling) return;
    
    setIsPolling(true);
    checkNotifications(); // 즉시 한 번 실행
    
    // 3초마다 알림 확인 (로그 스팸 방지)
    pollingIntervalRef.current = setInterval(checkNotifications, 3000);
  };

  // 폴링 중지
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  // 컴포넌트 마운트 시 폴링 시작
  useEffect(() => {
    // sessionStorage에 userKey가 없으면 localStorage에서 복사
    if (!sessionStorage.getItem("userKey") && localStorage.getItem("userKey")) {
      sessionStorage.setItem("userKey", localStorage.getItem("userKey"));
      console.log(`[NotificationListener] userKey를 localStorage에서 sessionStorage로 복사: ${localStorage.getItem("userKey")}`);
    }
    
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // 토큰 변경 시 폴링 재시작
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken') {
        if (e.newValue) {
          // 토큰이 새로 설정된 경우
          setTimeout(startPolling, 100);
        } else {
          // 토큰이 제거된 경우
          stopPolling();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 알림 모달 닫기
  const handleCloseNotification = (notificationId) => {
    removeNotification(notificationId);
  };

  // 주차장 상세 보기
  const handleViewDetail = (notification) => {
    // 알림을 닫고 해당 주차장 상세 페이지로 이동
    removeNotification(notification.id);
    // 여기서 라우팅 로직을 추가할 수 있습니다
    console.log('주차장 상세 보기:', notification.parkingId);
  };

  // 테스트용: 수동으로 알림 추가 (개발 중에만 사용)
  const addTestNotification = () => {
    const testNotification = {
      id: Date.now(),
      type: 'SOON_OUT',
      parkingId: 'test-parking-123',
      placeName: '테스트 주차장',
      minutesAgo: 5,
      timestamp: Date.now()
    };
    
    addNotification(testNotification);
    
    // 세션 스토리지에도 추가 (실제 시나리오 시뮬레이션)
    const currentUserKey = sessionStorage.getItem("userKey") || localStorage.getItem("userKey") || "guest";
    const notificationsKey = `pendingNotifications__${currentUserKey}`;
    const existingNotifications = JSON.parse(sessionStorage.getItem(notificationsKey) || "[]");
    existingNotifications.push(testNotification);
    sessionStorage.setItem(notificationsKey, JSON.stringify(existingNotifications));
    
    console.log('[테스트] 알림 추가됨:', testNotification);
  };

  // 수동으로 알림 확인 (개발 중에만 사용)
  const checkNotificationsManually = () => {
    console.log('[수동] 알림 확인 시작');
    checkNotifications();
  };

  return (
    <>
      {/* 개발 중에만 표시되는 테스트 버튼들 */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <button 
            onClick={addTestNotification}
            style={{
              position: 'fixed',
              top: '10px',
              right: '10px',
              zIndex: 9999,
              padding: '8px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            테스트 알림 추가
          </button>
          
          <button 
            onClick={checkNotificationsManually}
            style={{
              position: 'fixed',
              top: '50px',
              right: '10px',
              zIndex: 9999,
              padding: '8px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            수동 알림 확인
          </button>
        </>
      )}

      {notifications.map((notification) => (
        <OutModal
          key={notification.id}
          isOpen={true}
          minutesAgo={notification.minutesAgo}
          placeId={notification.parkingId}
          placeName={notification.placeName}
          onClose={() => handleCloseNotification(notification.id)}
          onViewDetail={() => handleViewDetail(notification)}
          autoCloseMs={0}
          vibrate={true}
          sound={true}
        />
      ))}
    </>
  );
}
