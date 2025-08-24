import { client } from "./client";

export const fetchParkingPrediction = async (payload) => {
  try {
    console.log("[AI예측] POST /api/parking/predict 호출:", payload);
    const res = await client.post("/api/parking/predict", payload, {
      headers: { "Content-Type": "application/json" }
    });
    
    // 응답 상태 체크
    if (res.data?.status === 500 || res.status >= 400) {
      console.warn("[AI예측] 서버 오류 응답:", res.data);
      throw new Error(`Server Error: ${res.data?.message || 'Unknown error'}`);
    }
    
    console.log("[AI예측] API 응답:", res.data);
    return res.data;
  } catch (err) {
    console.error("[AI예측] API 호출 오류:", err);
    // 오류 시 모의 데이터 반환
    console.log("[AI예측] 모의 데이터로 대체");
    
    // 검색 위치 정보를 반영한 모의 데이터 생성
    const mockData = {
      ...mockPredictResponse,
      location: {
        lat: payload.lat,
        lon: payload.lon,
        address: `위도 ${payload.lat.toFixed(4)}, 경도 ${payload.lon.toFixed(4)} 주변`
      },
      searchTime: payload.arrival,
      message: `${payload.lat.toFixed(4)}, ${payload.lon.toFixed(4)} 좌표 기준 1km 반경 주차 예측 (모의 데이터)`
    };
    
    return mockData;
  }
};

// 모의 응답 데이터
export const mockPredictResponse = {
  ok: true,
  items: [
    {
      prkCd: "EXT_ChIJ2USMGj0hfDUR",
      prkNm: "매헌시민의숲 동측주차장",
      areaCd: "EXT",
      dist_km: 0.1059,
      pred_level: "여유",
      score: 5.0e-4,
      p_여유: 0.9991,
      p_보통: 0.0009,
      p_혼잡: 0.0,
    },
    {
      prkCd: "EXT_ChIJ3yfI1symfDUR",
      prkNm: "(주)케이엠파크 양재근린공원",
      areaCd: "EXT",
      dist_km: 0.1639,
      pred_level: "여유",
      score: 5.0e-4,
      p_여유: 0.9991,
      p_보통: 0.0009,
      p_혼잡: 0.0,
    },
    {
      prkCd: "EXT_ChIJV4TUscumfDUR",
      prkNm: "삼호주차장",
      areaCd: "EXT",
      dist_km: 0.5609,
      pred_level: "여유",
      score: 5.0e-4,
      p_여유: 0.9991,
      p_보통: 0.0009,
      p_혼잡: 0.0,
    },
  ],
  logs: "[예측 시각] 2025-08-18T06:00\n[모델] v1.0.0",
};

// 모의 호출 함수 (네트워크 지연 흉내)
export async function fetchParkingPredictionMock(payload) {
  console.log("[MOCK] POST /api/parking/predict", payload);
  await new Promise((r) => setTimeout(r, 500));
  return mockPredictResponse;
}
