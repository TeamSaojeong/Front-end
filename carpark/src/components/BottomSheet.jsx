import React, { useRef } from "react";
import useBottomSheet from "./useBottomSheet";
import "../Styles/BottomSheet.css";
import Content from "./Content";

export default function BottomSheet({ hostRef, places = [] }) {
  const sheetRef = useRef(null);
  const contentRef = useRef(null);

  useBottomSheet({ hostRef, sheetRef, contentRef });

  return (
    <div className="bs-wrapper" ref={sheetRef}>
      <div className="bs-header">
        <div className="bs-handle" />
      </div>
      <div className="bs-content" ref={contentRef}>

        {/*Home에서 받은 places를 그대로 내려줌 */}
        <Content places={places} />
      </div>
    </div>
  );
}
