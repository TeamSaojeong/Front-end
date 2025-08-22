import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  // 알림 목록
  notifications: [],
  
  // 알림 추가
  addNotification: (notification) => {
    console.log(`[Store] 새 알림 추가:`, notification);
    
    set((state) => {
      const newState = {
        notifications: [...state.notifications, notification]
      };
      return newState;
    });
    
    // 상태 업데이트 후 확인
    setTimeout(() => {
      const finalState = get();
      console.log(`[Store] 알림 추가 완료. 총 ${finalState.notifications.length}개`);
    }, 0);
  },
  
  // 알림 제거
  removeNotification: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== notificationId)
    }));
  },
  
  // 모든 알림 제거
  clearNotifications: () => {
    set({ notifications: [] });
  },
  
  // 특정 주차장의 알림만 제거
  removeNotificationsByParkingId: (parkingId) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.parkingId !== parkingId)
    }));
  },
  
  // 알림 개수
  getNotificationCount: () => {
    return get().notifications.length;
  },
  
  // 특정 주차장의 알림이 있는지 확인
  hasNotificationForParking: (parkingId) => {
    return get().notifications.some(n => n.parkingId === parkingId);
  }
}));
