// import axios from "axios";

// export const fetchParkingPrediction = async (payload) => {
//   try {
//     const res = await axios.post("/api/parking/predict", payload, {
//       headers: { "Content-Type": "application/json" }
//     });
//     return res.data; // { pred_level: "혼잡", ... }
//   } catch (err) {
//     console.error("API 호출 오류:", err);
//     return null;
//   }
// };

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