import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../Styles/Nfc/NFCTagPage.css";

import arrow from "../../Assets/arrow.png";
import nfc_icon from "../../Assets/Vector.svg";
import pin_icon from "../../Assets/pin.svg";
import PreviousBtn from "../../components/Register/PreviousBtn";

const NFCTagPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [parkingInfo, setParkingInfo] = useState(null);

  useEffect(() => {
    console.log('[NFCTagPage] 정보 로드 시작 (모바일 환경)');
    
    // 1. location.state에서 받기 (PvPlaceDetail에서 전달)
    let info = location.state;
    console.log('[NFCTagPage] location.state:', info);
    
    // 2. sessionStorage에서 백업 정보 받기 (모바일에서 중요)
    if (!info) {
      try {
        const saved = sessionStorage.getItem('nfcParkingInfo');
        console.log('[NFCTagPage] sessionStorage raw:', saved);
        if (saved) {
          info = JSON.parse(saved);
          console.log('[NFCTagPage] sessionStorage에서 불러온 정보:', info);
        }
      } catch (error) {
        console.error('[NFCTagPage] sessionStorage 로드 실패:', error);
      }
    }
    
    // 3. localStorage에서도 백업 확인 (모바일 추가 보완)
    if (!info) {
      try {
        const backup = localStorage.getItem('lastNfcParkingInfo');
        if (backup) {
          info = JSON.parse(backup);
          console.log('[NFCTagPage] localStorage 백업 사용:', info);
        }
      } catch (error) {
        console.error('[NFCTagPage] localStorage 로드 실패:', error);
      }
    }
    
    // 4. 모바일에서 URL 파라미터도 확인
    const urlParams = new URLSearchParams(window.location.search);
    const placeIdFromUrl = urlParams.get('placeId');
    if (!info && placeIdFromUrl) {
      console.log('[NFCTagPage] URL에서 placeId 발견:', placeIdFromUrl);
      // 기본 정보라도 설정
      info = {
        id: placeIdFromUrl,
        name: "주차장",
        isPrivate: true
      };
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
      <PreviousBtn />
      
        <div className="nfc-text">
          <h1 className="nfc-title">NFC 태그</h1>
          
          <p className="nfc-sub">
            주차 장소에 도착하시고,
            <br />
            NFC 태그에 휴대폰을 가까이 대주세요.
          </p>
        </div>

      <div className="nfc-section">
        <img src={nfc_icon} alt="nfc 아이콘" className="nfc-icon-img" />
        
        
        
        
        
        
      <div className="nfc-time-box">
        <div className="nfc-time-inner">
          <img src={pin_icon} alt="핀 아이콘" className="pin-icon" />
          <span className="nfc-time-text">
            {parkingInfo ? parkingInfo.name : "주차장 정보를 불러오는 중..."}
          </span>
        </div>
      </div>
      {/* 버튼 */}
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
          <span className="nfc-outsoon-text">
            경로 다시 보기
            </span>
          
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
