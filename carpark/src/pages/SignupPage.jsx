import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/LoginSignup.css';

import user_icon from '../Assets/person.png';
import email_icon from '../Assets/email.png';
import password_icon from '../Assets/password.png';
import car_icon from '../Assets/car.png';

const SignupPage = () => {
  const navigate = useNavigate();

  const [idPlaceholder, setIdPlaceholder]=useState('아이디를 입력해 주세요(최소 8자리)');
  const [pwPlaceholder, setPwPlaceholder]=useState('비밀번호를 입력해 주세요(최소 10자리)');
  const [namePlaceholder, setNamePlaceholder]=useState('이름을 입력해 주세요');
  const [carPlaceholder, setCarPlaceholder]=useState('차량번호를 입력해 주세요 (EX)123가4568');

  const [id,setId]=useState('');
  const [pw,setPw]=useState('');
  const [name,setName]=useState('');
  const [car,setCar]=useState('');
  //밑에서 가입하기 버튼 활성화 여부 판단을 위한 선언
  const isEnabled=id.trim()!==''&&pw.trim()!==''&&name.trim()!==''&&car.trim()!=='';

  const handleSignup = () => {
    
  }

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
          <input type="text" placeholder={idPlaceholder} 
          value={id}
          onChange={(e)=>setId(e.target.value)}
          onFocus={()=>setIdPlaceholder('')}
          onBlur={()=>setIdPlaceholder('아이디를 입력해 주세요(최소 8자리)')}
          />
        </div>
        <div className='inputuptext'>비밀번호</div>
        <div className="input">
          <input type="password" placeholder={pwPlaceholder}
          value={pw}
          onChange={(e)=>setPw(e.target.value)}
          onFocus={()=>setPwPlaceholder('')}
          onBlur={()=>setPwPlaceholder('비밀번호를 입력해 주세요(최소 10자리)')}
          />
        </div>
        <div className='inputuptext'>이름</div>
        <div className="input">
          <input type="text" placeholder={namePlaceholder}
          value={name}
          onChange={(e)=>setName(e.target.value)}
          onFocus={()=>setNamePlaceholder('')}
          onBlur={()=>setNamePlaceholder('이름을 입력해 주세요')}
          />
        </div>
        <div className='inputuptext'>차량번호</div>
         <div className="input">
          <input type="text" placeholder={carPlaceholder}
          value={car}
          onChange={(e)=>setCar(e.target.value)}
          onFocus={()=>setCarPlaceholder('')}
          onBlur={()=>setCarPlaceholder('차량번호를 입력해 주세요 (EX)123가4568')}
          />
        </div>
      </div>
      <div className="signupsubmit-container">
        <div className={`signupsubmit ${!isEnabled ? 'gray' : ''}`} 
         onClick={handleSignup}
         disabled={!isEnabled}>가입하기</div>
      </div>
    </div>
  )
}

export default SignupPage;
