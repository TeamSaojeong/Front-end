// src/components/LocalSearch.jsx
// 현재: .env의 REST 키를 브라우저에서 직접 사용 (개발 편의용)
// 배포(Vercel) 시: /api/local 서버리스 프록시를 호출하도록 전환
// ──────────────────────────────────────────────────────────────

import { useState } from "react";
import axios from "axios";

const Keyword= () =>{
  const [mode, setMode] = useState("keyword"); // 'keyword' | 'address'
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // 개발용: .env에서 키 읽기 (배포 시 브라우저에서 키가 보이므로 제거 예정)
  const REST_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;

  const search = async (p = 1) => {
    const query = q.trim();
    if (!query) return;
    setLoading(true);

    // ──────────────────────────────────────────────────────────────
    // [현재(개발용) 활성화 구간]
    // 카카오 Local API를 브라우저에서 직접 호출
    // 배포(Vercel) 전환 시, 이 블록은 "삭제"하세요.
    //    (키가 브라우저에 노출되므로 운영에 부적합)
    const baseDev =
      mode === "address"
        ? "https://dapi.kakao.com/v2/local/search/address.json"
        : "https://dapi.kakao.com/v2/local/search/keyword.json";
    // ──────────────────────────────────────────────────────────────

    // ──────────────────────────────────────────────────────────────
    // [배포(Vercel)용) 비활성화 구간]
    // 서버리스 함수 프록시로 호출 (키는 서버 환경변수에서만 사용)
    // ✅ 배포 시 아래 두 줄을 "주석 해제"하고,
    //    윗부분의 baseDev/headers Authorization 블록은 "삭제"하세요.
    // const baseProd = "/api/local";
    // const paramsProd = { q: query, type: mode, page: p, size: 15 };
    // ──────────────────────────────────────────────────────────────

    try {
      // ──────────────────────────────────────────────────────────
      // [현재(개발용) 활성화 요청]
      // ⚠️ 배포 시 이 요청 전체를 삭제하고, 아래의 "배포용 요청"을 주석 해제하세요.
      const { data } = await axios.get(baseDev, {
        params: { query: encodeURIComponent(query), page: p, size: 15 },
        headers: { Authorization: `KakaoAK ${REST_KEY}` }, // ⚠️ 배포 시 이 헤더 삭제
      });
      // ──────────────────────────────────────────────────────────

      // ──────────────────────────────────────────────────────────
      // [배포(Vercel)용) 주석 해제할 요청]
      // const { data } = await axios.get(baseProd, { params: paramsProd });
      // ──────────────────────────────────────────────────────────

      const docs = data?.documents ?? [];
      const list = docs.map((d) =>
        mode === "keyword"
          ? {
              title: d.place_name,
              addr: d.road_address_name || d.address_name,
              x: Number(d.x),
              y: Number(d.y),
              url: d.place_url,
            }
          : {
              title: d.address_name,
              addr:
                d.road_address?.address_name ||
                d.address?.address_name ||
                d.address_name,
              x: Number(d.x),
              y: Number(d.y),
            }
      );

      setItems(list);
      setPage(p);
    } catch (e) {
      console.error("Kakao local search error:", e);
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const onEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      search(1);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="keyword">장소 검색</option>
          <option value="address">주소 검색</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onEnter}
          placeholder={mode === "keyword" ? "예: 이태원 맛집" : "예: 강남대로 10"}
          style={{ flex: 1 }}
        />
        <button onClick={() => search(1)} disabled={loading}>
          {loading ? "검색중..." : "검색"}
        </button>
      </div>

      <ul style={{ marginTop: 12, padding: 0, listStyle: "none" }}>
        {items.length === 0 && !loading && (
          <li style={{ color: "#888" }}>검색 결과가 없습니다.</li>
        )}
        {items.map((it, i) => (
          <li key={i} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
            <div style={{ fontWeight: 600 }}>{it.title}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{it.addr}</div>
            {it.url && (
              <a href={it.url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                상세 보기
              </a>
            )}
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
        <button onClick={() => search(Math.max(1, page - 1))} disabled={page === 1 || loading}>
          이전
        </button>
        <span>Page {page}</span>
        <button onClick={() => search(page + 1)} disabled={loading}>
          다음
        </button>
      </div>
    </div>
  );
}

export default Keyword;