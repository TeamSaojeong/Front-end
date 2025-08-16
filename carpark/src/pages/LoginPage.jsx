import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Login.css";
import client from "../apis/client";
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
      //프록시 사용 → /login 으로 호출하면 proxy로 백엔드로 전달됨
      const res = await client.post("/login", {
        loginId: id.trim(),
        password: pw,
      });

      const { status, message } = res.data || {};
      // 토큰이 헤더로 올 수도 있어 대비 (axios는 헤더 키가 소문자)
      const accessRaw = res.headers?.["authorization"]; // 예: "Bearer x.y.z"
      const refreshRaw = res.headers?.["refresh-token"]; // 예: "x.y.z"
      const accessToken = accessRaw?.startsWith("Bearer ")
        ? accessRaw.slice(7)
        : accessRaw;

      if (status === 200) {
        if (accessToken) localStorage.setItem("accessToken", accessToken);
        if (refreshRaw) localStorage.setItem("refreshToken", refreshRaw);
        if (accessToken) {
          client.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;
        }
        navigate("/home");
      } else {
        setMsg(message || "로그인에 실패했어요. 다시 시도해 주세요.");
      }
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "아이디 또는 비밀번호를 확인해 주세요.";
      setMsg(serverMsg);
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
