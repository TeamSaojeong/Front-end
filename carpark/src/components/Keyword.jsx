// src/components/map/KakaoKeywordSearch.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "../Styles/Keyword.css";
import aisearch from "../Assets/aisearch.svg";

// 간단 디바운스 유틸
const useDebounced = (value, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

export default function KakaoKeywordSearch() {
  // 입력/검색 상태
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState(""); // 실제 검색에 사용
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // 자동완성(관련 검색어)
  const [suggestions, setSuggestions] = useState([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const debouncedInput = useDebounced(searchInput, 300);

  // 페이지네이션
  const paginationRef = useRef(null);

  const onSubmit = (e) => {
    e.preventDefault();
    const q = (searchInput || "").trim();
    if (!q) return;
    // 제안 패널 닫고 실제 검색
    setOpenSuggest(false);
    setKeyword(q);
  };

  const doSearch = useCallback(
    (page) => {
      if (!window.kakao?.maps?.services) {
        // setStatusMsg("Kakao services를 불러오지 못했습니다.");
        return;
      }
      const q = (keyword || "").trim();
      if (!q) {
        setPlaces([]);
        setStatusMsg("");
        paginationRef.current = null;
        return;
      }

      setIsLoading(true);
      setStatusMsg("");

      const ps = new window.kakao.maps.services.Places();

      const callback = (data, status, pagination) => {
        setIsLoading(false);
        if (status === window.kakao.maps.services.Status.OK) {
          setPlaces(data || []);
          paginationRef.current = pagination;
          setStatusMsg("");
        } 
        else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setPlaces([]);
          paginationRef.current = null;
          setStatusMsg("검색 결과가 없습니다.");
        } else {
          setPlaces([]);
          paginationRef.current = null;
          setStatusMsg("검색 중 오류가 발생했습니다.");
        }
      };

      if (page && paginationRef.current?.setPage) {
        paginationRef.current.setPage(page);
      } else {
        ps.keywordSearch(q, callback);
      }
    },
    [keyword]
  );

  // keyword 변경 시 본 검색 수행
  useEffect(() => {
    doSearch();
  }, [doSearch]);

  // 입력 내용이 바뀔 때마다 자동완성(관련 검색어) 호출
  useEffect(() => {
    if (!window.kakao?.maps?.services) return;
    const q = (debouncedInput || "").trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(q, (data, status) => {
      if (status !== window.kakao.maps.services.Status.OK) {
        setSuggestions([]);
        return;
      }
      // 상위 4개만 관련 검색어로 사용 (place_name)
      const items = (data || []).slice(0, 4).map((d) => d.place_name);
      setSuggestions(items);
    });
  }, [debouncedInput]);

  // 페이지네이션 렌더
  const renderPagination = () => {
    const p = paginationRef.current;
    if (!p) return null;

    const goPage = (n) => {
      if (!p?.setPage) return;
      const next = Math.max(1, Math.min(p.last, n));
      p.setPage(next);
    };

    const items = [];
    for (let i = 1; i <= p.last; i += 1) {
      const isCurrent = i === p.current;
      items.push(
        <button
          key={i}
          type="button"
          disabled={isCurrent}
          onClick={() => goPage(i)}
          className={`kkm-page ${isCurrent ? "is-current" : ""}`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="kkm-pages">
        <button
          type="button"
          onClick={() => goPage(p.current - 1)}
          disabled={p.current === 1}
          className="kkm-page-nav"
        >
          이전
        </button>
        {items}
        <button
          type="button"
          onClick={() => goPage(p.current + 1)}
          disabled={p.current === p.last}
          className="kkm-page-nav"
        >
          다음
        </button>
      </div>
    );
  };

  return (
    <div>
      {/* 검색 필드 */}
      <form className="kkm-search" onSubmit={onSubmit}>
        <span className="kkm-ico" aria-hidden>
         <img src={aisearch} />
        </span>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onFocus={() => setOpenSuggest(true)}
          placeholder="장소 혹은 주소 검색"
          className="kkm-input"
          aria-autocomplete="list"
          aria-expanded={openSuggest}
        />
        {/* submit 버튼은 숨김(모바일 키보드용 enter 제출) */}
        <button type="submit" className="kkm-hidden-submit" aria-hidden />
      </form>

      {/* 관련 검색어 패널 */}
      {openSuggest && suggestions.length > 0 && (
        <div
          className="kkm-suggest"
          onMouseDown={(e) => e.preventDefault()} // 클릭 시 input 블러 방지
        >
          {suggestions.map((s, i) => (
            <button
              key={`${s}-${i}`}
              type="button"
              className="kkm-suggest-item"
              onClick={() => {
                setSearchInput(s);
                setOpenSuggest(false);
                setKeyword(s); // 제안 선택 즉시 본 검색
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 결과 리스트 */}
      <div className="kkm-list">
        {isLoading && <div className="kkm-empty">검색 중…</div>}
        {!isLoading && statusMsg && <div className="kkm-empty">{statusMsg}</div>}
        {!isLoading && !statusMsg && places.length > 0 && (
          <ul className="kkm-ul">
            {places.map((p, idx) => (
              <li key={`${p.id}-${idx}`} className="kkm-li">
                <div className="kkm-li-no">{idx + 1}</div>
                <div className="kkm-li-body">
                  <div className="kkm-li-name">{p.place_name}</div>
                  <div className="kkm-li-addr">
                    {p.road_address_name || p.address_name}
                  </div>
                  {p.phone && <div className="kkm-li-sub">{p.phone}</div>}
                  {p.place_url && (
                    <a
                      href={p.place_url}
                      target="_blank"
                      rel="noreferrer"
                      className="kkm-li-link"
                    >
                      상세보기
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 페이지네이션 */}
      {renderPagination()}
    </div>
  );
}