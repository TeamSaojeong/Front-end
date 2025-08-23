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
    console.log('NFCTagPage 정보 로드 시작');
    
    // 1. location.state에서 받기 (PvPlaceDetail에서 전달)
    let info = location.state;
    console.log('location.state:', info);
    
    // 2. sessionStorage에서 백업 정보 받기
    if (!info) {
      try {
        const saved = sessionStorage.getItem('nfcParkingInfo');
        if (saved) {
          info = JSON.parse(saved);
          console.log('sessionStorage에서 불러온 정보:', info);
        }
      } catch (error) {
        console.error('sessionStorage 로드 실패:', error);
      }
    }
    
    if (info) {
      // 주차장 이름 추출 (다양한 필드명 지원)
      const parkingName = info.name || info.placeName || info.parkingName || "주차 장소";
      
      const processedInfo = {
        id: info.id || info.placeId,
        name: parkingName,
        address: info.address || "",
        availableTimes: info.availableTimes || info.openRangesText || "",
        isPrivate: info.isPrivate !== false, // 기본값 true
        lat: info.lat,
        lng: info.lng,
        charge: info.charge || info.pricePer10Min || 0
      };
      
      console.log('처리된 주차장 정보:', processedInfo);
      console.log('주차장 이름:', parkingName);
      setParkingInfo(processedInfo);
    } else {
      console.warn('주차장 정보를 찾을 수 없습니다');
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
            {parkingInfo ? parkingInfo.name : "주차장 정보를 불러오는 중..."}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NFCTagPage;
