import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 내 주차장 목록 (지도 표시/관리용 로컬 캐시)
 * - items: [{ id, name, address, charge, lat, lng, enabled, origin, imageUrl }]
 *   - origin: "server" | "local"
 */
export const useMyParkings = create(
  persist(
    (set, get) => ({
      items: [],

      upsert: (park) =>
        set((s) => {
          const id = String(park.id);
          const idx = s.items.findIndex((x) => String(x.id) === id);
          const next = {
            enabled: true,
            origin: "local",
            ...s.items[idx],
            ...park,
          };
          if (idx >= 0) {
            const copy = s.items.slice();
            copy[idx] = next;
            return { items: copy };
          }
          return { items: [...s.items, next] };
        }),

      toggleEnabled: (id) =>
        set((s) => ({
          items: s.items.map((p) =>
            String(p.id) === String(id) ? { ...p, enabled: !p.enabled } : p
          ),
        })),

      remove: (id) =>
        set((s) => ({
          items: s.items.filter((p) => String(p.id) !== String(id)),
        })),

      // 서버 동기화 시 한번에 덮어쓰기
      replaceAll: (rows = []) => set({ items: rows }),
    }),
    {
      name: "my-parkings",
      // ✅ blob: URL은 새로고침 후 무효 → persist 시 제거
      partialize: (s) => ({
        items: (s.items || []).map((it) => {
          const copy = { ...it };
          if (
            typeof copy.imageUrl === "string" &&
            copy.imageUrl.startsWith("blob:")
          ) {
            delete copy.imageUrl;
          }
          return copy;
        }),
      }),
    }
  )
);
