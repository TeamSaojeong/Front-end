import React from "react";
import searchIcon from "../Assets/glasses.png";

// bs = bottom-sheet
export default function Content({
  places = [],
  isLoading = false,
  errorMsg = "",
  onRefreshHere,
  onSelectPlace,
}) {
  return (
    <div className="bs-body">
      <div className="bs-search">
        <img className="bs-search-icon" src={searchIcon} alt="" />
        <input placeholder="장소 혹은 주소 검색" />
      </div>

      <div className="bs-section">
        <h2 className="bs-title">지금 주차 가능한 곳</h2>
        <p className="bs-sub">현재 위치 기반으로 추천해드려요!</p>
      </div>

      {isLoading && (
        <div style={{ padding: "8px 2px 12px", color: "#6b7280" }}>
          불러오는 중…
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: "8px 2px 12px", color: "#de5e56" }}>
          {errorMsg}
        </div>
      )}

      {!isLoading &&
        !errorMsg &&
        places.map((p) => (
          <div
            className="bs-card"
            key={p.id}
            role="button"
            onClick={() => onSelectPlace?.(p)}
          >
            <div className="bs-card-image" aria-hidden="true" />
            <div className="bs-info">
              <div className="bs-name">
                {p.name}
                {p.leavingSoon && <span className="bs-badge">곧 나감</span>}
              </div>
              <div className="bs-card-details">
                <span>{p.distanceKm ?? "—"}km</span>
                <span>|</span>
                <span>{p.etaMin ?? "—"}분</span>
              </div>
              <div className="bs-price">
                ₩ {(p.price ?? 0).toLocaleString()}원
              </div>
            </div>
            <button
              className="bs-more"
              onClick={(e) => {
                e.stopPropagation(); // 카드 onClick 중복 방지
                onSelectPlace?.(p);
              }}
            >
              상세보기
            </button>
          </div>
        ))}

      <button
        className="bs-location"
        onClick={onRefreshHere}
        disabled={isLoading}
        aria-busy={isLoading ? "true" : "false"}
      >
        {isLoading ? "추천 갱신 중…" : "현 위치에서 다시 추천"}
      </button>
    </div>
  );
}
