import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DaumPostcodeEmbed } from "react-daum-postcode";
import PreviousBtn from "../../components/Register/PreviousBtn";
import styled, { createGlobalStyle } from "styled-components";

export default function Zipcode() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || -1;

  const handleComplete = (data) => {
    const addr = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;

    const selectedAddress = {
      postcode: data.zonecode || "",
      address: addr || "",
      type: data.userSelectedType,
      roadAddress: data.roadAddress || "",
      jibunAddress: data.jibunAddress || "",
    };

    if (typeof returnTo === "string") {
      navigate(returnTo, { state: { selectedAddress }, replace: true });
    } else {
      navigate(-1, { state: { selectedAddress }, replace: true });
    }
  };

  return (
    <>
      <ZipOverrides />
      
      <Wrapper className="zip-page">
        <Back>
            <Backinner>
        <PreviousBtn/>
        </Backinner>
        </Back>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
          <DaumPostcodeEmbed
            onComplete={handleComplete}
            style={{ width: "342px", height: "597px" }}
            animation
          />
        </div>
        </Wrapper>
    </>
  );
}

/* 기존 Wrapper 그대로 사용 */
const Wrapper = styled.div`
  background-color: rgba(255, 255, 255, 1);
  width: 24.375rem;
  min-height: 52.75rem;
  margin: 0 auto;
  position: relative;
  box-sizing: border-box;
`;



/* 🔥 핵심: Previous.css 수정 없이, 이 페이지에서만 margin-top 제거 */
const ZipOverrides = createGlobalStyle`
  .zip-page .back {
    margin-top: 0 !important;
    position: sticky;
    top: 0;
    z-index: 1000;
    background: #fff;
  }
`;

const Back = styled.div`
    height: 3.5rem; 
    margin-top: 2.75rem; 
    width: 100%; 
    position: sticky;
    z-index: 1000; 
    padding: 0 1.5rem;

`;

const Backinner = styled.div`
    height: 100%; 
    display: flex; 
    align-items: center; 
`;