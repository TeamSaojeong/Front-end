import React from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Nfc/NFCTagPage.css";

import arrow from "../../Assets/arrow.png";
import nfc_icon from "../../Assets/Nfc.svg";
import pin_icon from "../../Assets/pin.svg";

const NFCTagPage = () => {
  const navigate = useNavigate();

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
          경로 다시보기
        </button>
      </div>

      <div className="nfc-time-box">
        <div className="nfc-time-inner">
          <img src={pin_icon} alt="핀 아이콘" className="pin-icon" />
          <span className="nfc-time-text">주차 장소 api 가져오는 곳</span>
        </div>
      </div>
    </div>
  );
};

export default NFCTagPage;
