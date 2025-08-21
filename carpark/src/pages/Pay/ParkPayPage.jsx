import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/Pay/DataPayPage.css";

import arrow from "../../Assets/arrow.png";
import kakaopay from "../../Assets/kakaopay.svg";

import { getPublicDetail, createReservation } from "../../apis/parking";

const DEFAULTS = {
  lotName: "양재근린공원주차장",
  openRangesText: "00:00 ~ 24:00",
  pricePer10Min: 800,
};

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

export default function ParkPayPage() {
  const navigate = useNavigate();
  const { state } = useLocation() || {};

  const paymentUrl =
    state?.paymentUrl || state?.data?.paymentRedirectUrl || null;
  const presetReservationId =
    state?.reservationId || state?.data?.reservationId || null;

  const parkingId = state?.parkingId ?? state?.lotId ?? null;
  const startAt = state?.startAt ? new Date(state.startAt) : new Date();
  const endAt = state?.endAt
    ? new Date(state.endAt)
    : new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
  const startInMinutes = state?.startInMinutes;
  const isDemo = !!state?.demo;

  const [loading, setLoading] = useState(true);
  const [lotName, setLotName] = useState(state?.lotName ?? DEFAULTS.lotName);
  const [pricePer10Min, setPricePer10Min] = useState(
    state?.pricePer10m ?? DEFAULTS.pricePer10Min
  );
  const [nearbyAvg10Min, setNearbyAvg10Min] = useState(null);
  const [posting, setPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const minutes = useMemo(() => {
    const diff = Math.max(0, Math.round((endAt - startAt) / 60000));
    return diff;
  }, [startAt, endAt]);

  const hoursPart = Math.floor(minutes / 60);
  const minsPart = minutes % 60;

  const billableUnits = useMemo(() => Math.ceil(minutes / 10), [minutes]);
  const fee = useMemo(
    () => billableUnits * pricePer10Min,
    [billableUnits, pricePer10Min]
  );
  const svcRate = 0.1;
  const svcFee = useMemo(() => Math.round(fee * svcRate), [fee]);
  const total = useMemo(() => fee + svcFee, [fee, svcFee]);

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

  useEffect(() => {
    let mounted = true;

    if (paymentUrl || presetReservationId) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    if (isDemo) {
      setLotName(state?.lotName ?? DEFAULTS.lotName);
      setPricePer10Min(state?.pricePer10m ?? DEFAULTS.pricePer10Min);
      setNearbyAvg10Min(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    if (!parkingId) {
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
        setLotName(d?.name ?? state?.lotName ?? DEFAULTS.lotName);
        setPricePer10Min(
          d?.pricePer10m ??
            d?.pricePer10Min ??
            state?.pricePer10m ??
            DEFAULTS.pricePer10Min
        );
        setNearbyAvg10Min(null);
      } catch (e) {
        console.error(e);

        setLotName(state?.lotName ?? DEFAULTS.lotName);
        setPricePer10Min(state?.pricePer10m ?? DEFAULTS.pricePer10Min);
        setErrorMsg(
          "요금 정보를 불러오지 못했습니다. 기본 금액으로 계산합니다."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    isDemo,
    parkingId,
    paymentUrl,
    presetReservationId,
    state?.lotName,
    state?.pricePer10m,
  ]);

  const handlePay = async () => {
    if (posting) return;
    if (!parkingId) return alert("주차장 정보가 없습니다.");
    if (minutes <= 0) return alert("이용 시간을 확인해 주세요.");
    if (pricePer10Min <= 0) return alert("요금 정보가 없습니다.");

    setPosting(true);
    try {
      const payload =
        typeof startInMinutes === "number"
          ? { startInMinutes, minutes }
          : { minutes };

      const res = await createReservation(parkingId, payload);

      const paymentRedirectUrl =
        res?.data?.paymentRedirectUrl || res?.data?.data?.paymentRedirectUrl;
      const reservationId =
        res?.data?.reservationId || res?.data?.data?.reservationId;

      if (paymentRedirectUrl) {
        window.location.href = paymentRedirectUrl;
      } else if (reservationId) {
        navigate("/paycomplete", {
          replace: true,
          state: {
            reservationId,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            lotName,
          },
        });
      } else {
        alert("예약은 되었지만 응답을 해석할 수 없습니다.");
      }
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "예약/결제에 실패했습니다.");
    } finally {
      setPosting(false);
    }
  };

  if (paymentUrl || presetReservationId) return null;

  return (
    <div className="Data">
      <div className="Data__header">
        <img
          src={arrow}
          alt="뒤로가기"
          className="back-arrow"
          onClick={() => navigate(-1)}
        />
      </div>
      <h1 className="Data__title">
        선택한 이용 시간에 따라{"\n"}계산된 금액이에요
      </h1>

      {errorMsg && <div className="Data__notice">{errorMsg}</div>}

      <div className="Data__card">
        <div className="Data__row">
          <div className="Data-label">주차 장소 이름</div>
          <div className="Data-value">{loading ? "-" : lotName}</div>
        </div>

        <div className="Data__row">
          <div className="Data-label">10분당 주차 비용</div>
          <div className="Data-value">
            {loading ? "-" : KRW(pricePer10Min)}
            {nearbyAvg10Min != null && (
              <span className="sub"> (주변 평균 {KRW(nearbyAvg10Min)})</span>
            )}
          </div>
        </div>

        <div className="Data__row">
          <div className="Data-label">주차 이용 시간</div>
          <div className="Data-value">
            {hhmm.format(startAt)} ~ {hhmm.format(endAt)} (
            {Math.floor(minutes / 60)}시간 {minutes % 60}분)
          </div>
        </div>

        <hr className="Data-divider" />

        <div className="Data__pair">
          <span>주차 요금</span>
          <b>{KRW(fee)}</b>
        </div>
        <div className="Data__pair">
          <span>수수료(10%)</span>
          <b>{KRW(svcFee)}</b>
        </div>

        <div className="Data__pair Data__total">
          <span>총 합계</span>
          <span className="Data-total-amount">
            <span className="Data-num">{KRW_NUM(total)}</span>
            <span className="Data-won">원</span>
          </span>
        </div>
      </div>

      <div className="Data-kakaopay-box" aria-live="polite">
        {kakaopay ? (
          <img src={kakaopay} alt="" />
        ) : (
          <span className="Data-kakao-badge">pay</span>
        )}
        <span className="Data-kakao-text">
          <strong>카카오페이로</strong> 간편결제!
        </span>
      </div>

      <div className="Data__footer">
        <button
          className={`Data-primary ${posting || loading ? "disabled" : ""}`}
          onClick={handlePay}
          disabled={posting || loading || minutes <= 0 || pricePer10Min <= 0}
        >
          {KRW(total)} 결제하기
        </button>
      </div>
    </div>
  );
}
