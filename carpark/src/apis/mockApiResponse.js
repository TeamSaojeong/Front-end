// components/mockApiResponse.js
// 🆕 모의 응답을 "named export"로
export const mockApiResponse = {
  ok: true,
  items: [
    {
      prkCd: "EXT_001",
      prkNm: "매헌시민의숲 동측주차장",
      areaCd: "EXT",
      dist_km: 0.105,
      pred_level: "여유",
      score: 0.0005,
      p_여유: 0.9991,
      p_보통: 0.0009,
      p_혼잡: 0.0,
    },
    {
      prkCd: "EXT_002",
      prkNm: "(주)케이엠파크 양재근린공원",
      areaCd: "EXT",
      dist_km: 0.163,
      pred_level: "여유",
      score: 0.0005,
      p_여유: 0.9991,
      p_보통: 0.0009,
      p_혼잡: 0.0,
    },
    {
      prkCd: "EXT_003",
      prkNm: "삼호주차장",
      areaCd: "EXT",
      dist_km: 0.56,
      pred_level: "보통",
      score: 0.0005,
      p_여유: 0.6,
      p_보통: 0.39,
      p_혼잡: 0.01,
    },
  ],
  logs: "[예측 시각] 2025-08-18T06:00",
};
