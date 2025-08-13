import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Signup.css";

const SignupPage = () => {
  const navigate = useNavigate();

  const [idPlaceholder, setIdPlaceholder] = useState(
    "아이디를 입력해 주세요(최소 8자리)"
  );
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
  const [name, setName] = useState("");
  const [car, setCar] = useState("");

  const [idError, setIdError] = useState("");
  const [pwError, setPwError] = useState("");
  const [carError, setCarError] = useState("");

  // 차량번호 규칙대로 정의
  const carPattern = /^[0-9]{2,3}[가-힣][0-9]{4}$/;

  // 유효성 검사를 위한 함수 미리 선언
  const isValidId = (v) => v.trim().length >= 8;
  const isValidPw = (v) => v.trim().length >= 10;
  const isValidCar = (v) => carPattern.test(v.trim());

  const isEnabled =
    isValidId(id) && isValidPw(pw) && name.trim() !== "" && isValidCar(car);

  //입력 중에는 값만 바뀌고
  const handleIdChange = (e) => setId(e.target.value);
  //블러에서만 에러 뜨도록 설정
  const handleIdBlur = () => {
    const t = id.trim();
    setId(t);
    setIdError(isValidId(t) ? "" : "최소 8자 이상 입력해주세요");
  };

  const handlePwChange = (e) => setPw(e.target.value);
  const handlePwBlur = () => {
    const t = pw.trim();
    setPw(t);
    setPwError(isValidPw(t) ? "" : "최소 10자 이상 입력해주세요");
  };

  const handleNameChange = (e) => setName(e.target.value);
  const handleNameBlur = () => setName((prev) => prev.trim());

  const handleCarChange = (e) => setCar(e.target.value);
  const handleCarBlur = () => {
    const t = car.trim();
    setCar(t);
    setCarError(isValidCar(t) ? "" : "올바르지 않은 차량 번호입니다. (8자리)");
  };

  // 회원가입 로직
  const handleSignup = () => {
    const idErr = isValidId(id) ? "" : "최소 8자 이상 입력해주세요";
    const pwErr = isValidPw(pw) ? "" : "최소 10자 이상 입력해주세요";
    const carErr = isValidCar(car)
      ? ""
      : "올바르지 않은 차량 번호입니다. (8자리)";
    setIdError(idErr);
    setPwError(pwErr);
    setCarError(carErr);
    if (idErr || pwErr || carErr || name.trim() === "") return;

    // 나중에 axiois 이용해서 로직 작성해야함
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">가입하기</div>
        <div className="underline"></div>
      </div>

      <div className="inputs">
        {/* 아이디 */}
        <div className="inputuptext">아이디</div>
        <div className="input">
          <input
            type="text"
            placeholder={idPlaceholder}
            value={id}
            onChange={handleIdChange}
            onFocus={() => setIdPlaceholder("")}
            onBlur={() => {
              setIdPlaceholder("아이디를 입력해 주세요(최소 8자리)");
              handleIdBlur();
            }}
          />
        </div>
        {idError && <div className="error-text">{idError}</div>}

        {/* 비밀번호 */}
        <div className="inputuptext">비밀번호</div>
        <div className="input">
          <input
            type="password"
            placeholder={pwPlaceholder}
            value={pw}
            onChange={handlePwChange}
            onFocus={() => setPwPlaceholder("")}
            onBlur={() => {
              setPwPlaceholder("비밀번호를 입력해 주세요(최소 10자리)");
              handlePwBlur();
            }}
            autoComplete="new-password"
          />
        </div>
        {pwError && <div className="error-text">{pwError}</div>}

        {/* 이름 */}
        <div className="inputuptext">이름</div>
        <div className="input">
          <input
            type="text"
            placeholder={namePlaceholder}
            value={name}
            onChange={handleNameChange}
            onFocus={() => setNamePlaceholder("")}
            onBlur={() => {
              setNamePlaceholder("이름을 입력해 주세요");
              handleNameBlur();
            }}
          />
        </div>

        {/* 차량번호 */}
        <div className="inputuptext">차량번호</div>
        <div className="input">
          <input
            type="text"
            placeholder={carPlaceholder}
            value={car}
            onChange={handleCarChange}
            onFocus={() => setCarPlaceholder("")}
            onBlur={() => {
              setCarPlaceholder("차량번호를 입력해 주세요 (EX)123가4568");
              handleCarBlur();
            }}
            inputMode="numeric"
          />
        </div>
        {carError && <div className="error-text">{carError}</div>}
      </div>

      <div className="signupsubmit-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSignup();
          }}
          style={{ width: "100%" }}
        >
          <button
            className={`signupsubmit ${!isEnabled ? "gray" : ""}`}
            disabled={!isEnabled}
            type="submit"
          >
            가입하기
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
