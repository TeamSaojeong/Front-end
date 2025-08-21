// Address.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useParkingForm } from "../../store/ParkingForm";
import "../../Styles/Register/Address.css";

const Address = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 전역 상태와 동기화할 필드 (zustand)
  const {
    address: storeAddress,
    zipcode: storeZipcode,
    setField,
  } = useParkingForm();

  // 화면 표시용 로컬 상태 (초기값은 전역 상태에서)
  const [zip, setZip] = useState(storeZipcode || "");
  const [road, setRoad] = useState(storeAddress || "");

  // 주소 검색 페이지에서 돌아올 때 state에 담아온 값으로 반영
  useEffect(() => {
    const sel = location.state?.selectedAddress;
    if (sel) {
      const roadStr = sel.roadAddress || sel.address || sel.jibunAddress || "";
      const zipStr = sel.zonecode || sel.postcode || sel.zipcode || "";

      setZip(zipStr);
      setRoad(roadStr);

      // 전역 상태에도 저장 (다음 버튼 활성화에 필요)
      setField("zipcode", zipStr);
      setField("address", roadStr);

      // ✅ lat/lng도 저장
      if (sel.lat && sel.lng) {
        setField("lat", sel.lat);
        setField("lng", sel.lng);
        console.log("[Address] 좌표 저장:", sel.lat, sel.lng);
      }

      // state 비우기: 뒤로가기/새로고침 시 중복 세팅 방지
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate, setField]);

  // 직접 수정 가능하게 하려면 readOnly 빼고 onChange에서 전역도 같이 갱신
  const handleZip = (e) => {
    const v = e.target.value;
    setZip(v);
    setField("zipcode", v);
  };

  const handleRoad = (e) => {
    const v = e.target.value;
    setRoad(v);
    setField("address", v);
  };

  const goSearch = () => {
    navigate("/zipcode", { state: { returnTo: location.pathname } });
  };

  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
      <div className="address-text-btn">
        <input
          className="address-zipcode-text"
          type="text"
          placeholder="우편번호"
          value={zip}
          onChange={handleZip} // readOnly 원하면 이 줄 지우고 readOnly 추가
        />
        <button className="address-btn" type="button" onClick={goSearch}>
          주소 검색
        </button>
      </div>

      <input
        className="address-address-text"
        type="text"
        placeholder="주소"
        value={road}
        onChange={handleRoad} // readOnly 원하면 이 줄 지우고 readOnly 추가
      />
    </div>
  );
};

export default Address;
