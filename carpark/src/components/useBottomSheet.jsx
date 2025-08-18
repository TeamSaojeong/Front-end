import { useEffect, useRef } from "react";

export default function useBottomSheet({
  hostRef,
  sheetRef,
  contentRef,
  onOpenChange, // 시트 열림 상태 변경 콜백
}) {
  const m = useRef({
    touchStart: { sheetY: 0, touchY: 0 },
    touchMove: { prevTouchY: 0, moving: "none" }, // "up" | "down" | "none"
    isContentTouched: false,
    bounds: { MIN_Y: 90, MAX_Y: 0 }, // MIN_Y 기본값(동기화 목적)
    isOpen: false,
  });

  useEffect(() => {
    const host = hostRef.current,
      sheet = sheetRef.current,
      content = contentRef.current;
    if (!host || !sheet || !content) return;

    const H = host.clientHeight;

    // ✅ CSS와 반드시 동일하게 유지
    const MIN_Y = 90; // 완전 펼침 시 상단 여백 (BottomSheet.css: height: calc(100% - 90px))
    const PEEK = 115; // 접힘 상태 노출 높이 (BottomSheet.css: top: calc(100% - 115px))
    const MAX_Y = H - PEEK; // 접혀 있을 때 sheet top

    m.current.bounds = { MIN_Y, MAX_Y };

    const open = () => {
      sheet.style.transform = `translateY(${MIN_Y - MAX_Y}px)`;
      sheet.dataset.open = "1";
      m.current.isOpen = true;
      onOpenChange?.(true);
    };
    const close = () => {
      sheet.style.transform = `translateY(0)`;
      sheet.dataset.open = "0";
      m.current.isOpen = false;
      onOpenChange?.(false);
    };

    // 초기 상태: 닫힘
    sheet.dataset.open = "0";
    onOpenChange?.(false);

    const canMove = () => {
      if (!m.current.isContentTouched) return true;

      // sub-pixel 오차 허용
      if (Math.abs(sheet.getBoundingClientRect().y - MIN_Y) > 1) return true;

      // 완전 펼침 상태일 때, 컨텐츠가 맨 위이면 아래로만 드래그 허용
      return m.current.touchMove.moving === "down" && content.scrollTop <= 0;
    };

    const onStart = (e) => {
      const t = e.touches ? e.touches[0] : e;
      m.current.touchStart.sheetY = sheet.getBoundingClientRect().y;
      m.current.touchStart.touchY = t.clientY;
      m.current.touchMove.prevTouchY = t.clientY;
    };

    const onMove = (e) => {
      const t = e.touches ? e.touches[0] : e;
      const { MIN_Y, MAX_Y } = m.current.bounds;

      m.current.touchMove.moving =
        m.current.touchMove.prevTouchY < t.clientY
          ? "down"
          : m.current.touchMove.prevTouchY > t.clientY
          ? "up"
          : "none";
      m.current.touchMove.prevTouchY = t.clientY;

      if (!canMove()) {
        document.body.style.overflowY = "hidden";
        return;
      }
      e.preventDefault();

      // 드래그 offset → 위치 클램프
      const offset = t.clientY - m.current.touchStart.touchY;
      let nextY = m.current.touchStart.sheetY + offset;
      if (nextY < MIN_Y) nextY = MIN_Y;
      if (nextY > MAX_Y) nextY = MAX_Y;
      sheet.style.transform = `translateY(${nextY - MAX_Y}px)`;
    };

    const onEnd = () => {
      document.body.style.overflowY = "auto";

      // 마지막 이동 방향으로 스냅
      if (m.current.touchMove.moving === "up") open();
      else close();

      // 초기화
      m.current.touchMove = { prevTouchY: 0, moving: "none" };
      m.current.isContentTouched = false;
    };

    const onContentStart = () => {
      m.current.isContentTouched = true;
    };

    // 이벤트 연결
    sheet.addEventListener("touchstart", onStart, { passive: false });
    sheet.addEventListener("touchmove", onMove, { passive: false });
    sheet.addEventListener("touchend", onEnd);

    sheet.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);

    content.addEventListener("touchstart", onContentStart);

    return () => {
      sheet.removeEventListener("touchstart", onStart);
      sheet.removeEventListener("touchmove", onMove);
      sheet.removeEventListener("touchend", onEnd);
      sheet.removeEventListener("mousedown", onStart);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      content.removeEventListener("touchstart", onContentStart);
    };
  }, [hostRef, sheetRef, contentRef, onOpenChange]);
}
