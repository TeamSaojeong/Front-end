// TimeRangePicker.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import styled from "styled-components";

/** ---------- 공용 유틸 ---------- */
const pad2 = (n) => String(n).padStart(2, "0");
const to24h = ({ meridiem, hour12, minute }) => {
  let h = hour12 % 12;
  if (meridiem === "오후") h += 12;
  return `${pad2(h)}:${pad2(minute)}`;
};
const fromDate = (d) => {
  let h = d.getHours();
  const meridiem = h >= 12 ? "오후" : "오전";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { meridiem, hour12, minute: d.getMinutes() - (d.getMinutes() % 5) };
};

/** ---------- 휠 콤보 박스(스크롤 스냅) ---------- */
const ITEM_HEIGHT = 56; // px (디자인 라인과 맞춤)
function WheelColumn({ values, value, onChange, render = (v) => v }) {
  const ref = useRef(null);
  // value -> 스크롤 위치 동기화
  useEffect(() => {
    const idx = values.findIndex((v) => v === value);
    if (idx >= 0 && ref.current) {
      ref.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
    }
  }, [value, values]);

  // 스크롤 멈출 때 가장 가까운 아이템으로 스냅 + onChange
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const idx = Math.round(el.scrollTop / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(idx, values.length - 1));
        const snappedTop = clamped * ITEM_HEIGHT;
        el.scrollTo({ top: snappedTop, behavior: "smooth" });
        const newVal = values[clamped];
        if (newVal !== value) onChange(newVal);
      }, 90); // 살짝 여유 두고 스냅
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      el.removeEventListener("scroll", onScroll);
    };
  }, [values, value, onChange]);

  return (
    <WheelWrap>
      <WheelInner ref={ref}>
        {values.map((v) => (
          <WheelItem
            key={String(v)}
            aria-selected={v === value}
            onClick={() => onChange(v)}
          >
            {render(v)}
          </WheelItem>
        ))}
      </WheelInner>
      <CenterGuide />
    </WheelWrap>
  );
}

/** ---------- 메인 컴포넌트 ---------- */
export default function TimeRangePicker({
  label = "첫 번째 주차 가능 시간",
  initialStart = fromDate(new Date()),
  initialEnd = fromDate(new Date(Date.now() + 1000 * 60 * 60 * 6)),
  onChange,
}) {
  const HOURS = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const MINUTES = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []);
  const MERIDIEM = ["오전", "오후"];

  const [editing, setEditing] = useState("end"); // 'start' | 'end'
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);

  // 외부로 24시간 포맷 전달(옵션)
  useEffect(() => {
    if (!onChange) return;
    onChange({
      start24: to24h(start),
      end24: to24h(end),
      start,
      end,
    });
  }, [start, end, onChange]);

  const cur = editing === "start" ? start : end;
  const setCur = editing === "start" ? setStart : setEnd;

  const displayValue = `${to24h(start)} ~ ${to24h(end)}`;

  return (
    <Wrap>
      <Label>{label}</Label>
      <SummaryInput readOnly value={displayValue} />
      <Segmented>
        <SegBtn
          type="button"
          data-active={editing === "start"}
          onClick={() => setEditing("start")}
        >
          시작
        </SegBtn>
        <SegBtn
          type="button"
          data-active={editing === "end"}
          onClick={() => setEditing("end")}
        >
          마무리
        </SegBtn>
        <SegThumb aria-hidden />
      </Segmented>

      <PickerGrid>
        <WheelColumn
          values={MERIDIEM}
          value={cur.meridiem}
          onChange={(v) => setCur((p) => ({ ...p, meridiem: v }))}
          render={(v) => <span className="dim">{v}</span>}
        />
        <WheelColumn
          values={HOURS}
          value={cur.hour12}
          onChange={(v) => setCur((p) => ({ ...p, hour12: v }))}
          render={(v) => <strong>{v}</strong>}
        />
        <Colon>:</Colon>
        <WheelColumn
          values={MINUTES}
          value={cur.minute}
          onChange={(v) => setCur((p) => ({ ...p, minute: v }))}
          render={(v) => <strong>{pad2(v)}</strong>}
        />
      </PickerGrid>
    </Wrap>
  );
}

/** ---------- 스타일 ---------- */
const Wrap = styled.div`
  width: 390px;
  padding: 16px;
  font-family: Pretendard, system-ui, -apple-system, "Segoe UI", Roboto, Arial,
    "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
  color: #111;
`;

const Label = styled.div`
  font-size: 14px;
  line-height: 20px;
  margin-bottom: 8px;
`;

const SummaryInput = styled.input`
  width: 100%;
  height: 48px;
  border: 1px solid #e5e5ea;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 15px;
  outline: none;
  margin-bottom: 14px;
`;

const Segmented = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f2f2f7;
  border-radius: 999px;
  padding: 4px;
  height: 48px;
  gap: 6px;
  margin-bottom: 12px;
`;

const SegBtn = styled.button`
  position: relative;
  z-index: 1;
  border: 0;
  background: transparent;
  border-radius: 999px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  &[data-active="true"] {
    color: #fff;
  }
  &[data-active="false"] {
    color: #666;
  }
`;

const SegThumb = styled.div`
  position: absolute;
  inset: 4px;
  width: calc(50% - 3px);
  border-radius: 999px;
  background: #0a84ff;
  box-shadow: 0 6px 14px rgba(10, 132, 255, 0.25);
  transition: transform 0.22s ease;
  pointer-events: none;

  /* 부모 state를 못 보므로 형제 버튼의 data-active를 이용한 트릭 */
  ${Segmented}:has(button:nth-child(1)[data-active="true"]) & {
    transform: translateX(0);
  }
  ${Segmented}:has(button:nth-child(2)[data-active="true"]) & {
    transform: translateX(100%);
  }
`;

const PickerGrid = styled.div`
  margin-top: 6px;
  display: grid;
  grid-template-columns: 1.1fr 1fr auto 1fr;
  align-items: stretch;
  gap: 8px;
  position: relative;

  /* 중앙 가이드 라인 */
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

const WheelWrap = styled.div`
  position: relative;
  height: ${ITEM_HEIGHT * 3}px; /* 3행 표시 */
  overflow: hidden;
  border-bottom: 1px solid #e8ecf3;
`;

const WheelInner = styled.div`
  height: 100%;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  padding: ${ITEM_HEIGHT}px 0; /* 위아래 버퍼로 중앙정렬 */
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const WheelItem = styled.div`
  height: ${ITEM_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
  font-size: 22px;
  user-select: none;
  cursor: pointer;
  color: #9aa3af;

  &[aria-selected="true"] {
    font-weight: 700;
    color: #111;
    transform: translateZ(0);
  }

  .dim {
    font-size: 20px;
  }
`;

const CenterGuide = styled.div`
  pointer-events: none;
  position: absolute;
  left: 0;
  right: 0;
  top: calc(50% - ${ITEM_HEIGHT / 2}px);
  height: ${ITEM_HEIGHT}px;
`;

const Colon = styled.div`
  font-size: 22px;
  font-weight: 700;
  display: grid;
  place-items: center;
  color: #9aa3af;
`;