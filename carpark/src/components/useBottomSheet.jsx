// src/components/useBottomSheet.js
import { useEffect, useRef } from "react";

/**
 * BottomSheet drag logic (with dynamic reflow fix)
 * - host/sheet의 현재 레이아웃을 바탕으로 MIN_Y/MAX_Y를 '항상' 다시 계산
 * - ResizeObserver/resize 이벤트로 콘텐츠 높이 변화·화면 크기 변화에 즉시 대응
 */
export default function useBottomSheet({
  hostRef,
  sheetRef,
  contentRef,
  headerRef, // 헤더에서만 드래그 시작
  onOpenChange,
}) {
  const m = useRef({
    touchStart: { sheetY: 0, touchY: 0, time: 0 },
    lastMove: { y: 0, time: 0 },
    touchMove: { prevTouchY: 0, moving: "none" }, // "up" | "down" | "none"
    isContentTouched: false,
    startedOnHeader: false,
    bounds: { MIN_Y: 0, MAX_Y: 0 },
    isOpen: false,
  });

  useEffect(() => {
    const host = hostRef.current;
    const sheet = sheetRef.current;
    const content = contentRef.current;
    const header = headerRef?.current || sheet;
    if (!host || !sheet || !content || !header) return;

    // --- 바운드 재계산(항상 최신 레이아웃 기반) ---
    const recalcBounds = () => {
      const hostRect = host.getBoundingClientRect();
      const sheetRect = sheet.getBoundingClientRect();

      // host 내부 기준 top
      const topRel = sheetRect.top - hostRect.top;
      const H = hostRect.height;
      const sh = sheetRect.height;

      const MIN_Y = H - sh; // 완전 펼침일 때 top
      const MAX_Y = topRel; // 접힘(현재 DOM 배치) top

      m.current.bounds = { MIN_Y, MAX_Y };

      // 이미 열려 있는 상태라면, 새로운 MIN_Y에 맞춰 위치 보정
      const open = m.current.isOpen;
      sheet.style.transform = open
        ? `translateY(${MIN_Y - MAX_Y}px)`
        : `translateY(0)`;
    };

    const setOpenState = (open) => {
      // 열고/닫기 직전에 최신 바운드 보장
      recalcBounds();
      const { MIN_Y, MAX_Y } = m.current.bounds;
      sheet.style.transform = open
        ? `translateY(${MIN_Y - MAX_Y}px)`
        : `translateY(0)`;
      m.current.isOpen = open;
      sheet.dataset.open = open ? "1" : "0";
      onOpenChange?.(open);
    };

    // 초기 상태: 접힘
    recalcBounds();
    setOpenState(false);

    // ---- Resize 감시 (리스트 로딩 등으로 시트 높이 바뀔 때 보정) ----
    const ro = new ResizeObserver(recalcBounds);
    ro.observe(sheet);

    // 화면 크기/회전 변화 대응
    const onResize = () => recalcBounds();
    window.addEventListener("resize", onResize);

    // 컨텐츠 스크롤 시작 표시
    const onContentStart = () => {
      m.current.isContentTouched = true;
    };

    const onStart = (e) => {
      const t = e.touches ? e.touches[0] : e;
      const now = performance.now();
      recalcBounds(); // 제스처 시작 시점에도 최신 바운드 보장

      m.current.touchStart.sheetY = sheet.getBoundingClientRect().y;
      m.current.touchStart.touchY = t.clientY;
      m.current.touchStart.time = now;

      m.current.touchMove.prevTouchY = t.clientY;
      m.current.lastMove = { y: t.clientY, time: now };

      m.current.startedOnHeader = true;
      m.current.isContentTouched = false;
    };

    const canMove = () => {
      if (!m.current.startedOnHeader) return false;

      const { MIN_Y } = m.current.bounds;
      if (m.current.isContentTouched) {
        const atTop = sheet.getBoundingClientRect().y === MIN_Y;
        const movingDown = m.current.touchMove.moving === "down";
        return atTop && movingDown && content.scrollTop <= 0;
      }
      return true;
    };

    const onMove = (e) => {
      const t = e.touches ? e.touches[0] : e;
      const now = performance.now();

      m.current.touchMove.moving =
        m.current.touchMove.prevTouchY < t.clientY
          ? "down"
          : m.current.touchMove.prevTouchY > t.clientY
          ? "up"
          : "none";
      m.current.touchMove.prevTouchY = t.clientY;

      m.current.lastMove = { y: t.clientY, time: now };

      if (!canMove()) return;

      e.preventDefault();
      const { MIN_Y, MAX_Y } = m.current.bounds;
      const offset = t.clientY - m.current.touchStart.touchY;
      let nextY = m.current.touchStart.sheetY + offset;

      if (nextY < MIN_Y) nextY = MIN_Y;
      if (nextY > MAX_Y) nextY = MAX_Y;

      sheet.style.transform = `translateY(${nextY - MAX_Y}px)`;
    };

    const onEnd = () => {
      const { MIN_Y, MAX_Y } = m.current.bounds;
      const range = Math.max(1, MAX_Y - MIN_Y);

      const DIST_THRESHOLD = Math.min(36, range * 0.18);
      const TAP_THRESHOLD = 8;

      const currY = sheet.getBoundingClientRect().y;
      const moved = currY - m.current.touchStart.sheetY;

      const dt = Math.max(1, performance.now() - m.current.lastMove.time);
      const dy = m.current.lastMove.y - m.current.touchStart.touchY;
      const velocity = dy / dt; // 음수=위로

      if (Math.abs(moved) < TAP_THRESHOLD) {
        setOpenState(true); // 탭은 열기 우선
        reset();
        return;
      }

      const OPEN_FLING_V = -0.35;
      const CLOSE_FLING_V = 0.35;
      if (velocity <= OPEN_FLING_V) {
        setOpenState(true);
        reset();
        return;
      }
      if (velocity >= CLOSE_FLING_V) {
        setOpenState(false);
        reset();
        return;
      }

      if (Math.abs(moved) >= DIST_THRESHOLD) {
        if (m.current.touchMove.moving === "up") setOpenState(true);
        else setOpenState(false);
      } else {
        const toOpen = Math.abs(currY - MIN_Y) <= Math.abs(currY - MAX_Y) + 6;
        setOpenState(toOpen);
      }

      reset();
    };

    const reset = () => {
      m.current.touchMove = { prevTouchY: 0, moving: "none" };
      m.current.isContentTouched = false;
      m.current.startedOnHeader = false;
    };

    // 드래그 시작은 헤더에서만
    header.addEventListener("touchstart", onStart, { passive: false });
    header.addEventListener("mousedown", onStart);

    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mousemove", onMove);

    window.addEventListener("touchend", onEnd);
    window.addEventListener("mouseup", onEnd);

    content.addEventListener("touchstart", onContentStart);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);

      header.removeEventListener("touchstart", onStart);
      header.removeEventListener("mousedown", onStart);

      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mousemove", onMove);

      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("mouseup", onEnd);

      content.removeEventListener("touchstart", onContentStart);
    };
  }, [hostRef, sheetRef, contentRef, headerRef, onOpenChange]);
}
//good
