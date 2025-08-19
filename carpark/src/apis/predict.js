import React, { useState } from "react";
import axios from "axios";

const predict = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    try {
      setLoading(true);
      // 예시 body (실제 API 스펙에 맞게 수정 필요)
      const body = {
        lat: 37.482,
        lng: 127.036,
        time: "2025-08-18T06:00:00",
      };

      const res = await axios.post("/api/parking/predict", body);
      if (res.data.ok) {
        setResults(res.data.items);
      }
    } catch (err) {
      console.error("조회 실패", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleSearch}>주차장 예측 조회</button>
      {loading && <p>조회 중...</p>}
      <ul>
        {results.map((item, idx) => (
          <li key={idx}>
            <strong>{item.prkNm}</strong> ({(item.dist_km * 1000).toFixed(0)}m)
            <br />
            예측: {item.pred_level}
            <small>
              {" "}
              (여유 {Math.round(item.p_여유 * 100)}%, 혼잡{" "}
              {Math.round(item.p_혼잡 * 100)}%)
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default predict;
