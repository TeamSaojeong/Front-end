import { useEffect } from "react";
import { getSoonOutDetail } from "../apis/parking";

const normalizeId = (id) => String(id ?? "").replace(/^kakao:/i, "");

export default function SoonOutDeepLinker() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const soonOutId = url.searchParams.get("soonOutId");
    if (!soonOutId) return;

    const token = localStorage.getItem("accessToken");
    const currentUserKey = localStorage.getItem("userKey") || "guest";

    const enqueueNotification = (payload) => {
      const notificationsKey = `pendingNotifications__${currentUserKey}`;
      try {
        const existing = JSON.parse(localStorage.getItem(notificationsKey) || "[]");
        existing.push(payload);
        localStorage.setItem(notificationsKey, JSON.stringify(existing));
      } catch {}
    };

    const complete = () => {
      // URL 정리 (soonOutId 제거)
      url.searchParams.delete("soonOutId");
      window.history.replaceState({}, document.title, url.toString());
    };

    (async () => {
      try {
        if (!token) {
          // 로그인 필요. 토큰 없으면 최소 정보로 노티 저장만.
          enqueueNotification({
            id: `deeplink_${soonOutId}_${Date.now()}`,
            type: "SOON_OUT",
            parkingId: "",
            placeName: "주차장",
            minutesAgo: 10,
            timestamp: Date.now(),
            soonOutId,
          });
          complete();
          return;
        }

        const res = await getSoonOutDetail(soonOutId);
        const data = res?.data?.data || {};
        const parkingId = normalizeId(data.parkingId || data.parking_id || "");
        const placeName = data.placeName || data.place_name || "주차장";
        const minutes = data.minute || data.minutes || 10;

        enqueueNotification({
          id: `deeplink_${soonOutId}_${Date.now()}`,
          type: "SOON_OUT",
          parkingId,
          placeName,
          minutesAgo: minutes,
          timestamp: Date.now(),
          soonOutId,
        });
      } catch (e) {
        // 실패해도 최소 정보로 표시
        enqueueNotification({
          id: `deeplink_${soonOutId}_${Date.now()}`,
          type: "SOON_OUT",
          parkingId: "",
          placeName: "주차장",
          minutesAgo: 10,
          timestamp: Date.now(),
          soonOutId,
        });
      } finally {
        complete();
      }
    })();
  }, []);

  return null;
}


