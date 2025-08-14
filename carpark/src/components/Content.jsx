import React from "react";
import searchIcon from "../Assets/glasses.png";

//bs 는 bottom-sheet의 약자
export default function Content({ places = [] }) {
  return (
    <div className="bs-body">
      <div className="bs-search">
        <img className="bs-search-icon" src={searchIcon} alt="" />
        <input placeholder="장소 혹은 주소 검색" />
      </div>

      {/*섹션 타이틀 */}
      <div className="bs-section">
        <h2 className="bs-title">지금 주차 가능한 곳</h2>
        <p className="bs-sub">현재 위치 기반으로 추천해드려요!</p>
      </div>

      {/*Home에서 받은 places를 렌더링하는 부분 */}
      {places.map((p) => (
        <div className="bs-card" key={p.id}>
          <div className="bs-card-image" aria-hidden="true" />
          <div className="bs-info">
            <div className="bs-name">{p.name}</div>
            <div className="bs-card-details">
              <span>{p.distanceKm}km</span>
              <span>|</span>
              <span>{p.etaMin}분</span>
            </div>
            <div className="bs-price">₩ {p.price.toLocaleString()}원</div>
          </div>
          <button className="bs-more">상세보기</button>
        </div>
      ))}

      <button className="bs-location">현 위치에서 다시 추천</button>
    </div>
  );
}
