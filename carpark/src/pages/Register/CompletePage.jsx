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
  const isActive =true;
  const navigate = useNavigate();

  return (
    <div className="complete-wrapper">
      <div>
        <PreviousBtn />
      </div>

      <div className="complete-check">
        <img src={check} />
      </div>

      <div>
        <h1
          className="complete-title">
          주차 장소 등록 완료
        </h1>
      </div>

      <div>
        <div>
          <p className="complete-label-name">주차 장소 이름</p>
          <p className="complete-name">{name}</p>
        </div>

        <div>
          <p className="complete-label-time">주차 가능 시간</p>
          <p className="complete-time">
            {start} ~ {end}
          </p>
        </div>

        <div>
          <p className="complete-label-charge">주차 비용</p>
          <p className="complete-charge">{charge}원 (10분당 비용)</p>
        </div>

      <div className="complete-logo">
        <img src={complete_logo} />
      </div>

      <div className="complete-next-btn">
        <NextBtn label="홈으로 가기" isActive={isActive} onClick={()=>navigate("/home")} />
      </div>
    </div>
    </div>
  );
};

export default CompletePage;