import React, { useRef, useState, useEffect } from "react";
import useBottomSheet from "./useBottomSheet";
import "../Styles/BottomSheet.css";
import Content from "./Content";

export default function BottomSheet({
  hostRef,
  places = [],
  isLoading = false,
  errorMsg = "",
  onRefreshHere, // ← 현 위치 재검색
  onSelectPlace,
  onOpenChange,
}) {
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const headerRef = useRef(null); // 헤더 전용 드래그 타깃

  //타이틀 표시 여부
  const [showTitle, setShowTitle] = useState(false);
  const sentinelRef = useRef(null);

  useBottomSheet({ hostRef, sheetRef, contentRef, headerRef, onOpenChange });

  //헤더 바로 밑 센티넬 보임 여부로 타이틀 토글
  useEffect(()=>{
    const rootEl = hostRef?.current ?? null;
    const io = new IntersectionObserver(
      ([entry]) => setShowTitle(entry.isIntersecting),
      {
        root: rootEl,        // host 기준(없으면 뷰포트)
        threshold: 0.3,
        rootMargin: "0px 0px -20% 0px",
      }
    );
    const s = sentinelRef.current;
    if (s) io.observe(s);
    return () => io.disconnect();
  }, [hostRef]);


  return (
        <div
          className={`bs-wrapper ${showTitle ? "show-title" : ""}`}
          ref={sheetRef}>
      <div className="bs-header" ref={headerRef}>
        <div className="bs-handle" />
        <div className="bs-sentinel" ref={sentinelRef} aria-hidden></div>
      </div>

      <div className="bs-content" ref={contentRef}>
        <Content
          places={places}
          isLoading={isLoading}
          errorMsg={errorMsg}
          onRefreshHere={onRefreshHere}
          onSelectPlace={onSelectPlace}
        />
      </div>
    </div>
  );
}
