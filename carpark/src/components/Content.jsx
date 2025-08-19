import React, { useMemo, useState } from "react";
import searchIcon from "../Assets/glasses.png";

/* ========= 임시 데이터 ========= */
const MOCK_PLACES = [
  {
    id: 1,
    name: "신림 주차장",
    distanceKm: 0.3,
    etaMin: 2,
    price: 1000,
    leavingSoon: false,
  },
  {
    id: 2,
    name: "서울역 주차장",
    distanceKm: 1.2,
    etaMin: 6,
    price: 2000,
    leavingSoon: true,
  },
  {
    id: 3,
    name: "강남 센터 주차장",
    distanceKm: 5.1,
    etaMin: 15,
    price: 5000,
    leavingSoon: false,
  },
  {
    id: 4,
    name: "잠실 롯데 주차장",
    distanceKm: 8.0,
    etaMin: 20,
    price: 8000,
    leavingSoon: false,
  },
];

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
  enableMock, // 외부에서 강제 목데이터 사용하고 싶을 때
}) {
  const [q, setQ] = useState("");

  // URL 쿼리로도 제어 가능: ?mock=1
  let mockFromQuery = false;
  try {
    const qs = new URLSearchParams(window.location.search);
    mockFromQuery = qs.get("mock") === "1";
  } catch {}

  // ✅ 목데이터 사용 조건
  const useMock =
    enableMock === true ||
    mockFromQuery ||
    (!isLoading && !errorMsg && (!places || places.length === 0));

  const data = useMock ? MOCK_PLACES : places;

  const filtered = useMemo(() => {
    const nq = norm(q);
    if (!nq) return data;

    const isChosungQuery = /^[ㄱ-ㅎ]+$/.test(q);
    return data.filter((p) => {
      const name = p?.name ?? "";
      const nname = norm(name);
      if (nname.includes(nq)) return true;
      if (isChosungQuery) {
        const nameCho = toChosung(nname);
        return nameCho.startsWith(q);
      }
      return false;
    });
  }, [q, data]);

  return (
    <div className="bs-body">
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
        <p className="bs-sub">
          {useMock
            ? "테스트용 목데이터입니다"
            : "현재 위치 기반으로 추천해드려요!"}
        </p>
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
        filtered.map((p) => (
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
                e.stopPropagation();
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
