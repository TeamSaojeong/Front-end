import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PreviousBtn from "../components/Register/PreviousBtn";
import NextBtn from "../components/Register/NextBtn";
import TimeWheel from "../components/TimeWheel";
import "../Styles/AIPredict.css";

const AIPredict = () => {
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState("18:00");
  const [address, setAddress] = useState("");
  const [locationData, setLocationData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleAddressSearch = async () => {
    if (!address.trim()) {
      alert("주소를 입력해주세요.");
      return;
    }

    setIsSearching(true);
    try {
      // 카카오 주소 검색 API 호출
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
        {
          headers: {
            Authorization: `KakaoAK ${process.env.REACT_APP_KAKAO_REST_API_KEY || 'your-kakao-api-key'}`
          }
        }
      );

      const data = await response.json();
      
      if (data.documents && data.documents.length > 0) {
        const firstResult = data.documents[0];
        setLocationData({
          lat: parseFloat(firstResult.y),
          lng: parseFloat(firstResult.x),
          address: firstResult.address_name
        });
        setAddress(firstResult.address_name);
        console.log('주소 검색 결과:', firstResult);
      } else {
        alert("주소를 찾을 수 없습니다. 다시 입력해주세요.");
      }
    } catch (error) {
      console.error('주소 검색 실패:', error);
      alert("주소 검색에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleNext = () => {
    if (!address.trim()) {
      alert("주소를 입력해주세요.");
      return;
    }

    if (!locationData) {
      alert("주소를 검색해주세요.");
      return;
    }

    // AIResult로 이동
    navigate("/airesult", {
      state: {
        selectedTime,
        address,
        locationData
      }
    });
  };

  return (
    <div className="aipredict-wrap">
      <PreviousBtn />
      
      <div className="ap-header">
        <h1 className="ap-title">AI 주차 혼잡도 예측</h1>
        <p className="ap-subtitle">
          도착할 장소와 시간을 알려주시면<br />
          AI가 주차 혼잡도를 예측해드려요
        </p>
      </div>

      <div className="ap-content">
        {/* 주소 입력 */}
        <div className="ap-section">
          <h2 className="ap-section-title">도착할 장소</h2>
          <div className="ap-address-input">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="주소를 입력해주세요"
              className="ap-input"
            />
            <button
              onClick={handleAddressSearch}
              disabled={isSearching}
              className="ap-search-btn"
            >
              {isSearching ? "검색 중..." : "검색"}
            </button>
          </div>
          {locationData && (
            <div className="ap-address-result">
              <span className="ap-address-text">✓ {locationData.address}</span>
            </div>
          )}
        </div>

        {/* 시간 선택 */}
        <div className="ap-section">
          <h2 className="ap-section-title">도착할 시간</h2>
          <div className="ap-time-selector">
            <TimeWheel
              selectedTime={selectedTime}
              onTimeChange={setSelectedTime}
            />
          </div>
        </div>
      </div>

      <div className="ap-footer">
        <NextBtn
          label="AI 예측 시작"
          onClick={handleNext}
          disabled={!locationData}
        />
      </div>
    </div>
  );
};

export default AIPredict;
