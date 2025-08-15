import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Signup.css";
import arrow from "../Assets/arrow.png";
import client from "../apis/client";

const SignupPage = () => {
  const navigate = useNavigate();

  const [idPlaceholder, setIdPlaceholder] = useState("EX) abc1234@naver.com");
  const [pwPlaceholder, setPwPlaceholder] = useState(
    "비밀번호를 입력해 주세요(최소 10자리)"
  );
  const [namePlaceholder, setNamePlaceholder] =
    useState("이름을 입력해 주세요");
  const [carPlaceholder, setCarPlaceholder] = useState(
    "차량번호를 입력해 주세요 (EX)123가4568"
  );

  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pwCheck, setPwCheck] = useState("");
  const [name, setName] = useState("");
  const [car, setCar] = useState("");

  const [idError, setIdError] = useState("");
  const [pwError, setPwError] = useState("");
  const [carError, setCarError] = useState("");

  const carPattern = /^[0-9]{2,3}[가-힣][0-9]{4}$/;
  const isValidId = (v) => v.trim().length >= 8;
  const isValidPw = (v) => v.trim().length >= 10;
  const isValidCar = (v) => carPattern.test(v.trim());

  const isEnabled =
    isValidId(id) &&
    isValidPw(pw) &&
    pw === pwCheck &&
    name.trim() !== "" &&
    isValidCar(car);

  const handleSignup = async () => {
    const idErr = isValidId(id) ? "" : "최소 8자 이상 입력해주세요";
    const pwErr = isValidPw(pw) ? "" : "최소 10자 이상 입력해주세요";
    const carErr = isValidCar(car)
      ? ""
      : "올바르지 않은 차량 번호입니다. (8자리)";
    setIdError(idErr);
    setPwError(pwErr);
    setCarError(carErr);
    if (idErr || pwErr || carErr || name.trim() === "" || pw !== pwCheck)
      return;

    try {
      const res = await client.post("/signup", {
        memberId: id,
        password: pw,
        passwordCheck: pwCheck,
        carnumber: car,
        name: name,
      });

      if (res.data?.status === 200) {
        alert("회원가입 성공");
        navigate("/login");
      } else {
        alert(res.data?.message || "회원가입 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 요청 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-header">
        <img
          src={arrow}
          alt="뒤로가기"
          className="back-arrow"
          onClick={() => navigate(-1)}
        />
        <div className="signup-text">가입하기</div>
      </div>

      <div className="signup-inputs">
        {/* 아이디 */}
        <div className="signup-inputuptext">이메일</div>
        <div className="signup-input">
          <input
            type="text"
            placeholder={idPlaceholder}
            value={id}
            onChange={(e) => setId(e.target.value)}
            onFocus={() => setIdPlaceholder("")}
            onBlur={() => setIdPlaceholder("이메일을 입력해 주세요")}
          />
        </div>
        {idError && <div className="error-text">{idError}</div>}

        {/* 비밀번호 */}
        <div className="signup-inputuptext">비밀번호</div>
        <div className="signup-input">
          <input
            type="password"
            placeholder={pwPlaceholder}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onFocus={() => setPwPlaceholder("")}
            onBlur={() =>
              setPwPlaceholder("비밀번호를 입력해 주세요(최소 10자리)")
            }
          />
        </div>
        {pwError && <div className="error-text">{pwError}</div>}

        {/* 비밀번호 확인 */}
        <div className="signup-inputuptext">비밀번호 확인</div>
        <div className="signup-input">
          <input
            type="password"
            placeholder="비밀번호를 다시 입력해 주세요"
            value={pwCheck}
            onChange={(e) => setPwCheck(e.target.value)}
          />
        </div>

        {/* 이름 */}
        <div className="signup-inputuptext">이름</div>
        <div className="signup-input">
          <input
            type="text"
            placeholder={namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setNamePlaceholder("")}
            onBlur={() => setNamePlaceholder("이름을 입력해 주세요")}
          />
        </div>

        {/* 차량번호 */}
        <div className="signup-inputuptext">차량번호</div>
        <div className="signup-input">
          <input
            type="text"
            placeholder={carPlaceholder}
            value={car}
            onChange={(e) => setCar(e.target.value)}
            onFocus={() => setCarPlaceholder("")}
            onBlur={() =>
              setCarPlaceholder("차량번호를 입력해 주세요 (EX)123가4568")
            }
          />
        </div>
        {carError && <div className="error-text">{carError}</div>}
      </div>

      <div className="signupsubmit-container">
        <button
          className={`signupsubmit ${!isEnabled ? "gray" : ""}`}
          disabled={!isEnabled}
          onClick={handleSignup}
        >
          가입하기
        </button>
      </div>
    </div>
  );
};

export default SignupPage;
