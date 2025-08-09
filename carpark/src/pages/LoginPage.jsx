import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/LoginSignup.css';

import email_icon from '../Assets/email.png';
import password_icon from '../Assets/password.png';

const LoginPage = () => {
  const navigate = useNavigate();

  const [idPlaceholder,setIdPlaceholder]=useState('아이디를 입력해 주세요');
  const [pwPlaceholder,setPwPlaceholder]=useState('비밀번호를 입력해 주세요');

  const handleLogin = () => {
    //여기에 나중에 axios든 뭐든 써서 로그인 정보 받아오게 할 예정
  }

  return (
    <div className='container'>
      <div className="header">
        {/* <img src={email_icon} alt="" /> 로고 이미지 넣을 곳*/}
        <div className="text">로고예정</div>
        <div className="underline"></div>
      </div>
     <div className="inputs">
        <div className='inputuptext'>아이디</div>
        <div className="input">
          <input type="text" placeholder={idPlaceholder}
          onFocus={()=> setIdPlaceholder('')}
          onBlur={()=> setIdPlaceholder('아이디를 입력해 주세요')}
          />
        </div>
        <div className='inputuptext'>비밀번호</div>
        <div className="input">
          <input type="password" placeholder={pwPlaceholder}
          onFocus={()=>setPwPlaceholder('')}
          onBlur={()=>setPwPlaceholder('비밀번호를 입력해 주세요')}
          />
        </div>
      </div>
      <div className="submit-container">
      <div className="notyet-customer" onClick={() => navigate('/signup')}>아직 회원이 아니신가요? <span>회원가입</span></div>
        <div className="submit" onClick={handleLogin}>로그인</div>
      </div>
    </div>
  )
}
export default LoginPage;
