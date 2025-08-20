// src/apis/register.js
import { useParkingForm } from "../store/ParkingForm";
import { client } from "./client";

export async function register(accessToken) {
  const s = useParkingForm.getState();

  const request = {
    name: String(s.name || "").trim(),
    zipcode: String(s.zipcode || "").trim(),
    address: String(s.address || "").trim(),
    content: String(s.content || "").trim(),
    operateTimes: Array.isArray(s.operateTimes)
      ? s.operateTimes.map(({ start, end }) => ({ start, end }))
      : [],
    charge: Number(s.charge || 0),
  };

  const fd = new FormData();
  fd.append(
    "request",
    new Blob([JSON.stringify(request)], { type: "application/json" })
  );
  if (s.image) fd.append("image", s.image, s.image.name);

  try {
    const { data } = await client.post("/api/parking", fd, {
      headers: {
        Authorization: accessToken
          ? `Bearer ${accessToken}`
          : client.defaults.headers.common.Authorization,
        "Content-Type": "multipart/form-data",
        Accept: "application/json, text/plain, */*",
      },
    });
    return data;
  } catch (e) {
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
