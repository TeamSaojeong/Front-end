import React, { useMemo, useState } from "react";
import "../Styles/AISearch.css";
import aisearch from "../Assets/aisearch.svg";

const MOCK_ADDRESSES = [
  "서울특별시 강남구 테헤란로 123",
  "서울특별시 강남구 역삼동 123-4",
  "서울특별시 강남구 선릉로 321",
  "서울특별시 서초구 서초대로 77",
  "서울특별시 마포구 양화로 45",
  "서울특별시 종로구 종로 1",
  "경기도 성남시 분당구 판교역로 10",
  "경기도 성남시 분당구 수내동 88",
  "부산광역시 해운대구 센텀서로 30",
  "대구광역시 수성구 달구벌대로 100",
];

export default function AISearch({
  value,
  onChange,
  onSelect,
  placeholder = "장소 혹은 주소를 검색하세요",
}) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);

  const list = useMemo(() => {
    const q = (query || "").trim();
    if (!q) return [];
    return MOCK_ADDRESSES.filter((a) => a.includes(q)).slice(0, 6);
  }, [query]);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onChange?.(v);
    setOpen(!!v);
  };

  const handleSelect = (text) => {
    setQuery(text);
    onChange?.(text);
    onSelect?.(text);
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

      {open && list.length > 0 && (
        <div className="ai-search-suggest" role="listbox">
          {list.map((item) => (
            <button
              type="button"
              key={item}
              className="ai-search-item"
              onClick={() => handleSelect(item)}
              role="option"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
