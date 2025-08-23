// src/apis/parking.js
import { client } from "./client";

/** 🔧 공통: id 정제 함수 (kakao:123 → 123) */
const normalizeId = (id) => String(id ?? "").replace(/^kakao:/i, "");
const authHeader = () => {
  const t = localStorage.getItem("accessToken");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

/** 주변 주차장 검색 : Query => lat, lon */
export const getNearby = (lat, lng, config = {}) => {
  const _lat = typeof lat === "number" ? lat : Number(lat);
  const _lon = typeof lng === "number" ? lng : Number(lng);
  return client.get("/api/parking/nearby", {
    params: { lat: _lat, lon: _lon },
    signal: config.signal,
  });
};

/** [공영 상세] kakaoId(nearby의 id), lat(y), lon(x) */
export const getPublicDetail = (kakaoId, lat, lon) => {
  const cleanId = normalizeId(kakaoId);
  return client.get("/api/parking/detail", {
    params: { kakaoId: cleanId, lat, lon },
  });
};

/** (호환) id로 상세 */
export const getPublicDetailById = (parkingId) => {
  const cleanId = normalizeId(parkingId);
  return client.get("/api/parking/detail", { params: { parkingId: cleanId } });
};

/** 개인 주차장 상세(관리/수정/내 주차장) */
export const getPrivateDetail = (parkingId) => {
  const cleanId = normalizeId(parkingId);
  return client.get(`/api/parking/${cleanId}`);
};

/** (추가) 방금 등록한 내 주차장 상세 */
export async function getMyParkingDetail(parkingId, accessToken) {
  const cleanId = normalizeId(parkingId);
  if (!cleanId) throw new Error("parkingId가 필요합니다.");
  const { data } = await client.get(
    `/api/parking/${encodeURIComponent(cleanId)}`,
    {
      headers: {
        Authorization:
          accessToken || client.defaults.headers.common.Authorization,
      },
    }
  );
  return data?.data ?? data ?? {};
}

/** 개인 주차장 이미지(blob) */
export const getPrivateImage = async (parkingId) => {
  const cleanId = normalizeId(parkingId);
  console.log(`[API] 이미지 요청 시작: GET /api/parking/${cleanId}/image`);
  
  try {
    const response = await client.get(`/api/parking/${cleanId}/image`, { 
      responseType: "blob" 
    });
    
    console.log(`[API] 이미지 응답 성공:`, {
      status: response.status,
      contentType: response.headers['content-type'],
      dataSize: response.data?.size,
      hasData: !!response.data
    });
    
    return response;
  } catch (error) {
    console.log(`[API] 이미지 요청 실패:`, {
      parkingId: cleanId,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      message: error?.message,
      url: error?.config?.url
    });
    
    // 404는 정상적인 상황 (이미지가 없는 경우)
    if (error?.response?.status === 404) {
      console.log(`[API] 주차장 ${cleanId} 이미지 없음 (404) - 정상`);
      return null;
    }
    // 다른 오류는 재전파
    throw error;
  }
};

/** [내가 등록한 주차장 조회] GET /api/parking (관리용) */
export const getMyParkings = async () => {
  try {
    console.log('[API] GET /api/parking - 내 주차장 조회 (관리용)');
    const response = await client.get('/api/parking', {
      headers: authHeader(),
    });
    console.log('[API] 내 주차장 응답 (관리용):', response.data);
    return response;
  } catch (error) {
    if (error?.response?.status === 401) {
      console.warn('[API] 토큰 만료, 로그인 페이지로 이동');
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return { data: [] };
    }
    console.error('[API] 내 주차장 조회 실패:', error);
    throw error;
  }
};

/** [모든 개인 주차장 조회] GET /api/parking (지도용) */
export const getAllPrivateParkings = async () => {
  try {
    console.log('[API] GET /api/parking - 모든 개인 주차장 조회 (지도용)');
    
    // 🔍 JWT 토큰에서 사용자 정보 추출
    const token = localStorage.getItem("accessToken");
    let currentUserId = null;
    
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        currentUserId = decoded.loginId || decoded.email || decoded.sub; // ✅ loginId 사용
        console.log('[API] 토큰에서 추출한 사용자 ID:', currentUserId);
      } catch (e) {
        console.warn('[API] JWT 디코딩 실패:', e);
      }
    }
    
    // ✅ 기존 API 호출하되, 응답에 소유자 정보 추가
    const response = await client.get('/api/parking', {
      headers: authHeader(),
    });
    
    // ✅ 백엔드 응답 필드명에 맞춰 매핑
    if (response.data?.data) {
      response.data.data = response.data.data.map(parking => ({
        ...parking,
        // 필드명 통일
        parking_id: parking.parkingId,
        name: parking.parkingName,
        enabled: parking.operate,
        // 소유자 구분은 아직 백엔드에서 제공 안함 (임시로 모든 주차장 표시)
        is_owner: false, // 일단 모든 주차장을 다른 사용자 것으로 처리
        owner_id: 'unknown',
        current_user: currentUserId
      }));
    }
    
    console.log('[API] 모든 개인 주차장 응답 (소유자 정보 추가):', response.data);
    return response;
  } catch (error) {
    if (error?.response?.status === 401) {
      console.warn('[API] 토큰 만료, 로그인 페이지로 이동');
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return { data: [] };
    }
    console.error('[API] 모든 개인 주차장 조회 실패:', error);
    
    // ✅ 오류 시 빈 배열 반환 (지도 기능 유지)
    return { data: { data: [] } };
  }
};

/** 혼잡도 예측 */
export const getPredict = (parkingId, etaMinutes) => {
  const cleanId = normalizeId(parkingId);
  return client.get(`/api/parking/predict`, {
    params: { parkingId: cleanId, etaMinutes },
  });
};

/** ✅ 알림 구독 (공영/민영 겸용) — 서버 스펙: 쿼리 파라미터 */
export function subscribeAlert({ provider, externalId, parkingId }) {
  const params = {};
  
  if (parkingId && parkingId !== externalId) {
    // 개인 주차장: parkingId만 전송
    params.parkingId = normalizeId(parkingId);
  } else {
    // 공용 주차장: provider + externalId만 전송
    params.provider = provider || "kakao";
    params.externalId = normalizeId(externalId);
  }
  
  console.log('subscribeAlert API 호출 파라미터:', params);
  return client.post(`/api/alerts`, null, { params, headers: authHeader() });
}

/** ✅ 알림 구독 해지 (새로운 DELETE API 사용) */
export function unsubscribeAlert({ alertId }) {
  return client.delete(`/api/alerts/delete`, { 
    params: { alertId },
    headers: authHeader() 
  });
}

// 알림 서버 API는 현재 미제공. 로컬 스토리지 기반 메커니즘을 사용합니다.

/** 상태 조회 */
export const getParkingStatus = (parkingId) => {
  const cleanId = normalizeId(parkingId);
  return client.get(`/api/parking/${cleanId}/status`);
};

/** 예약 시작 */
export const createReservation = (parkingId, usingMinutes) => {
  const cleanId = normalizeId(parkingId);
  return client.post(`/api/parking/${cleanId}/reservation`, { usingMinutes });
};

/** 카카오페이 결제 준비 */
export const preparePayment = (payload) => {
  return client.post('/api/pay/ready', payload, {
    headers: authHeader()
  });
};

/** ‘곧 나감’ 신고 */
export const postSoonOut = (payload) => client.post(`/api/soonout`, payload);

/** 주변 평균 요금(10분당) */
export const getAvgFee = (lat, lon) =>
  client.get("/api/parking/avg", { params: { lat, lon } });

/** 생성된 곧나감 알림 조회 */
export const getSoonOutDetail = (soonOutId) => {
  return client.get(`/api/soonout/${encodeURIComponent(soonOutId)}`, {
    headers: authHeader(),
  });
};
