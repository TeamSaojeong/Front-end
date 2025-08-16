import React, { useRef } from "react";
import useBottomSheet from "./useBottomSheet";
import "../Styles/BottomSheet.css";
import Content from "./Content";

export default function BottomSheet({
  hostRef,
  places = [],
  isLoading = false,
  errorMsg = "",
  onRefresh,
  onRefreshHere,
}) {
  const sheetRef = useRef(null);
  const contentRef = useRef(null);

  useBottomSheet({ hostRef, sheetRef, contentRef });

  return (
    <div className="bs-wrapper" ref={sheetRef}>
      <div className="bs-header">
        <div className="bs-handle" />
      </div>
      <div className="bs-content" ref={contentRef}>
        <Content
          places={places}
          isLoading={isLoading}
          errorMsg={errorMsg}
          onRefresh={onRefresh}
          onRefreshHere={onRefreshHere}
        />
      </div>
    </div>
  );
}
