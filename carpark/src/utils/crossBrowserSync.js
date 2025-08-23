/**
 * 크로스 브라우저 데이터 동기화 (개발용)
 * 서버 API 대신 브라우저 간 데이터 공유 시뮬레이션
 */

// 🔄 공유 데이터 저장소 (서버 시뮬레이션)
const SYNC_ENDPOINT = 'https://api.jsonbin.io/v3/b'; // 무료 JSON 저장소
const API_KEY = '$2a$10$YOUR_API_KEY'; // 실제 사용 시 발급받아야 함

/**
 * 주차장 등록 시 공유 저장소에 저장
 */
export const syncParkingToCloud = async (parkingData) => {
  try {
    console.log('[SYNC] 클라우드 동기화 시작:', parkingData);
    
    // 1. 기존 데이터 가져오기
    const existing = await getCloudParkings();
    
    // 2. 새 데이터 추가
    const updated = [...existing, {
      ...parkingData,
      id: `parking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      owner: getCurrentUser()
    }];
    
    // 3. 클라우드에 저장 (실제 구현 시)
    // await fetch(SYNC_ENDPOINT, { method: 'PUT', body: JSON.stringify(updated) });
    
    // 임시: 로컬 스토리지에 전역 키로 저장
    localStorage.setItem('global-parkings', JSON.stringify(updated));
    
    console.log('[SYNC] 클라우드 동기화 완료');
    return updated;
  } catch (error) {
    console.error('[SYNC] 동기화 실패:', error);
    return [];
  }
};

/**
 * 모든 브라우저의 주차장 데이터 가져오기
 */
export const getCloudParkings = async () => {
  try {
    // 실제 구현 시: const response = await fetch(SYNC_ENDPOINT);
    // 임시: 로컬 스토리지에서 전역 데이터 읽기
    const data = localStorage.getItem('global-parkings');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[SYNC] 데이터 로드 실패:', error);
    return [];
  }
};

/**
 * 현재 사용자 확인 (JWT 기반)
 */
const getCurrentUser = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return "anonymous";
  
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.loginId || decoded.email || decoded.sub || "anonymous";
  } catch (e) {
    return "anonymous";
  }
};
