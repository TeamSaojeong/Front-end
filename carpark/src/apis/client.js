// src/apis/client.js
import axios from "axios";

// CRA / Vite 모두에서 읽히도록
const baseURL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  process.env.VITE_API_BASE ||
  "https://api.parkhere.store"; // 필요 시 환경에 맞게 조정

export const client = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: false,
});

// 요청 인터셉터
client.interceptors.request.use((config) => {
  // 헤더 객체 보장
  config.headers = config.headers ?? {};

  // 1) Authorization 자동 주입
  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // 반드시 공백 포함: "Bearer <token>"
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // 디버깅용: 토큰 없음
      // console.debug("[axios] no accessToken in localStorage");
    }
  } catch {
    // localStorage 접근 불가 환경 대비
  }

  // 2) Accept 기본값
  if (!config.headers.Accept) {
    config.headers.Accept = "application/json, text/plain, */*";
  }

  // 3) FormData면 Content-Type 제거 (axios가 boundary 자동 세팅)
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    delete config.headers["Content-Type"];
  } else {
    // JSON/기타에는 명시 (이미 설정돼 있으면 유지)
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
  }

  // 디버깅 로그(원하면 주석 해제)
  console.log("[axios] ->", config.method?.toUpperCase(), config.url, {
    auth: !!config.headers.Authorization,
    ct: config.headers["Content-Type"],
  });

  return config;
});

// 응답 인터셉터
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      console.warn("[axios] 401 Unauthorized (토큰 누락/만료/무효)");
      // 필요 시 자동 로그아웃 처리:
      // localStorage.removeItem("accessToken");
      // window.location.href = "/login";
    }
    console.error(
      "[API ERROR]",
      err.config?.method?.toUpperCase(),
      err.config?.url,
      "| status:",
      status,
      "| data:",
      err.response?.data
    );
    return Promise.reject(err);
  }
);
