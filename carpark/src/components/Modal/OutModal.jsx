import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import "../../Styles/Modal/OutModal.css";
import outmd from "../../Assets/outmd.svg";

/**
 * 곧 나감 알림 모달
 *
 * props:
 * - isOpen        : boolean  — 열림/닫힘
 * - minutesAgo    : number   — "5분 전 곧 나감이 나타났어요!"에서 5
 * - placeName     : string   — 주차장 이름
 * - onClose       : () => void
 * - onViewDetail  : () => void  — 상세보기 버튼 클릭
 */
export default function OutModal({
  isOpen = false,
  minutesAgo = 5,
  placeName = "주차 장소 이름",
  onClose,
  onViewDetail,
}) {
  // ESC로 닫기 + 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // body로 포탈 렌더
  return ReactDOM.createPortal(
    <div
      className="om-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="om-sheet"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="om-title"
      >
        <button className="om-close" onClick={onClose} aria-label="닫기">
          ×
        </button>

        <img className="om-illust" src={outmd} alt="" />

        <h3 id="om-title" className="om-title">
          {minutesAgo}분 전 곧 나감이 나타났어요!
        </h3>
        <p className="om-sub">찾고 있던 주차 장소였다면, 얼른 준비하세요!</p>

        <div
          className="om-placecard"
          role="button"
          tabIndex={0}
          onClick={onViewDetail}
          onKeyDown={(e) => e.key === "Enter" && onViewDetail?.()}
        >
          <div className="om-place-top">주차 장소</div>
          <div className="om-place-name">{placeName}</div>
        </div>

        <button className="om-primary" onClick={onViewDetail}>
          상세 보기
        </button>
      </div>
    </div>,
    document.body
  );
}
