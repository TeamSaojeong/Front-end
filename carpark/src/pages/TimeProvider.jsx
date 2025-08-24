import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/TimeProvider.css";

import backIcon from "../Assets/arrow.png";
import closeSvg from "../Assets/close1.svg";
import { useParkingForm } from "../store/ParkingForm"; // ✅ 추가

const ITEM_H = 44;
const AMPM = ["오전", "오후"];
const HOURS12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES10 = [0, 10, 20, 30, 40, 50];

const pad2 = (n) => String(n).padStart(2, "0");
const to24min = ({ ampm, h12, m }) =>
  ((h12 % 12) + (ampm === "오후" ? 12 : 0)) * 60 + m;
const fmt24 = (t) =>
  `${pad2((t.h12 % 12) + (t.ampm === "오후" ? 12 : 0))}:${pad2(t.m)}`;
const labelK = (i) =>
  ["첫 번째", "두 번째", "세 번째", "네 번째", "다섯 번째"][i] ??
  `${i + 1}번째`;

const makeSlot = () => ({
  id: crypto.randomUUID(),
  start: { ampm: "오전", h12: 1, m: 0 },
  end: { ampm: "오전", h12: 1, m: 0 },
});

export default function TimeProvider() {
  const navigate = useNavigate();
  const { state, search } = useLocation() || {};
  const qs = new URLSearchParams(search || "");
  const placeId = state?.placeId ?? qs.get("placeId") ?? null;

  const [loading] = useState(false);
  const [error] = useState(null);
  const [placeName] = useState(state?.placeName ?? "—");

  const [slots, setSlots] = useState([makeSlot()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [picking, setPicking] = useState("start");

  // 등록 폼 저장소
  const setField = useParkingForm((s) => s.setField);

  // 휠 refs & 타이머
  const refA = useRef(null);
  const tA = useRef(null);
  const refH = useRef(null);
  const tH = useRef(null);
  const refM = useRef(null);
  const tM = useRef(null);

  const active = slots[activeIdx];
  const target = picking === "start" ? active.start : active.end;

  useEffect(() => {
    const idxA = AMPM.indexOf(target.ampm);
    const idxH = HOURS12.indexOf(target.h12);
    const idxM = MINUTES10.indexOf(target.m);
    if (refA.current) refA.current.scrollTop = idxA * ITEM_H;
    if (refH.current) refH.current.scrollTop = idxH * ITEM_H;
    if (refM.current) refM.current.scrollTop = (idxM >= 0 ? idxM : 0) * ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx, picking]);

  const applyTarget = (next) => {
    setSlots((prev) =>
      prev.map((s, i) =>
        i !== activeIdx ? s : { ...s, [picking]: { ...s[picking], ...next } }
      )
    );
  };

  const snap = (el, idx) =>
    el?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });

  const onScroll = (type) => (e) => {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamp = (i, arr) => Math.min(Math.max(i, 0), arr.length - 1);
    const timerRef = type === "ampm" ? tA : type === "h" ? tH : tM;

    const doSet = () => {
      if (type === "ampm") applyTarget({ ampm: AMPM[clamp(idx, AMPM)] });
      else if (type === "h") applyTarget({ h12: HOURS12[clamp(idx, HOURS12)] });
      else applyTarget({ m: MINUTES10[clamp(idx, MINUTES10)] });
    };

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      snap(el, idx);
      doSet();
    }, 100);
  };

  const isSlotValid = (s) => {
    const sv = to24min(s.start),
      ev = to24min(s.end);
    const dur = ev >= sv ? ev - sv : ev + 24 * 60 - sv;
    return dur >= 10;
  };

  const allValid = useMemo(
    () => slots.length > 0 && slots.every(isSlotValid) && !loading && !error,
    [slots, loading, error]
  );

  const addSlot = () => {
    const next = makeSlot();
    setSlots((prev) => [...prev, next]);
    setActiveIdx(slots.length);
    setPicking("start");
    requestAnimationFrame(() => {
      const el = document.getElementById(next.id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const removeSlot = (idx) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((i) => Math.max(0, Math.min(i, slots.length - 2)));
  };

  const handleNext = () => {
    if (!allValid) return;
    const payload = slots.map((s) => ({
      start: fmt24(s.start),
      end: fmt24(s.end),
    }));
    // 스토어에 저장 (register 호출 시 사용)
    setField("operateTimes", payload);

    navigate("/registerpay", {
      state: { lotId: placeId ?? 0, lotName: placeName, timeRanges: payload },
    });
  };

  return (
    <div className="time-container">
      <div className="time-top">
      <img
        src={backIcon}
        alt="뒤로가기"
        className="time-back"
        onClick={() => navigate(-1)}
      />

      <div className="time-header">
        <div className="time-title">주차 가능 시간 설정</div>
        <div className="time-desc">
          10분 단위로 주차 가능한 시간을 설정해주세요.
          <br />
          (주차 가능 최소 10분 이상이어야 합니다)
        </div>
      </div>
      </div>

      <div className="time-scroll">
        <div className="time-slots">
          {slots.map((s, idx) => {
            const text = `${fmt24(s.start)} ~ ${fmt24(s.end)}`;
            const isActive = idx === activeIdx;
            const valid = isSlotValid(s);
            return (
              <div
                id={s.id}
                key={s.id}
                className={`time-slot ${isActive ? "active" : ""}`}
                onClick={() => setActiveIdx(idx)}
              >
                <div className="time-slot-head">
                  <span className="time-slot-label">
                    {labelK(idx)} 주차 가능 시간
                  </span>
                  {slots.length > 1 && (
                    <button
                      className="time-slot-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSlot(idx);
                      }}
                      aria-label="항목 삭제"
                    >
                      {closeSvg ? <img src={closeSvg} alt="" /> : "×"}
                    </button>
                  )}
                </div>

                <div className={`time-slot-input ${valid ? "" : "invalid"}`}>
                  {text}
                </div>

                <div className="time-toggle">
                  <button
                    className={`time-toggle-btn ${
                      isActive && picking === "start" ? "on" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIdx(idx);
                      setPicking("start");
                    }}
                  >
                    시작
                  </button>
                  <button
                    className={`time-toggle-btn ${
                      isActive && picking === "end" ? "on" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIdx(idx);
                      setPicking("end");
                    }}
                  >
                    마무리
                  </button>
                </div>

                {isActive && (
                  <>
                    <div className="time-wheel-wrap">
                      <div
                        className="time-wheel"
                        ref={refA}
                        onScroll={onScroll("ampm")}
                        aria-label="오전/오후 선택"
                      >
                        <div className="time-spacer" />
                        {AMPM.map((v) => (
                          <div
                            key={v}
                            className={`time-item ${
                              target.ampm === v ? "active" : ""
                            }`}
                          >
                            {v}
                          </div>
                        ))}
                        <div className="time-spacer" />
                      </div>

                      <div className="time-col-suffix" />

                      <div
                        className="time-wheel"
                        ref={refH}
                        onScroll={onScroll("h")}
                        aria-label="시 선택"
                      >
                        <div className="time-spacer" />
                        {HOURS12.map((v) => (
                          <div
                            key={v}
                            className={`time-item ${
                              target.h12 === v ? "active" : ""
                            }`}
                          >
                            {v}
                          </div>
                        ))}
                        <div className="time-spacer" />
                      </div>

                      <div className="time-col-suffix">:</div>

                      <div
                        className="time-wheel"
                        ref={refM}
                        onScroll={onScroll("m")}
                        aria-label="분 선택"
                      >
                        <div className="time-spacer" />
                        {MINUTES10.map((v) => (
                          <div
                            key={v}
                            className={`time-item ${
                              target.m === v ? "active" : ""
                            }`}
                          >
                            {pad2(v)}
                          </div>
                        ))}
                        <div className="time-spacer" />
                      </div>

                      <div className="time-guide-line time-guide-top" />
                      <div className="time-guide-line time-guide-bot" />
                    </div>

                    <div className="time-divider" />
                  </>
                )}
              </div>
            );
          })}

          <button className="time-add" onClick={addSlot}>
            + 항목 추가하기
          </button>

          <div className="time-bottom">
            <button
              className="time-next"
              onClick={handleNext}
              disabled={!allValid}
            >
              다음
            </button>
            {error && <div className="time-error">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
