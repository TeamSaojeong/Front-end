import React, { useMemo, useState, useEffect } from "react";
import "../Styles/AISearch.css";
import aisearch from "../Assets/aisearch.svg";

// 카카오 지도 API를 사용한 주소 검색
const searchAddress = (query) => {
  return new Promise((resolve, reject) => {
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      console.error('[AISearch] 카카오 지도 API가 로드되지 않았습니다');
      resolve([]);
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();
    
    geocoder.addressSearch(query, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const results = result.slice(0, 6).map(item => ({
          address: item.address_name,
          roadAddress: item.road_address?.address_name,
          placeName: item.place_name,
          lat: parseFloat(item.y),
          lng: parseFloat(item.x)
        }));
        console.log('[AISearch] 주소 검색 결과:', results);
        resolve(results);
      } else {
        console.log('[AISearch] 주소 검색 실패:', status);
        resolve([]);
      }
    });
  });
};

export default function AISearch({
  value,
  onChange,
  onSelect,
  placeholder = "장소 혹은 주소를 검색하세요",
}) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // 실시간 주소 검색
  useEffect(() => {
    const q = query.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchAddress(q);
        setSearchResults(results);
      } catch (error) {
        console.error('[AISearch] 검색 오류:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms 디바운싱

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onChange?.(v);
    setOpen(!!v);
  };

  const handleSelect = (result) => {
    const displayText = result.roadAddress || result.address;
    setQuery(displayText);
    onChange?.(displayText);
    
    // 좌표 정보도 함께 전달
    onSelect?.({
      address: displayText,
      lat: result.lat,
      lng: result.lng,
      placeName: result.placeName
    });
    setOpen(false);
  };

  return (
    <div className="ai-search">
      {/* ✅ Figma 스펙: 342x52 (302x24 + padding 14/20) */}
      <div className="s-input-wrap">
        <img src={aisearch} alt="" className="s-img" />
        <input
          className="s-input"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(!!query)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>

      {open && (searchResults.length > 0 || searching) && (
        <div className="ai-search-suggest" role="listbox">
          {searching && (
            <div className="ai-search-loading">
              검색 중...
            </div>
          )}
          {searchResults.map((result, index) => (
            <button
              type="button"
              key={`${result.lat}-${result.lng}-${index}`}
              className="ai-search-item"
              onClick={() => handleSelect(result)}
              role="option"
            >
              <div className="ai-search-item-main">
                {result.roadAddress || result.address}
              </div>
              {result.placeName && (
                <div className="ai-search-item-sub">
                  {result.placeName}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
