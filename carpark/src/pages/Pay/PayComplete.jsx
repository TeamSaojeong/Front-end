import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/Pay/PayComplete.css";

import car_icon from "../../Assets/paycomplete.svg";
import clock_icon from "../../Assets/clock.svg";

const fmt = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const PayComplete = () => {
  const navigate = useNavigate();
  const { state } = useLocation() || {};
 
  const startAt = state?.startAt ? new Date(state.startAt) : null;
  const endAt = state?.endAt ? new Date(state.endAt) : null;
  const lotName = state?.lotName || "";
  
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId');
  const reservationId = params.get('reservationId');

  console.log('[PayComplete] URL 파라미터:', {
    orderId,
    reservationId,
    fullUrl: window.location.href
  });

  const totalMin =
    startAt && endAt
      ? Math.max(0, Math.round((endAt - startAt) / 60000))
      : null;

  const timeText =
    startAt && endAt
      ? `${fmt.format(startAt)} ~ ${fmt.format(endAt)} (${Math.floor(
          totalMin / 60
        )}시간 ${totalMin % 60}분)`
      : "시간 정보 없음";

  return (
    <div className="paycomplete-container">
      <div className="paycomplete-header">
        <div className="paycomplete-text">
          결제완료
          <br />
          <p>
            정상적으로 결제가 완료되었습니다.
            <br />
            {orderId && (
              <>
                주문번호: <b>{orderId}</b>
                <br />
              </>
            )}
            {reservationId && (
              <>
                예약번호: <b>{reservationId}</b>
                <br />
              </>
            )}
            {lotName && (
              <>
                {lotName}
                <br />
              </>
            )}
            자동으로 화면이 넘어갈 예정입니다.
          </p>
        </div>
      </div>

      <div className="paycomplete-time-box">
        <div className="paycomplete-time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="paycomplete-time-text">{timeText}</span>
        </div>
      </div>

      <div className="paycomplete-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="paycomplete-button-section">
        <button
          className="paycomplete-outsoon"
          onClick={() => navigate("/home")}
        >
          주차를 해주세요!
        </button>
      </div>
    </div>
  );
};

export default PayComplete;
