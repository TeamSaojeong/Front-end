import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PreviousBtn from "../../components/Register/PreviousBtn";
import NextBtn from "../../components/Register/NextBtn";
import Address from "../../components/Register/Address";
import InputBox from "../../components/InputBox";
import AddImg from "../../components/Register/AddImg";
import { useParkingForm } from "../../store/ParkingForm";
import "../../Styles/Register/DescriptionPage.css";

/* ===== Kakao 지오코딩 ===== */
const SDK_SRC =
  "https://dapi.kakao.com/v2/maps/sdk.js?appkey=68f3d2a6414d779a626ae6805d03b074&autoload=false&libraries=services";

async function ensureKakao() {
  if (window.kakao?.maps?.services) return;
  await new Promise((resolve, reject) => {
    const prev = document.getElementById("kakao-map-sdk-services");
    if (prev) {
      prev.onload = resolve;
      prev.onerror = reject;
      return;
    }
    const s = document.createElement("script");
    s.src = SDK_SRC;
    s.async = true;
    s.id = "kakao-map-sdk-services";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  await new Promise((r) => window.kakao.maps.load(r));
}

async function geocodeAddressToXY(address) {
  if (!address || !address.trim()) return null;
  await ensureKakao();
  const geocoder = new window.kakao.maps.services.Geocoder();
  return new Promise((resolve) => {
    geocoder.addressSearch(address, (res, status) => {
      if (status === window.kakao.maps.services.Status.OK && res?.[0]) {
        resolve({ lng: Number(res[0].x), lat: Number(res[0].y) });
      } else {
        console.warn("[Geocode] 주소 변환 실패:", address, status);
        resolve(null);
      }
    });
  });
}

export default function DescriptionPage() {
  const navigate = useNavigate();
  const { address, content, image, setField } = useParkingForm();
  const [errors] = useState({});

  const hasAddress =
    typeof address === "string"
      ? !!address.trim()
      : !!address?.roadAddress || !!address?.address;
  const hasContent = !!(content || "").trim();
  const hasImage = image instanceof File || (!!image && !!image.name);
  const isActive = hasAddress && hasContent && hasImage;

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
        <p className="ds-address-title">주차 장소와 가장 근접한 위치</p>

        <Address
          onChange={async (addr) => {
            const zip =
              addr?.zonecode || addr?.zip || addr?.zipcode || addr?.postCode;
            const full =
              addr?.roadAddress || addr?.address || addr?.jibunAddress || "";

            if (zip) setField("zipcode", zip);
            setField("address", full);

            // 좌표 초기화
            setField("lat", null);
            setField("lng", null);

            // ✅ 검색결과에서 좌표 제공 시 그대로 사용
            if (addr?.x && addr?.y) {
              console.log(
                "[DescriptionPage] 검색결과 좌표 사용:",
                addr.y,
                addr.x
              );
              setField("lat", Number(addr.y));
              setField("lng", Number(addr.x));
              return;
            }

            // ✅ 없으면 geocode fallback
            const xy = await geocodeAddressToXY(full);
            console.log("[DescriptionPage] 주소 → 좌표 변환:", full, xy);

            setField("lat", xy?.lat ?? null);
            setField("lng", xy?.lng ?? null);
          }}
        />
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
        label="다음"
      />
    </div>
  );
}
