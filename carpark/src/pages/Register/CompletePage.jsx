import NextBtn from "../../components/Register/NextBtn";
import PreviousBtn from "../../components/Register/PreviousBtn";
import check from "../../Assets/check.svg";
import complete_logo from "../../Assets/complete_logo.svg";
import { useNavigate } from "react-router-dom";
import { useParkingForm } from "../../store/ParkingForm";
import "../../Styles/Register/CompletePage.css";

const CompletePage = () => {
  const { name, charge, operateTimes } = useParkingForm();
  const start = operateTimes[0]?.start || "";
  const end = operateTimes[0]?.end || "";

  const navigate = useNavigate();

  return (
    <div className="Wrapper">
      <div>
        <PreviousBtn />
      </div>

      <div className="check">
        <img src={check} />
      </div>

      <div>
        <h1
          className="
                title"
        >
          주차 장소 등록 완료
        </h1>
      </div>

      <div>
        <div>
          <p className="label-name">주차 장소 이름</p>
          <p className="name">{name}</p>
        </div>

        <div>
          <p className="label-time">주차 가능 시간</p>
          <p className="time">
            {start} ~ {end}
          </p>
        </div>

        <div>
          <p className="label-charge">주차 비용</p>
          <p className="charge">{charge}원 (10분당 비용)</p>
        </div>
      </div>

      <div className="logo">
        <img src={complete_logo} />
      </div>

      <div className="next-btn">
        <NextBtn onClick={useNavigate("/home")} />
      </div>
    </div>
  );
};

export default CompletePage;
