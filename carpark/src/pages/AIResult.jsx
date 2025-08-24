import { useLocation, useNavigate } from "react-router-dom";
import React, {useEffect} from "react";
import PreviousBtn from "../components/Register/PreviousBtn";
import ai_time from "../Assets/ai_time.svg";
import { mockApiResponse } from "../apis/mockApiResponse";
import emoji_s from "../Assets/emoji_s.svg";
import emoji_t from "../Assets/emoji_t.svg";
import "../Styles/AIResult.css";
import NextBtn from "../components/Register/NextBtn";
import ParkingCard from "../components/ParkingCard";
import ai_location2 from "../Assets/ai_location2.svg";
import "../Styles/BottomSheet.css";

export function formatKoreanTime (hhmm){
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return "시간 정보 없음";
  let [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  let ampm = "오전";
  if (h >= 12) { ampm = "오후"; if (h > 12) h -= 12; }
  if (h === 0) h = 12;
  return `${ampm} ${h}시 ${m}분`;
}

const levelMessages = {
  여유: {
    title: "주차가 여유로울 가능성이 높아요",
    color: "#1DD871",
    typography: {
        fontFamily: "Pretendard",
      fontSize: "24px",
      fontStyle: "normal",
      fontWeight: 600,
      lineHeight: "34px",      // 141.667%
      letterSpacing: "-0.6px",
    },
    emoji: emoji_s, // 경로 자체를 값으로
    sub: "좋은 소식이에요! <br/>가까운 주차 장소를 추천해드릴게요.",
  },
  혼잡: {
    title: "주차가 혼잡할 확률이 높아요",
    color: "#DE5E56",
    typography: {
      fontFamily: "Pretendard",
      fontSize: "24px",
      fontStyle: "normal",
      fontWeight: 600,
      lineHeight: "34px",
      letterSpacing: "-0.6px",
    },
    emoji: emoji_t, 
    sub: "대신, 주변에 여유로운 구역의 <br/>주차 장소를 추천해드릴게요.",
  },
};

const AIResult = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const arrival = state?.arrival ?? state?.selectedTime ?? ""; //HH:MM
  const name = state?.name ?? ""; //장소 이름
  const address = state?.address || "주소 없음"; //주소
  const lat = state?.lat ?? null;
  const lon = state?.lon ?? null; // 경도

  const timeLabel = formatKoreanTime(arrival);

  // 모의 응답에서 첫 번째 결과 사용
  const first = mockApiResponse.items?.[0];
  const msg =
    levelMessages[first?.pred_level] || levelMessages["여유"]; // 안전한 fallback
  
  return (
    <div className="airesult-wrap">
      <PreviousBtn />

      <div className="ar-time-wrap">
        <span className="ar-time">{timeLabel}</span>
        <span className="ar-time-selected">
          <img src={ai_time} className="ar-time-img" alt="" />
          <span className="ar-picked">{arrival || "--:--"}</span>
        </span>
      </div>

    <div className="ar-address-wrap">
      <span className="ar-address">{name || "장소 미선택"}</span>
      <span className="ar-address-selected">
          <img src={ai_location2} className="ar-address-img" alt="" />
          <span className="ar-picked">{address || "주소 없음"}</span>
        </span>
    </div>

      {/* 혼잡도 문구: 가운데만 색상, 이모지는 이미지로 */}
      <p className="ar-pred-title" style={msg.typography}>
        주차가{" "}
        <span className="ar-pred-title-text"style={{ color: msg.color }}>
          {msg.title.replace("주차가 ", "")}
        </span>{" "}
        <img src={msg.emoji} alt="" style={{ width: 32, height: 32, verticalAlign: "middle" }} />
      </p>
      <p className="ar-pred-sub"> 
        {msg.sub //줄바꿈
        .split(/<br\s*\/?>/i)
        .map((chunk, i, arr) => (
            <>
            {chunk.trim()}
            {i < arr.length - 1 && <br />}
            </>
  ))}
            </p>
            

      {/* 리스트 예시 */}
      <ParkingCard />

      <NextBtn className="ar-next" label="확인"/>
    </div>
  );
};

export default AIResult;