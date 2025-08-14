import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DaumPostcodeEmbed } from "react-daum-postcode";
import PreviousBtn from "../../components/Register/PreviousBtn";

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
    <div className="Wrapper">
                    <PreviousBtn/>
    </div>
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <DaumPostcodeEmbed
        onComplete={handleComplete}
        style={{ width: "342px", height: "597px" }}
        animation
      />
      
    </div>
    </>
  );
}