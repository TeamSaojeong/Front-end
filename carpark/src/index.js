// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./Styles/fonts.css";
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

function loadKakaoSdkAndRender() {
  // 하드코딩된 키
  const SDK_SRC =
    "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false&libraries=services";

  // 이미 로드된 경우
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
  s.src = SDK_SRC;
  s.onload = () => {
    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(renderApp);
    } else {
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