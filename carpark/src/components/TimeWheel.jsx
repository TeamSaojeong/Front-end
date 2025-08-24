import React, { useEffect, useMemo, useRef } from "react";
import "../Styles/TimeProvider.css"; // 기존 스타일 재사용 (time-wheel, time-item 등)

const ITEM_H = 44;
const AMPM = ["오전", "오후"];
const HOURS12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES10 = [0, 10, 20, 30, 40, 50];

const pad2 = (n) => String(n).padStart(2, "0");

export default function TimeWheel({ value, onChange, ariaLabelPrefix = "" }) {
  // value: { ampm: "오전" | "오후", h12: 1..12, m: 0|10|...|50 }
  const target = value || { ampm: "오전", h12: 1, m: 0 };

  const refA = useRef(null);
  const tA = useRef(null);
  const refH = useRef(null);
  const tH = useRef(null);
  const refM = useRef(null);
  const tM = useRef(null);

  // 초기 위치 스냅
  useEffect(() => {
    const idxA = AMPM.indexOf(target.ampm);
    const idxH = HOURS12.indexOf(target.h12);
    const idxM = MINUTES10.indexOf(target.m);
    if (refA?.current) refA.current.scrollTop = (idxA >= 0 ? idxA : 0) * ITEM_H;
    if (refH?.current) refH.current.scrollTop = (idxH >= 0 ? idxH : 0) * ITEM_H;
    if (refM?.current) refM.current.scrollTop = (idxM >= 0 ? idxM : 0) * ITEM_H;
  }, [target.ampm, target.h12, target.m]);

  const snap = (el, idx) =>
    el?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });

  const apply = (next) => onChange?.({ ...target, ...next });

  const onScroll = (type) => (e) => {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamp = (i, arr) => Math.min(Math.max(i, 0), arr.length - 1);

    const timerRef = type === "ampm" ? tA : type === "h" ? tH : tM;
    const doSet = () => {
      if (type === "ampm") apply({ ampm: AMPM[clamp(idx, AMPM)] });
      else if (type === "h") apply({ h12: HOURS12[clamp(idx, HOURS12)] });
      else apply({ m: MINUTES10[clamp(idx, MINUTES10)] });
    };

    if (timerRef?.current) clearTimeout(timerRef.current);
    if (timerRef) {
      timerRef.current = setTimeout(() => {
        snap(el, idx);
        doSet();
      }, 100);
    }
  };

  return (
    <div className="time-wheel-wrap">
      {/* 오전/오후 */}
      <div
        className="time-wheel"
        ref={refA}
        onScroll={onScroll("ampm")}
        aria-label={`${ariaLabelPrefix} 오전/오후 선택`}
      >
        <div className="time-spacer" />
        {AMPM.map((v) => (
          <div
            key={v}
            className={`time-item ${target.ampm === v ? "active" : ""}`}
          >
            {v}
          </div>
        ))}
        <div className="time-spacer" />
      </div>

      <div className="time-col-suffix" />

      {/* 시 */}
      <div
        className="time-wheel"
        ref={refH}
        onScroll={onScroll("h")}
        aria-label={`${ariaLabelPrefix} 시 선택`}
      >
        <div className="time-spacer" />
        {HOURS12.map((v) => (
          <div
            key={v}
            className={`time-item ${target.h12 === v ? "active" : ""}`}
          >
            {v}
          </div>
        ))}
        <div className="time-spacer" />
      </div>

      <div className="time-col-suffix">:</div>

      {/* 분 (10분 단위) */}
      <div
        className="time-wheel"
        ref={refM}
        onScroll={onScroll("m")}
        aria-label={`${ariaLabelPrefix} 분 선택`}
      >
        <div className="time-spacer" />
        {MINUTES10.map((v) => (
          <div
            key={v}
            className={`time-item ${target.m === v ? "active" : ""}`}
          >
            {pad2(v)}
          </div>
        ))}
        <div className="time-spacer" />
      </div>

      <div className="time-guide-line time-guide-top" />
      <div className="time-guide-line time-guide-bot" />
    </div>
  );
}
