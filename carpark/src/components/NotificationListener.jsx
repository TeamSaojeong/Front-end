import React, { useEffect, useRef, useState } from 'react';
import OutModal from './Modal/OutModal';
import { useNotificationStore } from '../store/NotificationStore';
import { getSoonOutDetail } from '../apis/parking';

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

  // 폴링으로 알림 확인 (로컬 + 서버)
  const getUserEmail = () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return "guest";
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.email || decoded.sub || "guest";
    } catch {
      return "guest";
    }
  };

  const checkNotifications = async () => {
    const token = localStorage.getItem('accessToken');
    const currentUserKey = getUserEmail();

    try {
      // 1. 로컬 스토리지에서 pendingNotifications 확인
      const notificationsKey = `pendingNotifications__${currentUserKey}`;
      
      try {
        const pendingNotifications = JSON.parse(localStorage.getItem(notificationsKey) || "[]");
        
        if (pendingNotifications.length > 0) {
          console.log(`[폴링] 📬 로컬에서 발견된 알림:`, pendingNotifications);
          
          for (const notification of pendingNotifications) {
            const isDuplicate = notifications.some(existing => 
              existing.id === notification.id
            );
            
            if (!isDuplicate) {
              console.log(`[폴링] ✅ 새 알림 처리 시작:`, notification);
              
              try {
                // 항상 soonOutId로 서버에서 최신 정보 조회 시도
                if (notification.soonOutId) {
                  const detailRes = await getSoonOutDetail(notification.soonOutId);
                  const detail = detailRes?.data?.data || {};
                  
                  // 서버 응답의 provider/externalId와 내가 구독한 주차장 비교
                  const watchedIds = JSON.parse(localStorage.getItem(`watchedPlaceIds__${currentUserKey}`) || "[]");
                  const watchedNames = JSON.parse(localStorage.getItem(`watchedPlaceNames__${currentUserKey}`) || "{}");
                  
                  const isSubscribed = detail.provider === 'kakao' && 
                    watchedIds.includes(detail.externalId);
                  
                  if (isSubscribed) {
                    console.log(`[폴링] ✅ 구독한 주차장의 곧나감 발견:`, detail);
                    addNotification({
                      id: `soonout_${notification.soonOutId}`,
                      type: 'SOON_OUT',
                      parkingId: detail.externalId,
                      placeName: watchedNames[detail.externalId] || detail.placeName,
                      minutesAgo: detail.minute || 10,
                      timestamp: Date.now()
                    });
                  } else {
                    console.log(`[폴링] ❌ 구독하지 않은 주차장:`, detail);
                  }
                }
              } catch (e) {
                console.error(`[폴링] 서버 조회 실패:`, e);
                // 서버 조회 실패 시 로컬 정보로 폴백
                addNotification({
                  id: notification.id,
                  type: notification.type,
                  parkingId: notification.parkingId,
                  placeName: notification.placeName,
                  minutesAgo: notification.minutesAgo || 10,
                  timestamp: notification.timestamp
                });
              }
            } else {
              console.log(`[폴링] ❌ 중복 알림 무시:`, notification.id);
            }
          }
          
          // 처리된 알림은 로컬 스토리지에서 제거
          localStorage.removeItem(notificationsKey);
        }
      } catch (error) {
        console.error('[폴링] 로컬 알림 처리 실패:', error);
      }

    } catch (error) {
      console.error('[폴링] 알림 확인 전체 실패:', error);
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
    const currentUserKey = getUserEmail();
    const testNotification = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'SOON_OUT',
      parkingId: 'test-parking-123',
      placeName: `테스트 주차장 (사용자: ${currentUserKey})`,
      minutesAgo: Math.floor(Math.random() * 15) + 5, // 5-20분 사이 랜덤
      timestamp: Date.now(),
      senderUserKey: 'test-sender',
      targetUserKey: currentUserKey
    };
    
    console.log(`[테스트] 사용자 ${currentUserKey}에게 테스트 알림 추가:`, testNotification);
    
    // 직접 store에 추가
    addNotification(testNotification);
    
    // 로컬 스토리지에도 추가 (폴링 시스템 테스트용)
    const notificationsKey = `pendingNotifications__${currentUserKey}`;
    const existingNotifications = JSON.parse(localStorage.getItem(notificationsKey) || "[]");
    existingNotifications.push({...testNotification, id: testNotification.id + '_storage'});
    localStorage.setItem(notificationsKey, JSON.stringify(existingNotifications));
    
    console.log(`[테스트] 🎯 테스트 알림이 ${currentUserKey} 사용자에게 전송됨`);
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
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="현재 사용자에게 테스트 알림을 즉시 추가합니다"
          >
            🔔 테스트 알림
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
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="수동으로 서버 및 로컬 알림을 확인합니다"
          >
            🔍 수동 확인
          </button>
          
          <div
            style={{
              position: 'fixed',
              top: '90px',
              right: '10px',
              zIndex: 9999,
              padding: '8px',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              borderRadius: '4px',
              fontSize: '10px',
              maxWidth: '200px',
              lineHeight: '1.3'
            }}
          >
            <div><strong>💡 개발 가이드:</strong></div>
            <div>1. 다른 계정으로 로그인</div>
            <div>2. 주차장 알림 설정</div>
            <div>3. 원래 계정으로 돌아와서</div>
            <div>4. '곧 나감' 버튼 클릭</div>
            <div>5. 알림 설정한 계정에서 OutModal 확인</div>
          </div>
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
