// src/pages/Register/DescriptionPage.jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PreviousBtn from "../../components/Register/PreviousBtn";
import NextBtn from "../../components/Register/NextBtn";
import Address from "../../components/Register/Address";
import InputBox from "../../components/InputBox";
import AddImg from "../../components/Register/AddImg";
import { useParkingForm } from "../../store/ParkingForm";
import "../../Styles/Register/DescriptionPage.css";

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

export default function DescriptionPage() {
  const navigate = useNavigate();
  const { address, content, image, setField } = useParkingForm();
  const [busy, setBusy] = useState(false);

  // 주소/설명/이미지 모두 있어야 다음 활성화
  const hasAddress =
    typeof address === "string"
      ? !!address.trim()
      : !!address?.roadAddress || !!address?.address;
  const hasContent = !!(content || "").trim();
  const hasImage = image instanceof File || (!!image && !!image.name);
  const isActive = hasAddress && hasContent && hasImage && !busy;

  const onAddressChange = async (addr) => {
    // 주소 저장
    const zip = addr?.zonecode || addr?.zip || addr?.zipcode || addr?.postCode;
    const full = addr?.roadAddress || addr?.address || addr?.jibunAddress || "";
    if (zip) setField("zipcode", zip);
    setField("address", full);

    // 우선 전달 좌표 그대로 저장
    const x = Number(addr?.x ?? addr?.lng ?? addr?.lon);
    const y = Number(addr?.y ?? addr?.lat);
    const hasXY = Number.isFinite(x) && Number.isFinite(y);
    if (hasXY) {
      setField("lng", x);
      setField("lat", y);
      return;
    }

    // 좌표가 없으면 즉시 지오코딩으로 보완
    if (full) {
      try {
        setBusy(true);
        const geo = await geocodeAddress(full);
        if (geo) {
          setField("lng", geo.lng);
          setField("lat", geo.lat);
        }
      } finally {
        setBusy(false);
      }
    }
  };

  const handleNext = () => {
    if (!isActive) return;
    navigate("/time");
  };

  return (
    <div className="ds-wrapper">
      <PreviousBtn />

      <div>
        <h1 className="ds-title"> 주차 장소 설명</h1>
        <p className="ds-content">
          주차 위치를 이용자가 찾기 쉽도록 주차 장소에 대한
          <br />
          설명을 작성해주세요!
        </p>
      </div>

      <div>
        <p className="ds-address-title">주차 장소과 가장 근접한 위치</p>

        {/* ✅ 주소 선택 시 좌표까지 확보 */}
        <Address onChange={onAddressChange} />
      </div>

      <div>
        <div>
          <p className="ds-img-title">주차 장소 사진&설명</p>
        </div>
        <div className="ds-img_upload">
          <AddImg onChange={(file) => setField("image", file)} />
        </div>
      </div>

      <div className="ds-input-wrapper">
        <InputBox
          className="ds-input"
          value={content}
          onChange={(e) => setField("content", e.target.value)}
          placeholder="주차 장소 상세 설명"
          maxLength={80}
        />
      </div>

      <NextBtn
        disabled={!isActive}
        isActive={isActive}
        onClick={handleNext}
        className="ds-nextBtn"
        label={busy ? "좌표 확인 중..." : "다음"}
      />
    </div>
  );
}
