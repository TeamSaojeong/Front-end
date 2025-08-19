import React, { useState } from "react";
import styled from "styled-components";
import aisearch from "../Assets/aisearch.svg";
import "../Styles/AISearch.css";

const SearchBox = () => {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  // 임시 추천 검색어 (API 연동 시 대체 가능)
  const suggestions = [
    "관련 검색어_1",
    "관련 검색어_2",
    "관련 검색어_3",
    "관련 검색어_4",
  ];

  const handleChange = (e) => {
    setQuery(e.target.value);
    setShowResults(e.target.value.length > 0);
  };

  return (
    <Wrapper>
      <div className="s-input-wrap">
        <img src={aisearch} className="s-img" />
        <Input
          type="text"
          placeholder="장소 혹은 주소 검색"
          value={query}
          onChange={handleChange}
        />
      </div>

      {showResults && (
        <SuggestionBox>
          {suggestions
            .filter((item) => item.includes(query))
            .map((item, index) => (
              <Suggestion key={index}>{item}</Suggestion>
            ))}
        </SuggestionBox>
      )}
    </Wrapper>
  );
};

export default SearchBox;

/* ---------- styled-components ---------- */
const Wrapper = styled.div`
  width: 100%;
  position: relative;
`;

const Input = styled.input`
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  font-size: 16px;
  margin-left: 8px;
`;

const SuggestionBox = styled.div`
  margin-top: 6px;
  background: #f7f7f7;
  border-radius: 12px;
  padding: 8px 0;
`;

const Suggestion = styled.div`
  padding: 8px 16px;
  cursor: pointer;
  &:hover {
    background: #eaeaea;
  }
`;
