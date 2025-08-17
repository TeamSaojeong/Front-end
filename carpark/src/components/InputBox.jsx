import React from "react";
import "../Styles/Register/InputBox.css";

const InputBox = ({
  className,
  value, // 부모가 관리하는 값
  onChange, // (event) => setState(event.target.value)
  placeholder,
  maxLength,
  onEnter, // (val, event) 선택: 엔터 눌렀을 때
  type = "text",
  name,
  id,
  autoFocus,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onEnter?.(e.currentTarget.value, e);
    }
  };

  return (
    <div className="inputbox-wrapper">
      <input
        className={className || "inputbox"}
        type={type}
        value={value ?? ""} // uncontrolled 경고 방지
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        name={name}
        id={id}
        autoFocus={autoFocus}
      />
    </div>
  );
};

export default InputBox;
