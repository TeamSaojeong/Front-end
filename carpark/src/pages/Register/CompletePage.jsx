// src/pages/Register/CompletePage.jsx
import NextBtn from "../../components/Register/NextBtn";
import PreviousBtn from "../../components/Register/PreviousBtn";
import check from "../../Assets/check.svg";
import complete_logo from "../../Assets/complete_logo.svg";
import { useNavigate } from "react-router-dom";
import { useParkingForm } from "../../store/ParkingForm";
import { useEffect, useMemo, useRef } from "react";
import { useMyParkings } from "../../store/MyParkings";
import "../../Styles/Register/CompletePage.css";

const formatPrice = (n) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(
    Number(n || 0)
  );

const SDK_SRC =
  "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false&libraries=services";

async function ensureKakao() {
  if (window.kakao?.maps?.services) return;
  await new Promise((resolve, reject) => {
    const s = document.getElementById("kakao-map-sdk-services");
    if (s) {
      s.onload = resolve;
      s.onerror = reject;
      return;
    }
    const el = document.createElement("script");
    el.src = SDK_SRC;
    el.async = true;
    el.id = "kakao-map-sdk-services";
    el.onload = resolve;
    el.onerror = reject;
    document.head.appendChild(el);
  });
}

async function geocodeAddress(address) {
  if (!address || !address.trim()) return null;
  await ensureKakao();
  const geocoder = new window.kakao.maps.services.Geocoder();
  return new Promise((resolve) => {
    geocoder.addressSearch(address, (res, status) => {
      if (status === window.kakao.maps.services.Status.OK && res?.[0]) {
        resolve({ lng: Number(res[0].x), lat: Number(res[0].y) });
      } else {
        resolve(null);
      }
    });
  });
}

const CompletePage = () => {
  // ✅ lat/lng 포함
  const { name, charge, operateTimes, address, lat, lng, setField } =
    useParkingForm();
  const { upsert } = useMyParkings();
  const navigate = useNavigate();

  const didCommitRef = useRef(false); // 중복 방지

  const timesText = useMemo(
    () =>
      Array.isArray(operateTimes) && operateTimes.length > 0
        ? operateTimes.map((t) => `${t.start} ~ ${t.end}`).join(", ")
        : "-",
    [operateTimes]
  );

  useEffect(() => {
    if (didCommitRef.current) return;

    async function commit() {
      const key = `committed:${name}:${formatPrice(charge)}:${timesText}`;
      if (sessionStorage.getItem(key) === "1") return;

      // 좌표가 없으면 주소로 지오코딩(최종 안전망)
      let Lng = Number(lng);
      let Lat = Number(lat);
      const hasXY =
        Number.isFinite(Lng) && Number.isFinite(Lat) && Math.abs(Lng) > 0;

      if (!hasXY) {
        const fullAddr =
          typeof address === "string"
            ? address
            : address?.roadAddress || address?.address || "";
        const geo = await geocodeAddress(fullAddr);
        if (geo) {
          Lng = geo.lng;
          Lat = geo.lat;
          // 스토어에도 반영
          setField("lng", Lng);
          setField("lat", Lat);
        }
      }

      const genId =
        (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
        String(Date.now());

      upsert({
        id: genId,
        name: name || "내 주차장",
        enabled: true,
        charge: Number(charge || 0),
        operateTimes: Array.isArray(operateTimes) ? operateTimes : [],
        address:
          typeof address === "string" ? address : address?.roadAddress || "",
        // ✅ 최종 좌표
        lat: Number.isFinite(Lat) ? Lat : null,
        lng: Number.isFinite(Lng) ? Lng : null,
        type: "PRIVATE",
        origin: "local",
        createdAt: Date.now(),
      });

      sessionStorage.setItem(key, "1");
      didCommitRef.current = true;
    }

    commit();
    // 의존성: 주요 필드 변경 시 재시도되지만 key로 한 번만 수행
  }, [
    name,
    charge,
    timesText,
    operateTimes,
    address,
    lat,
    lng,
    setField,
    upsert,
  ]);

  return (
    <div className="complete-wrapper">
      <div>
        <PreviousBtn />
      </div>

      <div className="complete-check">
        <img src={check} alt="" />
      </div>

      <div>
        <h1 className="complete-title">주차 장소 등록 완료</h1>
      </div>

      <div>
        <div>
          <p className="complete-label-name">주차 장소 이름</p>
          <p className="complete-name">{name || "-"}</p>
        </div>

        <div>
          <p className="complete-label-time">주차 가능 시간</p>
          <p className="complete-time">{timesText}</p>
        </div>

        <div>
          <p className="complete-label-charge">주차 비용</p>
          <p className="complete-charge">
            {formatPrice(charge)}원 (10분당 비용)
          </p>
        </div>

        <div className="complete-logo">
          <img src={complete_logo} alt="" />
        </div>

        <div className="complete-next-btn">
          <NextBtn
            label="홈으로 가기"
            isActive
            onClick={() => navigate("/home")}
          />
        </div>
      </div>
    </div>
  );
};

export default CompletePage;
