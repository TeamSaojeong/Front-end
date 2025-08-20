// api/local.js
// Vercel Serverless Function (배포 시에만 추가/사용)
// 클라이언트는 /api/local 로만 요청 → REST 키는 서버 환경변수로만 사용됨

export default async function handler(req, res) {
  try {
    const { q = "", type = "keyword", page = "1", size = "15" } = req.query;
    if (!q.trim()) return res.status(400).json({ error: "query(q) is required" });

    const base =
      type === "address"
        ? "https://dapi.kakao.com/v2/local/search/address.json"
        : "https://dapi.kakao.com/v2/local/search/keyword.json";

    const r = await fetch(
      `${base}?query=${encodeURIComponent(q)}&page=${page}&size=${size}`,
      { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` } }
    );

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: "kakao_error", detail: text });
    }

    const data = await r.json();
    // 선택: 캐시 설정
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "server_error", message: String(e) });
  }
}