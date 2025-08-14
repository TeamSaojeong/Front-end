import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Start from "./pages/Start";
import OutSoon from "./pages/OutSoon";
import OutSoon_10m from "./pages/OutSoon_10m";
import OutSoon_cancel from "./pages/OutSoon_cancel";
import PrivateOutSoon from "./pages/PrivateOutSoon";
import PrivateOutSoon_10m from "./pages/PrivateOutSoon_10m";
import PrivateOutSoon_cancel from "./pages/PrivateOutSoon_cancel";
import "./Styles/app-frame.css";

const App = () => {
  return (
    <div className="app-outer">
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/outsoon" element={<OutSoon />} />
          <Route path="/outsoon_10m" element={<OutSoon_10m />} />
          <Route path="/outsoon_cancel" element={<OutSoon_cancel />} />
          <Route path="/privateoutsoon" element={<PrivateOutSoon />} />
          <Route path="/privateoutsoon_10m" element={<PrivateOutSoon_10m />} />
          <Route path="/outsoon_cancel" element={<PrivateOutSoon_cancel />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
