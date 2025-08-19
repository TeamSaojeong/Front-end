// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import "./Styles/app-frame.css";

import LocationPinger from "./components/LocationPinger";
import { client } from "./apis/client";

// --- pages (모두 최상단으로 이동) ---
import Splash from "./pages/Splash";
import Start from "./pages/Start";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Home from "./pages/Home";
import NamePage from "./pages/Register/NamePage";
import DescriptionPage from "./pages/Register/DescriptionPage";
import ZipCodePage from "./pages/Register/ZipCodePage";
import TimePage from "./pages/TimeProvider";
import CompletePage from "./pages/Register/CompletePage";
import RegisterPayPage from "./pages/Register/RegisterPayPage";
import ConfirmFilePage from "./pages/Register/ConfirmFilePage";
import OutSoon from "./pages/OutSoon";
import OutSoon_cancel from "./pages/OutSoon_cancel";
import PrivateOutSoon from "./pages/PrivateOutSoon";
import PrivateOutSoon_cancel from "./pages/PrivateOutSoon_cancel";
import ParkingEnd from "./pages/ParkingEnd";
import PvPlaceDetail from "./pages/Place/PvPlaceDetail";
import PlaceDetail from "./pages/Place/PlaceDetail";
import NFCTagPage from "./pages/Nfc/NFCTagPage";
import PvTimeSelect from "./pages/Nfc/PvTimeSelect";
import PubTimeSelect from "./pages/Nfc/PubTimeSelect";
import MapRoute from "./pages/Nfc/MapRoute";
import PayPage from "./pages/Pay/PayPage";
import PayLoading from "./pages/Pay/PayLoading";
import PayComplete from "./pages/Pay/PayComplete";
import ParkingPlaceManage from "./pages/ParkingPlaceManage";

// ---- 토큰 복원(컴포넌트 밖, 모든 import 아래) ----
const saved = localStorage.getItem("accessToken");
if (saved) {
  client.defaults.headers.common.Authorization = `Bearer ${saved}`;
}

function App() {
  const isAuthed = !!localStorage.getItem("accessToken");

  return (
    <div className="app-outer">
      <div className="app-shell">
        {isAuthed && <LocationPinger intervalMinutes={10} />}
        <Routes>
          {/* 시작 흐름 */}
          <Route path="/" element={<Splash />} />
          <Route path="/start" element={<Start />} />
          {/* 인증/메인 */}
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* 등록 플로우 */}
          <Route path="/name" element={<NamePage />} />
          <Route path="/confirm" element={<ConfirmFilePage />} />
          <Route path="/description" element={<DescriptionPage />} />
          <Route path="/zipcode" element={<ZipCodePage />} />
          <Route path="/time" element={<TimePage />} />
          <Route path="/registerpay" element={<RegisterPayPage />} />
          <Route path="/complete" element={<CompletePage />} />
          {/* 디테일 */}
          <Route path="/pv/place/:placeId" element={<PvPlaceDetail />} />
          <Route path="/place/:placeId" element={<PlaceDetail />} />
          {/* 주차 진행/알림 */}
          <Route path="/outsoon" element={<OutSoon />} />
          <Route path="/outsoon_cancel" element={<OutSoon_cancel />} />
          <Route path="/privateoutsoon" element={<PrivateOutSoon />} />
          <Route
            path="/privateoutsoon_cancel"
            element={<PrivateOutSoon_cancel />}
          />
          <Route path="/parkingend" element={<ParkingEnd />} />
          {/* NFC/길안내/결제 */}
          <Route path="/nfc" element={<NFCTagPage />} />
          <Route path="/pv/time-select" element={<PvTimeSelect />} />
          <Route path="/pub/time-select" element={<PubTimeSelect />} />
          <Route path="/MapRoute" element={<MapRoute />} />
          <Route path="/PayPage" element={<PayPage />} />
          <Route path="/paypage" element={<PayPage />} />
          <Route path="/payloading" element={<PayLoading />} />
          <Route path="/paycomplete" element={<PayComplete />} />
          {/* 설정/관리 */}
          <Route path="/parkingplacemanage" element={<ParkingPlaceManage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
