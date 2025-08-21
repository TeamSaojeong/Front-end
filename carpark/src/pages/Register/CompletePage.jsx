import NextBtn from "../../components/Register/NextBtn";
import PreviousBtn from "../../components/Register/PreviousBtn";
import check from "../../Assets/check.svg";
import complete_logo from "../../Assets/complete_logo.svg";
import { useLocation, useNavigate } from "react-router-dom";
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

function loadScriptOnce(src, id) {
  return new Promise((resolve, reject) => {
    const prev = document.getElementById(id);
    if (prev) {
      if (window.kakao?.maps) return resolve();
      prev.onload = resolve;
      prev.onerror = reject;
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.id = id;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
async function ensureKakao() {
  if (window.kakao?.maps?.services) return;
  await loadScriptOnce(SDK_SRC, "kakao-map-sdk");
  await new Promise((r) => window.kakao.maps.load(r));
}
async function geocodeAddress(address) {
  if (!address || !address.trim()) return null;
  await ensureKakao();
  const geocoder = new window.kakao.maps.services.Geocoder();
  return new Promise((resolve) => {
    geocoder.addressSearch(address, (res, status) => {
      if (status === window.kakao.maps.services.Status.OK && res?.[0]) {
        resolve({ lng: Number(res[0].x), lat: Number(res[0].y) });
      } else resolve(null);
    });
  });
}

const CompletePage = () => {
  const { state } = useLocation();
  const parkingId = state?.parkingId || null;
  const detailFromState = state?.detail || null;

  const {
    name,
    charge,
    operateTimes,
    address,
    lat,
    lng,
    content,
    image,
    setField,
    reset,
  } = useParkingForm();
  const { upsert } = useMyParkings();
  const navigate = useNavigate();

  const didCommitRef = useRef(false);

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
      const addrKey =
        typeof address === "string"
          ? address
          : address?.roadAddress || address?.address || "";

      // 중복방지 키(등록id/주소 포함)
      const key = `committed:${parkingId || "noid"}:${name}:${formatPrice(
        charge
      )}:${timesText}:${addrKey}`;
      if (sessionStorage.getItem(key) === "1") return;

      // 좌표 보정(서버 응답에 없으면 주소 지오코딩)
      let Lng = Number(lng);
      let Lat = Number(lat);
      const hasXY =
        Number.isFinite(Lng) && Number.isFinite(Lat) && Math.abs(Lng) > 0;

      if (!hasXY) {
        const geo = await geocodeAddress(addrKey);
        if (geo) {
          Lng = geo.lng;
          Lat = geo.lat;
          setField("lng", Lng);
          setField("lat", Lat);
        }
      }

      // 서버 상세(state.detail) 우선 사용
      const d = detailFromState || {};
      const serverName = d.parkingName || d.name;
      const serverCharge = d.charge;
      const serverAddress = d.address;
      const serverContent = d.content || d.description || d.desc;
      const serverTimes = Array.isArray(d.operateTimes) ? d.operateTimes : null;
      // 서버가 image URL을 같이 주면 사용
      const serverImageUrl = typeof d.image === "string" ? d.image : null;

      const id =
        parkingId ||
        (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
        String(Date.now());

      upsert({
        id,
        name: serverName || name || "내 주차장",
        enabled: true,
        charge: Number(serverCharge ?? charge ?? 0),
        operateTimes:
          serverTimes || (Array.isArray(operateTimes) ? operateTimes : []),
        address: serverAddress || addrKey,
        content: String(serverContent ?? content ?? "").trim(),
        lat: Lat ?? null,
        lng: Lng ?? null,
        imageUrl: serverImageUrl || null, // 서버 이미지 URL 있으면 저장
        type: "PRIVATE",
        origin: parkingId ? "server" : "local",
        createdAt: Date.now(),
      });

      sessionStorage.setItem(key, "1");
      didCommitRef.current = true;
    }

    commit();
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
    parkingId,
    detailFromState,
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
            onClick={() => {
              reset(); // 다음 등록 대비 폼 리셋
              navigate("/home");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CompletePage;
