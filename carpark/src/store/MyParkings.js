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
      
      // ✅ JWT 토큰에서 현재 사용자 확인
      getCurrentUser: () => {
        const token = localStorage.getItem("accessToken");
        if (!token) return "anonymous";
        
        try {
          const payload = token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          return decoded.loginId || decoded.email || decoded.sub || "anonymous";
        } catch (e) {
          console.warn('[MyParkings] JWT 디코딩 실패:', e);
          return "anonymous";
        }
      },
      
      // ✅ 사용자별 데이터 필터링 (JWT 기반)
      getMyItems: () => {
        const currentUser = get().getCurrentUser();
        const allItems = get().items || [];
        const myItems = allItems.filter(item => item.owner === currentUser);
        
        console.log('[MyParkings] 필터링 결과:', {
          currentUser,
          totalItems: allItems.length,
          myItems: myItems.length
        });
        
        return myItems;
      },

      upsert: (park) =>
        set((s) => {
          const currentUser = get().getCurrentUser(); // ✅ JWT 기반 사용자 확인
          const id = String(park.id);
          const idx = s.items.findIndex((x) => String(x.id) === id);

          const next = {
            enabled: true,
            ...s.items[idx],
            ...park,
            // ✅ origin은 들어온 값 우선, 없으면 기존 값, 둘 다 없으면 local
            origin: park.origin || s.items[idx]?.origin || "local",
            // ✅ 소유자 정보 추가 (JWT 기반)
            owner: park.owner || currentUser,
          };

          console.log("[MyParkings] upsert:", {
            user: currentUser,
            owner: next.owner,
            id,
            hasImageUrl: !!next.imageUrl,
            hasImage: !!next.image,
            imageUrl: next.imageUrl,
            origin: next.origin,
            isUpdate: idx >= 0
          });

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
      name: "my-parkings", // ✅ 동적 스토리지 키는 복잡하므로 공통 키 사용하되 필터링으로 분리
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
