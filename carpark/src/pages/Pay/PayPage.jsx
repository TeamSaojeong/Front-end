import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import client from "../../apis/client";
import "../../Styles/Pay/PayPage.css";

import arrow from "../../Assets/arrow.png";
import kakaopay from "../../Assets/kakaopay.svg";

const KRW = (n) =>
  (isNaN(n) ? 0 : Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원";

// 숫자만 포맷 (원 단위 제외)
const KRW_NUM = (n) =>
  (isNaN(n) ? 0 : Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// HH:mm 고정 포맷
const hhmm = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export default function PayPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // 데모 기본값
  const lotId = state?.lotId ?? 1;
  const startAt = state?.startAt ? new Date(state.startAt) : new Date();
  const endAt =
    state?.endAt ?? new Date(startAt.getTime() + 2 * 60 * 60 * 1000);
  const endDt = new Date(endAt);

  // 화면 데이터
  const [loading, setLoading] = useState(true);
  const [lotName, setLotName] = useState("");
  const [pricePer10Min, setPricePer10Min] = useState(0);
  const [nearbyAvg10Min, setNearbyAvg10Min] = useState(null);
  const [posting, setPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 이용 시간(분)
  const minutes = useMemo(() => {
    const diff = Math.max(0, Math.round((endDt - startAt) / 60000));
    return diff;
  }, [startAt, endDt]);
  const hoursPart = Math.floor(minutes / 60);
  const minsPart = minutes % 60;

  // 요금 (10분 단위 올림)
  const billableUnits = useMemo(() => Math.ceil(minutes / 10), [minutes]);
  const fee = useMemo(
    () => billableUnits * pricePer10Min,
    [billableUnits, pricePer10Min]
  );
  const svcRate = 0.1;
  const svcFee = useMemo(() => Math.round(fee * svcRate), [fee]);
  const total = useMemo(() => fee + svcFee, [fee, svcFee]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [lotRes, avgRes] = await Promise.all([
          client.get(`/lots/${lotId}`), // { data: { name, pricePer10Min } }
          client.get(`/lots/${lotId}/nearby-avg`), // { data: { avgPer10Min } }
        ]);
        if (!mounted) return;

        setLotName(lotRes?.data?.data?.name ?? "주차장 이름");
        setPricePer10Min(lotRes?.data?.data?.pricePer10Min ?? 0);
        setNearbyAvg10Min(avgRes?.data?.data?.avgPer10Min ?? null);
      } catch (e) {
        console.error(e);
        setLotName("주차장 이름");
        setPricePer10Min(0);
        setNearbyAvg10Min(null);
        setErrorMsg("요금 정보를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [lotId]);

  const handlePay = async () => {
    if (posting) return;
    if (minutes <= 0) return alert("이용 시간을 확인해 주세요.");
    if (pricePer10Min <= 0) return alert("요금 정보가 없습니다.");

    setPosting(true);
    try {
      navigate("/payloading", {
        replace: true,
        state: { lotId, startAt, endAt, fee, svcFee, total },
      });

      const res = await client.post("/payments", {
        lotId,
        startAt,
        endAt,
        minutes,
        unitMinutes: 10,
        unitPrice: pricePer10Min,
        fee,
        serviceFee: svcFee,
        total,
        method: "CARD",
      });

      if (res?.data?.status === 200) {
        navigate("/paycomplete", {
          replace: true,
          state: {
            lotId,
            lotName,
            total,
            paymentId: res?.data?.data?.paymentId,
          },
        });
      } else {
        alert(res?.data?.message || "결제에 실패했습니다.");
        navigate(-1);
      }
    } catch (e) {
      console.error(e);
      alert("결제 중 오류가 발생했습니다.");
      navigate(-1);
    } finally {
      setPosting(false);
    }
  };

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
            {hhmm.format(startAt)} ~ {hhmm.format(endDt)} ({hoursPart}시간{" "}
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

        {/* 총 합계 - 행 스타일 동일 + 금액만 컬러 분리 */}
        <div className="paypage__pair paypage__total">
          <span>총 합계</span>
          <span className="total-amount">
            <span className="num">{KRW_NUM(total)}</span>
            <span className="won">원</span>
          </span>
        </div>
      </div>

      {/* 카카오페이 안내 배지 (비클릭) */}
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
          disabled={posting || loading || minutes <= 0 || pricePer10Min <= 0}
        >
          {KRW(total)} 결제하기
        </button>
      </div>
    </div>
  );
}
