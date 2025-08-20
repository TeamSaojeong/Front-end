import { useNavigate } from "react-router-dom";
import { useState } from "react";
import PreviousBtn from "../../components/Register/PreviousBtn";
import NextBtn from "../../components/Register/NextBtn";
import Address from "../../components/Register/Address";
import InputBox from "../../components/InputBox";
import AddImg from "../../components/Register/AddImg";
import { useParkingForm } from "../../store/ParkingForm";
import "../../Styles/Register/DescriptionPage.css";

export default function DescriptionPage() {
  const navigate = useNavigate();
  const { address, content, image, setField } = useParkingForm();
  const [errors] = useState({});

  // 주소/설명/이미지 모두 있어야 다음 활성화
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
        <p className="ds-address-title">주차 장소과 가장 근접한 위치</p>

        {/* Address 컴포넌트가 넘겨주는 객체를 그대로 저장 */}
        <Address
          onChange={(addr) => {
            // 가능한 필드들 흡수
            const zip =
              addr?.zonecode || addr?.zip || addr?.zipcode || addr?.postCode;
            const full =
              addr?.roadAddress || addr?.address || addr?.jibunAddress || "";
            if (zip) setField("zipcode", zip);
            setField("address", full);
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
