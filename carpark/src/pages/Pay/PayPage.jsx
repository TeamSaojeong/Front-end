import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/Pay/PayPage.css";

import arrow from "../../Assets/arrow.png";
import kakaopay from "../../Assets/kakaopay.svg";

import { getPublicDetail } from "../../apis/parking"; // preparePayment 제거

const KRW = (n) =>
  (isNaN(n) ? 0 : Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원";

const KRW_NUM = (n) =>
  (isNaN(n) ? 0 : Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const hhmm = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export default function PayPage() {
  const navigate = useNavigate();
  const { state, search } = useLocation() || {};
  const qs = new URLSearchParams(search || "");

  console.log("[PayPage] 받은 state 정보:", state);
  console.log("[PayPage] parkingInfo:", state?.parkingInfo);
  
  // URL 파라미터에서 placeId 가져오기
  const placeIdFromUrl = qs.get("placeId");
  console.log("[PayPage] URL 파라미터 placeId:", placeIdFromUrl);
  
  // 주차장 정보 가져오기 함수
  const getParkingInfo = () => {
    // 1. state에서 받은 정보 우선
    if (state?.parkingInfo) {
      // state에서 받은 정보를 sessionStorage에 저장
      try {
        sessionStorage.setItem('nfcParkingInfo', JSON.stringify(state.parkingInfo));
        console.log("[PayPage] state에서 받은 주차장 정보를 sessionStorage에 저장:", state.parkingInfo);
      } catch (error) {
        console.error("[PayPage] sessionStorage 저장 실패:", error);
      }
      return state.parkingInfo;
    }
    
    // 2. sessionStorage에서 placeId로 검색
    if (placeIdFromUrl) {
      try {
        const saved = sessionStorage.getItem('nfcParkingInfo');
        if (saved) {
          const info = JSON.parse(saved);
          if (info.id == placeIdFromUrl || info.placeId == placeIdFromUrl) {
            console.log("[PayPage] sessionStorage에서 주차장 정보 찾음:", info);
            return info;
          }
        }
      } catch (error) {
        console.error("[PayPage] sessionStorage 로드 실패:", error);
      }
    }
    
    // 3. localStorage 백업 확인
    try {
      const backup = localStorage.getItem('lastNfcParkingInfo');
      if (backup) {
        const info = JSON.parse(backup);
        if (placeIdFromUrl && (info.id == placeIdFromUrl || info.placeId == placeIdFromUrl)) {
          console.log("[PayPage] localStorage에서 주차장 정보 찾음:", info);
          return info;
        }
      }
    } catch (error) {
      console.error("[PayPage] localStorage 로드 실패:", error);
    }
    
    return null;
  };

  const parkingInfo = getParkingInfo();
  console.log("[PayPage] 최종 주차장 정보:", parkingInfo);

  // A) 바로 리디렉트 모드(이 로직은 유지하되, 버튼은 직접 완료 페이지로 이동)
  const paymentUrl =
    state?.paymentUrl || state?.data?.paymentRedirectUrl || null;
  const presetReservationId =
    state?.reservationId || state?.data?.reservationId || null;

  // B) 계산/예약 모드
  const parkingId = state?.parkingId ?? state?.lotId ?? 28;

  const startAt = state?.startAt ? new Date(state.startAt) : new Date();
  const endAt = state?.endAt
    ? new Date(state.endAt)
    : new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
  const startInMinutes = state?.startInMinutes;

  // C) NFC/PvTimeSelect에서 넘어온 정보 (parkingInfo 우선 사용)
  const parkName =
    parkingInfo?.name || state?.parkingInfo?.name || state?.parkName || "주차장";
  const total = state?.total || state?.estimatedCost || 0;
  const usingMinutes = state?.usingMinutes || state?.durationMin || 10;

  console.log("[PayPage] 주차장 데이터 확인:", {
    parkingInfo: parkingInfo,
    stateParkingInfo: state?.parkingInfo,
    parkName: state?.parkName,
    finalParkName: parkName,
    charge: parkingInfo?.charge || state?.parkingInfo?.charge,
    pricePer10Min: parkingInfo?.charge || state?.parkingInfo?.charge || 0,
    availableTimes: parkingInfo?.availableTimes || state?.parkingInfo?.availableTimes || state?.openRangesText,
  });

  // D) 주문/예약 ID
  const orderId = state?.orderId || null;
  const reservationId = state?.reservationId || null;

  console.log("[PayPage] 추출된 정보:", {
    parkingId,
    parkName,
    total,
    usingMinutes,
    startAt,
    endAt,
  });

  // 화면 데이터 (parkingInfo 우선 사용)
  const [loading, setLoading] = useState(!parkName);
  const [lotName, setLotName] = useState(parkName);
  const [pricePer10Min, setPricePer10Min] = useState(
    parkingInfo?.charge || state?.parkingInfo?.charge || state?.pricePer10Min || 0
  );
  const [availableTimes, setAvailableTimes] = useState(
    parkingInfo?.availableTimes ||
      state?.parkingInfo?.availableTimes ||
      state?.openRangesText ||
      "운영시간 정보 없음"
  );
  const [nearbyAvg10Min, setNearbyAvg10Min] = useState(null);
  const [posting, setPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 이용 시간(분)
  const minutes = useMemo(() => {
    if (usingMinutes > 0) return usingMinutes;
    const diff = Math.max(0, Math.round((endAt - startAt) / 60000));
    return diff;
  }, [startAt, endAt, usingMinutes]);

  const hoursPart = Math.floor(minutes / 60);
  const minsPart = minutes % 60;

  // 요금 계산
  const billableUnits = useMemo(() => Math.ceil(minutes / 10), [minutes]);
  const fee = useMemo(() => {
    if (total > 0) return total;
    return billableUnits * pricePer10Min;
  }, [billableUnits, pricePer10Min, total]);

  const svcRate = 0.1;
  const svcFee = useMemo(() => {
    if (total > 0) return Math.round(total * svcRate);
    return Math.round(fee * svcRate);
  }, [fee, total, svcRate]);

  const finalTotal = useMemo(() => {
    return total > 0 ? total + svcFee : fee + svcFee;
  }, [fee, svcFee, total]);

  // 1) 리디렉트 모드 유지(외부 URL이 넘어온 경우)
  useEffect(() => {
    if (paymentUrl) {
      window.location.href = paymentUrl;
      return;
    }
    if (presetReservationId) {
      navigate("/paycomplete", {
        replace: true,
        state: { reservationId: presetReservationId },
      });
    }
  }, [paymentUrl, presetReservationId, navigate]);

  // 2) 주차장 정보 업데이트 (parkingInfo가 있으면 즉시 사용)
  useEffect(() => {
    if (parkingInfo) {
      console.log("[PayPage] parkingInfo로 화면 데이터 업데이트:", parkingInfo);
      setLotName(parkingInfo.name || parkName);
      setPricePer10Min(parkingInfo.charge || pricePer10Min);
      setAvailableTimes(parkingInfo.availableTimes || availableTimes);
      setLoading(false);
      
      // sessionStorage에 주차장 정보 저장 (PayComplete에서 사용하기 위해)
      try {
        sessionStorage.setItem('nfcParkingInfo', JSON.stringify(parkingInfo));
        console.log("[PayPage] sessionStorage에 주차장 정보 저장:", parkingInfo);
      } catch (error) {
        console.error("[PayPage] sessionStorage 저장 실패:", error);
      }
    }
  }, [parkingInfo, parkName, pricePer10Min, availableTimes]);

  // 3) 계산/예약 모드: 가격 정보 로드
  useEffect(() => {
    let mounted = true;

    if (!parkingId || paymentUrl || presetReservationId || parkingInfo) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }



    (async () => {
      try {
        const lotRes = await getPublicDetail(parkingId);
        if (!mounted) return;

        const d = lotRes?.data || {};
        setLotName(d?.name ?? state?.lotName ?? "주차장");
        setPricePer10Min(
          d?.pricePer10m ?? d?.pricePer10Min ?? state?.pricePer10m ?? 0
        );
        setNearbyAvg10Min(null);
      } catch (e) {
        console.error(e);
        setLotName(state?.lotName ?? "주차장");
        setPricePer10Min(state?.pricePer10m ?? 0);
        setErrorMsg("요금 정보를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    parkingId,
    paymentUrl,
    presetReservationId,
    state?.lotName,
    state?.pricePer10m,
    parkName,
    state?.parkingInfo?.name,
    state?.parkingInfo?.charge,
    state?.parkingInfo?.availableTimes,
    state?.openRangesText,
  ]);

  // 3) 예약/결제 실행 - 카카오페이 생략, 바로 완료 페이지로 이동
  const handlePay = () => {
    if (posting) return;
    if (minutes <= 0) return alert("이용 시간을 확인해 주세요.");

    setPosting(true);
    try {
      const mockReservationId =
        presetReservationId || reservationId || orderId || `mock_${Date.now()}`;

      navigate("/paycomplete", {
        replace: true,
        state: {
          reservationId: mockReservationId,
          parkingId,
          lotName,
          total: finalTotal,
          usingMinutes: minutes,
          startAt: state?.startAt || startAt.toISOString(),
          endAt: state?.endAt || endAt.toISOString(),
          from: "PayPage-direct",
          // 주차장 정보 추가
          parkingInfo: parkingInfo || state?.parkingInfo,
          parkName: parkingInfo?.name || lotName,
          placeName: parkingInfo?.name || lotName,
          address: parkingInfo?.address || state?.address || "",
          pricePer10Min: parkingInfo?.charge || pricePer10Min,
          openRangesText: parkingInfo?.availableTimes || availableTimes,
        },
      });
    } finally {
      setPosting(false);
    }
  };

  // 리디렉트 모드면 UI 없이 반환
  if (paymentUrl || presetReservationId) return null;

  return (
    <div className="paypage">
      {/* 헤더 */}
      <div className="paypage__header">
        <img
          src={arrow}
          alt="뒤로가기"
          className="back-arrow"
          onClick={() => navigate(-1)}
        />
      </div>

      {/* 타이틀 */}
      <h1 className="paypage__title">
        선택한 이용 시간에 따라{"\n"}계산된 금액이에요
      </h1>

      {/* 공지/에러 */}
      {errorMsg && <div className="paypage__notice">{errorMsg}</div>}

      {/* 본문 카드 */}
      <div className="paypage__card">
        <div className="paypage__row">
          <div className="label">주차 장소 이름</div>
          <div className="value">{loading ? "-" : lotName}</div>
        </div>

        <div className="paypage__row">
          <div className="label">10분당 주차 비용</div>
          <div className="value">
            {loading ? "-" : KRW(pricePer10Min)}
            {nearbyAvg10Min != null && (
              <span className="sub"> (주변 평균 {KRW(nearbyAvg10Min)})</span>
            )}
          </div>
        </div>

        <div className="paypage__row">
          <div className="label">주차 가능 시간</div>
          <div className="value">{loading ? "-" : availableTimes}</div>
        </div>

        <div className="paypage__row">
          <div className="label">주차 이용 시간</div>
          <div className="value">
            {hhmm.format(startAt)} ~ {hhmm.format(endAt)} ({hoursPart}시간{" "}
            {minsPart}분)
          </div>
        </div>

        <hr className="divider" />

        <div className="paypage__pair">
          <span>주차 요금</span>
          <b>{KRW(fee)}</b>
        </div>
        <div className="paypage__pair">
          <span>수수료(10%)</span>
          <b>{KRW(svcFee)}</b>
        </div>

        <div className="paypage__pair paypage__total">
          <span>총 합계</span>
          <span className="total-amount">
            <span className="num">{KRW_NUM(finalTotal)}</span>
            <span className="won">원</span>
          </span>
        </div>
      </div>

      {/* 카카오페이 안내 배지(이미지와 문구만 유지) */}
      <div className="kakaopay-box" aria-live="polite">
        {kakaopay ? (
          <img src={kakaopay} alt="" />
        ) : (
          <span className="kakao-badge">pay</span>
        )}
        <span className="kakao-text">
          <strong>카카오페이로</strong> 간편결제!
        </span>
      </div>

      {/* 하단 결제 버튼 */}
      <div className="paypage__footer">
        <button
          className={`primary ${posting || loading ? "disabled" : ""}`}
          onClick={handlePay}
          disabled={posting || loading || minutes <= 0}
        >
          {KRW(finalTotal)} 결제하기
        </button>
      </div>
    </div>
  );
}
