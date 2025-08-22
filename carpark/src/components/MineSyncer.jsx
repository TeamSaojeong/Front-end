// src/components/MineSyncer.jsx
import { useEffect, useRef } from "react";
import { useMyParkings } from "../store/MyParkings";
import { fetchMyParkingsWithDetails } from "../apis/parking";

export default function MineSyncer() {
  const replaceMine = useMyParkings((s) => s.replaceMine);
  const syncing = useRef(false);

  const myId =
    localStorage.getItem("memberId") ||
    localStorage.getItem("userId") ||
    localStorage.getItem("loginId") ||
    "me";

  const sync = async () => {
    if (syncing.current) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    syncing.current = true;
    try {
      const list = await fetchMyParkingsWithDetails(myId);
      replaceMine(list);
    } finally {
      syncing.current = false;
    }
  };

  useEffect(() => {
    sync();
    const onVisible = () => document.visibilityState === "visible" && sync();
    const onStorage = (e) => e.key === "accessToken" && sync();
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
