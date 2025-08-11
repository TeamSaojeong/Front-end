import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Start from "./pages/Start";
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
        </Routes>
      </div>
    </div>
  );
};

export default App;
