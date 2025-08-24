import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/PrivateOutSoon_cancel.css";

import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import infoyellow_icon from "../Assets/info-yellow.svg";

import PointModal from "../components/Modal/PointModal";

const pad2 = (n) => String(n).padStart(2, "0");
const formatHHMM = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const formatDiff = (start, end) => {
  const ms = Math.max(0, end.getTime() - start.getTime());
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0 && mm > 0) return `${h}시간 ${mm}분`;
  if (h > 0) return `${h}시간`;
  return `${mm}분`;
};

export default function PrivateOutSoon_cancel() {
  const navigate = useNavigate();
  const { state } = useLocation() || {};

  const placeName = state?.placeName ?? "콘하스 DDP 앞 주차장";

  // 현재 시간 기준으로 시간 계산
  const now = useMemo(() => new Date(), []);
  
  // 전달된 시간 정보 사용 (없으면 현재 시간 기준으로 계산)
  const startAt = useMemo(() => {
    if (state?.startAt) {
      return new Date(state.startAt);
    }
    // PayComplete에서 전달받은 시간이 없으면 현재 시간을 시작 시간으로
    return new Date(now);
  }, [state?.startAt, now]);
  
  const endAt = useMemo(() => {
    if (state?.endAt) {
      return new Date(state.endAt);
    }
    // PayComplete에서 전달받은 시간이 없으면 usingMinutes로 계산
    if (state?.usingMinutes) {
      return new Date(now.getTime() + Number(state.usingMinutes) * 60 * 1000);
    }
    // 기본값: 현재 시간 + 10분
    return new Date(now.getTime() + 10 * 60 * 1000);
  }, [state?.endAt, state?.usingMinutes, now]);

  const [open, setOpen] = useState(state?.openModal ?? true);

  // 시간 정보 디버깅
  useEffect(() => {
    console.log('[PrivateOutSoon_cancel] 시간 정보:', {
      currentTime: new Date().toLocaleString(),
      startAt: startAt.toLocaleString(),
      endAt: endAt.toLocaleString(),
      usingMinutes: state?.usingMinutes,
      state: state
    });
  }, [startAt, endAt, state]);

  // 남은 시간 계산 (실제 선택한 이용시간부터 계산)
  const [remainingTime, setRemainingTime] = useState(0);
  
  useEffect(() => {
    const calculateRemaining = () => {
      const now = new Date();
      // 실제 선택한 이용시간(endAt)부터 현재까지의 남은 시간 계산
      const remaining = Math.max(0, endAt.getTime() - now.getTime());
      setRemainingTime(remaining);
      
      // 시간이 다 되면 ParkingEnd로 이동
      if (remaining <= 0) {
        navigate("/parkingend", { 
          replace: true,
          state: {
            placeName,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            parkingId: state?.parkingId,
            parkName: state?.parkName,
            total: state?.total,
            usingMinutes: state?.usingMinutes,
            parkingInfo: state?.parkingInfo,
            orderId: state?.orderId,
            reservationId: state?.reservationId
          }
        });
      }
    };
    
    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [endAt, navigate, placeName, startAt, state]);

  // 남은 시간 포맷팅
  const formatRemainingTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 건너뛰기 버튼 클릭 핸들러
  const handleSkip = () => {
    navigate("/parkingend", {
      state: {
        placeName,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        parkingId: state?.parkingId,
        parkName: state?.parkName,
        total: state?.total,
        usingMinutes: state?.usingMinutes,
        parkingInfo: state?.parkingInfo,
        orderId: state?.orderId,
        reservationId: state?.reservationId
      }
    });
  };

  return (
    <div className="privatecancel-container">
      <div className="privatecancel-header">
        <div className="privatecancel-text">
          {placeName}
          <br />
          이용중...
        </div>
      </div>

      <div className="privatecancel-time-box">
        <div className="privatecancel-time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="privatecancel-time-text">
            {startAt && endAt
              ? `${formatHHMM(startAt)} ~ ${formatHHMM(endAt)} (${formatDiff(
                  startAt,
                  endAt
                )})`
              : "00:00 ~ 00:00 (—)"}
          </span>
        </div>
      </div>

      <div className="privatecancel-notice-box">
        <div className="privatecancel-notice-inner">
          <img src={infoyellow_icon} alt="안내 아이콘" className="info-icon" />
          <div className="privatecancel-notice-text">
            <p className="privatecancel-info-text1">
              이용 시간 꼭 확인하시고 잘 지켜주세요!
            </p>
            <p className="privatecancel-info-text2">
              무단으로 이용시간을 초과하면 신고를 받을 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* [시범용] 시간 건너뛰기 버튼 - notice box 바로 아래 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '16px 24px 0',
        width: 'calc(100% - 48px)'
      }}>
        <button
          onClick={handleSkip}
          style={{
            width: '227px',
            height: '33px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '8px 10px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            border: '1px solid #303030',
            background: '#303030',
            color: '#FFF',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#e8e8e8';
            e.target.style.color = '#333';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#f8f8f8';
            e.target.style.color = '#666';
          }}
          onMouseDown={(e) => {
            e.target.style.background = '#d8d8d8';
            e.target.style.transform = 'translateY(1px)';
          }}
          onMouseUp={(e) => {
            e.target.style.background = '#e8e8e8';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          [시범용] 시간 건너뛰기 버튼
        </button>
      </div>

      <div className="privatecancel-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="privatecancel-button-section">
        {/* '곧 나감'은 이미 눌렀으므로 항상 비활성화 */}
        <button
          className="privatecancel-outsoon is-disabled"
          disabled
          aria-disabled="true"
          tabIndex={-1}
          title="이미 '곧 나감'을 눌렀습니다"
        >
          곧 나감
        </button>
      </div>

      <PointModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
