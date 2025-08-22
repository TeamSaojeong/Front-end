import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/Nfc/PvTimeSelect.css";

import backIcon from "../../Assets/arrow.png";
import clockIcon from "../../Assets/clock.svg";

const ITEM_H = 44; // CSS의 tp-item 높이와 동일하게 유지

export default function PvTimeSelect() {
  const navigate = useNavigate();
  const { state, search } = useLocation() || {};
  const qs = new URLSearchParams(search || "");
  
  // NFC 태그로 진입 시 저장된 주차장 정보 불러오기
  const getNfcParkingInfo = () => {
    try {
      const saved = sessionStorage.getItem('nfcParkingInfo');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('NFC 주차장 정보 로드 실패:', error);
      return null;
    }
  };

  const nfcInfo = getNfcParkingInfo();
  
  // NFC URL 진입 시 ?placeId=xxx 지원
  const placeId = state?.placeId ?? qs.get("placeId") ?? nfcInfo?.placeId ?? 999;

  // ✅ 요청 값(기본값) - NFC 정보가 있으면 우선 사용
  const DEFAULTS = {
    placeName: nfcInfo?.placeName ?? "양재근린공원주차장",
    openRangesText: nfcInfo?.openRangesText ?? "00:00 ~ 24:00",
    pricePer10Min: nfcInfo?.pricePer10Min ?? 800,
  };

  // ------- 백엔드에서 받아올 값들 -------
  const [loading, setLoading] = useState(!state?.prefetched);
  const [error, setError] = useState(null);
  const [placeName, setPlaceName] = useState(
    state?.placeName ?? DEFAULTS.placeName
  );
  const [openRangesText, setOpenRangesText] = useState(
    state?.openRangesText ?? DEFAULTS.openRangesText
  );
  const [pricePer10Min, setPricePer10Min] = useState(
    state?.pricePer10Min ?? DEFAULTS.pricePer10Min
  );
  // ------------------------------------

  useEffect(() => {
    if (!placeId || state?.prefetched) return;
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: 실제 API로 교체
        // const res = await fetch(`/api/parking/places/${placeId}`);
        // const data = await res.json();

        // mock (요청하신 값으로 세팅)
        await new Promise((r) => setTimeout(r, 200));
        const data = {
          placeName: DEFAULTS.placeName,
          openRangesText: DEFAULTS.openRangesText,
          pricePer10Min: DEFAULTS.pricePer10Min,
        };

        if (aborted) return;
        setPlaceName(data.placeName);
        setOpenRangesText(data.openRangesText);
        setPricePer10Min(data.pricePer10Min);
      } catch (e) {
        if (!aborted) setError("정보를 불러오지 못했어요.");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [placeId, state?.prefetched]);

  // 휠 데이터
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = [0, 10, 20, 30, 40, 50];

  // 선택값
  const [h, setH] = useState(0);
  const [m, setM] = useState(10);

  const totalMinutes = h * 60 + m;
  const isDisabled = totalMinutes === 0;

  // 비용 계산 (10분 단위 올림)
  const blocks = Math.ceil(totalMinutes / 10);
  const estimatedCost = totalMinutes === 0 ? 0 : blocks * (pricePer10Min || 0);

  const fmt2 = (n) => (n < 10 ? `0${n}` : String(n)).slice(-2);
  const durationText = `${fmt2(Math.floor(totalMinutes / 60))}시간 ${fmt2(
    totalMinutes % 60
  )}분`;

  // wheel refs
  const wheelHRef = useRef(null);
  const wheelMRef = useRef(null);
  const scrollTimerH = useRef(null);
  const scrollTimerM = useRef(null);

  // 초기 위치 스크롤
  useEffect(() => {
    const wh = wheelHRef.current;
    const wm = wheelMRef.current;
    if (wh) wh.scrollTop = h * ITEM_H;
    if (wm)
      wm.scrollTop =
        (minutes.indexOf(m) >= 0 ? minutes.indexOf(m) : 0) * ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // 공통 스냅
  const snapToIndex = (el, index) => {
    if (!el) return;
    const top = index * ITEM_H;
    el.scrollTo({ top, behavior: "smooth" });
  };

  // onScroll → 멈추면 가장 가까운 인덱스로 스냅 + 상태 반영
  const handleScroll = (type) => (e) => {
    const el = e.currentTarget;
    const rawIdx = el.scrollTop / ITEM_H;
    const idx = Math.round(rawIdx);

    if (type === "h") {
      if (scrollTimerH.current) clearTimeout(scrollTimerH.current);
      scrollTimerH.current = setTimeout(() => {
        snapToIndex(el, idx);
        const val = hours[Math.min(Math.max(idx, 0), hours.length - 1)];
        setH(val);
      }, 100);
    } else {
      if (scrollTimerM.current) clearTimeout(scrollTimerM.current);
      scrollTimerM.current = setTimeout(() => {
        snapToIndex(el, idx);
        const safeIdx = Math.min(Math.max(idx, 0), minutes.length - 1);
        setM(minutes[safeIdx]);
      }, 100);
    }
  };

  // ✅ 데모 값으로 PayPage로 이동 (금액은 PayPage에서 계산/표시)
  const handlePay = () => {
    if (isDisabled || loading || error) return;

    const now = new Date();
    const end = new Date(now.getTime() + totalMinutes * 60000);

    // NFC 정보와 함께 결제 페이지로 이동
    navigate("/PayPage", {
      state: {
        demo: true, // 데모 플래그 (PayPage에서 API 생략)
        lotId: placeId || 999,
        startAt: now.toISOString(),
        endAt: end.toISOString(),
        durationMin: totalMinutes,
        estimatedCost,
        // NFC 주차장 정보 포함
        parkingInfo: nfcInfo ? {
          placeId: nfcInfo.placeId,
          placeName: nfcInfo.placeName,
          address: nfcInfo.address,
          isLocal: nfcInfo.isLocal,
        } : null,
      },
    });
  };

  return (
    <div className="tp-container">
      <img
        src={backIcon}
        alt="뒤로가기"
        className="tp-back"
        onClick={() => navigate(-1)}
      />

      <div className="tp-header">
        <div className="tp-title">주차 이용 시간을{"\n"}선택해 주세요</div>

        <div className="tp-meta">
          <div className="tp-row">
            <span className="tp-label">주차 장소 이름</span>
            <span className="tp-value">
              {loading ? "불러오는 중..." : error ? "—" : placeName}
            </span>
          </div>
          <div className="tp-row">
            <span className="tp-label">주차 가능 시간</span>
            <span className="tp-value">
              {loading ? "불러오는 중..." : error ? "—" : openRangesText}
            </span>
          </div>
          <div className="tp-row">
            <span className="tp-label">10분당 주차 비용</span>
            <span className="tp-value">
              {loading
                ? "…"
                : error
                ? "—"
                : `${pricePer10Min.toLocaleString()}원`}
            </span>
          </div>
        </div>

        {/* 아이콘 + 선택 시간 */}
        <div className="tp-chip">
          <img src={clockIcon} alt="" className="tp-chip-icon" />
          <span>{durationText}</span>
        </div>
      </div>

      {/* Wheel Picker (박스 없이 두 줄 가이드만) */}
      <div className="tp-wheel-wrap">
        <div
          className="tp-wheel"
          ref={wheelHRef}
          onScroll={handleScroll("h")}
          aria-label="시간 선택 휠"
        >
          <div className="tp-spacer" />
          {hours.map((hh) => (
            <div className={`tp-item ${h === hh ? "active" : ""}`} key={hh}>
              {hh}
            </div>
          ))}
          <div className="tp-spacer" />
        </div>

        <div className="tp-col-suffix">:</div>

        <div
          className="tp-wheel"
          ref={wheelMRef}
          onScroll={handleScroll("m")}
          aria-label="분 선택 휠"
        >
          <div className="tp-spacer" />
          {minutes.map((mm) => (
            <div className={`tp-item ${m === mm ? "active" : ""}`} key={mm}>
              {fmt2(mm)}
            </div>
          ))}
          <div className="tp-spacer" />
        </div>

        {/* 가운데 가이드 라인 */}
        <div className="tp-guide-line tp-guide-top" />
        <div className="tp-guide-line tp-guide-bot" />
      </div>

      <div className="tp-bottom">
        <button
          className={`tp-pay ${
            isDisabled || loading || error ? "disabled" : ""
          }`}
          onClick={handlePay}
          disabled={isDisabled || loading || !!error}
        >
          결제하기
        </button>
        {error && <div className="tp-error">{error}</div>}
      </div>
    </div>
  );
}
