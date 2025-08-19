// src/apis/parking.js
import { client } from "./client";

/** 주변 주차장 검색 : Query => lat, lon */
export const getNearby = (lat, lng) => {
  const _lat = typeof lat === "number" ? lat : Number(lat);
  const _lon = typeof lng === "number" ? lng : Number(lng);
  return client.get("/api/parking/nearby", {
    params: { lat: _lat, lon: _lon },
  });
};

/**
 * [공영 상세] kakaoId(nearby의 id), lat(y), lon(x)
 * 예) GET /api/parking/detail?kakaoId=1021815417&lat=37.46&lon=127.04
 */
export const getPublicDetail = (kakaoId, lat, lon) =>
  client.get("/api/parking/detail", { params: { kakaoId, lat, lon } });

/** (호환용) id로 상세 - 백엔드가 parkingId 방식 지원할 때만 사용 */
export const getPublicDetailById = (parkingId) =>
  client.get("/api/parking/detail", { params: { parkingId } });

/** 개인 주차장 상세 */
export const getPrivateDetail = (parkingId) =>
  client.get(`/api/parking/${parkingId}`);

/** (유지) 혼잡도 예측 */
export const getPredict = (parkingId, etaMinutes) =>
  client.get(`/api/parking/predict`, { params: { parkingId, etaMinutes } });

/** 알림 구독 */
export const subscribeAlert = (parkingId) =>
  client.post(`/api/alerts`, { parkingId });

/** 주차장 상태 조회 (이용중/대기중 여부 등) */
export const getParkingStatus = (parkingId) =>
  client.get(`/api/parking/${parkingId}/status`);

/**
 * 예약(주차장 이용 시간 추가/시작)
 * POST /api/parking/{parkingId}/reservation
 * body: { usingMinutes: number }
 */
export const createReservation = (parkingId, usingMinutes) =>
  client.post(`/api/parking/${parkingId}/reservation`, { usingMinutes });

/** ‘곧 나감’ 알림 (공영/민영 공통) */
export const postSoonOut = (payload) =>
  // payload: { lat, lng, minute, provider?, externalId?, parkingId?, reservationId?, placeName, address }
  client.post(`/api/soonout`, payload);
