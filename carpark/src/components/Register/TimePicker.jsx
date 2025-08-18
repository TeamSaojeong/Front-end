import React, { useMemo, useRef, useState, useEffect } from "react";
import styled from "styled-components";
import WheelColumn from "../Register/WheelColumn";
import "../../Styles/Register/TimePicker.css";

const pad2 = (n) => String(n).padStart(2, "0"); // 숫자 두자리 문자열로 패딩 3->03
const roundUp5 = (m) => (m % 5 === 0 ? m : m + (5 - (m % 5))); // m분을 5분 단위로 올림 12->15
const nowRoundedUp5 = () => {
  // 현재 시간 5분 단위로 올림
  const d = new Date();
  const m = roundUp5(d.getMinutes());
  if (m === 60) {
    // 10:58 -> 11:00
    d.setMinutes(0); // 분 0으로,
    d.setHours(d.getHours() + 1); //시 +1
  } else {
    d.setMinutes(m);
  }
  return d;
};
const to12hParts = (d) => {
  //
  let h24 = d.getHours(); //24시간
  const am_pm = h24 >= 12 ? "오후" : "오전"; //12시 기준 오전/오후

  let hour12 = h24 % 12; //1~12 정각
  if (hour12 === 0) hour12 = 12; //0시는 12시로 보정
  return { am_pm, hour12, minute: d.getMinutes() };
};
const to24hStr = ({ am_pm, hour12, minute }) => {
  //12시간제 파츠를 "HH:MM" 24시간 문자열로
  let h = hour12 % 12; // 12시는 0으로 만든 뒤
  if (am_pm === "오후") h += 12; // 오후면 h += 12
  return `${pad2(h)}:${pad2(minute)}`; // pad2로 앞자리 채우기 => (오후, 1, 7 -> 13:07)
};

//비교 / 보정
const compareTime = (a, b) => {
  // 두 시간 파츠 a가 b보다 이전인지 비교
  if (a.am_pm !== b.am_pm)
    // 오전 오후 다르면
    return a.am_pm === "오전" && b.am_pm === "오후"; // 오전 < 오후

  if (a.hour12 !== b.hour12) return a.hour12 < b.hour12; // 같으면 hour12 비교
  return a.minute < b.minute; //그래도 같으면 minutes비교
};

// 현재 시각보다 이른 시각 선택시 최소 시각으로 변경
const clampMin = (a, min) => {
  if (!compareTime(a, min)) return a; // a가 min보다 빠르지 않으면 a반환
  return { ...min }; // 빠르면 ...min 새 객체로 반환
};

/* ---------- 메인 ---------- */
const TimePicker = ({ label = "첫 번째 주차 가능 시간", onChange }) => {
  const MINUTES = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i * 5),
    []
  );
  const HOURS = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const MER = ["오전", "오후"];

  const minParts = useMemo(() => to12hParts(nowRoundedUp5()), []);
  const [editing, setEditing] = useState("start"); // 'start' | 'end'
  const [start, setStart] = useState(minParts);
  const [end, setEnd] = useState(minParts);

  // 편집 전환 시에도 최소 시각 강제 적용
  useEffect(() => {
    if (editing === "start") setStart((p) => clampMin(p, minParts));
    else setEnd((p) => clampMin(p, minParts));
  }, [editing, minParts]);

  // 외부 콜백
  useEffect(() => {
    if (!onChange) return;
    onChange({ start24: to24hStr(start), end24: to24hStr(end), start, end });
  }, [start, end, onChange]);

  const cur = editing === "start" ? start : end;
  const setCur = editing === "start" ? setStart : setEnd;

  /* ---- 동적 옵션: 최소 이전은 리스트에 아예 안 노출 ---- */
  const merOptions = useMemo(() => {
    // 기본: 최소가 오후면 오전 전체 제거 (START에는 그대로 적용)
    if (minParts.am_pm === "오후") {
      // END 편집 중에는 다음날 00:00(오전 12:00) 선택을 허용하기 위해 '오전'도 표시는 하되,
      // 실제로는 시간/분 옵션에서 오전은 12시 00분만 가능하도록 제한한다.
      return editing === "end" ? ["오후", "오전"] : ["오후"];
    }
    return MER;
  }, [minParts, editing]);

  const hourOptions = useMemo(() => {
    // 같은 오전/오후라면 최소 시각의 시간부터
    if (cur.am_pm === minParts.am_pm) {
      return HOURS.filter((h) => h >= minParts.hour12);
    }
    // '오전'은 END 편집일 때만 허용되며, 그 중에서도 12시(=00시)만 허용
    if (editing === "end" && cur.am_pm === "오전") {
      return [12];
    }
    // 그 외에는 전체 허용
    return HOURS;
  }, [cur.am_pm, minParts, HOURS, editing]);

  const minuteOptions = useMemo(() => {
    const sameMer = cur.am_pm === minParts.am_pm;
    const sameHour = cur.hour12 === minParts.hour12;
    let base = MINUTES;

    if (sameMer && sameHour) base = MINUTES.filter((m) => m >= minParts.minute);

    // END에서 '오전 12시'는 정확히 00만 허용 (다음날 00:00)
    if (editing === "end" && cur.am_pm === "오전" && cur.hour12 === 12) {
      return [0];
    }

    // START에서는 오후 11시에서 다음날로 넘어가면 안되므로 sentinel 금지
    if (editing === "start" && cur.am_pm === "오후" && cur.hour12 === 11) {
      return base;
    }

    // 그 외에는 앞으로 한 칸 더 내리면 다음 시간 00으로 롤오버할 수 있도록 sentinel(60) 추가
    return [...base, 60];
  }, [cur.am_pm, cur.hour12, minParts, MINUTES, editing]);

  // 현재 선택이 옵션 밖으로 나가면 즉시 보정
  useEffect(() => {
    if (!merOptions.includes(cur.am_pm)) {
      setCur((p) => ({ ...p, am_pm: merOptions[0] }));
      return;
    }
    if (!hourOptions.includes(cur.hour12)) {
      setCur((p) => ({ ...p, hour12: hourOptions[0] }));
      return;
    }
    if (!minuteOptions.includes(cur.minute)) {
      setCur((p) => ({ ...p, minute: minuteOptions[0] }));
      return;
    }

    // 추가 안전장치: END에서 오전을 선택했다면 반드시 12:00만 유지
    if (editing === "end" && cur.am_pm === "오전") {
      if (cur.hour12 !== 12 || cur.minute !== 0) {
        setCur((p) => ({ ...p, hour12: 12, minute: 0 }));
      }
    }
  }, [
    merOptions,
    hourOptions,
    minuteOptions,
    editing,
    cur.am_pm,
    cur.hour12,
    cur.minute,
    setCur,
  ]);

  const display = `${to24hStr(start)} ~ ${to24hStr(end)}`;

  return (
    <div className="tp-wrapper">
      <div className="tp-label">{label}</div>
      <input className="tp-display" readOnly value={display} />
      <div className="tp-btn-wrap">
        <button
          className="tp-start-btn"
          type="button"
          data-active={editing === "start"}
          onClick={() => setEditing("start")}
        >
          시작
        </button>
        <button
          className="tp-end-btn"
          type="button"
          data-active={editing === "end"}
          onClick={() => setEditing("end")}
        >
          마무리
        </button>
        <div className="segthumb" aria-hidden />
      </div>

      <div className="tp-grid">
        <WheelColumn
          className="tp-am_pm"
          values={merOptions}
          value={cur.am_pm}
          onChange={(v) =>
            setCur((p) => clampMin({ ...p, am_pm: v }, minParts))
          }
          render={(v) => <span className="dim">{v}</span>}
        />
        <WheelColumn
          values={hourOptions}
          value={cur.hour12}
          onChange={(v) =>
            setCur((p) => clampMin({ ...p, hour12: v }, minParts))
          }
          render={(v) => <strong>{v}</strong>}
        />
        <div className="colon">:</div>
        <WheelColumn
          className="tp-hours"
          values={minuteOptions}
          value={cur.minute}
          onChange={(v) => {
            if (v === 60) {
              // 공통 롤오버: ..:55 다음 → 다음 시간 00
              setCur((p) => {
                let { am_pm, hour12 } = p;
                // START는 다음날로 넘어가면 안 됨 → 오후 11시에서의 롤오버 금지
                const isEnd = editing === "end";
                if (hour12 === 11) {
                  if (am_pm === "오전") {
                    // 11:55 AM → 12:00 PM
                    am_pm = "오후";
                    hour12 = 12;
                  } else {
                    // 11:55 PM → (다음날 00:00) → END만 허용
                    if (!isEnd) return p; // START에선 막음
                    am_pm = "오전";
                    hour12 = 12; // 다음날 00:00
                  }
                } else if (hour12 === 12) {
                  // 12:55 → 1:00 (동일 am_pm)
                  hour12 = 1;
                } else {
                  hour12 += 1;
                }
                const next = { ...p, am_pm, hour12, minute: 0 };
                return clampMin(next, minParts);
              });
              return;
            }
            setCur((p) => clampMin({ ...p, minute: v }, minParts));
          }}
          render={(v) => <strong>{pad2(v === 60 ? 0 : v)}</strong>}
        />
      </div>
    </div>
    // <Wrap>
    //   <Label>{label}</Label>
    //   <SummaryInput readOnly value={display} />
    //   <Segmented>
    //     <SegBtn
    //       type="button"
    //       data-active={editing === "start"}
    //       onClick={() => setEditing("start")}
    //     >
    //       시작
    //     </SegBtn>
    //     <SegBtn
    //       type="button"
    //       data-active={editing === "end"}
    //       onClick={() => setEditing("end")}
    //     >
    //       마무리
    //     </SegBtn>
    //     <SegThumb aria-hidden />
    //   </Segmented>

    //   <PickerGrid>
    //     <WheelColumn
    //       values={merOptions}
    //       value={cur.am_pm}
    //       onChange={(v) =>
    //         setCur((p) => clampMin({ ...p, am_pm: v }, minParts))
    //       }
    //       render={(v) => <span className="dim">{v}</span>}
    //     />
    //     <WheelColumn
    //       values={hourOptions}
    //       value={cur.hour12}
    //       onChange={(v) =>
    //         setCur((p) => clampMin({ ...p, hour12: v }, minParts))
    //       }
    //       render={(v) => <strong>{v}</strong>}
    //     />
    //     <Colon>:</Colon>
    //     <WheelColumn
    //       values={minuteOptions}
    //       value={cur.minute}
    //       onChange={(v) => {
    //         if (v === 60) {
    //           // 공통 롤오버: ..:55 다음 → 다음 시간 00
    //           setCur((p) => {
    //             let { am_pm, hour12 } = p;
    //             // START는 다음날로 넘어가면 안 됨 → 오후 11시에서의 롤오버 금지
    //             const isEnd = editing === "end";
    //             if (hour12 === 11) {
    //               if (am_pm === "오전") {
    //                 // 11:55 AM → 12:00 PM
    //                 am_pm = "오후";
    //                 hour12 = 12;
    //               } else {
    //                 // 11:55 PM → (다음날 00:00) → END만 허용
    //                 if (!isEnd) return p; // START에선 막음
    //                 am_pm = "오전";
    //                 hour12 = 12; // 다음날 00:00
    //               }
    //             } else if (hour12 === 12) {
    //               // 12:55 → 1:00 (동일 am_pm)
    //               hour12 = 1;
    //             } else {
    //               hour12 += 1;
    //             }
    //             const next = { ...p, am_pm, hour12, minute: 0 };
    //             return clampMin(next, minParts);
    //           });
    //           return;
    //         }
    //         setCur((p) => clampMin({ ...p, minute: v }, minParts));
    //       }}
    //       render={(v) => <strong>{pad2(v === 60 ? 0 : v)}</strong>}
    //     />
    //   </PickerGrid>
    // </Wrap>
  );
};
export default TimePicker;

/* ---------- 스타일 (기존과 동일) ---------- */

const PickerGrid = styled.div`
  margin-top: 6px;
  display: grid;
  grid-template-columns: 1.1fr 1fr auto 1fr;
  align-items: stretch;
  gap: 22px;
  position: relative;
  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 0;
    top: calc(50% - 1px);
    border-top: 2px solid #dfe3eb;
    pointer-events: none;
  }
`;
// const WheelWrap = styled.div`
//   position: relative;
//   height: ${ITEM_HEIGHT * 3}px;
//   overflow: hidden;
//   border-bottom: 1px solid #e8ecf3;
// `;
// const WheelInner = styled.div`
//   height: 100%;
//   overflow-y: auto;
//   scroll-snap-type: y mandatory;
//   padding: ${ITEM_HEIGHT}px 0;
//   -webkit-overflow-scrolling: touch;
//   &::-webkit-scrollbar {
//     display: none;
//   }
// `;
// const WheelItem = styled.div`
//   height: ${ITEM_HEIGHT}px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   scroll-snap-align: center;
//   font-size: 22px;
//   user-select: none;
//   cursor: pointer;
//   color: #9aa3af;
//   &[aria-selected="true"] {
//     font-weight: 700;
//     color: #111;
//     transform: translateZ(0);
//   }
//   .dim {
//     font-size: 20px;
//   }
// `;
// const CenterGuide = styled.div`
//   pointer-events: none;
//   position: absolute;
//   left: 0;
//   right: 0;
//   top: calc(50% - ${ITEM_HEIGHT / 2}px);
//   height: ${ITEM_HEIGHT}px;
//   border-top: 0.5px solid #2E80EC;
//   border-bottom: 0.5px solid #2E80EC
// `;
const Colon = styled.div`
  font-size: 22px;
  font-weight: 700;
  display: grid;
  place-items: center;
  color: #9aa3af;
  transform: translateY(0.5px);
`;
