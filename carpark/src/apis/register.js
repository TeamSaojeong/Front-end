import { useParkingForm } from "../store/ParkingForm";
import { client } from "./client";
import { shrinkImageFile } from "../utils/imageShrink";
import { useMyParkings } from "../store/MyParkings"; // ✅ 내 주차장 저장소

const pad2 = (n) => String(n ?? "").padStart(2, "0");

/** 신규 등록 */
export async function register(accessToken) {
  const s = useParkingForm.getState();

  console.log("[REGISTER] 함수 진입");

  const addressStr =
    typeof s.address === "string"
      ? s.address.trim()
      : (
          s.address?.roadAddress ||
          s.address?.address ||
          s.address?.jibunAddress ||
          ""
        ).trim();

  const operateTimes = Array.isArray(s.operateTimes)
    ? s.operateTimes.map(({ start, end }) => ({
        start:
          typeof start === "string"
            ? start
            : `${pad2(start?.h)}:${pad2(start?.m)}`,
        end: typeof end === "string" ? end : `${pad2(end?.h)}:${pad2(end?.m)}`,
      }))
    : [];

  // ✅ lat/lng 그대로 전달
  const request = {
    name: String(s.name || "").trim(),
    zipcode: String(s.zipcode || "").trim(),
    address: addressStr,
    content: String(s.content || "").trim(),
    operateTimes,
    charge: Number(s.charge || 0),
    lat: s.lat ?? null,
    lng: s.lng ?? null,
  };

  console.log("[REGISTER] 전송할 JSON:", request);

  let file = s.image;
  if (!(file instanceof File)) {
    const err = new Error("이미지 파일이 필요합니다.");
    err.code = "IMAGE_REQUIRED";
    throw err;
  }

  if (shrinkImageFile) {
    file = await shrinkImageFile(file, {
      maxW: 1600,
      maxH: 1600,
      quality: 0.82,
      targetBytes: 900 * 1024,
    });
  }

  async function postOnce(f) {
    const fd = new FormData();
    fd.append(
      "request",
      new Blob([JSON.stringify(request)], { type: "application/json" })
    );
    fd.append("image", f, f.name || "parking.jpg");

    console.log("[REGISTER] 서버로 요청 보냄…");

    const { data } = await client.post("/api/parking", fd, {
      headers: {
        Authorization:
          accessToken || client.defaults.headers.common.Authorization,
      },
    });

    console.log("[REGISTER] raw 서버 응답:", JSON.stringify(data, null, 2));

    return data;
  }

  try {
    const data = await postOnce(file);
    const created = data?.data ?? {};

    const parkingId = String(
      created?.id || created?.parkingId || created?.parking_id || ""
    );
    console.log("[REGISTER] 생성된 주차장 ID:", parkingId);

    const detail = {
      id: parkingId,
      name: created?.name ?? request.name,
      zipcode: created?.zipcode ?? request.zipcode,
      address: created?.address ?? request.address,
      content: created?.content ?? request.content,
      operateTimes: created?.operateTimes ?? request.operateTimes,
      charge: created?.charge ?? request.charge,
      lat: created?.lat ?? request.lat,
      lng: created?.lng ?? request.lng,
      imageUrl: created?.imageUrl ?? null,
      origin: "server",
    };

    useMyParkings.getState().upsert(detail);

    return { parkingId, detail };
  } catch (e) {
    if (e?.response?.status === 413 && shrinkImageFile) {
      console.warn("[REGISTER] 413 발생 → 이미지 더 줄여서 재시도");
      const smaller = await shrinkImageFile(file, {
        maxW: 1200,
        maxH: 1200,
        quality: 0.78,
        targetBytes: 600 * 1024,
      });
      const data = await postOnce(smaller);
      const created = data?.data ?? {};
      const parkingId = String(
        created?.id || created?.parkingId || created?.parking_id || ""
      );
      console.log("[REGISTER] 재시도 후 주차장 ID:", parkingId);

      const detail = {
        id: parkingId,
        name: created?.name ?? request.name,
        zipcode: created?.zipcode ?? request.zipcode,
        address: created?.address ?? request.address,
        content: created?.content ?? request.content,
        operateTimes: created?.operateTimes ?? request.operateTimes,
        charge: created?.charge ?? request.charge,
        lat: created?.lat ?? request.lat,
        lng: created?.lng ?? request.lng,
        imageUrl: created?.imageUrl ?? null,
        origin: "server",
      };

      useMyParkings.getState().upsert(detail);

      return { parkingId, detail };
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

/** 수정 */
export async function modify(parkingId, accessToken) {
  const s = useParkingForm.getState();

  const request = {
    name: String(s.name || "").trim(),
    zipcode: String(s.zipcode || "").trim(),
    address:
      typeof s.address === "string" ? s.address : s.address?.roadAddress || "",
    content: String(s.content || "").trim(),
    operateTimes: Array.isArray(s.operateTimes)
      ? s.operateTimes.map(({ start, end }) => ({
          start:
            typeof start === "string"
              ? start
              : `${pad2(start?.h)}:${pad2(start?.m)}`,
          end:
            typeof end === "string" ? end : `${pad2(end?.h)}:${pad2(end?.m)}`,
        }))
      : [],
    charge: Number(s.charge || 0),
  };

  const fd = new FormData();
  fd.append(
    "request",
    new Blob([JSON.stringify(request)], { type: "application/json" })
  );
  if (s.image instanceof File) {
    fd.append("image", s.image, s.image.name || "parking.jpg");
  }

  const { data } = await client.patch(`/api/parking/${parkingId}/modify`, fd, {
    headers: {
      Authorization:
        accessToken || client.defaults.headers.common.Authorization,
    },
  });

  const detail = {
    ...(data || {}),
    id: parkingId,
    lat: data?.lat ?? s.lat,
    lng: data?.lng ?? s.lng,
    origin: "server",
  };

  useMyParkings.getState().upsert(detail);

  return detail;
}
