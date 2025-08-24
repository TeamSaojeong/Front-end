import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import PreviousBtn from "../components/Register/PreviousBtn";
import ai_time from "../Assets/ai_time.svg";
import { fetchParkingPrediction } from "../apis/aipredict";
import emoji_s from "../Assets/emoji_s.svg";
import emoji_t from "../Assets/emoji_t.svg";
import "../Styles/AIResult.css";
import NextBtn from "../components/Register/NextBtn";
import ParkingCard from "../components/ParkingCard";

function formatKoreanTime(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return "시간 정보 없음";
  let [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  let ampm = "오전";
  if (h >= 12) {
    ampm = "오후";
    if (h > 12) h -= 12;
  }
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
      lineHeight: "34px", // 141.667%
      letterSpacing: "-0.6px",
    },
    emoji: emoji_s, // ✅ 경로 자체를 값으로
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
    emoji: emoji_t, // ✅
    sub: "대신, 주변에 여유로운 구역의 <br/>주차 장소를 추천해드릴게요.",
  },
};

const AIResult = () => {
  const { state } = useLocation();
  const selectedTime = state?.selectedTime || ""; // "HH:MM"
  const address = state?.address || "";
  const locationData = state?.locationData || null; // ✅ 좌표 정보
  
  const [loading, setLoading] = useState(true);
  const [predictionData, setPredictionData] = useState(null);
  const [error, setError] = useState("");

  const timeLabel = formatKoreanTime(selectedTime);

  // AI 예측 API 호출
  useEffect(() => {
    const fetchPrediction = async () => {
      if (!address || !selectedTime) {
        setError("주소 또는 시간 정보가 없습니다.");
        setLoading(false);
        return;
      }

      if (!locationData || !locationData.lat || !locationData.lng) {
        setError("위치 좌표 정보가 없습니다. 주소를 다시 선택해주세요.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        console.log('[AIResult] 검색 위치 기준 예측:', {
          address,
          coordinates: locationData,
          selectedTime
        });
        
        // 검색한 위치의 좌표 사용
        const payload = {
          lat: locationData.lat, // ✅ 검색한 위치의 위도
          lon: locationData.lng, // ✅ 검색한 위치의 경도
          arrival: `2025-08-18T${selectedTime}:00`, // 도착 시간
          radius: 1.0, // 1km 반경
          top_k: 15,
          exact_radius: true,
          list_mode: true,
          sort_by: "score",
          fill_external: true,
          use_places: true
        };

        const result = await fetchParkingPrediction(payload);
        setPredictionData(result);
        
        console.log('[AIResult] 예측 결과 수신:', result);
        
      } catch (err) {
        console.error('[AIResult] 예측 실패:', err);
        setError(`AI 예측 요청에 실패했습니다: ${err.message || '알 수 없는 오류'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [address, selectedTime, locationData]);

  // 로딩 중
  if (loading) {
    return (
      <div className="airesult-wrap">
        <PreviousBtn />
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>AI가 주차 혼잡도를 예측하고 있어요...</p>
        </div>
      </div>
    );
  }

  // 오류 발생
  if (error) {
    return (
      <div className="airesult-wrap">
        <PreviousBtn />
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // 예측 결과 사용
  const first = predictionData?.items?.[0];
  const msg = levelMessages[first?.pred_level] || levelMessages["여유"];

  return (
    <div className="airesult-wrap">
      <PreviousBtn />

      <div className="ar-time-wrap">
        <span className="ar-time">{timeLabel}</span>
        <span className="ar-time-selected">
          <img src={ai_time} className="ar-time-img" alt="" />
          <span className="ar-picked">{selectedTime}</span>
        </span>
      </div>

      <div className="ar-address">{address}</div>

      {/* 혼잡도 문구: 가운데만 색상, 이모지는 이미지로 */}
      <p className="ar-pred-title" style={msg.typography}>
        주차가{" "}
        <span className="ar-pred-title-text" style={{ color: msg.color }}>
          {msg.title.replace("주차가 ", "")}
        </span>{" "}
        <img
          src={msg.emoji}
          alt=""
          style={{ width: 32, height: 32, verticalAlign: "middle" }}
        />
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

      <NextBtn className="ar-next" label="확인" />
    </div>
  );
};

export default AIResult;
