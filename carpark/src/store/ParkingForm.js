import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useParkingForm = create(
  persist(
    (set, get) => ({
      // 수정 모드 여부는 editingId로 판단 (null 이면 신규)
      editingId: null,

      // 입력 필드
      name: "",
      address: "",
      zipcode: "",
      content: "",
      operateTimes: [], // [{ start:"HH:MM", end:"HH:MM" }]
      charge: 0,
      image: null, // 새로 업로드한 파일만 저장

      setField: (key, value) => set((s) => ({ ...s, [key]: value })),
      setImage: (file) => set(() => ({ image: file })),
      addOperateTime: (ot) =>
        set((s) => ({ operateTimes: [...s.operateTimes, ot] })),
      removeOperateTime: (idx) =>
        set((s) => ({
          operateTimes: s.operateTimes.filter((_, i) => i !== idx),
        })),
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
        });
      },
    }),
    {
      name: "parking-form",
      partialize: (s) => ({
        editingId: s.editingId,
        name: s.name,
        address: s.address,
        zipcode: s.zipcode,
        content: s.content,
        operateTimes: s.operateTimes,
        charge: s.charge,
      }),
    }
  )
);
