import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useParkingForm } from "../../store/ParkingForm";

export default function Address() {
  const navigate = useNavigate();
  const location = useLocation();
  //일단 우편번호는 저장 x 화면 표시만
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");

  //주소만 전역 상태에 저장
  const { setField } = useParkingForm();

  //zipcodepage에서 돌아올떼 선택한 값 받음
  // 주소 검색 페이지에서 선택 후 돌아올 때 state로 값이 넘어옴
  useEffect(() => {
    const sel = location.state?.selectedAddress;
    const zonecode = location.state?.zonecode;
    if (sel) {
      setAddress(sel);
      setField("address", sel); // 주소만 전역 저장함
    }
    if (zonecode) {
      setPostcode(zonecode);
    }
  }, [location.state, setField]);

  const goSearch = () => {
    navigate("/zipcode", { state: { returnTo: location.pathname } });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ postcode, address });
    // TODO: 서버 전송 또는 다음 단계로
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: 8, maxWidth: 420 }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
        <input type="text" placeholder="우편번호" value={postcode} readOnly />
        <button type="button" onClick={goSearch}>
          주소 검색
        </button>
      </div>
      <input type="text" placeholder="주소" value={address} readOnly />
    </form>
  );
}
