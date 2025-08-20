import { useState } from "react";
import axios from "axios";

export default function KakaoLocalSearch() {
  const [mode, setMode] = useState("place"); // 'place' | 'address'
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1); // 페이지네이션(선택)

  const REST_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;

  const search = async (p = 1) => {
    const keyword = q.trim();
    if (!keyword || !REST_KEY) return;

    const base =
      mode === "place"
        ? "https://dapi.kakao.com/v2/local/search/keyword.json"
        : "https://dapi.kakao.com/v2/local/search/address.json";

    const { data } = await axios.get(base, {
      params: { query: encodeURIComponent(keyword), page: p, size: 15 },
      headers: { Authorization: `KakaoAK ${REST_KEY}` },
    });

    // 응답 정규화
    const list = (data?.documents ?? []).map((d) =>
      mode === "place"
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
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      search(1);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="place">장소 검색</option>
          <option value="address">주소 검색</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={mode === "place" ? "예: 이태원 맛집" : "예: 강남대로 10"}
          style={{ flex: 1 }}
        />
        <button onClick={() => search(1)}>검색</button>
      </div>

      <ul style={{ marginTop: 12, padding: 0, listStyle: "none" }}>
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
        {items.length === 0 && <li style={{ color: "#888" }}>검색 결과가 없습니다.</li>}
      </ul>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
        <button onClick={() => search(Math.max(1, page - 1))}>이전</button>
        <span>Page {page}</span>
        <button onClick={() => search(page + 1)}>다음</button>
      </div>
    </div>
  );
}