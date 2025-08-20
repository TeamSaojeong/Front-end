// src/store/ParkingForm.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useParkingForm = create(
  persist(
    (set) => ({
      // 입력값
      name: "",
      content: "",
      address: "",       // string 또는 { roadAddress, jibunAddress, zonecode ... }
      zipcode: "",
      operateTimes: [],  // [{ start: "HH:MM", end: "HH:MM" }]
      charge: 0,
      image: null,       // File

      // 액션
      setField: (key, value) => set(() => ({ [key]: value })),
      reset: () =>
        set({
          name: "",
          content: "",
          address: "",
          zipcode: "",
          operateTimes: [],
          charge: 0,
          image: null,
        }),
    }),
    { name: "parking-form" }
  )
);