import React, { useMemo, useState } from "react";
import NextBtn from "../../components/Register/NextBtn";
import { useNavigate } from "react-router-dom";
import "../../Styles/Register/Rg_PayPage.css";
import PreviousBtn from "../../components/Register/PreviousBtn";
import rg_backspace from "../../Assets/rg-backspace.svg";
import rg_location from "../../Assets/rg_location.svg";
import { useParkingForm } from "../../store/ParkingForm";
import { register } from "../../apis/register";

const rg_price = (n) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(n);

const RegisterPayPage = () => {
  const [digits, setDigits] = useState("0");
  const { address, setField } = useParkingForm();
  const amount = useMemo(() => Number(digits || "0"), [digits]);

  const navigate = useNavigate();
  const isActive = amount !== 0;

  const push = (d) => {
    const next = digits === "0" ? d : digits + d;
    if (next.replace(/^0+/, "").length > 7) return; // 최대 7자리
    const cleaned = next.replace(/^0+(?=\d)/, "");
    setDigits(cleaned || "0");
  };

  const back = () => {
    const next = digits.length <= 1 ? "0" : digits.slice(0, -1);
    setDigits(next);
  };

  const handleSubmit = async () => {
    if (!isActive) return;

    // ✅ 금액 저장
    setField("charge", amount);

    // ✅ 등록 호출
    try {
      const token = localStorage.getItem("accessToken") || "";
      await register(token);
      navigate("/complete");
    } catch (e) {
      alert(`[${e.status ?? "ERR"}] ${e.message}`);
      console.error("register failed:", e);
    }
  };

  const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  return (
    <div className="rg-pay-wrapper">
      <PreviousBtn />

      <div>
        <h1 className="rg-pay-title">주차 비용 설정</h1>
        <p className="rg-description">
          <span className="rg-desc-point">10분당 주차 비용</span>
          <span className="rg-desc">을 설정해주세요</span>
        </p>
      </div>

      <div>
        <p className="rg-pay">
          <span className="rg-ten">10분당</span>{" "}
          <span className="rg-charge">주차 금액</span>
        </p>
      </div>
      <div className="rg-won">
        {rg_price(amount)}
        <span>원</span>
      </div>

      <div className="rg-paypad" role="group" aria-label="숫자 패드">
        {keypad.slice(0, 9).map((k) => (
          <button
            className="rg-num-key"
            key={k}
            onClick={() => push(k)}
            aria-label={`${k}`}
          >
            {k}
          </button>
        ))}

        <div className="rg-spacer" aria-hidden="true" />
        <button className="rg-zero" onClick={() => push("0")} aria-label="0">
          0
        </button>
        <button className="rg-backspace" onClick={back} aria-label="지우기">
          <img src={rg_backspace} alt="" />
        </button>
      </div>

      {/* 평균 비용 풍선(원한다면 값 바인딩) */}
      <div className="rg-bubble-wrap">
        <div className="rg-bubble">
          <span className="rg-desc">주변 주차장 10분당 평균 비용은</span>
          <span className="rg-desc-charge" />
          <span className="rg-desc">원이에요!</span>
        </div>
        <div className="rg-bubble-bottom" />
      </div>

      <div className="rg-address-wrap">
        <img src={rg_location} alt="" />
        <span className="rg_address">{address}</span>
      </div>

      <NextBtn
        isActive={isActive}
        onClick={handleSubmit}
        className="rg-nextBtn"
      />
    </div>
  );
};

export default RegisterPayPage;
