import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Address() {
  const navigate = useNavigate();
  const location = useLocation();
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");

  // 주소 검색 페이지에서 선택 후 돌아올 때 state로 값이 넘어옴
  useEffect(() => {
    const sel = location.state?.selectedAddress;
    if (sel) {
      setPostcode(sel.postcode || "");
      setAddress(sel.address || "");
    }
  }, [location.state]);

  const goSearch = () => {
    // 돌아올 경로를 알려주고 싶으면 state에 넣어 전달 가능
    navigate("/zipcode", { state: { returnTo: "/register/address" } });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ postcode, address });
    // TODO: 서버 전송 또는 다음 단계로
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
        <input type="text" placeholder="우편번호" value={postcode} readOnly />
        <button type="button" onClick={goSearch}>주소 검색</button>
      </div>
      <input type="text" placeholder="주소" value={address} readOnly />
      <button type="submit">다음</button>
    </form>
  );
}