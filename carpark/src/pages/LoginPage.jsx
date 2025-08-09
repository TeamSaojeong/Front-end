import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/LoginSignup.css';

import email_icon from '../Assets/email.png';
import password_icon from '../Assets/password.png';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    //여기에 나중에 axios든 뭐든 써서 로그인 정보 받아오게 할 예정
  }

  return (
    <div className='container'>
      <div className="header">
        <div className="text">Login</div>
        <div className="underline"></div>
      </div>
      <div className="inputs">
        <div className="input">
          <img src={email_icon} alt="" />
          <input type="email" placeholder="Email Id"/>
        </div>
        <div className="input">
          <img src={password_icon} alt="" />
          <input type="password" placeholder="Password"/>
        </div>
        
      </div>
      <div className="forgot-password">Lost Password? <span>Click Here!</span></div>
      <div className="submit-container">
        <div className="submit" onClick={handleLogin}>Login</div>
        <div className="submit gray" onClick={() => navigate('/signupage')}>Go to Sign Up</div>
      </div>
    </div>
  )
}
export default LoginPage;
