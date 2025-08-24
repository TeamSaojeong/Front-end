import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/Pay/PayPage.css";

import arrow from "../../Assets/arrow.svg";
import kakaopay from "../../Assets/kakaopay.svg";

import { getPublicDetail, createReservation, preparePayment } from "../../apis/parking"; // ← 명세 기반 API 사용

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
//이건 그냥 커밋밋
export default function PayPage() {
  const navigate = useNavigate();
  const { state } = useLocation() || {};

  console.log('[PayPage] 받은 state 정보:', state);
  console.log('[PayPage] parkingInfo:', state?.parkingInfo);

  // 상세에서 넘어올 수 있는 값들
  // A) 바로 리디렉트 모드: paymentUrl 또는 reservationId 만 넘어온 경우
  const paymentUrl =
    state?.paymentUrl || state?.data?.paymentRedirectUrl || null;
  const presetReservationId =
    state?.reservationId || state?.data?.reservationId || null;

  // B) 계산/예약 모드: parkingId/시작/종료 등
  const parkingId = state?.parkingId ?? state?.lotId ?? 28; // 실제 주차장 ID 사용
  const startAt = state?.startAt ? new Date(state.startAt) : new Date();
  const endAt = state?.endAt
    ? new Date(state.endAt)
    : new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
  const startInMinutes = state?.startInMinutes; // RESERVABLE에서 넘겨줄 수 있음(곧 나감 n분 뒤)

  // C) NFC/PvTimeSelect에서 넘어온 정보들
  const parkName = state?.parkingInfo?.name || state?.parkName || "교장 앞 주차장(구간 182)";
  const total = state?.total || state?.estimatedCost || 1800; // 테스트용 기본값
  const usingMinutes = state?.usingMinutes || state?.durationMin || 10; // 테스트용 기본값
  
  // 교장 앞 주차장 데이터 디버깅
  console.log('[PayPage] 교장 앞 주차장 데이터 확인:', {
    parkingInfo: state?.parkingInfo,
    parkName: state?.parkName,
    finalParkName: parkName,
    charge: state?.parkingInfo?.charge,
    pricePer10Min: state?.parkingInfo?.charge || 1800
  });
  
  // D) 주문/예약 ID 정보
  const orderId = state?.orderId || null;
  const reservationId = state?.reservationId || null;

  console.log('[PayPage] 추출된 정보:', {
    parkingId,
    parkName,
    total,
    usingMinutes,
    startAt,
    endAt
  });

  // 화면 데이터 - NFC에서 넘어온 정보 우선 사용
  const [loading, setLoading] = useState(!parkName); // 이름이 있으면 로딩 스킵
  const [lotName, setLotName] = useState(parkName); // NFC에서 넘어온 이름 우선
  const [pricePer10Min, setPricePer10Min] = useState(
    state?.parkingInfo?.charge || state?.pricePer10Min || 1000 // 교장 앞 주차장 요금 우선
  );
  const [nearbyAvg10Min, setNearbyAvg10Min] = useState(null); // 선택: 표시만
  const [posting, setPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 이용 시간(분) - NFC에서 넘어온 정보 우선 사용
  const minutes = useMemo(() => {
    // NFC에서 넘어온 시간이 있으면 우선 사용
    if (usingMinutes > 0) {
      return usingMinutes;
    }
    // 아니면 시작/종료 시간으로 계산
    const diff = Math.max(0, Math.round((endAt - startAt) / 60000));
    return diff;
  }, [startAt, endAt, usingMinutes]);

  const hoursPart = Math.floor(minutes / 60);
  const minsPart = minutes % 60;

  // 요금 (10분 단위 올림) - NFC에서 넘어온 총액이 있으면 우선 사용
  const billableUnits = useMemo(() => Math.ceil(minutes / 10), [minutes]);
  const fee = useMemo(() => {
    // NFC에서 넘어온 총액이 있으면 그대로 사용 (수수료는 별도 추가)
    if (total > 0) {
      return total; // 수수료 제외하지 않고 그대로 사용
    }
    return billableUnits * pricePer10Min;
  }, [billableUnits, pricePer10Min, total]);
  
  const svcRate = 0.1;
  const svcFee = useMemo(() => {
    // NFC에서 넘어온 총액이 있으면 10% 수수료 추가
    if (total > 0) {
      return Math.round(total * svcRate);
    }
    return Math.round(fee * svcRate);
  }, [fee, total, svcRate]);
  const finalTotal = useMemo(() => {
    // NFC에서 넘어온 총액이 있으면 수수료 추가
    return total > 0 ? total + svcFee : fee + svcFee;
  }, [fee, svcFee, total]);

  // ───────────────────────────────────────────────────────────
  // 1) 바로 리디렉트 모드 처리: paymentUrl/reservationId만 넘어온 케이스
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (paymentUrl) {
      // 외부 PG로 바로 이동
      window.location.href = paymentUrl;
      return;
    }
    if (presetReservationId) {
      // 결제 없이 바로 완료
      navigate("/paycomplete", {
        replace: true,
        state: { reservationId: presetReservationId },
      });
    }
  }, [paymentUrl, presetReservationId, navigate]);

  // ───────────────────────────────────────────────────────────
  // 2) 계산/예약 모드: 가격 정보 로드
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // 리디렉트 모드가 아니고, parkingId가 있어야 계산/예약 모드로 진행
    if (!parkingId || paymentUrl || presetReservationId) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    // 테스트 모드인지 확인 (더미 데이터 또는 test_로 시작하는 경우)
    const parkingIdStr = String(parkingId);
    const isTestMode = parkingIdStr.startsWith('pub-dummy-') || parkingIdStr.startsWith('pv-dummy-') || parkingIdStr.startsWith('prv-dummy-') || parkingIdStr.startsWith('test_') || true;
    
    if (isTestMode) {
      // 테스트 모드: API 호출 없이 기본값 사용
      console.log('테스트 모드: API 호출 건너뛰기');
      console.log('테스트 모드에서 사용할 데이터:', {
        lotName: state?.parkingInfo?.name || state?.lotName || parkName,
        pricePer10Min: state?.parkingInfo?.charge || state?.pricePer10m || 1800
      });
      setLotName(state?.parkingInfo?.name || state?.lotName || parkName);
      setPricePer10Min(state?.parkingInfo?.charge || state?.pricePer10m || 1800);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        // 공영/민영 상세에서 가격 가져오기
        const lotRes = await getPublicDetail(parkingId); // { data: {...} }
        if (!mounted) return;

        const d = lotRes?.data || {};
        setLotName(d?.name ?? state?.lotName ?? "주차장");
        setPricePer10Min(
          d?.pricePer10m ?? d?.pricePer10Min ?? state?.pricePer10m ?? 0
        );
        setNearbyAvg10Min(null); // 서버 준비되면 채우기
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
  ]);

  // ───────────────────────────────────────────────────────────
  // 3) 예약/결제 실행
  // ───────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (posting) return;
    if (minutes <= 0) return alert("이용 시간을 확인해 주세요.");

    console.log('[PayPage] 결제 시작:', {
      parkingId,
      lotName,
      minutes,
      finalTotal,
      pricePer10Min,
      orderId,
      reservationId
    });

    setPosting(true);
    try {
      // 카카오페이 결제 준비 - API 명세에 맞춰 데이터 타입 정확히 설정
      // 더미 데이터인 경우 실제 주차장 ID(28)로 변경
      const parkingIdStr = String(parkingId);
      const actualParkingId = parkingIdStr.startsWith('pub-dummy-') || parkingIdStr.startsWith('pv-dummy-') || parkingIdStr.startsWith('prv-dummy-') ? 28 : parkingId;
      
      const paymentPayload = {
        parkName: String(lotName || "주차장"),
        parkingId: actualParkingId,
        total: String(finalTotal), // 문자열로 변경
        usingMinutes: String(minutes) // 문자열로 변경
      };

      console.log('결제 준비 요청:', paymentPayload);
      console.log('parkingId 변환:', { original: parkingId, actual: actualParkingId });
      
      // API 요청 전 데이터 유효성 검사
      if (!paymentPayload.parkName || !paymentPayload.parkingId || 
          !paymentPayload.total || !paymentPayload.usingMinutes) {
        throw new Error('필수 결제 정보가 누락되었습니다.');
      }
      
      if (Number(paymentPayload.total) <= 0 || Number(paymentPayload.usingMinutes) <= 0) {
        throw new Error('결제 금액과 이용 시간은 0보다 커야 합니다.');
      }
      
      let res;
      let isTestMode = String(parkingId).startsWith('test_'); // test_로 시작하는 경우만 테스트 모드
      
      if (isTestMode) {
        // test_로 시작하는 경우만 API 호출 건너뛰고 모의 카카오페이 URL 생성
        console.log('테스트 모드 감지 - API 호출 건너뛰기');
        res = {
          data: {
            data: {
              next_redirect_mobile_url: `https://online-payment.kakaopay.com/mockup/bridge/mobile-web/pg/one-time/payment/test_${Date.now()}`
            }
          }
        };
      } else {
        try {
          // 실제 API 호출 시도 - 쿼리 파라미터 추가
          const queryParams = {};
          if (orderId) queryParams.orderId = orderId;
          if (reservationId) queryParams.reservationId = reservationId;
          
          res = await preparePayment(paymentPayload, queryParams);
          console.log('결제 준비 응답:', res);
          
          // API 응답이 성공적인지 확인
          if (res?.data?.data?.next_redirect_mobile_url || res?.data?.next_redirect_mobile_url) {
            console.log('API 호출 성공 - 실제 카카오페이 URL 획득');
          } else {
            console.log('API 응답 구조:', res);
            throw new Error('API 응답에 결제 URL이 없습니다.');
          }
        } catch (apiError) {
          console.log('API 호출 실패:', apiError);
          // API 호출 실패 시 모바일 환경에서는 테스트 모드로 폴백
          console.log('모바일 환경에서 API 실패 - 테스트 모드로 폴백');
          res = {
            data: {
              data: {
                next_redirect_mobile_url: `https://online-payment.kakaopay.com/mockup/bridge/mobile-web/pg/one-time/payment/mobile_fallback_${Date.now()}`
              }
            }
          };
        }
      }

      // 카카오페이 리다이렉트 URL 추출 - 백엔드 응답 구조에 맞춤
      const paymentRedirectUrl = res?.data?.data?.next_redirect_mobile_url || res?.data?.next_redirect_mobile_url;

      if (paymentRedirectUrl) {
        // 실제 API 성공: 카카오페이로 이동
        // 주차장 정보를 URL 파라미터로 추가
        const url = new URL(paymentRedirectUrl);
        url.searchParams.set('parkingId', parkingId);
        url.searchParams.set('parkName', lotName || "주차장");
        url.searchParams.set('total', finalTotal.toString());
        url.searchParams.set('usingMinutes', minutes.toString());
        
        // 예약 시간 정보 추가 (PvTimeSelect에서 전달받은 값)
        if (state?.startAt) {
          url.searchParams.set('startAt', state.startAt);
        }
        if (state?.endAt) {
          url.searchParams.set('endAt', state.endAt);
        }
        
        // 주차장 상세 정보도 추가
        if (state?.parkingInfo) {
          url.searchParams.set('parkingInfo', JSON.stringify(state.parkingInfo));
        }
        
        const finalRedirectUrl = url.toString();
        console.log('API 성공 - 카카오페이로 이동:', finalRedirectUrl);
        window.location.href = finalRedirectUrl;
      } else {
        alert("결제 준비에 실패했습니다. 응답을 확인해주세요.");
        console.error('결제 URL을 찾을 수 없음:', res);
      }
    } catch (e) {
      console.error('결제 준비 오류:', e);
      alert("결제 준비에 실패했습니다.");
    } finally {
      setPosting(false);
    }
  };

  // ───────────────────────────────────────────────────────────

  // 리디렉트 모드면 UI를 보여줄 필요 없이 빈 화면 유지
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
          <div className="label">주차 이용 시간</div>
          <div className="value">
            {hhmm.format(startAt)} ~ {hhmm.format(endAt)} (
            {Math.floor(minutes / 60)}시간 {minutes % 60}분)
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

      {/* 카카오페이 안내 배지 */}
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
