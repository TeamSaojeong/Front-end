import React, { useMemo, useState } from "react";
import NextBtn from "../../components/Register/NextBtn";
import { useNavigate } from "react-router-dom";
import "../../Styles/Register/Rg_PayPage.css";
import PreviousBtn from "../../components/Register/PreviousBtn";
import rg_backspace from "../../Assets/rg-backspace.svg";
import rg_location from "../../Assets/rg_location.svg";
import { useParkingForm } from "../../store/ParkingForm";
import { register } from "../../apis/register";
import { useMyParkings } from "../../store/MyParkings";

// 금액 표시
const rg_price = (n) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(n);

export default function RegisterPayPage() {
  const navigate = useNavigate();

  const form = useParkingForm();
  const { address, operateTimes, name, setField } = form;

  const [digits, setDigits] = useState(() =>
    String(Math.max(0, Number(form.charge || 0)))
  );
  const amount = useMemo(() => Number(digits || "0"), [digits]);
  const isActive = amount !== 0;

  const push = (d) => {
    const next = digits === "0" ? d : digits + d;
    if (next.replace(/^0+/, "").length > 7) return; // 최대 9,999,999
    const cleaned = next.replace(/^0+(?=\d)/, "");
    setDigits(cleaned || "0");
  };
  const back = () => {
    const next = digits.length <= 1 ? "0" : digits.slice(0, -1);
    setDigits(next);
  };

  const addMine = useMyParkings((s) => s.upsert);

  const handleSubmit = async () => {
    if (!isActive) return;

    try {
      // 1) 스토어에 요금 반영
      setField("charge", amount);

      // 2) 서버 등록
      const token = localStorage.getItem("accessToken") || "";
      const resp = await register(token);

      // 3) 클라이언트 캐시에 내 주차장으로 반영(지도에 바로 뜨게)
      const created =
        resp?.data ??
        resp; /* 서버 응답 스키마 차이를 흡수 (parking_id, name …) */

      addMine({
        id: String(created?.parking_id ?? created?.id ?? name),
        origin: "server",
        enabled: true,
        name,
        address: form.address,
        charge: amount,
        // 좌표는 없을 수 있으니 추후 홈에서 지오코딩/보간
        lat: created?.lat ?? created?.y ?? null,
        lng: created?.lon ?? created?.x ?? null,
      });

      navigate("/complete");
    } catch (e) {
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        "주차 장소 등록에 실패했습니다.";
      alert(msg);
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

      {/* (선택) 평균 비용 안내는 나중에 API 붙이면 채우면 됩니다 */}
      <div className="rg-bubble-wrap">
        <div className="rg-bubble">
          <span className="rg-desc">주변 주차장 10분당 평균 비용은</span>
          <span className="rg-desc-charge"></span>
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
}
