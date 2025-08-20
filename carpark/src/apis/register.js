// import { useParkingForm } from "../store/ParkingForm";

// export async function register(accessToken) {
//   const { name, address, zipcode, content, operateTimes, charge, image } =
//     useParkingForm.getState();

//   const fd = new FormData();
//   const request = { name, address, zipcode, content, operateTimes, charge };

//   fd.append(
//     "request",
//     new Blob([JSON.stringify(request)], { type: "application/json" })
//   );
//   if (image) fd.append("image", image);

//   const res = await fetch("/api/parking", {
//     method: "POST",
//     headers: { Authorization: `Bearer ${accessToken}` },
//     body: fd,
//   });

//   if (res.ok) {
//     try {
//       return await res.json();
//     } catch {
//       return { status: res.status };
//     }
//   }

//   // --- 에러 처리 ---
//   let body = null;
//   let rawText = "";
//   try {
//     body = await res.json();
//   } catch {
//     rawText = await res.text();
//   }

//   const serverMsg = body?.message || rawText || "요청이 실패했습니다.";
//   const serverCode = body?.code;

//   const err = new Error(serverMsg);
//   err.status = res.status;
//   err.code = serverCode;
//   throw err;
// }


import axios from "axios";

export const API = axios.create({
  baseURL : "/api/parking",
  headers:{
    "Content-Type" : "application/json",
  },
  withCredentials: true,
})
