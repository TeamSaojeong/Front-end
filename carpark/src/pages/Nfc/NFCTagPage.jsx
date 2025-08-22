import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../Styles/Nfc/NFCTagPage.css";

import arrow from "../../Assets/arrow.png";
import nfc_icon from "../../Assets/Nfc.svg";
import pin_icon from "../../Assets/pin.svg";

const NFCTagPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [parkingInfo, setParkingInfo] = useState(null);

  useEffect(() => {
    // PvPlaceDetail에서 전달된 주차장 정보 받기
    const info = location.state;
    console.log('NFCTagPage 받은 정보:', info);
    
    if (info) {
      console.log('주차장 이름:', info.placeName);
      setParkingInfo(info);
      // NFC 태그용 정보를 sessionStorage에 저장
      sessionStorage.setItem('nfcParkingInfo', JSON.stringify({
        placeId: info.placeId,
        placeName: info.placeName,
        address: info.address,
        openRangesText: info.openRangesText,
        isLocal: info.isLocal,
        lat: info.lat,
        lng: info.lng,
        pricePer10Min: info.pricePer10Min || 800 // 기본값
      }));
    } else {
      // sessionStorage에서 기존 정보 불러오기
      try {
        const saved = sessionStorage.getItem('nfcParkingInfo');
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('sessionStorage에서 불러온 정보:', parsed);
          setParkingInfo(parsed);
        }
      } catch (error) {
        console.error('주차장 정보 로드 실패:', error);
      }
    }
  }, [location.state]);

  return (
    <div className="nfc-container">
      <div className="nfc-header">
        <img
          src={arrow}
          alt="뒤로가기"
          className="back-arrow"
          onClick={() => navigate(-1)}
        />
        <div className="nfc-text">
          NFC 태그
          <br />
          <p>
            주차 장소에 도착하시고,
            <br />
            NFC 태그에 휴대폰을 가까이 대주세요.
          </p>
        </div>
      </div>

      <div className="nfc-section">
        <img src={nfc_icon} alt="nfc 아이콘" />
      </div>

      {/* 버튼 */}
      <div className="nfc-button-section">
        <button
          className="nfc-outsoon"
          onClick={() => {
            if (parkingInfo) {
              navigate("/MapRoute", {
                state: {
                  dest: { lat: parkingInfo.lat, lng: parkingInfo.lng },
                  name: parkingInfo.placeName,
                  address: parkingInfo.address,
                  placeId: parkingInfo.placeId,
                  isPrivate: parkingInfo.isLocal,
                },
              });
            } else {
              alert("주차장 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            }
          }}
        >
          경로 다시보기
        </button>
      </div>

      <div className="nfc-time-box">
        <div className="nfc-time-inner">
          <img src={pin_icon} alt="핀 아이콘" className="pin-icon" />
          <span className="nfc-time-text">
            {parkingInfo ? parkingInfo.placeName : "주차장 정보를 불러오는 중..."}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NFCTagPage;
