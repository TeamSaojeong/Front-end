import React, { useRef } from "react";
import useBottomSheet from "./useBottomSheet";
import "../Styles/BottomSheet.css";
import Content from "./Content";

export default function BottomSheet({
  hostRef,
  places = [],
  isLoading = false,
  errorMsg = "",
  onRefreshHere,
  onSelectPlace,
  onOpenChange,
}) {
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const headerRef = useRef(null);

  const { open, close } = useBottomSheet({
    hostRef,
    sheetRef,
    contentRef,
    headerRef,
    onOpenChange,
  });

  const handleRefresh = () => {
    onRefreshHere?.();
    close(); // ✅ 현 위치에서 다시 검색 시 자동으로 닫힘
  };

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
          onRefreshHere={handleRefresh}
          onSelectPlace={onSelectPlace}
        />
      </div>
    </div>
  );
}
