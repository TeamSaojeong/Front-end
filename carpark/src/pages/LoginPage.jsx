// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Login.css";
import { client } from "../apis/client"; // ✅ named import
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
      // ✅ 엔드포인트/필드 수정
      const res = await client.post("/api/login", {
        loginId: id.trim(), // 이메일 or 아이디
        password: pw, // 비밀번호
      });

      // 서버가 status를 HTTP 코드/바디 둘 다로 줄 가능성 대비
      const httpOk = res.status >= 200 && res.status < 300;
      const { status: bodyStatus, message, token } = res.data || {};

      // 토큰은 바디 또는 헤더로 올 수 있음 (헤더 노출에는 서버 CORS의 expose 필요)
      const accessRaw = res.headers?.["authorization"]; // "Bearer x.y.z" 또는 없음
      const refreshRaw = res.headers?.["refresh-token"]; // "x.y.z" 또는 없음
      const accessToken = accessRaw?.startsWith("Bearer ")
        ? accessRaw.slice(7)
        : accessRaw || token;

      if (httpOk && (bodyStatus === undefined || bodyStatus === 200)) {
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          client.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;
        }
        if (refreshRaw) localStorage.setItem("refreshToken", refreshRaw);
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
