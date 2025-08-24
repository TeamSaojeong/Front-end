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
  
  // 주차장 정보 파라미터 추가
  const parkingId = params.get('parkingId');
  const parkName = params.get('parkName');
  const total = params.get('total');
  const usingMinutes = params.get('usingMinutes');
  const parkingInfoStr = params.get('parkingInfo');
  
  // 예약 시간 정보 파라미터 추가
  const startAtParam = params.get('startAt');
  const endAtParam = params.get('endAt');
  
  // 주차장 상세 정보 파싱
  let parkingInfo = null;
  if (parkingInfoStr) {
    try {
      parkingInfo = JSON.parse(parkingInfoStr);
    } catch (e) {
      console.error('주차장 정보 파싱 실패:', e);
    }
  }

  console.log('[PayComplete] URL 파라미터:', {
    orderId,
    reservationId,
    parkingId,
    parkName,
    total,
    usingMinutes,
    startAtParam,
    endAtParam,
    parkingInfo,
    fullUrl: window.location.href
  });

  // 예약 시간 계산 (PvTimeSelect에서 전달받은 시간 사용)
  const getReservationTimeText = () => {
    // URL 파라미터에서 예약 시간이 있으면 사용
    if (startAtParam && endAtParam) {
      const startTime = new Date(startAtParam);
      const endTime = new Date(endAtParam);
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      let durationText = "";
      if (hours > 0) {
        durationText = `(${hours}시간 ${minutes}분)`;
      } else {
        durationText = `(${minutes}분)`;
      }
      
      return `${fmt.format(startTime)} ~ ${fmt.format(endTime)} ${durationText}`;
    }
    
    // URL 파라미터에 없으면 usingMinutes로 계산 (fallback)
    if (usingMinutes) {
      const now = new Date();
      const startTime = new Date(now);
      const endTime = new Date(now.getTime() + Number(usingMinutes) * 60 * 1000);
      
      const hours = Math.floor(Number(usingMinutes) / 60);
      const minutes = Number(usingMinutes) % 60;
      
      let durationText = "";
      if (hours > 0) {
        durationText = `(${hours}시간 ${minutes}분)`;
      } else {
        durationText = `(${minutes}분)`;
      }
      
      return `${fmt.format(startTime)} ~ ${fmt.format(endTime)} ${durationText}`;
    }
    
    return "시간 정보 없음";
  };

  const timeText = getReservationTimeText();

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
            {(parkName || lotName) && (
              <>
                주차장: <b>{parkName || lotName}</b>
                <br />
              </>
            )}
            {parkingId && (
              <>
                주차장 ID: <b>{parkingId}</b>
                <br />
              </>
            )}
            {total && (
              <>
                결제 금액: <b>{Number(total).toLocaleString()}원</b>
                <br />
              </>
            )}
            {usingMinutes && (
              <>
                이용 시간: <b>{Math.floor(Number(usingMinutes) / 60)}시간 {Number(usingMinutes) % 60}분</b>
                <br />
              </>
            )}
            {parkingInfo?.address && (
              <>
                주소: <b>{parkingInfo.address}</b>
                <br />
              </>
            )}
            {parkingInfo?.charge && (
              <>
                10분당 요금: <b>{Number(parkingInfo.charge).toLocaleString()}원</b>
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
