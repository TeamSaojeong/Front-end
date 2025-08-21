// src/apis/client.js
import axios from "axios";

// CRA / Vite 모두에서 읽히도록
const baseURL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  process.env.VITE_API_BASE ||
  "http://localhost:8080";

export const client = axios.create({
  baseURL,
  timeout: 15000,
  // ❌ 전역 Content-Type 고정 금지 — 각 요청 타입에 맞게 자동 설정되게 둠
  withCredentials: false,
});

// 요청 인터셉터: FormData면 Content-Type 제거(axios가 boundary 포함해 자동 세팅)
client.interceptors.request.use((config) => {
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  // Accept 기본값만 깔끔하게
  if (!config.headers) config.headers = {};
  if (!config.headers.Accept) config.headers.Accept = "application/json";

  if (isFormData) {
    // axios가 multipart/form-data; boundary=... 자동 지정하도록 제거
    delete config.headers["Content-Type"];
  } else {
    // JSON/기타에는 명시 (이미 설정돼 있으면 유지)
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
  }
  return config;
});

// 응답 인터셉터(로그)
client.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error(
      "[API ERROR]",
      err.config?.method?.toUpperCase(),
      err.config?.url,
      "| status:",
      err.response?.status,
      "| data:",
      err.response?.data
    );
    return Promise.reject(err);
  }
);
