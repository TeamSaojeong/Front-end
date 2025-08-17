import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NextBtn from "../../components/Register/NextBtn";
import PreviousBtn from "../../components/Register/PreviousBtn";
import TimePicker from "../../components/Register/TimePicker";
import "../../Styles/Register/TimePage.css";
const TimePage = () => {
  const [time, setTime] = useState("");
  const navigate = useNavigate();

  // const handleNext = () => {
  //     if() return;
  //     navigate("/description");
  // }
  return (
    <div className="time-wrapper">
      <PreviousBtn />
      <div>
        <h1 className="time-title">주차 가능 시간 설정</h1>
        <p className="time-description">
          10분 단위로 주차 가능한 시간을 설정해주세요.
          <br />
          (주차 가능 최소 10분 이상이여야 합니다.)
        </p>
      </div>

      <div>
        <TimePicker />
      </div>

      <div>
        <NextBtn />
      </div>
    </div>
  );
};

export default TimePage;
