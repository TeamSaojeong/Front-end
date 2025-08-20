import NextBtn from "../../components/Register/NextBtn";
import PreviousBtn from "../../components/Register/PreviousBtn";
import check from "../../Assets/check.svg";
import complete_logo from "../../Assets/complete_logo.svg";
import { useNavigate } from "react-router-dom";
import { useParkingForm } from "../../store/ParkingForm";
import { useEffect, useMemo } from "react";
import { useMyParkings } from "../../store/MyParkings";
import "../../Styles/Register/CompletePage.css";

const formatPrice = (n) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(
    Number(n || 0)
  );

const CompletePage = () => {
  const { name, charge, operateTimes, address } = useParkingForm();
  const { upsert } = useMyParkings();
  const navigate = useNavigate();

  const timesText = useMemo(
    () =>
      Array.isArray(operateTimes) && operateTimes.length > 0
        ? operateTimes.map((t) => `${t.start} ~ ${t.end}`).join(", ")
        : "-",
    [operateTimes]
  );

  // 한 번만 반영 (새로고침 중복 방지)
  useEffect(() => {
    const key = `committed:${name}:${formatPrice(charge)}:${timesText}`;
    if (sessionStorage.getItem(key) === "1") return;

    const genId =
      (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
      String(Date.now());

    upsert({
      id: genId,
      name: name || "내 주차장",
      enabled: true,
      charge: Number(charge || 0),
      operateTimes: Array.isArray(operateTimes) ? operateTimes : [],
      address:
        typeof address === "string" ? address : address?.roadAddress || "",
      createdAt: Date.now(),
    });

    sessionStorage.setItem(key, "1");
  }, [name, charge, timesText, operateTimes, address, upsert]);

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
          <p className="complete-name">{name || "-"}</p>
        </div>

        <div>
          <p className="complete-label-time">주차 가능 시간</p>
          <p className="complete-time">{timesText}</p>
        </div>

        <div>
          <p className="complete-label-charge">주차 비용</p>
          <p className="complete-charge">
            {formatPrice(charge)}원 (10분당 비용)
          </p>
        </div>

        <div className="complete-logo">
          <img src={complete_logo} alt="" />
        </div>

        <div className="complete-next-btn">
          <NextBtn
            label="홈으로 가기"
            isActive
            onClick={() => navigate("/home")}
          />
        </div>
      </div>
    </div>
  );
};

export default CompletePage;
