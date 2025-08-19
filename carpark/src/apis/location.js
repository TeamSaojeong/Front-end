// src/apis/location.js
import { client } from "./client";

/** 명세: POST /api/members/me/location  (Query: lat, lng) */
export async function postMyLocation({ lat, lng }) {
  // 토큰이 없다면 로컬스토리지에서 한 번 더 세팅(새로고침 대비)
  const token = localStorage.getItem("accessToken");
  if (token && !client.defaults.headers.common.Authorization) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  // RequestBody는 없음, lat/lng는 RequestParam
  return client.post(`/api/members/me/location`, null, {
    params: { lat, lng },
  });
}
