import React from "react";
import "../Styles/ParkingCard.css";                 // ⬅️ 아래 CSS
import moiimg from "../Assets/moiimg.svg";    // ⬅️ (선택) 한 곳에 모은 이미지 객체
import ai_location from "../Assets/ai_location.svg";
import ai_won from "../Assets/ai_won.svg";
export default function FrameCard({
  name ="주차 장소 이름",
  address = "주차 장소 주소",
  fee = "0,000원",
  onDetail,
}) {
  return (
    <div className="frame">
      {/* 썸네일 박스 */}
      <div className="view-wrapper">
        {/* 필요하면 background-image로 썸네일 넣기 */}
        <div className="view" />
      </div>

      {/* 주차 장소 이름 */}
      <div className="ai-text-wrapper">{name}</div>

      {/* 상세보기 */}
      <button type="button" className="frame-wrapper" onClick={onDetail}>
        <div className="div-wrapper">
          <div className="div">상세보기</div>
        </div>
      </button>

      {/* 주소 */}
      <div className="div-2">
        <div className="pepicons-pencil-map" aria-hidden>
          <div className="group">
            <div className="overlap-group">
              {/* 아이콘 3겹 (간단히 대체 가능) */}
              <img className="ai-img" alt="" src={ai_location} />
            </div>
          </div>
        </div>
        <div className="text-wrapper-2">{address}</div>
      </div>

      {/* 요금 */}
      <div className="div-3">
        <img className="ai-img" alt="" src={ai_won} />
        <div className="text-wrapper-3">{fee}</div>
      </div>
    </div>
  );
}