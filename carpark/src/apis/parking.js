import { client } from "./client";

/** 주변 주차장 검색 : Query => lat, lon */
export const getNearby = (lat, lng, config = {}) => {
  const _lat = typeof lat === "number" ? lat : Number(lat);
  const _lon = typeof lng === "number" ? lng : Number(lng);
  return client.get("/api/parking/nearby", {
    params: { lat: _lat, lon: _lon },
    signal: config.signal, // AbortController 지원
  });
};

/** [공영 상세] kakaoId(nearby의 id), lat(y), lon(x) */
export const getPublicDetail = (kakaoId, lat, lon) =>
  client.get("/api/parking/detail", { params: { kakaoId, lat, lon } });

/** (호환) id로 상세 */
export const getPublicDetailById = (parkingId) =>
  client.get("/api/parking/detail", { params: { parkingId } });

/** 개인 주차장 상세(관리/수정/내 주차장) */
export const getPrivateDetail = (parkingId) =>
  client.get(`/api/parking/${parkingId}`);

/** (추가) 방금 등록한 내 주차장 상세 */
export async function getMyParkingDetail(parkingId, accessToken) {
  if (!parkingId) throw new Error("parkingId가 필요합니다.");
  const { data } = await client.get(
    `/api/parking/${encodeURIComponent(parkingId)}`,
    {
      headers: {
        Authorization:
          accessToken || client.defaults.headers.common.Authorization,
      },
    }
  );
  // API: { status, data: {...}, message }
  return data?.data ?? data ?? {};
}

/** 개인 주차장 이미지(blob) */
export const getPrivateImage = (parkingId) =>
  client.get(`/api/parking/${parkingId}/image`, { responseType: "blob" });

/** 혼잡도 예측 */
export const getPredict = (parkingId, etaMinutes) =>
  client.get(`/api/parking/predict`, { params: { parkingId, etaMinutes } });

/** 알림 구독 */
export const subscribeAlert = (parkingId) =>
  client.post(`/api/alerts`, { parkingId });

/** 상태 조회 */
export const getParkingStatus = (parkingId) =>
  client.get(`/api/parking/${parkingId}/status`);

/** 예약 시작 */
export const createReservation = (parkingId, usingMinutes) =>
  client.post(`/api/parking/${parkingId}/reservation`, { usingMinutes });

/** ‘곧 나감’ 신고 */
export const postSoonOut = (payload) => client.post(`/api/soonout`, payload);

/** 주변 평균 요금(10분당) */
export const getAvgFee = (lat, lon) =>
  client.get("/api/parking/avg", { params: { lat, lon } });
