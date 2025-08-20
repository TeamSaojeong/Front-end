import { useParkingForm } from "../store/ParkingForm";
import { client } from "./client";
import { shrinkImageFile } from "../utils/imageShrink";

const pad2 = (n) => String(n ?? "").padStart(2, "0");

export async function register(accessToken) {
  const s = useParkingForm.getState();

  const addressStr =
    typeof s.address === "string"
      ? s.address.trim()
      : (
          s.address?.roadAddress ||
          s.address?.address ||
          s.address?.jibunAddress ||
          ""
        ).trim();

  const times = Array.isArray(s.operateTimes)
    ? s.operateTimes.map(({ start, end }) => ({
        start:
          typeof start === "string"
            ? start
            : `${pad2(start?.h)}:${pad2(start?.m)}`,
        end: typeof end === "string" ? end : `${pad2(end?.h)}:${pad2(end?.m)}`,
      }))
    : [];

  const request = {
    name: String(s.name || "").trim(),
    zipcode: String(s.zipcode || "").trim(),
    address: addressStr,
    content: String(s.content || "").trim(),
    operateTimes: times,
    charge: Number(s.charge || 0),
  };

  let file = s.image;
  if (!(file instanceof File)) {
    const err = new Error("이미지 파일이 필요합니다.");
    err.code = "IMAGE_REQUIRED";
    throw err;
  }

  // 1차 축소(대부분 여기서 413 회피)
  file = await shrinkImageFile(file, {
    maxW: 1600,
    maxH: 1600,
    quality: 0.82,
    targetBytes: 900 * 1024,
  });

  async function postOnce(f) {
    const fd = new FormData();
    fd.append(
      "request",
      new Blob([JSON.stringify(request)], { type: "application/json" })
    );
    fd.append("image", f, f.name || "parking.jpg");
    const { data } = await client.post("/api/parking", fd, {
      headers: {
        Authorization: accessToken
          ? `Bearer ${accessToken}`
          : client.defaults.headers.common.Authorization,
        // Content-Type 지정하지 않음 (boundary 자동)
        Accept: "application/json, text/plain, */*",
      },
    });
    return data;
  }

  try {
    const data = await postOnce(file);
    const created = data?.data ?? data ?? {};
    return { parkingId: String(created?.id ?? created?.parkingId ?? "") };
  } catch (e) {
    // 413이면 더 세게 줄여 재시도
    if (e?.response?.status === 413) {
      const smaller = await shrinkImageFile(file, {
        maxW: 1200,
        maxH: 1200,
        quality: 0.78,
        targetBytes: 600 * 1024,
      });
      const data = await postOnce(smaller);
      const created = data?.data ?? data ?? {};
      return { parkingId: String(created?.id ?? created?.parkingId ?? "") };
    }
    const status = e?.response?.status;
    const body = e?.response?.data;
    const msg = body?.message || e.message || "요청이 실패했습니다.";
    const err = new Error(msg);
    err.status = status;
    err.code = body?.code;
    err.body = body;
    throw err;
  }
}
