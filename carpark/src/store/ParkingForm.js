import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useParkingForm = create(
  persist(
    (set) => ({
      name: "",
      address: "",
      zipcode: "",
      content: "",
      operateTimes: [], // [{ start: "HH:MM", end: "HH:MM" }]
      charge: 0, // 10분당 요금(int)
      image: null,

      setField: (key, value) => set((s) => ({ ...s, [key]: value })),
      reset: () =>
        set({
          name: "",
          address: "",
          zipcode: "",
          content: "",
          operateTimes: [],
          charge: 0,
          image: null,
        }),
    }),
    { name: "parking-form" } // ← 로컬스토리지 키 (페이지 이동/새로고침해도 유지)
  )
);
