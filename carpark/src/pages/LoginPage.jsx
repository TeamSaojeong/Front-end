// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Login.css";
import { client } from "../apis/client";
import mainpic from "../Assets/main_logo_text.png";

const LoginPage = () => {
  const navigate = useNavigate();

  const [idPlaceholder, setIdPlaceholder] = useState("이메일을 입력해 주세요");
  const [pwPlaceholder, setPwPlaceholder] =
    useState("비밀번호를 입력해 주세요");

  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const isEnabled = id.trim() !== "" && pw.trim() !== "";

  const handleLogin = async () => {
    if (!isEnabled || loading) return;
    setMsg("");
    setLoading(true);

    const idValue = id.trim();

    // 1) JSON: loginId + memberId 둘 다 포함 (어떤 필드로 받아도 매칭)
    const bodyJson = {
      loginId: idValue,
      memberId: idValue,
      password: pw,
    };

    // 2) FORM도 준비 (JSON 실패 시 재시도)
    const form = new URLSearchParams();
    form.set("loginId", idValue);
    form.set("memberId", idValue);
    form.set("password", pw);

    // 로그인 요청엔 Authorization 금지
    const noAuthJson = {
      headers: { Authorization: undefined, "Content-Type": "application/json" },
      validateStatus: () => true,
    };
    const noAuthForm = {
      headers: {
        Authorization: undefined,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      validateStatus: () => true,
    };

    const extractToken = (res) => {
      const h = res.headers?.["authorization"];
      const fromHeader = h?.startsWith("Bearer ") ? h.slice(7) : h;
      const fromBody =
        res.data?.accessToken ||
        res.data?.token ||
        res.data?.jwt ||
        res.data?.data?.accessToken ||
        res.data?.data?.token;
      return fromHeader || fromBody || null;
    };

    try {
      // A) JSON 우선
      let res = await client.post("/api/login", bodyJson, noAuthJson);
      console.log(
        "[login] JSON req body =>",
        bodyJson,
        "| status:",
        res.status,
        "| data:",
        res.data
      );

      // B) JSON 실패면 FORM 재시도
      if (!(res.status >= 200 && res.status < 300)) {
        const res2 = await client.post("/api/login", form, noAuthForm);
        console.log(
          "[login] FORM req body =>",
          Object.fromEntries(form),
          "| status:",
          res2.status,
          "| data:",
          res2.data
        );
        res = res2;
      }

      const ok = res.status >= 200 && res.status < 300;
      const bodyStatus = res.data?.status;
      const message =
        res.data?.message ||
        res.data?.error ||
        "로그인에 실패했어요. 다시 시도해 주세요.";

      if (!ok || (bodyStatus && bodyStatus !== 200)) {
        setMsg(message);
        return;
      }

      // 토큰 저장
      const accessToken = extractToken(res);
      if (accessToken) {
        // 🔍 토큰 디코딩해서 사용자 정보 확인
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          console.log('🔑 새로 발급받은 토큰:', {
            사용자: payload.loginId || payload.sub,
            발급시간: new Date(payload.iat * 1000),
            만료시간: new Date(payload.exp * 1000),
            토큰앞부분: accessToken.substring(0, 50) + '...'
          });
        } catch (e) {
          console.log('토큰 디코딩 실패:', e);
        }
        
        localStorage.setItem("accessToken", accessToken);
        // ✅ 전역 헤더 설정 제거 - interceptor에서만 처리
        // client.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      }

      // 사용자 키 저장 (이메일/아이디). 응답에 값이 없으면 입력값 사용
      const userKey =
        res.data?.data?.memberId ||
        res.data?.memberId ||
        res.data?.data?.loginId ||
        res.data?.loginId ||
        idValue;
      localStorage.setItem("userKey", String(userKey));

      // ✅ (선택) 이전 공용 watchedPlaceIds → 사용자별로 마이그레이션
      try {
        const legacy = localStorage.getItem("watchedPlaceIds");
        if (legacy) {
          const namespacedKey = `watchedPlaceIds__${userKey}`;
          if (!localStorage.getItem(namespacedKey)) {
            localStorage.setItem(namespacedKey, legacy);
          }
          localStorage.removeItem("watchedPlaceIds");
        }
      } catch {}

      navigate("/home");
    } catch (err) {
      const code = err?.response?.status;
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.error;
      if (code === 400) setMsg(serverMsg || "아이디/비밀번호를 확인해 주세요.");
      else if (code === 401) setMsg(serverMsg || "인증에 실패했어요.");
      else if (code === 403) setMsg(serverMsg || "접근 권한이 없습니다.");
      else setMsg(serverMsg || "잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <img src={mainpic} alt="PARK HERE" />
      </div>

      <div className="login-inputs">
        <div>
          <div className="login-inputuptext">이메일</div>
          <div className="login-input">
            <input
              className="login-input-text"
              type="text"
              placeholder={idPlaceholder}
              value={id}
              onChange={(e) => setId(e.target.value)}
              onFocus={() => setIdPlaceholder("")}
              onBlur={() => setIdPlaceholder("이메일을 입력해 주세요")}
              autoComplete="username"
              inputMode="email"
            />
          </div>
        </div>

        <div>
          <div className="login-inputuptext">비밀번호</div>
          <div className="login-input">
            <input
              className="login-password-text"
              type="password"
              placeholder={pwPlaceholder}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onFocus={() => setPwPlaceholder("")}
              onBlur={() => setPwPlaceholder("비밀번호를 입력해 주세요")}
              autoComplete="current-password"
            />
          </div>
        </div>

        {msg && (
          <div style={{ color: "#dc0000", fontSize: 12, paddingLeft: 4 }}>
            {msg}
          </div>
        )}
      </div>

      <div className="loginsubmit-container">
        <div className="notyet-customer">
          아직 회원이 아니신가요?{" "}
          <span onClick={() => navigate("/signup")}>회원가입</span>
        </div>

        <button
          className={`loginsubmit ${!isEnabled || loading ? "gray" : ""}`}
          onClick={handleLogin}
          disabled={!isEnabled || loading}
          type="button"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
