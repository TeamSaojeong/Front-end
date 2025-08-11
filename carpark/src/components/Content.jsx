import React from "react";
import searchIcon from "../Assets/glasses.png";

//bs 는 bottom-sheet의 약자로 사용.

export default function Content() {
  return (
    <div className="bs-body">
      <div className="bs-search">
        <img className="bs-search-icon" src={searchIcon} alt="" />
        <input placeholder="장소 혹은 주소 검색" />
      </div>

      {/* 섹션 타이틀 */}
      <div className="bs-section">
        <h2 className="bs-title">지금 주차 가능한 곳</h2>
        <p className="bs-sub">현재 위치 기반으로 추천해드려요!</p>
      </div>

      {/* ★★★★임의 데이터 3개임. 여기 코드는 나중에 백에서 데이터 가져오는 코드로 수정해야됌★★★ */}
      {[1, 2, 3].map((i) => (
        <div className="bs-card" key={i}>
          <div className="bs-card-image" aria-hidden="true" />
          <div className="bs-info">
            <div className="bs-name">주차 장소 이름</div>
            <div className="bs-card-details">
              <span>24km</span>
              <span>|</span>
              <span>36분</span>
            </div>
            <div className="bs-price">₩ 0,000원</div>
          </div>
          <button className="bs-more">상세보기</button>
        </div>
      ))}

      {/* 하단 현 위치 */}
      <button className="bs-location">현 위치에서 다시 추천</button>
    </div>
  );
}
