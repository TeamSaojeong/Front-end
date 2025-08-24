import React, { useState, useMemo } from "react";
import PreviousBtn from "../components/Register/PreviousBtn";
import AISearch from "../components/AISearch";
import Keyword from "../components/Keyword";
import "../Styles/AIPredict.css"; 
import NextBtn from "../components/Register/NextBtn";
import { useNavigate } from "react-router-dom";
import TimeWheel from "../components/TimeWheel";
import ai_time from "../Assets/ai_time.svg";

const pad2 = (n) => String(n).padStart(2, "0");
const to24 = ({ ampm, h12, m }) =>
  `${pad2((h12 % 12) + (ampm === "오후" ? 12 : 0))}:${pad2(m)}`;

const AIPredict = () => {
  const navigate = useNavigate();

  const [time, setTime] = useState({ ampm: "오전", h12: 1, m: 0 });
  const [name, setName] = useState("");
  const [address, setAddress] = useState(""); // 선택된 주소
  const [lat, setLAT] = useState(null);
  const [lon, setLon] = useState(null);

  const label = useMemo(() => to24(time), [time]);

  const timeValid =
    ["오전", "오후"].includes(time.ampm) &&
    Number.isInteger(time.h12) &&
    time.h12 >= 1 &&
    time.h12 <= 12 &&
    [0, 10, 20, 30, 40, 50].includes(time.m);

  const addrValid = !!address?.trim();
  const isActive = timeValid && !!name?.trim() && !!lat && !!lon;

  const handleNext = () => {
    if (!isActive) return;
    navigate("/airesult", {
      state: { 
        arrival: label, //HH:MM
        address,
        name,
        lat,
        lon,
       }, // 주소 같이 전달
    });
  };

  return (
    <div className="ai-wrap">
      <PreviousBtn />

      <h1 className="ai-title">AI 주차 예보</h1>
      <p className="ai-desc">
        장소와 시간을 입력하면,
        <br />그 주변 구역의 주차 혼잡도를 미리 알려드립니다!
      </p>

      <div>
        <p className="ai-name">주차 장소 이름</p>

        <Keyword 
          value={name}
          onSelect={({name, address: addr, lat:y, lon: x}) =>{
            setName(name || "");
            setAddress(addr || "");
            setLAT(y ?? null);
            setLon(x ?? null);
          }}
        />
      </div>

      <div className="ai-time-wrap">
        <div className="ai-time">
          <img src={ai_time} className="ai-time-img" alt="" />
          <span className="ai-picked">{label}</span>
        </div>

        <TimeWheel value={time} onChange={setTime} ariaLabelPrefix="예보" />
      </div>

      <NextBtn
        onClick={handleNext}
        className="ai-next"
        isActive={isActive} // Next 활성/비활성
      />
    </div>
  );
};

export default AIPredict;