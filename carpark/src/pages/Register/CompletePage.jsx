import NextBtn from "../../components/Register/NextBtn";
import PreviousBtn from "../../components/Register/PreviousBtn";
import check from "../../Assets/check.svg";
import complete_logo from "../../Assets/complete_logo.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { useParkingForm } from "../../store/ParkingForm";
import { useMemo } from "react";
import "../../Styles/Register/CompletePage.css";

const formatPrice = (n) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(
    Number(n || 0)
  );

const CompletePage = () => {
  const { state } = useLocation();
  const detailFromState = state?.detail || null;

  const { name, charge, operateTimes, reset } = useParkingForm();

  const navigate = useNavigate();

  // 운영 시간 텍스트
  const timesText = useMemo(() => {
    const times =
      detailFromState?.operateTimes ||
      (Array.isArray(operateTimes) ? operateTimes : []);
    return times.length > 0
      ? times.map((t) => `${t.start} ~ ${t.end}`).join(", ")
      : "-";
  }, [detailFromState?.operateTimes, operateTimes]);

  // 서버 detail 우선 표시, 없으면 폼 값 표시
  const displayName =
    detailFromState?.parkingName || detailFromState?.name || name || "-";
  const displayCharge = detailFromState?.charge ?? charge ?? 0;

  return (
    <div className="complete-wrapper">
      <div>
        <PreviousBtn />
      </div>

      <div className="complete-check">
        <img src={check} alt="" />
      </div>

      <div>
        <h1 className="complete-title">주차 장소 등록 완료</h1>
      </div>

      <div>
        <div>
          <p className="complete-label-name">주차 장소 이름</p>
          <p className="complete-name">{displayName}</p>
        </div>

        <div>
          <p className="complete-label-time">주차 가능 시간</p>
          <p className="complete-time">{timesText}</p>
        </div>

        <div>
          <p className="complete-label-charge">주차 비용</p>
          <p className="complete-charge">
            {formatPrice(displayCharge)}원 (10분당 비용)
          </p>
        </div>

        <div className="complete-logo">
          <img src={complete_logo} alt="" />
        </div>

        <div className="complete-next-btn">
          <NextBtn
            label="홈으로 가기"
            isActive
            onClick={() => {
              reset(); // 다음 등록 대비 폼 리셋
              navigate("/home");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CompletePage;