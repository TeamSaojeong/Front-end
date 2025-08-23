import React, { useEffect, useState } from "react";

export default function KakaoPlaceList() {
  const [keyword, setKeyword] = useState("이태원 맛집");
  const [places, setPlaces] = useState([]);
  const [loaded, setLoaded] = useState(false); // SDK 로딩 여부

  useEffect(() => {
    const kakaoKey = process.env.REACT_APP_KAKAO_REST_API_KEY;
    console.log("카카오 키:", kakaoKey);

    if (window.kakao && window.kakao.maps) {
      console.log("✅ Kakao SDK 이미 로드됨");
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services`;
    script.async = true;

    script.onload = () => {
      console.log("✅ Kakao SDK 로드 완료");
      setLoaded(true);
    };

    script.onerror = () => {
      console.error("❌ Kakao SDK 로드 실패");
    };

    document.head.appendChild(script);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    if (!keyword.trim()) {
      alert("키워드를 입력해주세요.");
      return;
    }

    if (!window.kakao || !window.kakao.maps) {
      alert("Kakao SDK가 아직 로드되지 않았습니다.");
      return;
    }

    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch(keyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setPlaces(data);
      } else {
        alert("검색 결과가 없습니다.");
        setPlaces([]);
      }
    });
  };

  return (
    <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>장소 키워드 검색</h2>

      <form onSubmit={handleSearch} style={{ marginBottom: "16px" }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="장소 키워드를 입력하세요"
          style={{
            padding: "8px",
            fontSize: "16px",
            width: "70%",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button
          type="submit"
          disabled={!loaded}
          style={{
            marginLeft: "8px",
            padding: "8px 16px",
            fontSize: "16px",
            background: "#2e80ec",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loaded ? "pointer" : "not-allowed",
          }}
        >
          {loaded ? "검색" : "로딩 중..."}
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {places.map((place, i) => (
          <li
            key={i}
            style={{
              marginBottom: "16px",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <strong style={{ fontSize: "16px" }}>{place.place_name}</strong>
            <div style={{ fontSize: "14px", marginTop: "4px" }}>
              {place.road_address_name || place.address_name}
            </div>
            {place.phone && (
              <div style={{ color: "#888", marginTop: "2px" }}>{place.phone}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}