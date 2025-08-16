import { useLocation, useNavigate } from "react-router-dom";
import { DaumPostcodeEmbed } from "react-daum-postcode";
import PreviousBtn from "../../components/Register/PreviousBtn";
import styled, { createGlobalStyle } from "styled-components";

const ZipCodePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || -1;

  const handleComplete = (data) => {
    const addr =
      data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;

    const selectedAddress = {
      zipcode: data.zonecode || "",
      address: addr || "",
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
        <Back className="zip-back">
          <Backinner>
            <PreviousBtn onClick={() => navigate(-1)} />
          </Backinner>
        </Back>
        <div style={{ maxWidth: 720, margin: "26px auto"}}>
          <DaumPostcodeEmbed
            onComplete={handleComplete}
            style={{ width: "342px", height: "597px" }}
            animation
          />
        </div>
      </Wrapper>
    </>
  );
};

export default ZipCodePage;
const Wrapper = styled.div`
  background-color: rgba(255, 255, 255, 1);
  width: 24.375rem;
  min-height: 52.75rem;
  margin: 0 auto;
  position: relative;
  box-sizing: border-box;
  padding: 0 1.5rem;
`;

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
  
`;

const Backinner = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
`;
