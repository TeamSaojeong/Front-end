import React, { useMemo, useState } from "react";
import searchIcon from "../Assets/glasses.png";
import ai_location from "../Assets/ai_location.svg";
import money from "../Assets/money.svg";

/* ========= 초성 검색 유틸 ========= */
const CHO_LIST = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const norm = (s = "") => String(s).toLowerCase().replace(/\s+/g, "");
function toChosung(str = "") {
  let out = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = Math.floor((code - 0xac00) / 588);
      out += CHO_LIST[idx] || ch;
    } else {
      out += ch;
    }
  }
  return out;
}

export default function Content({
  places = [],
  isLoading = false,
  errorMsg = "",
  onRefreshHere,
  onSelectPlace,
}) {
  const [q, setQ] = useState("");

  // 검색(초성/일반)
  const filtered = useMemo(() => {
    const nq = norm(q);
    if (!nq) return places;
    const isChosungQuery = /^[ㄱ-ㅎ]+$/.test(q);
    return places.filter((p) => {
      const name = p?.name ?? "";
      const nname = norm(name);
      if (nname.includes(nq)) return true;
      if (isChosungQuery) {
        const nameCho = toChosung(nname);
        return nameCho.startsWith(q);
      }
      return false;
    });
  }, [q, places]);

  const showEmpty =
    !isLoading && !errorMsg && Array.isArray(places) && places.length === 0;

  return (
    <div className="bs-body">
      {/* 검색 */}
      <div className="bs-search">
        <img className="bs-search-icon" src={searchIcon} alt="" />
        <input
          placeholder="장소 혹은 주소 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
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

      {/* 결과 카드 */}
      {!isLoading &&
        !errorMsg &&
        filtered.map((p) => (
          <div
            className="bs-card"
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectPlace?.(p)}
            onKeyDown={(e) => e.key === "Enter" && onSelectPlace?.(p)}
          >
            <div className="bs-card-image" aria-hidden="true" />
            <div className="bs-info">
              <div className="bs-name">
                {p.name}
                {p.leavingSoon && <span className="bs-badge">곧 나감</span>}
              </div>
              <div className="bs-card-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img src={ai_location} alt="위치" style={{ width: '12px', height: '12px' }} />
                  <span>{p.distanceKm ?? "—"}km</span>
                </div>
              </div>
              <div className="bs-price" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img src={money} alt="요금" style={{ width: '12px', height: '12px' }} />
                <span>
                  {p.price == null || Number.isNaN(Number(p.price)) || Number(p.price) === 0
                    ? "P"
                    : `₩ ${Number(p.price).toLocaleString()}원`}
                </span>
              </div>
            </div>
            <button
              className="bs-more"
              onClick={(e) => {
                e.stopPropagation();
                onSelectPlace?.(p);
              }}
            >
              상세보기
            </button>
          </div>
        ))}

      {/* 빈 상태 */}
      {showEmpty && (
        <div style={{ padding: "4px 2px 12px", color: "#6b7280" }}>
          주변에 추천할 주차장이 없어요. 아래 버튼으로 현 위치에서 다시 추천을
          받아보세요.
        </div>
      )}

      {/* 현 위치 재검색 */}
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
