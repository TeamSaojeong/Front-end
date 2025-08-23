import { useLocation, useNavigate } from "react-router-dom";
import { DaumPostcodeEmbed } from "react-daum-postcode";
import PreviousBtn from "../../components/Register/PreviousBtn";
import styled, { createGlobalStyle } from "styled-components";

/* ===== Kakao 지오코딩 유틸 ===== */
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

const ZipCodePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || -1;

  const handleComplete = async (data) => {
    try {
      const addr =
        data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;

      console.log("[ZipCodePage] 주소 선택됨:", data);

      // ✅ 좌표 구하기 (오류 시 null 처리)
      let xy = null;
      try {
        const full = data.roadAddress || data.jibunAddress || addr;
        xy = await geocodeAddressToXY(full);
        console.log("[ZipCodePage] 좌표 변환 결과:", xy);
      } catch (geocodeError) {
        console.warn("[ZipCodePage] 좌표 변환 실패:", geocodeError);
      }

      const selectedAddress = {
        zipcode: data.zonecode || "",
        address: addr || "",
        roadAddress: data.roadAddress || "",
        jibunAddress: data.jibunAddress || "",
        lat: xy?.lat ?? null,
        lng: xy?.lng ?? null,
      };

      console.log("[ZipCodePage] 선택된 주소:", selectedAddress);

      if (typeof returnTo === "string") {
        navigate(returnTo, { state: { selectedAddress }, replace: true });
      } else {
        navigate(-1, { state: { selectedAddress }, replace: true });
      }
    } catch (error) {
      console.error("[ZipCodePage] handleComplete 오류:", error);
      alert("주소 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <>
      <ZipOverrides />
      <Wrapper className="zip-page">
        <Back className="zip-back">
          <Backinner>
            <PreviousBtn onClick={() => navigate(-1)} />
          </Backinner>
        </Back>
        <div style={{ maxWidth: 720, margin: "26px auto" }}>
          <DaumPostcodeEmbed
            onComplete={handleComplete}
            style={{ width: "342px", height: "597px" }}
            animation
          />
        </div>
      </Wrapper>
    </>
  );
};

export default ZipCodePage;

/* 스타일 */
const Wrapper = styled.div`
  background-color: rgba(255, 255, 255, 1);
  width: 24.375rem;
  min-height: 52.75rem;
  margin: 0 auto;
  position: relative;
  box-sizing: border-box;
  padding: 0 1.5rem;
`;

const ZipOverrides = createGlobalStyle`
  .zip-page .back {
    margin-top: 0 !important;
    position: sticky;
    top: 0;
    z-index: 1000;
    background: #fff;
  }
`;

const Back = styled.div`
  height: 3.5rem;
  margin-top: 2.75rem;
  width: 100%;
  position: sticky;
  z-index: 1000;
`;

const Backinner = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
`;
