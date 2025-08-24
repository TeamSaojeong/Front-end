// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));

function renderApp() {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

// CRA(.env) -> REACT_APP_KAKAO_JS_KEY
// Vite(.env) -> VITE_KAKAO_JS_KEY  둘 다 지원
function getJsKey() {
  const k1 = process.env.REACT_APP_KAKAO_JS_KEY;
  const k2 =
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_KAKAO_JS_KEY : undefined;
  return k1 || k2;
}

function loadKakaoSdkAndRender() {
  const jsKey = getJsKey();

  if (!jsKey) {
    console.warn("[Kakao] JS Key가 없습니다. (.env에 REACT_APP_KAKAO_JS_KEY 또는 VITE_KAKAO_JS_KEY 설정)");
    renderApp(); // 키 없어도 앱은 먼저 뜨게
    return;
  }

  // 이미 로드되어 있으면 재사용
  if (document.querySelector('script[data-kakao-sdk="true"]')) {
    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(renderApp);
    } else {
      renderApp();
    }
    return;
  }

  const s = document.createElement("script");
  s.async = true;
  s.setAttribute("data-kakao-sdk", "true");
  // autoload=false 필수 -> window.kakao.maps.load로 초기화
  s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
    jsKey
  )}&libraries=services&autoload=false`;

  s.onload = () => {
    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(renderApp);
    } else {
      console.error("[Kakao] window.kakao.maps.load 없음");
      renderApp();
    }
  };
  s.onerror = () => {
    console.error("[Kakao] SDK 로드 실패 (네트워크/도메인/키 확인)");
    renderApp();
  };

  document.head.appendChild(s);
}

loadKakaoSdkAndRender();