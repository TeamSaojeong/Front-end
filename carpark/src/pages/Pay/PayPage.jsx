import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/Pay/PayPage.css";

import arrow from "../../Assets/arrow.png";
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
  console.log('[PayPage] location 전체:', useLocation());

  // 상세에서 넘어올 수 있는 값들
  // A) 바로 리디렉트 모드: paymentUrl 또는 reservationId 만 넘어온 경우
  const paymentUrl =
    state?.paymentUrl || state?.data?.paymentRedirectUrl || null;
  const presetReservationId =
    state?.reservationId || state?.data?.reservationId || null;

  // B) 계산/예약 모드: parkingId/시작/종료 등
  const parkingId = state?.parkingId ?? state?.lotId ?? null; // lotId 호환
  const startAt = state?.startAt ? new Date(state.startAt) : new Date();
  const endAt = state?.endAt
    ? new Date(state.endAt)
    : new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
  const startInMinutes = state?.startInMinutes; // RESERVABLE에서 넘겨줄 수 있음(곧 나감 n분 뒤)

  // C) NFC/PvTimeSelect에서 넘어온 정보들
  const parkName = state?.parkName || state?.parkingInfo?.name || "";
  const total = state?.total || state?.estimatedCost || 0;
  const usingMinutes = state?.usingMinutes || state?.durationMin || 0;

  // D) state가 비어있으면 sessionStorage에서 백업 확인
  let backupInfo = null;
  if (!state || Object.keys(state).length === 0) {
    try {
      const saved = sessionStorage.getItem('nfcParkingInfo');
      if (saved) {
        backupInfo = JSON.parse(saved);
        console.log('[PayPage] sessionStorage 백업 사용:', backupInfo);
      }
    } catch (error) {
      console.error('[PayPage] sessionStorage 로드 실패:', error);
    }
  }

  console.log('[PayPage] 추출된 정보:', {
    parkingId,
    parkName,
    total,
    usingMinutes,
    startAt,
    endAt
  });

  // 화면 데이터 - NFC에서 넘어온 정보 또는 백업 정보 사용
  const finalParkName = parkName || backupInfo?.name || "";
  const finalCharge = state?.pricePer10Min || state?.parkingInfo?.charge || backupInfo?.charge || 0;
  
  console.log('[PayPage] 10분당 요금 확인:', {
    statePricePer10Min: state?.pricePer10Min,
    parkingInfoCharge: state?.parkingInfo?.charge,
    backupCharge: backupInfo?.charge,
    finalCharge
  });
  
  const [loading, setLoading] = useState(!finalParkName); // 이름이 있으면 로딩 스킵
  const [lotName, setLotName] = useState(finalParkName); // NFC에서 넘어온 이름 우선
  const [pricePer10Min, setPricePer10Min] = useState(finalCharge);
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
    // NFC에서 넘어온 총액이 있으면 우선 사용 (서비스 수수료 제외)
    if (total > 0) {
      return Math.round(total / 1.1); // 서비스 수수료 10% 제외
    }
    return billableUnits * pricePer10Min;
  }, [billableUnits, pricePer10Min, total]);
  
  const svcRate = 0.1;
  const svcFee = useMemo(() => Math.round(fee * svcRate), [fee]);
  const finalTotal = useMemo(() => {
    // NFC에서 넘어온 총액이 있으면 우선 사용
    return total > 0 ? total : fee + svcFee;
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

    // 개인 주차장 여부 확인
    const isPrivateParking = state?.parkingInfo?.isPrivate || 
                           state?.demo || 
                           backupInfo?.isPrivate;

    console.log('[PayPage] 주차장 타입 확인:', {
      isPrivateParking,
      hasDemo: !!state?.demo,
      parkingInfoIsPrivate: state?.parkingInfo?.isPrivate,
      backupIsPrivate: backupInfo?.isPrivate
    });

    if (isPrivateParking) {
      // 개인 주차장: API 호출 없이 전달받은 정보 사용
      console.log('[PayPage] 개인 주차장 - API 호출 스킵');
      setLotName(finalParkName || "개인 주차장");
      setPricePer10Min(finalCharge);
      setLoading(false);
      return () => { mounted = false; };
    }

    // 공영 주차장만 API 호출
    (async () => {
      try {
        console.log('[PayPage] 공영 주차장 - API 호출 시작');
        const lotRes = await getPublicDetail(parkingId); // { data: {...} }
        if (!mounted) return;

        const d = lotRes?.data || {};
        setLotName(d?.name ?? state?.lotName ?? "주차장");
        setPricePer10Min(
          d?.pricePer10m ?? d?.pricePer10Min ?? state?.pricePer10m ?? 0
        );
        setNearbyAvg10Min(null); // 서버 준비되면 채우기
      } catch (e) {
        console.error('[PayPage] API 호출 실패:', e);
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
    if (!parkingId) return alert("주차장 정보가 없습니다.");
    if (minutes <= 0) return alert("이용 시간을 확인해 주세요.");

    console.log('[PayPage] 결제 시작:', {
      parkingId,
      lotName,
      minutes,
      finalTotal,
      pricePer10Min
    });

    setPosting(true);
    try {
      // 카카오페이 결제 준비
      const paymentPayload = {
        parkName: lotName || "주차장",
        parkingId: parkingId,
        total: finalTotal,
        usingMinutes: minutes
      };

      console.log('결제 준비 요청:', paymentPayload);
      const res = await preparePayment(paymentPayload);
      console.log('결제 준비 응답:', res);

      // 카카오페이 리다이렉트 URL 추출
      const paymentRedirectUrl = res?.data?.next_redirect_pc_url || res?.data?.data?.next_redirect_pc_url;

      if (paymentRedirectUrl) {
        // 카카오페이로 이동
        console.log('카카오페이로 이동:', paymentRedirectUrl);
        window.location.href = paymentRedirectUrl;
      } else {
        alert("결제 준비에 실패했습니다. 응답을 확인해주세요.");
        console.error('결제 URL을 찾을 수 없음:', res);
      }
    } catch (e) {
      console.error('결제 준비 오류:', e);
      alert(e?.response?.data?.message || "결제 준비에 실패했습니다.");
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
