import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Start from "./pages/Start";
import NamePage from "./pages/Register/NamePage";
import DescriptionPage from "./pages/Register/DescriptionPage";
import Address from "./components/Register/Address";
import ZipCodePage from "./pages/Register/ZipCodePage";
import TimePage from "./pages/Register/TimePage";
import CompletePage from "./pages/Register/CompletePage";
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
          <Route path="/name" element={<NamePage />}/>
          <Route path="/description" element={<DescriptionPage />}/>
          <Route path="/address" element={<Address />}/>
          <Route path="zipcode" element={<ZipCodePage />}/>
          <Route path="/time" element={<TimePage/>}/>
          <Route path="/complete" element={<CompletePage/>}/>
        </Routes>
      </div>
    </div>
  );
};

export default App;
