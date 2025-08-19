// src/apis/parking.js
import { client } from "./client";

/** 주변 주차장 조회 */
export const getNearby = async (lat, lng) => {
  // 서버 스펙 확정 전: lat/lng 기본 쿼리
  return client.get("/api/parking/nearby", { params: { lat, lng } });
};

/** 공영/민영 상세 */
export const getPublicDetail = (parkingId) =>
  client.get("/api/parking/detail", { params: { parkingId } });

/** 개인 상세 */
export const getPrivateDetail = (parkingId) =>
  client.get(`/api/parking/${parkingId}`);

/** 혼잡도 예측 */
export const getPredict = (parkingId, etaMinutes) =>
  client.get(`/api/parking/predict`, { params: { parkingId, etaMinutes } });

/** 알림 구독 */
export const subscribeAlert = (parkingId) =>
  client.post(`/api/alerts`, { parkingId });

/** 현재 예약/이용 상태 */
export const getParkingStatus = (parkingId) =>
  client.get(`/api/parking/${parkingId}/status`);

/** 개인 주차장 등록 (multipart: request JSON + image File) */
export const createPrivateParking = async (payload, imageFile) => {
  const fd = new FormData();
  const blob = new Blob([JSON.stringify(payload)], {
    type: "application/json",
  });
  fd.append("request", blob);
  if (imageFile) fd.append("image", imageFile);
  return client.post("/api/parking", fd);
};
