// src/components/LocationPinger.jsx
import { useEffect, useRef, useState } from "react";
import { postMyLocation } from "../apis/location";

export default function LocationPinger({
  intervalMinutes = 10, //여기가 10분 마다 전송할 때 그 10분 
  intervalSeconds, // 테스트 시 10 같은 값 넣으면 초 단위
  watch = true,
}) {
  const [pos, setPos] = useState(null); // {lat, lng}
  const timerRef = useRef(null);
  const watchIdRef = useRef(null);

  // 위치 구독
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const onOk = (p) =>
      setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
    const onErr = (e) => console.debug("[geo] error:", e.message);

    navigator.geolocation.getCurrentPosition(onOk, onErr, {
      enableHighAccuracy: true,
      maximumAge: 60_000,
      timeout: 10_000,
    });

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(onOk, onErr, {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      });
    }
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [watch]);

  // 주기 전송
  useEffect(() => {
    const ms =
      intervalSeconds != null
        ? Math.max(1, intervalSeconds) * 1000
        : Math.max(1, intervalMinutes) * 60_000;

    const send = async () => {
      if (!pos) return;
      try {
        await postMyLocation(pos); //10분마다 위치 전송송
        console.debug("[location] sent", pos);
      } catch (e) {
        console.debug(
          "[location] send failed:",
          e?.response?.status,
          e?.response?.data || e?.message
        );
      }
    };

    send(); // 즉시 한 번
    timerRef.current = setInterval(send, ms);

    const onVis = () => {
      if (document.hidden) {
        clearInterval(timerRef.current);
      } else {
        send();
        timerRef.current = setInterval(send, ms);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pos, intervalMinutes, intervalSeconds]);

  return null;
}
