import { client } from "./client";

// POST /api/members/me/location?lat=..&lng=..
export async function postMyLocation({ lat, lng }) {
  return client.post("/api/members/me/location", null, {
    params: { lat, lng }, // ← 명세서 2개 값 
  });
}

//useKakaoMap.js에서 사용됨(지도 중심 변경 시 마다 정보를 전송)
//locationPinger.jsx에서도 10분마다 자동으로 위치 정보를 전송하는데 사용되고 있음음