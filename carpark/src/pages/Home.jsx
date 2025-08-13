import React, { useEffect, useRef } from "react";
import BottomSheet from "../components/BottomSheet";
import "../Styles/app-frame.css";
import Mapmenu from "../components/Mapmenu";
import Aiforecast from "../components/Aiforecast";

const SDK_SRC =
  "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false";

export default function Home() {
  const wrapRef = useRef(null);
  const mapEl = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const init = () => {
      const kakao = window.kakao;
      if (!mapEl.current || mapRef.current) return;
      const center = new kakao.maps.LatLng(37.5665, 126.978);
      const map = new kakao.maps.Map(mapEl.current, { center, level: 4 });
      mapRef.current = map;
      new kakao.maps.Marker({ position: center, map });
    };

    if (window.kakao?.maps) return window.kakao.maps.load(init);
    const s = document.createElement("script");
    s.src = SDK_SRC;
    s.async = true;
    s.id = "kakao-map-sdk";
    s.onload = () => window.kakao.maps.load(init);
    document.head.appendChild(s);
  }, []);

  return (
    <div ref={wrapRef} className="map-wrap">
      <div ref={mapEl} className="map-fill" />
      <Mapmenu />

      <Aiforecast onClick={() => console.log("AI 예보 클릭")} />
      <BottomSheet hostRef={wrapRef} />
    </div>
  );
}
