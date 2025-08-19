import { useState } from "react";
import close from "../Assets/close.svg";
import PreviousBtn from "../components/Register/PreviousBtn";
import "../Styles/ReportPage.css";
import radio_button_off from "../Assets/radio_button_off.svg";
import radio_button_on from "../Assets/radio_button_on.svg";
import NextBtn from "../components/Register/NextBtn";
import parkname from "../Assets/parkname.svg";
import InputBox from "../components/InputBox";
import AddImg from "../components/Register/AddImg";
import { useParkingForm } from "../store/ParkingForm";

const ReportPage = () => {
  const { name } = useParkingForm();

  // 라디오(세 가지 중 하나만)
  const [selected, setSelected] = useState({
    one: false,
    two: false,
    three: false,
  });

  // one일 때 필요한 입력들
  const [carNum, setCarNum] = useState("");
  const [imageFile, setImageFile] = useState(null);

  // 라디오 토글: 단일 선택 + one 해제 시 입력 초기화
  const handleToggle = (key) => {
    const next = {
      one: key === "one" ? !selected.one : false,
      two: key === "two" ? !selected.two : false,
      three: key === "three" ? !selected.three : false,
    };
    // one이 꺼지는 경우 입력값 초기화
    if (!next.one) {
      setCarNum("");
      setImageFile(null);
    }
    setSelected(next);
  };

  // AddImg에서 파일 받기(컴포넌트 구현에 따라 file 또는 event 둘 다 수용)
  const handleAddImgChange = (payload) => {
    if (!payload) {
      setImageFile(null);
      return;
    }
    if (payload instanceof File) {
      setImageFile(payload);
      return;
    }
    // e.target.files[0] 형태도 허용
    const maybeFile = payload?.target?.files?.[0];
    setImageFile(maybeFile ?? null);
  };

  // 다음 버튼 활성화 조건
  // - one: 차량번호 + 이미지 모두 필요
  // - two/three: 택 1 선택만으로 가능
  const canProceed = selected.one
    ? carNum.trim().length > 0 && !!imageFile
    : selected.two || selected.three;

  return (
    <div className="rp-wrapper">
      <PreviousBtn img={close} />

      <div>
        <h1 className="rp-title">주차 장소 신고</h1>
        <p className="rp-title-desc">신고 사유를 알려주세요</p>
      </div>

      <div className="rp-check">
        <div className="rp-check-own">
          예약 시간 초과 점유 및 무단 주차 차량이 있어요
          <img
            className="rp-check-box"
            src={selected.one ? radio_button_on : radio_button_off}
            alt="사유1 선택"
            onClick={() => handleToggle("one")}
          />
        </div>

        {/* one 선택 시에만 입력 영역 렌더링 */}
        {selected.one && (
          <div className="rg-own-check">
            <p className="rg-carnum">차량번호</p>
            <InputBox
              className="rg-carnum-input"
              value={carNum}
              onChange={(e) => setCarNum(e.target.value)}
              placeholder="EX) 123가4568"
              maxLength={8}
            />
            <AddImg
              className="rg-carnum-addimg"
              onChange={handleAddImgChange}
            />
          </div>
        )}

        <div className="rp-check-two">
          NFC 태그할 곳이 안 보여요
          <img
            className="rp-check-box"
            src={selected.two ? radio_button_on : radio_button_off}
            alt="사유2 선택"
            onClick={() => handleToggle("two")}
          />
        </div>

        <div className="rp-check-three">
          등록된 정보와 실제 주차 장소 정보가 틀려요
          <img
            className="rp-check-box"
            src={selected.three ? radio_button_on : radio_button_off}
            alt="사유3 선택"
            onClick={() => handleToggle("three")}
          />
        </div>
      </div>

      {/* 하단 장소명 배지 */}
      <div className="rg-parkname-wrap">
        <img src={parkname} alt="" />
        <span className="rg-parkname">{name}</span>
      </div>

      {/* 다음 버튼: 활성 조건 적용 */}
      <NextBtn
        className="rp-next-wrap"
        label="신고하기"
        isActive={!!canProceed}
      />
    </div>
  );
};

export default ReportPage;
