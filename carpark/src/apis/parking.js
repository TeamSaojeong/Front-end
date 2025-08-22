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
export const getPrivateImage = (parkingId) => {
  const cleanId = normalizeId(parkingId);
  return client.get(`/api/parking/${cleanId}/image`, { responseType: "blob" });
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
  if (parkingId) {
    // 개인 주차장
    params.parkingId = normalizeId(parkingId);
  } else {
    // 공영/민영(kakao 등)
    params.provider = provider || "kakao";
    params.externalId = normalizeId(externalId);
  }
  return client.post(`/api/alerts`, null, { params, headers: authHeader() });
}

/** ✅ 알림 구독 해지 (토글 해제용) — DELETE /api/alerts */
export function unsubscribeAlert({ provider, externalId, parkingId }) {
  const params = {};
  if (parkingId) {
    params.parkingId = normalizeId(parkingId);
  } else {
    params.provider = provider || "kakao";
    params.externalId = normalizeId(externalId);
  }
  return client.delete(`/api/alerts`, { params, headers: authHeader() });
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

/** ‘곧 나감’ 신고 */
export const postSoonOut = (payload) => client.post(`/api/soonout`, payload);

/** 주변 평균 요금(10분당) */
export const getAvgFee = (lat, lon) =>
  client.get("/api/parking/avg", { params: { lat, lon } });
