import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';


const root = ReactDOM.createRoot(document.getElementById('root'));
function renderApp() {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

function getJsKey() {
  // CRA
  const k1 = process.env.REACT_APP_KAKAO_JS_KEY;
  // (혹시 vite 코드가 섞여 있는 경우를 대비)
  const k2 = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_KAKAO_JS_KEY : undefined;
  return k1 || k2;
}

function loadKakaoSdkAndRender() {
//   const jsKey = getJsKey();

//   if (!jsKey) {
//     console.warn('[Kakao] JS Key가 없습니다. (.env.local에 REACT_APP_KAKAO_JS_KEY 설정)');
//     renderApp(); // 키 없어도 앱은 뜨게
//     return;
//   }

//   // 이미 로드된 경우
//   if (document.querySelector('script[data-kakao-sdk="true"]')) {
//     if (window.kakao?.maps?.load) {
//       window.kakao.maps.load(renderApp);
//     } else {
//       renderApp();
//     }
//     return;
//   }

//   const s = document.createElement('script');
//   s.setAttribute('data-kakao-sdk', 'true');
//   s.async = true;
//   // https 고정 + autoload=false
//   s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(jsKey)}&libraries=services&autoload=false`;

//   s.onload = () => {
//     if (window.kakao?.maps?.load) {
//       window.kakao.maps.load(renderApp);
//     } else {
//       console.error('[Kakao] window.kakao.maps.load를 찾지 못했습니다.');
//       renderApp();
//     }
//   };
//   s.onerror = () => {
//     console.error('[Kakao] SDK 로드 실패 (네트워크/도메인/키 확인 필요)');
//     renderApp();
//   };
//   document.head.appendChild(s);
// }

// loadKakaoSdkAndRender();

const SDK_SRC =
    "https://dapi.kakao.com/v2/maps/sdk.js?appkey=71c60621c1fe2a426ab40cd49c430dbb&autoload=false&libraries=services";

  if (document.querySelector('script[data-kakao-sdk="true"]')) {
    window.kakao?.maps?.load ? window.kakao.maps.load(renderApp) : renderApp();
    return;
  }
  
  const s = document.createElement("script");
  s.src = SDK_SRC;
  s.async = true;
  s.setAttribute("data-kakao-sdk", "true");
  s.onload = () => window.kakao?.maps?.load ? window.kakao.maps.load(renderApp) : renderApp();
  s.onerror = () => {
    console.error("[Kakao] SDK 로드 실패");
    renderApp();
  };
  document.head.appendChild(s);
}

loadKakaoSdkAndRender();

