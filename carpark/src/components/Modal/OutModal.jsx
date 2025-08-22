// src/components/Modal/OutModal.jsx
import React, { useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import "../../Styles/Modal/OutModal.css";
import outmd from "../../Assets/outmd.svg";

const normalizeId = (id) => String(id ?? "").replace(/^kakao:/i, "");
const getUserKey = () => localStorage.getItem("userKey") || "guest";
const LSK_NAMES = (k) => `watchedPlaceNames__${k}`;

/** 구독한 주차장 이름 맵 { [placeId]: name } */
function readWatchedNames(userKey = getUserKey()) {
  try {
    const raw = localStorage.getItem(LSK_NAMES(userKey));
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

/**
 * 곧 나감 알림 모달
 *
 * props:
 * - isOpen        : boolean
 * - minutesAgo    : number
 * - placeId       : string | number   ← (백업 이름 조회용)
 * - placeName     : string            ← (우선 표시)
 * - onClose       : () => void
 * - onViewDetail  : () => void
 * - autoCloseMs   : number | 0        ← (자동 닫기 ms, 0은 비활성)
 * - vibrate       : boolean           ← (알림시 진동)
 * - sound         : boolean           ← (알림시 효과음)
 */
export default function OutModal({
  isOpen = false,
  minutesAgo = 10,
  placeId,
  placeName,
  onClose,
  onViewDetail,
  autoCloseMs = 0,
  vibrate = true,
  sound = false,
}) {
  const sheetRef = useRef(null);
  const closeBtnRef = useRef(null);
  const primaryBtnRef = useRef(null);
  const prevOverflowRef = useRef("");

  // 효과음(optional)
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02);
      o.start();
      setTimeout(() => {
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        setTimeout(() => {
          try {
            o.stop();
            ctx.close();
          } catch {}
        }, 120);
      }, 60);
    } catch {}
  };

  // 🔤 표시할 이름 결정: prop → 로컬 구독 이름 → 기본값
  const displayName = useMemo(() => {
    if (placeName && String(placeName).trim()) return placeName;
    const names = readWatchedNames();
    const key = normalizeId(placeId);
    return (key && names[key]) || "주차장";
  }, [placeId, placeName]);

  // 열릴 때: ESC 닫기, 스크롤 잠금, 진동/사운드, 포커스 이동/트랩
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      // 포커스 트랩
      if (e.key === "Tab") {
        const focusables = sheetRef.current?.querySelectorAll(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    prevOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (vibrate && navigator.vibrate) navigator.vibrate([40, 60, 40]);
    if (sound) playBeep();

    requestAnimationFrame(() => {
      (primaryBtnRef.current || closeBtnRef.current)?.focus?.();
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflowRef.current;
    };
  }, [isOpen, onClose, vibrate, sound]);

  // 자동 닫기(옵션)
  useEffect(() => {
    if (!isOpen || !autoCloseMs) return;
    const t = setTimeout(() => onClose?.(), autoCloseMs);
    return () => clearTimeout(t);
  }, [isOpen, autoCloseMs, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="om-overlay" onClick={onClose} role="presentation">
      <div
        className="om-sheet"
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="om-title"
        aria-describedby="om-desc"
      >
        <button
          className="om-close"
          onClick={onClose}
          aria-label="닫기"
          ref={closeBtnRef}
        >
          ×
        </button>

        <img className="om-illust" src={outmd} alt="" />

        <h3 id="om-title" className="om-title">
          {minutesAgo}분 전 “곧 나감”이 떴어요!
        </h3>
        <p id="om-desc" className="om-sub" aria-live="polite">
          찾고 있던 주차 장소였다면, 얼른 준비하세요.
        </p>

        <div
          className="om-placecard"
          role="button"
          tabIndex={0}
          onClick={onViewDetail}
          onKeyDown={(e) => e.key === "Enter" && onViewDetail?.()}
          aria-label={`${displayName} 상세 보기`}
        >
          <div className="om-place-top">주차 장소</div>
          <div className="om-place-name">{displayName}</div>
        </div>

        <button
          className="om-primary"
          onClick={onViewDetail}
          ref={primaryBtnRef}
        >
          상세 보기
        </button>
      </div>
    </div>,
    document.body
  );
}
