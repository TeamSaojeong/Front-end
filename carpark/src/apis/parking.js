// src/apis/parking.js
import { client } from "./client";

/** 🔧 공통: id 정제 함수 (kakao:123 → 123) */
const normalizeId = (id) => String(id ?? "").replace(/^kakao:/i, "");
const authHeader = () => {
  const t = localStorage.getItem("accessToken");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

/**nearby api 사용부분 */
export const getNearby = (lat, lng, config = {}) => {
  const _lat = typeof lat === "number" ? lat : Number(lat);
  const _lon = typeof lng === "number" ? lng : Number(lng);
  return client.get("/api/parking/nearby", {
    params: { lat: _lat, lon: _lon },
    signal: config.signal,
  });
};

/**[공영 상세] kakaoId(nearby의 id), lat(y), lon(x) */
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
  try {
    const response = await client.get(`/api/parking/${cleanId}/image`, { 
      responseType: "blob" 
    });
    return response;
  } catch (error) {
    // 404는 정상적인 상황 (이미지가 없는 경우)
    if (error?.response?.status === 404) {
      console.log(`[API] 주차장 ${cleanId} 이미지 없음 (404)`);
      return null;
    }
    // 다른 오류는 재전파
    throw error;
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
    params.parkingId = normalizeId(parkingId); //개인주차장장
  } else {
    // 공용 주차장: provider + externalId만 전송
    params.provider = provider || "kakao"; //공용주차장
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
export const preparePayment = (payload, queryParams = {}) => {
  console.log('preparePayment API 호출 파라미터:', payload);
  console.log('preparePayment 쿼리 파라미터:', queryParams);
  
  const params = {};
  if (queryParams.orderId) params.orderId = queryParams.orderId;
  if (queryParams.reservationId) params.reservationId = queryParams.reservationId;
  
  return client.post('/api/pay/ready', payload, {
    params,
    headers: authHeader()
  });
};

/** ‘곧 나감’ 신고 */
export const postSoonOut = (payload) => client.post(`/api/soonout`, payload);

/** 주변 평균 요금(10분당) */
export const getAvgFee = (lat, lon) =>
  client.get("/api/parking/avg", { params: { lat, lon } });
