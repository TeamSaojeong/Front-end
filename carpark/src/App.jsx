import React from "react";
import { Routes, Route } from "react-router-dom";

import "./Styles/app-frame.css";

/** 공통/인증/시작 */
import Splash from "./pages/Splash";
import Start from "./pages/Start";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

/** 메인 */
import Home from "./pages/Home";

/** 등록 플로우 */
import NamePage from "./pages/Register/NamePage";
import DescriptionPage from "./pages/Register/DescriptionPage";
import Address from "./components/Register/Address";
import ZipCodePage from "./pages/Register/ZipCodePage";
import TimePage from "./pages/Register/TimePage";
import CompletePage from "./pages/Register/CompletePage";
import RegisterPayPage from "./pages/Register/RegisterPayPage";
import ConfirmFilePage from "./pages/Register/ConfirmFilePage";

/** 주차 진행/알림 */
import OutSoon from "./pages/OutSoon";
import OutSoon_10m from "./pages/OutSoon_10m";
import OutSoon_cancel from "./pages/OutSoon_cancel";
import PrivateOutSoon from "./pages/PrivateOutSoon";
import PrivateOutSoon_10m from "./pages/PrivateOutSoon_10m";
import PrivateOutSoon_cancel from "./pages/PrivateOutSoon_cancel";
import ParkingEnd from "./pages/ParkingEnd";

/** 디테일 (개인 / 공영·민영 분리) */
import PvPlaceDetail from "./pages/Place/PvPlaceDetail";
import PlaceDetail from "./pages/Place/PlaceDetail";

/** 결제 & NFC */
import NFCTagPage from "./pages/Nfc/NFCTagPage";
import PvTimeSelect from "./pages/Nfc/PvTimeSelect";
import PubTimeSelect from "./pages/Nfc/PubTimeSelect";
import MapRoute from "./pages/Nfc/MapRoute";
import PayPage from "./pages/Pay/PayPage";
import PayLoading from "./pages/Pay/PayLoading";
import PayComplete from "./pages/Pay/PayComplete";

/** 설정/관리 */
import ParkingPlaceManage from "./pages/ParkingPlaceManage";

function App() {
  return (
    <div className="app-outer">
      <div className="app-shell">
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

          {/* 디테일 (분기) */}
          <Route path="/pv/place/:placeId" element={<PvPlaceDetail />} />
          <Route path="/place/:placeId" element={<PlaceDetail />} />

          {/* 주차 진행/알림 */}
          <Route path="/outsoon" element={<OutSoon />} />
          <Route path="/outsoon_10m" element={<OutSoon_10m />} />
          <Route path="/outsoon_cancel" element={<OutSoon_cancel />} />
          <Route path="/privateoutsoon" element={<PrivateOutSoon />} />
          <Route path="/privateoutsoon_10m" element={<PrivateOutSoon_10m />} />
          <Route
            path="/privateoutsoon_cancel"
            element={<PrivateOutSoon_cancel />}
          />
          <Route path="/parkingend" element={<ParkingEnd />} />

          {/* NFC / 개인용 타임선택 */}
          <Route path="/nfc" element={<NFCTagPage />} />
          <Route path="/pv/time-select" element={<PvTimeSelect />} />
          <Route path="/pub/time-select" element={<PubTimeSelect />} />

          {/* 길 안내 */}
          <Route path="/MapRoute" element={<MapRoute />} />
          {/* 필요하면 호환: <Route path="/map-route" element={<MapRoute />} /> */}

          {/* 결제 플로우 (대소문자 호환) */}
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
