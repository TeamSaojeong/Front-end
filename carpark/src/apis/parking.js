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

export const getPublicDetail = (parkingId) =>
  client.get("/api/parking/detail", { params: { parkingId } });

export const getPrivateDetail = (parkingId) =>
  client.get(`/api/parking/${parkingId}`);

export const getPredict = (parkingId, etaMinutes) =>
  client.get(`/api/parking/predict`, { params: { parkingId, etaMinutes } });

export const subscribeAlert = (parkingId) =>
  client.post(`/api/alerts`, { parkingId });

export const getParkingStatus = (parkingId) =>
  client.get(`/api/parking/${parkingId}/status`);

export const createReservation = (parkingId, payload) =>
  client.post(`/api/parking/${parkingId}/reservation`, payload);
