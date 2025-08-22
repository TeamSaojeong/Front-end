import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Signup.css";
import arrow from "../Assets/arrow.png";
import { client } from "../apis/client";

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
  const [name, setName] = useState("");
  const [car, setCar] = useState("");

  const [idError, setIdError] = useState("");
  const [pwError, setPwError] = useState("");
  const [carError, setCarError] = useState("");

  // --- validators ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailMinLen = (v) => v.trim().length >= 8;
  const isEmailFormat = (v) => emailRegex.test(v.trim());
  const isValidPw = (v) => v.trim().length >= 10;

  const normalizeCar = (v) => v.replace(/[\s-]/g, "");
  const carPattern = /^[0-9]{2,3}[가-힣][0-9]{4}$/;
  const isValidCar = (v) => carPattern.test(normalizeCar(v));

  // 에러 메시지 생성 (우선순위: 길이 -> 형식)
  const getIdError = (v) => {
    if (!isEmailMinLen(v)) return "최소 8자 이상 입력해주세요.";
    if (!isEmailFormat(v)) return "올바른 이메일 형식이 아닙니다.";
    return "";
  };
  const getPwError = (v) =>
    isValidPw(v) ? "" : "최소 10자 이상 입력해주세요.";
  const getCarError = (v) =>
    isValidCar(v) ? "" : "올바르지 않은 차량 번호입니다. (예: 123가4568)";

  // 버튼 활성화
  const isEnabled =
    getIdError(id) === "" &&
    getPwError(pw) === "" &&
    name.trim() !== "" &&
    getCarError(car) === "";

  // 블러 시 에러 표시
  const handleIdBlur = () => setIdError(getIdError(id));
  const handlePwBlur = () => setPwError(getPwError(pw));
  const handleCarBlur = () => setCarError(getCarError(car));

  // 타이핑 중 에러 해제/업데이트 (이미 에러가 떠있으면 재검증)
  const handleIdChange = (v) => {
    setId(v);
    if (idError) setIdError(getIdError(v));
  };
  const handlePwChange = (v) => {
    setPw(v);
    if (pwError) setPwError(getPwError(v));
  };
  const handleCarChange = (v) => {
    setCar(v);
    if (carError) setCarError(getCarError(v));
  };

  const handleSignup = async () => {
    // 최종 검증 (Submit 시)
    const _idErr = getIdError(id);
    const _pwErr = getPwError(pw);
    const _carErr = getCarError(car);
    const _nameEmpty = name.trim() === "";

    setIdError(_idErr);
    setPwError(_pwErr);
    setCarError(_carErr);

    if (_idErr || _pwErr || _carErr || _nameEmpty) return;

    try {
      const res = await client.post("/api/signup", {
        memberId: id.trim(),
        password: pw,
        carnumber: normalizeCar(car),
        name: name.trim(),
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
        {/* 이메일 */}
        <div className="signup-inputuptext">이메일</div>
        <div className="signup-input">
          <input              
            className="signup-email-text"
            type="text"
            placeholder={idPlaceholder}
            value={id}
            onChange={(e) => handleIdChange(e.target.value)}
            onFocus={() => setIdPlaceholder("")}
            onBlur={() => {
              setIdPlaceholder("이메일을 입력해 주세요(최소 8자리)");
              handleIdBlur();
            }}
          />
        </div>
        {idError && <div className="error-text">{idError}</div>}

        {/* 비밀번호 */}
        <div className="signup-inputuptext">비밀번호</div>
        <div className="signup-input">
          <input              
            className="signup-password-text"
            type="password"
            placeholder={pwPlaceholder}
            value={pw}
            onChange={(e) => handlePwChange(e.target.value)}
            onFocus={() => setPwPlaceholder("")}
            onBlur={() => {
              setPwPlaceholder("비밀번호를 입력해 주세요(최소 10자리)");
              handlePwBlur();
            }}
          />
        </div>
        {pwError && <div className="error-text">{pwError}</div>}

        {/* 이름 */}
        <div className="signup-inputuptext">이름</div>
        <div className="signup-input">
          <input              
            className="signup-name-text"
            type="text"
            placeholder={namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setNamePlaceholder("")}
            onBlur={() => {
              setNamePlaceholder("이름을 입력해 주세요")}}
          />
        </div>

        {/* 차량번호 */}
        <div className="signup-inputuptext">차량번호</div>
        <div className="signup-input">
          <input
            type="text"
            placeholder={carPlaceholder}
            value={car}
            onChange={(e) => handleCarChange(e.target.value)}
            onFocus={() => setCarPlaceholder("")}
            onBlur={() => {
              setCarPlaceholder("차량번호를 입력해 주세요 (EX)123가4568");
              handleCarBlur();
            }}
            className="signup-carnum-text"
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
          가입 완료
        </button>
      </div>
    </div>
  );
};

export default SignupPage;
