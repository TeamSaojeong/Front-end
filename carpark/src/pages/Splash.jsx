import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Splash.css";

import plogo from "../Assets/plogo.svg";
import phlogo from "../Assets/phlogo.svg";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const img1 = new Image();
    img1.src = plogo;
    const img2 = new Image();
    img2.src = phlogo;

    const t = setTimeout(() => {
      navigate("/start", { replace: true });
    }, 2000);

    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="splash">
      <img src={plogo} alt="PARK HERE P logo" className="splash__center" />
      <img src={phlogo} alt="PARK HERE wordmark" className="splash__bottom" />
    </div>
  );
}
