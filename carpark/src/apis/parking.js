// api헬퍼
export async function getParking(id, accessToken) {
  const res = await fetch(`/api/parking/${id}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `주차장 조회 실패: ${res.status}`);
  }
  return await res.json(); // 서버가 {status, data:{...}} 형태라면 그대로 반환
}