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
      charge: 0,
      image: null,

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
          name: "",
          address: "",
          zipcode: "",
          content: "",
          operateTimes: [],
          charge: 0,
          image: null,
        }),
    }),
    {
      name: "parking-form",
      partialize: (state) => ({
        name: state.name,
        address: state.address,
        zipcode: state.zipcode,
        content: state.content,
        operateTimes: state.operateTimes,
        charge: state.charge,
      }),
    }
  )
);