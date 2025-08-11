// src/components/BottomSheet/BottomSheet.jsx
import React, { useRef } from "react";
import useBottomSheet from "./useBottomSheet";
import "../Styles/BottomSheet.css";
import Content from "./Content";

export default function BottomSheet({ hostRef }) {
  const sheetRef = useRef(null);
  const contentRef = useRef(null);

  useBottomSheet({ hostRef, sheetRef, contentRef });

  return (
    <div className="bs-wrapper" ref={sheetRef}>
      <div className="bs-header">
        <div className="bs-handle" />
      </div>
      <div className="bs-content" ref={contentRef}>
        <Content />
      </div>
    </div>
  );
}
