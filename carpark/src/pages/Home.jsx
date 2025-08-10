import React, { useEffect, useRef } from "react";

const SDK_SRC =
  "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false";

export default function Home() {
  const mapEl = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const init = () => {
      const kakao = window.kakao;
      if (!mapEl.current || mapRef.current) return;
      const center = new kakao.maps.LatLng(37.5665, 126.9780);
      const map = new kakao.maps.Map(mapEl.current, { center, level: 4 });
      mapRef.current = map;
      new kakao.maps.Marker({ position: center, map });
    };

    if (window.kakao?.maps) return window.kakao.maps.load(init);
    const s = document.createElement("script");
    s.id = "kakao-map-sdk";
    s.src = SDK_SRC;
    s.async = true;
    s.onload = () => window.kakao.maps.load(init);
    document.head.appendChild(s);
  }, []);

  return <div ref={mapEl} className="fill" />;
}
