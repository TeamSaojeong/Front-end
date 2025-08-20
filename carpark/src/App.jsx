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
//ai 주차 예측
import AIPredict from "./pages/AIPredict";
import AIResult from "./pages/AIResult";

// 신고 flow
import ReportPage from "./pages/ReportPage";
import NFCTagPage from "./pages/Nfc/NFCTagPage";
import PvTimeSelect from "./pages/Nfc/PvTimeSelect";
import PubTimeSelect from "./pages/Nfc/PubTimeSelect";
import Estate from "./pages/Nfc/estate";
import Park from "./pages/Nfc/park";
import Flower from "./pages/Nfc/Flower";
import Village from "./pages/Nfc/village";
import MapRoute from "./pages/Nfc/MapRoute";
import PayPage from "./pages/Pay/PayPage";
import EstatePayPage from "./pages/Pay/EstatePayPage";
import ParkPayPage from "./pages/Pay/ParkPayPage";
import FlowerPayPage from "./pages/Pay/FlowerPayPage";
import VillagePayPage from "./pages/Pay/VillagePayPage";
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

          {/*AI 주차 예측*/}
          <Route path="/aipredict" element={<AIPredict />} />
          <Route path="/airesult" element={<AIResult />} />

          {/*신고하기 flow */}
          <Route path="/report" element={<ReportPage />} />

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
          <Route path="/estate" element={<Estate />} />
          <Route path="/park" element={<Park />} />
          <Route path="/flower" element={<Flower />} />
          <Route path="/village" element={<Village />} />
          <Route path="/pub/time-select" element={<PubTimeSelect />} />
          <Route path="/MapRoute" element={<MapRoute />} />
          <Route path="/PayPage" element={<PayPage />} />
          <Route path="/EstatePayPage" element={<EstatePayPage />} />
          <Route path="/ParkPayPage" element={<ParkPayPage />} />
          <Route path="/FlowerPayPage" element={<FlowerPayPage />} />
          <Route path="/VillagePayPage" element={<VillagePayPage />} />
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
