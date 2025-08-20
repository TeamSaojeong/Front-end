import { useParkingForm } from "../store/ParkingForm";

/**
 * 개인 주차장 등록
 * - multipart/form-data
 * - request: application/json (필드: name, zipcode, address, content, operateTimes, charge)
 * - image: File (선택 아님)
 */
export async function register(accessToken) {
  const { name, address, zipcode, content, operateTimes, charge, image } =
    useParkingForm.getState();

  const fd = new FormData();
  const request = { name, address, zipcode, content, operateTimes, charge };

  fd.append(
    "request",
    new Blob([JSON.stringify(request)], { type: "application/json" })
  );
  if (image) fd.append("image", image);

  const res = await fetch("/api/parking", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: fd,
  });

  if (res.ok) {
    try {
      return await res.json();
    } catch {
      return { status: res.status };
    }
  }

  // --- 에러 처리 ---
  let body = null;
  let rawText = "";
  try {
    body = await res.json();
  } catch {
    rawText = await res.text();
  }

  const serverMsg = body?.message || rawText || "요청이 실패했습니다.";
  const serverCode = body?.code;

  const err = new Error(serverMsg);
  err.status = res.status;
  err.code = serverCode;
  throw err;
}
