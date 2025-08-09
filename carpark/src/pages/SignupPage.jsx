import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/LoginSignup.css';

import user_icon from '../Assets/person.png';
import email_icon from '../Assets/email.png';
import password_icon from '../Assets/password.png';
import car_icon from '../Assets/car.png';

const SignupPage = () => {
  const navigate = useNavigate();

  return (
    <div className='container'>
      <div className="header">
        <div className="text">가입하기</div>
        <div className="underline"></div>
      </div>
      <div className="inputs">
        <div className='inputuptext'>아이디</div>
        <div className="input">
          {/* <img src={user_icon} alt="" /> 나중에 이미지 삽입할 상황 있을시 사용*/}
          <input type="text" placeholder="  아이디를 입력해 주세요 (최소 8자리)" />
        </div>
        <div className='inputuptext'>비밀번호</div>
        <div className="input">
          <input type="email" placeholder="  비밀번호를 입력해 주세요(최소 10자리)"/>
        </div>
        <div className='inputuptext'>이름</div>
        <div className="input">
          <input type="password" placeholder="  이름을 입력해 주세요"/>
        </div>
        <div className='inputuptext'>차량번호</div>
         <div className="input">
          <input type="password" placeholder="  EX)123가4568"/>
        </div>
      </div>
      <div className="submit-container">
        <div className="submit" onClick={() => {/* 회원가입 로직 */}}>Sign Up</div>
        <div className="submit gray" onClick={() => navigate('/loginpage')}>Go to Login</div>
      </div>
    </div>
  )
}

export default SignupPage;
