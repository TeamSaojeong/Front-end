import React, { useMemo, useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/OutSoon.css";

import car_icon from "../Assets/car.png";
import clock_icon from "../Assets/clock.svg";
import info_icon from "../Assets/info.svg";

const ITEM_H = 44; // 휠 아이템 높이 (CSS와 동일)
const TOL_MIN = 0.5; // 10/5분 근처 허용 오차(±30초)

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

export default function OutSoon() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const placeName = state?.placeName ?? "주차장";
  const placeId = state?.placeId ?? placeName;

  // ✅ “다른 사용자가 이미 이용 중인지” 여부 (기본 false)
  const inUseByOther = !!state?.inUseByOther;

  const now0 = useMemo(() => new Date(), []);

  // 데모 기본값: 시작=30분 전, 종료=현재+11분 (10분 전 테스트 용이)
  const [startAt] = useState(() =>
    state?.startAt
      ? new Date(state.startAt)
      : new Date(now0.getTime() - 30 * 60 * 1000)
  );
  const [endAt, setEndAt] = useState(() =>
    state?.endAt
      ? new Date(state.endAt)
      : new Date(now0.getTime() + 11 * 60 * 1000)
  );

  // 남은 시간 갱신
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const minsLeft = Math.max(0, (endAt.getTime() - now) / 60000);

  // 10분/5분 근처에서만 버튼 활성
  const near10 = Math.abs(minsLeft - 10) <= TOL_MIN;
  const near5 = Math.abs(minsLeft - 5) <= TOL_MIN;
  const canPressOutSoon = inUseByOther && (near10 || near5);

  // ‘이번 세션’ 기준 눌렀는지 저장
  const pressedKey = useMemo(
    () => `outsoon-pressed-${placeId}-${startAt.getTime()}`,
    [placeId, startAt]
  );
  const [pressedOutSoon, setPressedOutSoon] = useState(() => {
    try {
      return sessionStorage.getItem(pressedKey) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      setPressedOutSoon(sessionStorage.getItem(pressedKey) === "1");
    } catch {}
  }, [pressedKey]);

  const bubbleMinuteLabel = near5 ? "5분" : "10분";

  // ===== 연장하기(휠 타임피커) =====
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => [0, 10, 20, 30, 40, 50], []);
  const [open, setOpen] = useState(false);
  const [extH, setExtH] = useState(0);
  const [extM, setExtM] = useState(0);
  const wheelHRef = useRef(null);
  const wheelMRef = useRef(null);
  const scrollTimerH = useRef(null);
  const scrollTimerM = useRef(null);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      if (wheelHRef.current) wheelHRef.current.scrollTop = extH * ITEM_H;
      if (wheelMRef.current) {
        const idx = Math.max(0, minutes.indexOf(extM));
        wheelMRef.current.scrollTop = idx * ITEM_H;
      }
    });
  }, [open, extH, extM, minutes]);

  const snap = (el, idx) =>
    el?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  const onScroll = (type) => (e) => {
    const el = e.currentTarget;
    const rawIdx = el.scrollTop / ITEM_H;
    const idx = Math.round(rawIdx);
    if (type === "h") {
      if (scrollTimerH.current) clearTimeout(scrollTimerH.current);
      scrollTimerH.current = setTimeout(() => {
        const safe = Math.min(Math.max(idx, 0), hours.length - 1);
        snap(el, safe);
        setExtH(hours[safe]);
      }, 100);
    } else {
      if (scrollTimerM.current) clearTimeout(scrollTimerM.current);
      scrollTimerM.current = setTimeout(() => {
        const safe = Math.min(Math.max(idx, 0), minutes.length - 1);
        snap(el, safe);
        setExtM(minutes[safe]);
      }, 100);
    }
  };

  const totalMinutes = extH * 60 + extM;
  const disabledExtend = totalMinutes === 0;
  const selectedText = `${extH}시간 ${pad2(extM)}분 연장`;

  const applyExtend = () => {
    if (disabledExtend) return;
    const next = new Date(endAt);
    next.setHours(next.getHours() + extH);
    next.setMinutes(next.getMinutes() + extM);
    setEndAt(next);
    setOpen(false);
    setExtH(0);
    setExtM(0);
  };

  const onPressOutSoon = () => {
    if (!canPressOutSoon) return;
    setPressedOutSoon(true);
    try {
      sessionStorage.setItem(pressedKey, "1");
    } catch {}
    navigate("/outsoon_cancel", { state: { openModal: true } });
  };

  // 사용 중이 아니라면 CTA만 보여주기
  if (!inUseByOther) {
    return (
      <div className="outsoon-container">
        <div className="outsoon-header">
          <div className="outsoon-text">
            {placeName}
            <br />
            {/* 이용중 문구 제거 */}
          </div>
        </div>

        <div className="outsoon-car-section" style={{ marginTop: 16 }}>
          <img src={car_icon} alt="자동차 아이콘" />
        </div>

        <div className="outsoon-button-section" style={{ marginTop: 24 }}>
          <button
            className="outsoon-extend"
            onClick={() => navigate(-1)}
            title="뒤로"
          >
            뒤로가기
          </button>

          <button
            className="outsoon-outsoon"
            onClick={() =>
              alert("주차장 이용하기 (결제/예약 플로우 연결 예정)")
            }
          >
            주차장 이용하기
          </button>
        </div>
      </div>
    );
  }

  // ===== 여기부터는 '다른 사용자가 이용 중'일 때만 노출 =====
  return (
    <div className="outsoon-container">
      <div className="outsoon-header">
        <div className="outsoon-text">
          {placeName}
          <br />
          이용중...
        </div>
      </div>

      <div className="outsoon-time-box">
        <div className="outsoon-time-inner">
          <img src={clock_icon} alt="시계 아이콘" className="clock-icon" />
          <span className="outsoon-time-text">
            {formatHHMM(startAt)} ~ {formatHHMM(endAt)} (
            {formatDiff(startAt, endAt)})
          </span>
        </div>
      </div>

      <div className="outsoon-notice-box">
        <div className="outsoon-notice-inner">
          <img src={info_icon} alt="안내 아이콘" className="info-icon" />
          <div className="outsoon-notice-text">
            <p className="outsoon-info-text1">
              출차 전에 ‘곧 나감’을 눌러주세요!
            </p>
            <p className="outsoon-info-text2">
              {canPressOutSoon
                ? "지금 ‘곧 나감’을 누르시면 포인트를 받을 수 있어요!"
                : "‘곧 나감’은 10분/5분 전에만 활성화됩니다."}
            </p>
          </div>
        </div>
      </div>

      <div className="outsoon-car-section">
        <img src={car_icon} alt="자동차 아이콘" />
      </div>

      <div className="outsoon-button-section">
        <button className="outsoon-extend" onClick={() => setOpen(true)}>
          연장하기
        </button>

        <div className="outsoon-bubble-container">
          {!pressedOutSoon && (
            <div
              className="outsoon-bubble-box"
              role="status"
              aria-live="polite"
            >
              <span className="outsoon-bubble-text">
                주차 마감 시간{" "}
                <strong>{bubbleMinuteLabel} 전에 '곧 나감'</strong> 버튼을
                눌러주세요
              </span>
            </div>
          )}

          <button
            className={`outsoon-outsoon ${
              canPressOutSoon ? "" : "is-disabled"
            }`}
            onClick={onPressOutSoon}
            disabled={!canPressOutSoon}
            aria-disabled={!canPressOutSoon}
            title={!canPressOutSoon ? "10분/5분 전만 가능" : "곧 나감"}
          >
            곧 나감
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="extend-backdrop" onClick={() => setOpen(false)} />
          <div className="extend-sheet" role="dialog" aria-modal="true">
            <div className="extend-handle" />
            <div className="extend-title">얼만큼 더 이용하실 계획이실까요?</div>
            <div className="extend-sub">
              연장한 시간에 맞춰 알림을 보내 드릴게요!
            </div>
            <div className="extend-selected">{selectedText}</div>

            <div className="ext-wheel-wrap">
              <div
                className="ext-wheel"
                ref={wheelHRef}
                onScroll={onScroll("h")}
                aria-label="시간 선택"
              >
                <div className="ext-spacer" />
                {hours.map((hh) => (
                  <div
                    className={`ext-item ${hh === extH ? "active" : ""}`}
                    key={hh}
                  >
                    {hh}
                  </div>
                ))}
                <div className="ext-spacer" />
              </div>
              <div className="ext-colon">:</div>
              <div
                className="ext-wheel"
                ref={wheelMRef}
                onScroll={onScroll("m")}
                aria-label="분 선택"
              >
                <div className="ext-spacer" />
                {minutes.map((mm) => (
                  <div
                    className={`ext-item ${mm === extM ? "active" : ""}`}
                    key={mm}
                  >
                    {pad2(mm)}
                  </div>
                ))}
                <div className="ext-spacer" />
              </div>
              <div className="ext-guide ext-guide-top" />
              <div className="ext-guide ext-guide-bot" />
            </div>

            <button
              className={`extend-apply ${disabledExtend ? "is-disabled" : ""}`}
              disabled={disabledExtend}
              onClick={applyExtend}
            >
              연장하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}
