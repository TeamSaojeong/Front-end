import axios from "axios";

// CRA / Vite 모두에서 읽히도록
const baseURL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  process.env.VITE_API_BASE ||
  "https://api.parkhere.store";

export const client = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: false,
});

// 요청 인터셉터
client.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};

  // Authorization
  try {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}

  // Accept
  if (!config.headers.Accept) {
    config.headers.Accept = "application/json, text/plain, */*";
  }

  // Content-Type (FormData면 제거)
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;
  if (isFormData) {
    delete config.headers["Content-Type"];
  } else if (!config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

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
