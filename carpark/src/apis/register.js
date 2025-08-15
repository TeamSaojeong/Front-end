import { useParkingForm } from "../store/ParkingForm";

export async function register() {
  const { name, address, content, operateTimes, charge, image } = useParkingForm.getState();

  const fd = new FormData();
  const request = { name, address, content, operateTimes, charge };

  fd.append("request", new Blob([JSON.stringify(request)], { type: "application/json" }));
  if (image) fd.append("image", image);

  const res = await fetch("/api/parking", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`등록 실패: ${res.status} ${text}`);
  }
  return await res.json();
}