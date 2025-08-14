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

  //임의 데이터 삽입 부분, 아마 여기에 백엔드 데이터를 받아올 것으로 예상
  const places = [
    { id: 1, name: "서울특별시", distanceKm: 24, etaMin: 36, price: 0 },
    { id: 2, name: "부산광역시", distanceKm: 24, etaMin: 36, price: 0 },
    { id: 3, name: "인천광역시", distanceKm: 24, etaMin: 36, price: 0 },
  ];

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
        
      {/*places를 BottomSheet로 전달 */}
      <BottomSheet hostRef={wrapRef} places={places} />
    </div>
  );
}
