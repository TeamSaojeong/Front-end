import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/Nfc/PvTimeSelect.css";

import backIcon from "../../Assets/arrow.png";
import clockIcon from "../../Assets/clock.svg";

const ITEM_H = 44; // CSS의 pt-item 높이와 동일하게 유지

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
  
  // URL 파라미터로 접근했을 때 sessionStorage에서 주차장 정보 찾기
  const getParkingInfoFromStorage = () => {
    if (state?.placeName) return null; // state에 데이터가 있으면 스토리지 검색 불필요
    
    try {
      const saved = sessionStorage.getItem('nfcParkingInfo');
      if (saved) {
        const info = JSON.parse(saved);
        // placeId가 일치하는지 확인
        if (info.id == placeId || info.placeId == placeId) {
          return info;
        }
      }
    } catch (error) {
      console.error('스토리지에서 주차장 정보 로드 실패:', error);
    }
    return null;
  };

  const storageInfo = getParkingInfoFromStorage();

  // 실제 데이터 우선순위: state > storageInfo > nfcInfo > 기본값
  const DEFAULTS = {
    placeName: state?.placeName || storageInfo?.name || nfcInfo?.name || nfcInfo?.placeName || "주차장",
    openRangesText: state?.openRangesText || storageInfo?.availableTimes || nfcInfo?.availableTimes || nfcInfo?.openRangesText || "운영시간 정보 없음",
    pricePer10Min: state?.pricePer10Min || storageInfo?.charge || nfcInfo?.charge || nfcInfo?.pricePer10Min || 0,
  };
  
  console.log('PvTimeSelect 데이터 확인:', {
    state,
    nfcInfo,
    storageInfo,
    placeId,
    defaults: DEFAULTS,
    placeName: DEFAULTS.placeName,
    openRangesText: DEFAULTS.openRangesText,
    pricePer10Min: DEFAULTS.pricePer10Min,
    prefetched: state?.prefetched,
    hasStateData: !!(state?.placeName || state?.openRangesText || state?.pricePer10Min),
    hasStorageData: !!storageInfo
  });

  // ------- 백엔드에서 받아올 값들 -------
  const [loading, setLoading] = useState(!state?.prefetched && !state?.placeName);
  const [error, setError] = useState(null);
  const [placeName, setPlaceName] = useState(DEFAULTS.placeName);
  const [openRangesText, setOpenRangesText] = useState(DEFAULTS.openRangesText);
  const [pricePer10Min, setPricePer10Min] = useState(DEFAULTS.pricePer10Min);
  // ------------------------------------

  useEffect(() => {
    // prefetched가 true면 state에서 받은 데이터를 사용
    if (state?.prefetched) {
      console.log('PvTimeSelect: prefetched 데이터 사용', state);
      setPlaceName(state.placeName || DEFAULTS.placeName);
      setOpenRangesText(state.openRangesText || DEFAULTS.openRangesText);
      setPricePer10Min(state.pricePer10Min || DEFAULTS.pricePer10Min);
      setLoading(false);
      return;
    }

    // storageInfo가 있으면 즉시 사용 (URL 파라미터로 접근한 경우)
    if (storageInfo && !state?.placeName) {
      console.log('PvTimeSelect: storageInfo 데이터 사용', storageInfo);
      setPlaceName(storageInfo.name || DEFAULTS.placeName);
      setOpenRangesText(storageInfo.availableTimes || DEFAULTS.openRangesText);
      setPricePer10Min(storageInfo.charge || DEFAULTS.pricePer10Min);
      setLoading(false);
      return;
    }

    // prefetched가 false이고 storageInfo도 없으면 API 호출
    if (!placeId) return;
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 실제 API 호출
        const res = await fetch(`/api/parking/places/${placeId}`);
        const apiData = await res.json();
        
        // API 응답이 없으면 기본값 사용
        const data = {
          placeName: apiData?.placeName || DEFAULTS.placeName,
          openRangesText: apiData?.openRangesText || DEFAULTS.openRangesText,
          pricePer10Min: apiData?.pricePer10Min || DEFAULTS.pricePer10Min,
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
  }, [placeId, state?.prefetched, state?.placeName, state?.openRangesText, state?.pricePer10Min, storageInfo]);

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

    // 결제 정보 준비 - 실제 데이터 사용
    const paymentData = {
      demo: false, // 실제 결제 플래그
      lotId: placeId,
      parkingId: nfcInfo?.id || placeId,
      parkName: placeName,
      startAt: now.toISOString(),
      endAt: end.toISOString(),
      durationMin: totalMinutes,
      usingMinutes: totalMinutes,
      estimatedCost,
      total: estimatedCost,
      // 주차장 정보 - 실제 데이터 사용
      parkingInfo: {
        id: nfcInfo?.id || placeId,
        name: placeName,
        address: nfcInfo?.address || state?.address || "",
        isPrivate: nfcInfo?.isPrivate !== false,
        charge: pricePer10Min,
        availableTimes: nfcInfo?.availableTimes || openRangesText,
        note: nfcInfo?.note || state?.note || "",
        lat: nfcInfo?.lat || state?.lat || null,
        lng: nfcInfo?.lng || state?.lng || null,
      },
    };

    console.log('PvTimeSelect에서 PayPage로 전달:', paymentData);
    console.log('주차장 데이터 확인:', {
      name: paymentData.parkingInfo.name,
      charge: paymentData.parkingInfo.charge,
      address: paymentData.parkingInfo.address
    });

    // NFC 정보와 함께 결제 페이지로 이동
    navigate("/PayPage", { state: paymentData });
  };

  return (
    <div className="pt-container">
      <img
        src={backIcon}
        alt="뒤로가기"
        className="pt-back"
        onClick={() => navigate(-1)}
      />

      <div className="pt-header">
        <div className="pt-title">주차 이용 시간을{"\n"}선택해 주세요</div>

        <div className="pt-meta">
          <div className="pt-row">
            <span className="pt-label">주차 장소 이름</span>
            <span className="pt-value">
              {loading ? "불러오는 중..." : error ? "—" : placeName}
            </span>
          </div>
          <div className="pt-row">
            <span className="pt-label">주차 가능 시간</span>
            <span className="pt-value">
              {loading ? "불러오는 중..." : error ? "—" : openRangesText}
            </span>
          </div>
          <div className="pt-row">
            <span className="pt-label">10분당 주차 비용</span>
            <span className="pt-value">
              {loading
                ? "…"
                : error
                ? "—"
                : `${pricePer10Min.toLocaleString()}원`}
            </span>
          </div>
        </div>

        {/* 아이콘 + 선택 시간 */}
        <div className="pt-chip">
          <img src={clockIcon} alt="" className="pt-chip-icon" />
          <span>{durationText}</span>
        </div>
      </div>

      {/* Wheel Picker (박스 없이 두 줄 가이드만) */}
      <div className="pt-wheel-wrap">
        <div
          className="pt-wheel"
          ref={wheelHRef}
          onScroll={handleScroll("h")}
          aria-label="시간 선택 휠"
        >
          <div className="pt-spacer" />
          {hours.map((hh) => (
            <div className={`pt-item ${h === hh ? "active" : ""}`} key={hh}>
              {hh}
            </div>
          ))}
          <div className="pt-spacer" />
        </div>

        <div className="pt-col-suffix">:</div>

        <div
          className="pt-wheel"
          ref={wheelMRef}
          onScroll={handleScroll("m")}
          aria-label="분 선택 휠"
        >
          <div className="pt-spacer" />
          {minutes.map((mm) => (
            <div className={`pt-item ${m === mm ? "active" : ""}`} key={mm}>
              {fmt2(mm)}
            </div>
          ))}
          <div className="pt-spacer" />
        </div>

        {/* 가운데 가이드 라인 */}
        <div className="pt-guide-line pt-guide-top" />
        <div className="pt-guide-line pt-guide-bot" />
      </div>

      <div className="pt-bottom">
        <button
          className={`pt-pay ${
            isDisabled || loading || error ? "disabled" : ""
          }`}
          onClick={handlePay}
          disabled={isDisabled || loading || !!error}
        >
          결제하기
        </button>
        {error && <div className="pt-error">{error}</div>}
      </div>
    </div>
  );
}
