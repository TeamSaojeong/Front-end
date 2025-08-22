// src/store/ParkingForm.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useParkingForm = create(
  persist(
    (set, get) => ({
      // 수정 모드 여부 (null이면 신규)
      editingId: null,

      // 입력 필드
      name: "",
      address: "",
      zipcode: "",
      content: "",
      operateTimes: [], // [{ start:"HH:MM", end:"HH:MM" }]
      charge: 0,
      image: null, // 새로 업로드한 파일만 저장

      // ✅ 지도 말풍선 표시를 위해 좌표 추가
      lat: null, // number | null
      lng: null, // number | null

      // 공통 setter
      setField: (key, value) => set((s) => ({ ...s, [key]: value })),
      setImage: (file) => set(() => ({ image: file })),
      addOperateTime: (ot) =>
        set((s) => ({ operateTimes: [...s.operateTimes, ot] })),
      removeOperateTime: (idx) =>
        set((s) => ({
          operateTimes: s.operateTimes.filter((_, i) => i !== idx),
        })),

      // 초기화
      reset: () =>
        set({
          editingId: null,
          name: "",
          address: "",
          zipcode: "",
          content: "",
          operateTimes: [],
          charge: 0,
          image: null,
          lat: null,
          lng: null,
        }),

      // 관리 → 수정하기에서 기존 데이터 주입
      loadFromPlace: (p) => {
        set({
          editingId: p.id ?? null,
          name: p.name ?? "",
          address: p.address ?? "",
          zipcode: p.zipcode ?? "",
          content: p.content ?? "",
          operateTimes: Array.isArray(p.operateTimes) ? p.operateTimes : [],
          charge: Number(p.charge ?? 0),
          image: null, // 기존 이미지는 서버에 있으니 새 업로드만 파일로 보관
          // ✅ 좌표도 주입 (없으면 null)
          lat:
            typeof p.lat === "number"
              ? p.lat
              : Number.isFinite(Number(p?.latitude))
              ? Number(p.latitude)
              : null,
          lng:
            typeof p.lng === "number"
              ? p.lng
              : Number.isFinite(Number(p?.lon ?? p?.lng ?? p?.x))
              ? Number(p.lon ?? p.lng ?? p.x)
              : null,
        });
      },
    }),
    {
      name: "parking-form",
      // 저장/복원할 필드만 선별
      partialize: (s) => ({
        editingId: s.editingId,
        name: s.name,
        address: s.address,
        zipcode: s.zipcode,
        content: s.content,
        operateTimes: s.operateTimes,
        charge: s.charge,
        // ✅ 좌표도 영속화 (등록 도중 새로고침 대비)
        lat: s.lat,
        lng: s.lng,
      }),
    }
  )
);
