import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Pay/PayLoading.css";

import sandtimer from "../../Assets/sandtimer.svg";
import phlogo from "../../Assets/phlogo.png";

export default function PayLoading() {
  const navigate = useNavigate();

  useEffect(() => {
    const img1 = new Image();
    img1.src = sandtimer;
    const img2 = new Image();
    img2.src = phlogo;

    const t = setTimeout(() => {
      navigate("/paycomplete", { replace: true });
    }, 3000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="payloading">
      <div className="payloading__center">
        <img src={sandtimer} alt="결제 진행중" className="payloading__icon" />
        <div className="payloading__title">서비스 결제 중</div>
        <div className="payloading__subtitle">잠시만 기다려주세요 :)</div>
      </div>
      <div className="payloading__bottom">
        <p>주차까지, 가장 간단한 방법</p>
        <img src={phlogo} alt="PARK HERE" />
      </div>
    </div>
  );
}
