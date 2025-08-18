import React, { useMemo, useState } from "react";
import NextBtn from "../../components/Register/NextBtn";
import { useNavigate } from "react-router-dom";
import "../../Styles/Register/Rg_PayPage.css";
import PreviousBtn from "../../components/Register/PreviousBtn";
import rg_backspace from "../../Assets/rg-backspace.svg";
import rg_location from "../../Assets/rg_location.svg";
import { useParkingForm } from "../../store/ParkingForm";
import {register } from "../../apis/register"

// ===== 유틸 =====
const rg_price = (n) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(n);
/**
 * props
 * - value: 초기 금액(숫자, 원 단위)
 * - onChange(value:number): 금액 변경 콜백
 * - title: 상단 타이틀
 * - subtitle: 보조 설명
 * - unitLabel: 중앙 작은 라벨 (예: '10분당 주차 금액')
 * - maxDigits: 최대 입력 자리수 (기본 7 -> 최대 9,999,999원)
 * - nextText: 하단 버튼 텍스트
 * - onNext(value:number): 하단 버튼 클릭
 */
const RegisterPayPage=({
  value = 0,
  onChange,
  maxDigits = 7,
  onNext
}) => {
  const [digits, setDigits] = useState(() => String(Math.max(0, value)));
  const { address, setField /*, 평균비용 */ } = useParkingForm();
  const amount = useMemo(() => Number(digits || "0"), [digits]);

    const navigate = useNavigate();
    const isActive = amount != 0;
  const push = (d) => {
    // 앞자리에 0만 있는 경우 교체
    const next = digits === "0" ? d : digits + d;
    if (next.replace(/^0+/, "").length > maxDigits) return;
    const cleaned = next.replace(/^0+(?=\d)/, ""); // 선행 0 정리 (한 자리면 0 허용)
    setDigits(cleaned || "0");
    onChange?.(Number(cleaned || "0"));
  };

  const handleSunmit = async()=>{
              if (!isActive) return;
              // 저장 전 로컬 상태에 요금 반영
              setField("charge", amount);
              try {
                const token = ""; // TODO: 실제 액세스 토큰 주입
                const resp = await register(token);
                const id = resp?.data?.parking_id;
                if (!id) {
                  console("등록 실패: parking_id 없음");
                  return;
                }
                // 완료 페이지로 id 전달
                //onNext?.(amount);
                navigate("/complete", { state: { id } });
              } catch (e) {
                console(e?.message || "등록 실패");
              }
  }
  const back = () => {
    const next = digits.length <= 1 ? "0" : digits.slice(0, -1);
    setDigits(next);
    onChange?.(Number(next));
  };

  const keypad = ["1","2","3","4","5","6","7","8","9","0"];

  return (
    <div className="rg-pay-wrapper">
        
        <PreviousBtn/>

        <div>
          <h1 className="rg-pay-title">주차 비용 설정</h1>
          <p className="rg-description"><span className="rg-desc-point">10분당 주차 비용</span><span className="rg-desc">을 설정해주세요</span></p>
        </div>

        <div>
          <p className="rg-pay"><span className="rg-ten">10분당</span> <span className="rg-charge">주차 금액</span></p>
        </div>
        <div className="rg-won">
            {rg_price(amount)}
            <span>원</span>
        </div>

        <div className="rg-paypad" role="group" aria-label="숫자 패드">
          {keypad.slice(0, 9).map((k) => (
            <button className="rg-num-key" key={k} onClick={() => push(k)} aria-label={`${k}`}>
              {k}
            </button>
          ))}

          {/* 마지막 줄*/}
            <div className="rg-spacer" aria-hidden="true"/>
            <button className="rg-zero" onClick={()=> push("0")} aria-label="0">
            0
            </button>
            <button className="rg-backspace" onClick={back} aria-label="지우기">
              <img src={rg_backspace}/>
            </button>
        </div>

            
              <div className="rg-bubble-wrap">
                <div className="rg-bubble"><span className="rg-desc">주변 주차장 10분당 평균 비용은</span>
                <span className="rg-desc-charge">{/*평균 비용*/}</span><span className="rg-desc">원이에요!</span></div>
                <div className="rg-bubble-bottom"/>
              </div>
              
          
            <div className="rg-address-wrap">
              <img src={rg_location}/>
              <span className="rg_address">{address}</span>
              </div>
        
          <NextBtn isActive={isActive} 
                    onClick={handleSunmit}
                    className="rg-nextBtn"/>
        
      </div>
     
  );
}

export default RegisterPayPage;