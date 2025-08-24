import React from "react";
import "../Styles/ParkingCard.css"; // 아래 CSS
import moiimg from "../Assets/moiimg.svg"; // 한 곳에 모은 이미지 객체
import ai_location from "../Assets/ai_location.svg";
import ai_won from "../Assets/ai_won.svg";
const ParkingCard = ({
  name = "주차 장소 이름",
  address = "주차 장소 주소",
  fee = "0,000원",
  onDetail,
}) => {
  return (
    <div className="bs-card">
      {/* 썸네일 */}
      <div className="bs-card-image">
        {/* 필요 시 background-image */}
      </div>

      {/* 카드 정보 */}
      <div className="bs-info">
        {/* 주차장 이름 */}
        <div className="bs-name">{name}</div>

        {/* 주소 */}
        <div className="bs-card-details">
          <img src={ai_location} alt="" className="bs-target" />
          <span className="bs-card-details-text">{address}</span>
        </div>

        {/* 요금 */}
        <div className="bs-price confirmed">
          <img src={ai_won} alt="" className="bs-target" />
          <span>{fee}</span>
        </div>
      </div>

      {/* 상세보기 버튼 */}
      <button className="bs-more" onClick={onDetail}>
        상세보기
      </button>
    </div>
  );
}

export default ParkingCard;