import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/Nfc/Estate.css";

import backIcon from "../../Assets/arrow.png";
import clockIcon from "../../Assets/clock.svg";

const ITEM_H = 44;

export default function Estate() {
  const navigate = useNavigate();
  const { state, search } = useLocation() || {};
  const qs = new URLSearchParams(search || "");
  const placeId = state?.placeId ?? qs.get("placeId") ?? 999;

  const [loading, setLoading] = useState(!state?.prefetched);
  const [error, setError] = useState(null);
  const [placeName, setPlaceName] = useState(state?.placeName ?? "—");
  const [openRangesText, setOpenRangesText] = useState(
    state?.openRangesText ?? "—"
  );
  const [pricePer10Min, setPricePer10Min] = useState(state?.pricePer10Min ?? 0);

  useEffect(() => {
    if (!placeId || state?.prefetched) return;
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        await new Promise((r) => setTimeout(r, 200));
        const data = {
          placeName: "양재동부동산중개 앞 주차장(구간162)",
          openRangesText: "00:00 ~ 24:00",
          pricePer10Min: 300,
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

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = [0, 10, 20, 30, 40, 50];

  const [h, setH] = useState(0);
  const [m, setM] = useState(10);

  const totalMinutes = h * 60 + m;
  const isDisabled = totalMinutes === 0;

  const blocks = Math.ceil(totalMinutes / 10);
  const estimatedCost = totalMinutes === 0 ? 0 : blocks * (pricePer10Min || 0);

  const fmt2 = (n) => (n < 10 ? `0${n}` : String(n)).slice(-2);
  const durationText = `${fmt2(Math.floor(totalMinutes / 60))}시간 ${fmt2(
    totalMinutes % 60
  )}분`;

  const wheelHRef = useRef(null);
  const wheelMRef = useRef(null);
  const scrollTimerH = useRef(null);
  const scrollTimerM = useRef(null);

  useEffect(() => {
    const wh = wheelHRef.current;
    const wm = wheelMRef.current;
    if (wh) wh.scrollTop = h * ITEM_H;
    if (wm)
      wm.scrollTop =
        (minutes.indexOf(m) >= 0 ? minutes.indexOf(m) : 0) * ITEM_H;
  }, []);

  const snapToIndex = (el, index) => {
    if (!el) return;
    const top = index * ITEM_H;
    el.scrollTo({ top, behavior: "smooth" });
  };

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

  const handlePay = () => {
    if (isDisabled || loading || error) return;

    const now = new Date();
    const end = new Date(now.getTime() + totalMinutes * 60000);

    navigate("/EstatePayPage", {
      state: {
        demo: true,
        lotId: placeId || 999,
        startAt: now.toISOString(),
        endAt: end.toISOString(),
      },
    });
  };

  return (
    <div className="estate-container">
      <img
        src={backIcon}
        alt="뒤로가기"
        className="estate-back"
        onClick={() => navigate(-1)}
      />

      <div className="estate-header">
        <div className="estate-title">주차 이용 시간을{"\n"}선택해 주세요</div>

        <div className="estate-meta">
          <div className="estate-row">
            <span className="estate-label">주차 장소 이름</span>
            <span className="estate-value">
              {loading ? "불러오는 중..." : error ? "—" : placeName}
            </span>
          </div>
          <div className="estate-row">
            <span className="estate-label">주차 가능 시간</span>
            <span className="estate-value">
              {loading ? "불러오는 중..." : error ? "—" : openRangesText}
            </span>
          </div>
          <div className="estate-row">
            <span className="estate-label">10분당 주차 비용</span>
            <span className="estate-value">
              {loading
                ? "…"
                : error
                ? "—"
                : `${pricePer10Min.toLocaleString()}원`}
            </span>
          </div>
        </div>

        <div className="estate-chip">
          <img src={clockIcon} alt="" className="estate-chip-icon" />
          <span>{durationText}</span>
        </div>
      </div>

      <div className="estate-wheel-wrap">
        <div
          className="estate-wheel"
          ref={wheelHRef}
          onScroll={handleScroll("h")}
          aria-label="시간 선택 휠"
        >
          <div className="estate-spacer" />
          {hours.map((hh) => (
            <div className={`estate-item ${h === hh ? "active" : ""}`} key={hh}>
              {hh}
            </div>
          ))}
          <div className="estate-spacer" />
        </div>

        <div className="estate-col-suffix">:</div>

        <div
          className="estate-wheel"
          ref={wheelMRef}
          onScroll={handleScroll("m")}
          aria-label="분 선택 휠"
        >
          <div className="estate-spacer" />
          {minutes.map((mm) => (
            <div className={`estate-item ${m === mm ? "active" : ""}`} key={mm}>
              {fmt2(mm)}
            </div>
          ))}
          <div className="estate-spacer" />
        </div>

        <div className="estate-guide-line estate-guide-top" />
        <div className="estate-guide-line estate-guide-bot" />
      </div>

      <div className="estate-bottom">
        <button
          className={`estate-pay ${
            isDisabled || loading || error ? "disabled" : ""
          }`}
          onClick={handlePay}
          disabled={isDisabled || loading || !!error}
        >
          결제하기
        </button>
        {error && <div className="estate-error">{error}</div>}
      </div>
    </div>
  );
}
