import React from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Nfc/NFCTagPage.css";

import arrow from "../../Assets/arrow.png";
import nfc_icon from "../../Assets/nfc.svg";
import pin_icon from "../../Assets/pin.svg";
import PreviousBtn from "../../components/Register/PreviousBtn";

const NFCTagPage = () => {
  const navigate = useNavigate();

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
        <img src={nfc_icon} alt="nfc 아이콘" className="nfc-icon-img"/>
      </div>

      <div className="nfc-time-inner">
        <img src={pin_icon} alt="핀 아이콘" className="pin-icon" />
        <span className="nfc-time-text">주차 장소 api 가져오는 곳</span>
      </div>

      {/* 버튼 */}
        <button
          className="nfc-outsoon"
          onClick={() =>
            navigate("/MapRoute", {
              state: {
                //임의로 좌표 넣어놧음. 나중에 백엔드 값으로 교체
                dest: { lat: 37.579617, lng: 126.977041 }, //경복궁
                name: "주차 장소 이름",
              },
            })
          }
        >
          <span className="nfc-outsoon-text">
            경로 다시 보기
            </span>
          
        </button>

      
    </div>
  );
};

export default NFCTagPage;
