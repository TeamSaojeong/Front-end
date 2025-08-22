import React, { useState } from "react";
import axios from "axios";

const KakaoSearch = () => {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);

  const search = async (e) => {
    e.preventDefault();

    if (!keyword.trim()) {
      alert("검색어를 입력하세요");
      return;
    }

    try {
      const res = await axios.get(
        `https://dapi.kakao.com/v2/local/search/keyword.json`,
        {
          params: { query: keyword },
          headers: {
            Authorization: `KakaoAK ${import.meta.env.VITE_KAKAO_REST_API_KEY}`,
          },
        }
      );
      setResults(res.data.documents);
    } catch (err) {
      console.error("Kakao API 오류", err);
      alert("검색 중 오류가 발생했습니다.");
    }
  };

  return (
    <div>
      <form onSubmit={search}>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="장소명을 입력하세요"
        />
        <button type="submit">검색</button>
      </form>

      <ul>
        {results.map((place) => (
          <li key={place.id}>
            <strong>{place.place_name}</strong> <br />
            {place.road_address_name || place.address_name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KakaoSearch;