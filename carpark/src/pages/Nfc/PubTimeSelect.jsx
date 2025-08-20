// src/pages/Nfc/PubTimeSelect.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/Nfc/PubTimeSelect.css";

import backIcon from "../../Assets/arrow.png";
import clockIcon from "../../Assets/clock.svg";

const ITEM_H = 44; // CSS의 .pub-item 높이와 반드시 동일

const readSelectedPlace = () => {
  try {
    const raw = sessionStorage.getItem("selectedPlace");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function PubTimeSelect() {
  const navigate = useNavigate();
  const { state, search } = useLocation() || {};
  const qs = new URLSearchParams(search || "");
  const placeFromSession = readSelectedPlace();

  // Home/상세/NFC에서 전달되는 placeId (없으면 null)
  const placeId =
    state?.placeId ?? qs.get("placeId") ?? placeFromSession?.id ?? null;

  // ------- (공영/민영) 백엔드에서 받아올 값들 -------
  const [loading, setLoading] = useState(!state?.prefetched);
  const [error, setError] = useState(null);
  const [placeName, setPlaceName] = useState(
    state?.placeName ?? placeFromSession?.name ?? "—"
  );
  const [openRangesText, setOpenRangesText] = useState(
    state?.openRangesText ?? "—"
  );
  // --------------------------------------------------

  // 데이터 로딩 (prefetched면 스킵)
  useEffect(() => {
    if (!placeId || state?.prefetched) return;

    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: 실제 API(getPublicDetail)로 교체
        await new Promise((r) => setTimeout(r, 200));
        const data = {
          placeName: placeFromSession?.name ?? "주차장",
          openRangesText: "00:00 ~ 00:00",
        };

        if (aborted) return;
        setPlaceName(data.placeName);
        setOpenRangesText(data.openRangesText);
      } catch (e) {
        if (!aborted) setError("정보를 불러오지 못했어요.");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [placeId, state?.prefetched, placeFromSession]);

  // ===== 시간/분 (10분 단위) =====
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = [0, 10, 20, 30, 40, 50];

  const [h, setH] = useState(0);
  const [m, setM] = useState(10);

  const totalMinutes = h * 60 + m;
  const isDisabled = totalMinutes === 0 || loading || !!error;

  const fmt2 = (n) => (n < 10 ? `0${n}` : String(n)).slice(-2);
  const durationText = `${fmt2(Math.floor(totalMinutes / 60))}시간 ${fmt2(
    totalMinutes % 60
  )}분`;

  // ===== 휠 스냅 =====
  const wheelHRef = useRef(null);
  const wheelMRef = useRef(null);
  const scrollTimerH = useRef(null);
  const scrollTimerM = useRef(null);

  // 초기 위치
  useEffect(() => {
    const wh = wheelHRef.current;
    const wm = wheelMRef.current;
    if (wh) wh.scrollTop = h * ITEM_H;
    if (wm) {
      const idx = Math.max(0, minutes.indexOf(m));
      wm.scrollTop = idx * ITEM_H;
    }
    // mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapToIndex = (el, idx) => {
    if (!el) return;
    el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  };

  const handleScroll = (type) => (e) => {
    const el = e.currentTarget;
    const rawIdx = el.scrollTop / ITEM_H;
    const idx = Math.round(rawIdx);

    if (type === "h") {
      if (scrollTimerH.current) clearTimeout(scrollTimerH.current);
      scrollTimerH.current = setTimeout(() => {
        const safe = Math.min(Math.max(idx, 0), hours.length - 1);
        snapToIndex(el, safe);
        setH(hours[safe]);
      }, 100);
    } else {
      if (scrollTimerM.current) clearTimeout(scrollTimerM.current);
      scrollTimerM.current = setTimeout(() => {
        const safe = Math.min(Math.max(idx, 0), minutes.length - 1);
        snapToIndex(el, safe);
        setM(minutes[safe]);
      }, 100);
    }
  };

  // 시작(결제/입차) — 현재는 OutSoon으로 연결
  const [submitting, setSubmitting] = useState(false);
  const handleStart = async () => {
    if (isDisabled || submitting) return;

    setSubmitting(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + totalMinutes * 60000);

      navigate("/outsoon", {
        state: {
          inUseByOther: true, // 2번째 스샷처럼 ‘이용중…’ 화면
          placeId: placeId ?? null,
          placeName,
          address: state?.address ?? placeFromSession?.address ?? "",
          provider: "kakao",
          externalId: placeId,
          startAt: now.toISOString(),
          endAt: end.toISOString(),
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pub-container">
      {/* 뒤로가기 */}
      <img
        src={backIcon}
        alt="뒤로가기"
        className="pub-back"
        onClick={() => navigate(-1)}
      />

      {/* 헤더 */}
      <div className="pub-header">
        <div className="pub-title">
          예상 주차 이용 시간을{"\n"}선택해 주세요
        </div>

        <div className="pub-meta">
          <div className="pub-row">
            <span className="pub-label">주차 장소 이름</span>
            <span className="pub-value">
              {loading ? "불러오는 중..." : error ? "—" : placeName}
            </span>
          </div>
          <div className="pub-row">
            <span className="pub-label">주차 가능 시간</span>
            <span className="pub-value">
              {loading ? "불러오는 중..." : error ? "—" : openRangesText}
            </span>
          </div>
        </div>

        {/* 선택 시간 표시 칩 (풀폭) */}
        <div className="pub-chip">
          <img src={clockIcon} alt="" className="pub-chip-icon" />
          <span>{durationText}</span>
        </div>
      </div>

      {/* 휠 (가이드 라인 포함) */}
      <div className="pub-wheel-wrap">
        <div
          className="pub-wheel"
          ref={wheelHRef}
          onScroll={handleScroll("h")}
          aria-label="시간 선택 휠"
        >
          <div className="pub-spacer" />
          {hours.map((hh) => (
            <div className={`pub-item ${h === hh ? "active" : ""}`} key={hh}>
              {hh}
            </div>
          ))}
          <div className="pub-spacer" />
        </div>

        <div className="pub-col-suffix">:</div>

        <div
          className="pub-wheel"
          ref={wheelMRef}
          onScroll={handleScroll("m")}
          aria-label="분 선택 휠"
        >
          <div className="pub-spacer" />
          {minutes.map((mm) => (
            <div className={`pub-item ${m === mm ? "active" : ""}`} key={mm}>
              {fmt2(mm)}
            </div>
          ))}
          <div className="pub-spacer" />
        </div>

        {/* 가운데 가이드 라인 */}
        <div className="pub-guide-line pub-guide-top" />
        <div className="pub-guide-line pub-guide-bot" />
      </div>

      {/* 하단 버튼 */}
      <div className="pub-bottom">
        <button
          className={`pub-pay ${isDisabled || submitting ? "disabled" : ""}`}
          onClick={handleStart}
          disabled={isDisabled || submitting}
        >
          {submitting ? "이동 중..." : "주차장 이용 시작"}
        </button>
        {error && <div className="pub-error">{error}</div>}
      </div>
    </div>
  );
}
