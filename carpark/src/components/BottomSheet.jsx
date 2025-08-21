import React, { useRef } from "react";
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

  useBottomSheet({ hostRef, sheetRef, contentRef, headerRef, onOpenChange });

  return (
    <div className="bs-wrapper" ref={sheetRef}>
      <div className="bs-header" ref={headerRef}>
        <div className="bs-handle" />
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
