// src/pages/Register/NamePage.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InputBox from "../../components/InputBox";
import NextBtn from "../../components/Register/NextBtn";
import PreviousBtn from "../../components/Register/PreviousBtn";
import "../../Styles/Register/NamePage.css";
import { useParkingForm } from "../../store/ParkingForm";

const NamePage = () => {
  const { name, setField } = useParkingForm();
  const isActive = name.trim() !== "";
  const navigate = useNavigate();

  const handleNext = () => {
    if (!isActive) return;
    navigate("/description");
  };

  // ✅ 마운트 시 name 값 확인 (수정 모드면 이미 값이 들어옴)
  useEffect(() => {
    console.log("[NamePage] 현재 name:", name);
  }, [name]);

  return (
    <div className="name-Wrapper">
      <PreviousBtn />
      <div>
        <h1 className="name-title">주차 장소 이름</h1>
        <div>
          <p className="name-description">
            가까운 주변 건물 이름을 활용하면 더욱 알기 쉬워요!
            <br />
            EX) 'ㅇㅇㅇ대학교 앞 주차장'
          </p>
        </div>
      </div>

      <div>
        <p className="name-name">주차 장소 이름</p>
        <div>
          <InputBox
            value={name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="주차 장소 이름을 입력해 주세요(최대 25자)"
            maxLength={25}
          />
        </div>
      </div>

      <NextBtn
        isActive={isActive}
        onClick={handleNext}
        label="다음"
        className="name-custom-next"
      />
    </div>
  );
};

export default NamePage;
