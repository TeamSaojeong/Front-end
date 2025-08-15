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

  //이름과 설명, 이미지가 있어야 다음으로 이동 가능
  const isActive =
    name.trim() !== "" && content.trim() !== "" && image !== null;

  const handleNext = () => {
    if (!isActive) return;
    navigate("/time");
  };

  return (
    <div className="Wrapper">
      <PreviousBtn />

      <div>
        <h1 className="title"> 주차 장소 설명</h1>
        <p className="description">
          주차 위치를 이용자가 찾기 쉽도록 주차 장소에 대한
          <br />
          설명을 작성해주세요!
        </p>
      </div>

      <div>
        <p className="address-title">주차 장소과 가장 근접한 위치</p>
        <Address />
      </div>

      <div>
        <p className="img-title">주차 장소 사진&설명</p>
        <AddImg onChange={(file) => setField("image", file)} />
      </div>

      <div className="input-wrapper">
        <InputBox
          className="input"
          value={content}
          onChange={(e) => setField("content", e.target.value)}
          placeholder="주차 장소 상세 설명"
          maxLength={80}
        />
      </div>

      <NextBtn disabled={!isActive} onClick={handleNext} />
    </div>
  );
};

export default DescriptionPage;
