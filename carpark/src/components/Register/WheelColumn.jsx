import "../../Styles/Register/WheelColumn.css";
import {useRef, useEffect} from "react";

/* ---------- 스크롤 휠 ---------- */
const ITEM_HEIGHT = 52; // 세로 1행당 높이

const WheelColumn = ({ values, value, onChange, render = (v) => v }) =>{
    //values: 선택할 수 있는 값 배열 ex) 분 선택 -> [0, 5, 10, 15, ... 55]
  //value : 선택된 값 15-> 15분
  //onChange : 선택이 바뀌면 실행되는 콜백 함수. 브모 컴포넌트가 상태 업데이트하는데 사용
  //render(v) : 화면에 어떻게 표시할지 결정하는 함수. 기본 : (v) -> v / pad2 : 05로 표시
  const ref = useRef(null); // .wheel-inner div을 직접 조작하기 위한 dom 참조

  // 선택값 -> 스크롤 동기화
  useEffect(() => {
    const idx = values.findIndex((v) => v === value); // 선택 값이 배열 몇번째인지
    if (idx >= 0 && ref.current) { // 외부에서 valu가 바뀌면 스크롤도 맞춰서 내려감
      ref.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" }); // 선택값 위치로 스크롤 동기화
    }
  }, [value, values]);

  // 스크롤 스냅(스크롤 -> 선택값 동기화)
  useEffect(() => {
    const el = ref.current; //el : 스크롤 dom (wheel-inner) 참조
    if (!el) return;
    let t; // 타이머 id
    const onScroll = () => { //스크롤 이벤트 핸들러
      clearTimeout(t);
      t = setTimeout(() => {
        const idx = Math.round(el.scrollTop / ITEM_HEIGHT); // 가장 가까운 아이템으로 스냅(현재 스크롤 위치로 몇번째 아이템인지 계산)
        const clamped = Math.max(0, Math.min(idx, values.length - 1)); //인덱스가 배열 (0~values.length-1) 안에 들어가도록 보정
        const snappedTop = clamped * ITEM_HEIGHT;
        el.scrollTo({ top: snappedTop, behavior: "smooth" }); 
        const newVal = values[clamped];
        if (newVal !== value) onChange(newVal);
      }, 90);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      el.removeEventListener("scroll", onScroll);
    };
  }, [values, value, onChange]);

  return (
    <div className="wc">
    <div className="wheel-wrap">
      <div className="wheel-inner" ref={ref}>
        {values.map((v) => (
          <div className="wheel-item"
            key={String(v)}
            aria-selected={v === value}
            onClick={() => onChange(v)}
          >
            {render(v)}
          </div>
        ))}
      </div>
      <div className="center-guide" />
    </div>
    </div>
  );
}

export default WheelColumn;