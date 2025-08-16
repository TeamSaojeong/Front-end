import { useNavigate } from "react-router-dom";
import PreviousBtn from "../../components/Register/PreviousBtn";
import NextBtn from "../../components/Register/NextBtn";
import Address from "../../components/Register/Address";
import InputBox from "../../components/InputBox";
import AddImg from "../../components/Register/AddImg";
import { useParkingForm } from "../../store/ParkingForm";
import { ApiRegister } from "../../apis/register";
import "../../Styles/Register/DescriptionPage.css";
const DescriptionPage = () => {
  const navigate = useNavigate();
  const { name, address, content, image, setField, reset } = useParkingForm();

  const hasAddress = typeof address === "string" ? !!address.trim() : !!address?.zip || !!address?.zonecode || !!address.roa || !!address?.roadAddress;
  const hasContent = !!content?.trim();
  const hasImage = (image instanceof File) || (!!image && !!image.name);
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
        <Address onchange={(addr) =>setField("address", addr)}/>
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

      <NextBtn disabled={!isActive} onClick={handleNext} className="ds-nextBtn"/>
    </div>
  );
};

export default DescriptionPage;
