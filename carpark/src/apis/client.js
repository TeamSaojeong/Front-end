// src/apis/client.js
import axios from "axios";

// CRA/Vite 모두 안전하게 읽도록
const baseURL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  process.env.VITE_API_BASE ||
  "http://localhost:8080";

export const client = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

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
