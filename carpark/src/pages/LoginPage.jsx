// src/pages/LoginPage.jsx
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

    try {
      const res = await client.post("/api/login", {
        loginId: id.trim(),
        password: pw,
      });

      const httpOk = res.status >= 200 && res.status < 300;
      const { status: bodyStatus, message } = res.data || {};

      // 1) 응답 헤더(Authorization) → "Bearer xxx" 또는 "xxx"
      const authRaw = res.headers?.["authorization"];
      const fromHeader = authRaw?.startsWith("Bearer ")
        ? authRaw.slice(7)
        : authRaw;

      // 2) 혹시 바디에 토큰이 온다면 대비
      const fromBody =
        res.data?.accessToken ||
        res.data?.token ||
        res.data?.jwt ||
        res.data?.data?.accessToken ||
        res.data?.data?.token;

      const accessToken = fromHeader || fromBody;

      if (httpOk && (bodyStatus === undefined || bodyStatus === 200)) {
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          client.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        } else {
          // 서버가 헤더로만 토큰을 주는 경우, CORS에 expose가 필요
          console.warn(
            "[LOGIN] 토큰 미수신. 서버 CORS에 Access-Control-Expose-Headers: Authorization, Refresh-Token 추가 필요."
          );
        }
        navigate("/home");
      } else {
        setMsg(message || "로그인에 실패했어요. 다시 시도해 주세요.");
      }
    } catch (err) {
      const code = err?.response?.status;
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.error;
      if (code === 401)
        setMsg(serverMsg || "아이디 또는 비밀번호를 확인해 주세요.");
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
