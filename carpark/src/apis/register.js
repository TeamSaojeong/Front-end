import { useParkingForm } from "../store/ParkingForm";
import { client } from "./client";
import { shrinkImageFile } from "../utils/imageShrink";
import { useMyParkings } from "../store/MyParkings"; // ✅ 내 주차장 저장소

const pad2 = (n) => String(n ?? "").padStart(2, "0");

/** 신규 등록 */
export async function register(accessToken) {
  const s = useParkingForm.getState(); //parkingform store에서 데이터 가져오는 중중

  console.log("[REGISTER] 함수 진입");

  //주소 정보 처리리
  const addressStr =
    typeof s.address === "string"
      ? s.address.trim()
      : (
          s.address?.roadAddress ||
          s.address?.address ||
          s.address?.jibunAddress ||
          ""
        ).trim();

        //운영 시간 처리리
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

  // 필수 필드 검증
  if (!request.name) {
    throw new Error("주차장 이름은 필수입니다.");
  }
  if (!request.address) {
    throw new Error("주차장 주소는 필수입니다.");
  }
  if (!request.charge || request.charge <= 0) {
    throw new Error("주차 요금은 0보다 커야 합니다.");
  }
  if (!request.lat || !request.lng) {
    throw new Error("주차장 위치 정보가 필요합니다.");
  }

  console.log("[REGISTER] 전송할 JSON:", request);

  //이미지 압축 처리리
  let file = s.image;
  let hasImage = file instanceof File;
  
  // 이미지가 있는 경우에만 압축 처리 (박스에 딱 맞게)
  if (hasImage && shrinkImageFile) {
    file = await shrinkImageFile(file, {
      maxW: 342,  // pub-photo-box 너비에 맞게 조절
      maxH: 192,  // pub-photo-box 높이에 맞게 조절
      quality: 0.8,
      targetBytes: 400 * 1024, // 400KB 목표
    });
  }

  //formdata로 서버 전송송
  async function postOnce(f, hasImg) {
    const fd = new FormData();
    fd.append(
      "request",
      new Blob([JSON.stringify(request)], { type: "application/json" })
    );
    
    // 이미지가 있는 경우에만 추가
    if (hasImg && f) {
      fd.append("image", f, f.name || "parking.jpg");
    }

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
    const data = await postOnce(file, hasImage);
    console.log("[REGISTER] 서버 응답:", JSON.stringify(data, null, 2));
    
    // API 명세서에 따라 data는 객체 (배열이 아님)
    const created = data?.data ?? {};
    console.log("[REGISTER] created object:", created);

    const parkingId = String(
      created?.parking_id || created?.parkingId || created?.id || ""
    );
    console.log("[REGISTER] ID 추출 과정:", {
      parking_id: created?.parking_id,
      parkingId: created?.parkingId,
      id: created?.id,
      final: parkingId
    });

    // 이미지 정보 보존 - 백엔드에서 image 필드를 반환하는지 확인
    const imageInfo = {};
    if (s.image instanceof File) {
      imageInfo.image = s.image;
      // 백엔드에서 image 필드를 반환하는 경우 우선 사용
      if (created?.image && created.image.startsWith('http')) {
        imageInfo.imageUrl = created.image;
        console.log("[REGISTER] 백엔드에서 이미지 URL 받음:", created.image);
      } else if (created?.imageUrl && created.imageUrl.startsWith('http')) {
        // imageUrl 필드도 확인 (호환성)
        imageInfo.imageUrl = created.imageUrl;
        console.log("[REGISTER] 백엔드에서 imageUrl 받음:", created.imageUrl);
      } else {
        // 백엔드에서 URL을 반환하지 않는 경우 임시 blob URL 생성
        imageInfo.imageUrl = URL.createObjectURL(s.image);
        console.log("[REGISTER] 임시 blob URL 생성:", imageInfo.imageUrl);
      }
      console.log("[REGISTER] 이미지 정보 저장:", {
        fileName: s.image.name,
        fileSize: s.image.size,
        hasImageUrl: !!imageInfo.imageUrl,
        isBackendUrl: !!(created?.image || created?.imageUrl)
      });
    }

    const detail = {
      id: parkingId,
      name: created?.parkingName || created?.name || request.name,
      zipcode: created?.zipcode ?? request.zipcode,
      address: created?.address ?? request.address,
      content: created?.content ?? request.content,
      operateTimes: created?.operateTimes ?? request.operateTimes,
      charge: created?.charge ?? request.charge,
      lat: created?.lat ?? request.lat,
      lng: created?.lng ?? request.lng,
      ...imageInfo, // 이미지 정보 추가
      origin: "server",
      operate: created?.operate ?? true,
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
      const data = await postOnce(smaller, true);
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
    charge: Number(s.charge || 0), // API 명세서에 따라 Integer
  };

  console.log("[MODIFY] 전송할 request:", JSON.stringify(request, null, 2));

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

  console.log("[MODIFY] 서버 응답:", JSON.stringify(data, null, 2));

  // 서버 응답에서 실제 데이터 추출
  const responseData = data?.data || data || {};
  
  // 기존 저장된 주차장 정보에서 좌표 가져오기
  const existingParking = useMyParkings.getState().items.find(p => String(p.id) === String(parkingId));
  
  // 이미지 URL 처리
  let imageUrl = null;
  if (responseData?.image && responseData.image.startsWith('http')) {
    imageUrl = responseData.image;
    console.log("[MODIFY] 백엔드에서 이미지 URL 받음:", responseData.image);
  } else if (responseData?.imageUrl && responseData.imageUrl.startsWith('http')) {
    imageUrl = responseData.imageUrl;
    console.log("[MODIFY] 백엔드에서 imageUrl 받음:", responseData.imageUrl);
  } else if (s.image instanceof File) {
    // 새로 업로드한 이미지가 있는 경우 임시 blob URL 생성
    imageUrl = URL.createObjectURL(s.image);
    console.log("[MODIFY] 새 이미지 blob URL 생성:", imageUrl);
  }

  const detail = {
    ...responseData,
    id: parkingId,
    name: responseData?.name || responseData?.parkingName || s.name,
    address: responseData?.address || s.address,
    content: responseData?.content || s.content,
    operateTimes: responseData?.operateTimes || s.operateTimes,
    charge: responseData?.charge || s.charge,
    // 좌표는 기존 데이터 → 폼 데이터 → 서버 응답 순으로 우선순위
    lat: existingParking?.lat ?? s.lat ?? responseData?.lat ?? null,
    lng: existingParking?.lng ?? s.lng ?? responseData?.lng ?? null,
    // 이미지 URL 추가
    imageUrl: imageUrl,
    origin: "server",
  };

  console.log("[MODIFY] 최종 detail:", JSON.stringify(detail, null, 2));

  useMyParkings.getState().upsert(detail);

  return detail;
}
