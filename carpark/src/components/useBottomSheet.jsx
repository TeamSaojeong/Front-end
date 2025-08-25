import { useEffect, useRef } from "react";

/**
 * BottomSheet drag logic
 * - 외부에서 open()/close() 제어 가능
 */
export default function useBottomSheet({
  hostRef,
  sheetRef,
  contentRef,
  headerRef,
  onOpenChange,
}) {
  const m = useRef({
    touchStart: { sheetY: 0, touchY: 0, time: 0 },
    lastMove: { y: 0, time: 0 },
    touchMove: { prevTouchY: 0, moving: "none" },
    isContentTouched: false,
    startedOnHeader: false,
          bounds: { MIN_Y: 0, MAX_Y: 0 },
      isOpen: true,
  });

  useEffect(() => {
    const host = hostRef?.current;
    const sheet = sheetRef?.current;
    const content = contentRef?.current;
    const header = headerRef?.current || sheet;
    if (!host || !sheet || !content || !header) return;

    // --- 바운드 재계산 ---
    const recalcBounds = () => {
      const hostRect = host.getBoundingClientRect();
      const sheetRect = sheet.getBoundingClientRect();

      const topRel = sheetRect.top - hostRect.top;
      const H = hostRect.height;
      const sh = sheetRect.height;

      const MIN_Y = H - sh;
      const MAX_Y = topRel;

      if (m?.current) {
        m.current.bounds = { MIN_Y, MAX_Y };
      }

      const open = m?.current?.isOpen || false;
      sheet.style.transform = open
        ? `translateY(${MIN_Y - MAX_Y}px)`
        : `translateY(0)`;
    };

    const setOpenState = (open) => {
      recalcBounds();
      const { MIN_Y, MAX_Y } = m?.current?.bounds || { MIN_Y: 0, MAX_Y: 0 };
      sheet.style.transform = open
        ? `translateY(${MIN_Y - MAX_Y}px)`
        : `translateY(0)`;
      if (m?.current) {
        m.current.isOpen = open;
      }
      sheet.dataset.open = open ? "1" : "0";
      
      // 바텀 시트가 열리면 show-title 클래스 추가
      if (open) {
        sheet.classList.add('show-title');
      } else {
        sheet.classList.remove('show-title');
      }
      
      onOpenChange?.(open);
    };

    // 초기 상태: 열림
    recalcBounds();
    setOpenState(true);

    const ro = new ResizeObserver(recalcBounds);
    ro.observe(sheet);

    const onResize = () => recalcBounds();
    window.addEventListener("resize", onResize);

    const onContentStart = () => {
      if (m?.current) {
        m.current.isContentTouched = true;
      }
    };

    const onStart = (e) => {
      const t = e.touches ? e.touches[0] : e;
      const now = performance.now();
      recalcBounds();

      if (m?.current) {
        m.current.touchStart.sheetY = sheet.getBoundingClientRect().y;
        m.current.touchStart.touchY = t.clientY;
        m.current.touchStart.time = now;

        m.current.touchMove.prevTouchY = t.clientY;
        m.current.lastMove = { y: t.clientY, time: now };

        m.current.startedOnHeader = true;
        m.current.isContentTouched = false;
      }
    };

    const canMove = () => {
      if (!m?.current?.startedOnHeader) return false;

      const { MIN_Y } = m?.current?.bounds || { MIN_Y: 0 };
      if (m?.current?.isContentTouched) {
        const atTop = sheet.getBoundingClientRect().y === MIN_Y;
        const movingDown = m?.current?.touchMove?.moving === "down";
        return atTop && movingDown && content.scrollTop <= 0;
      }
      return true;
    };

    const onMove = (e) => {
      const t = e.touches ? e.touches[0] : e;
      const now = performance.now();

      if (m?.current) {
        m.current.touchMove.moving =
          m.current.touchMove.prevTouchY < t.clientY
            ? "down"
            : m.current.touchMove.prevTouchY > t.clientY
            ? "up"
            : "none";
        m.current.touchMove.prevTouchY = t.clientY;

        m.current.lastMove = { y: t.clientY, time: now };
      }

      if (!canMove()) return;

      e.preventDefault();
      const { MIN_Y, MAX_Y } = m?.current?.bounds || { MIN_Y: 0, MAX_Y: 0 };
      const offset = t.clientY - (m?.current?.touchStart?.touchY || 0);
      let nextY = (m?.current?.touchStart?.sheetY || 0) + offset;

      if (nextY < MIN_Y) nextY = MIN_Y;
      if (nextY > MAX_Y) nextY = MAX_Y;

      sheet.style.transform = `translateY(${nextY - MAX_Y}px)`;
    };

    const onEnd = () => {
      const { MIN_Y, MAX_Y } = m?.current?.bounds || { MIN_Y: 0, MAX_Y: 0 };
      const range = Math.max(1, MAX_Y - MIN_Y);

      const DIST_THRESHOLD = Math.min(36, range * 0.18);
      const TAP_THRESHOLD = 8;

      const currY = sheet.getBoundingClientRect().y;
      const moved = currY - (m?.current?.touchStart?.sheetY || 0);

      const dt = Math.max(1, performance.now() - (m?.current?.lastMove?.time || 0));
      const dy = (m?.current?.lastMove?.y || 0) - (m?.current?.touchStart?.touchY || 0);
      const velocity = dy / dt;

      if (Math.abs(moved) < TAP_THRESHOLD) {
        setOpenState(true);
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
        if (m?.current?.touchMove?.moving === "up") setOpenState(true);
        else setOpenState(false);
      } else {
        const toOpen = Math.abs(currY - MIN_Y) <= Math.abs(currY - MAX_Y) + 6;
        setOpenState(toOpen);
      }

      reset();
    };

    const reset = () => {
      if (m?.current) {
        m.current.touchMove = { prevTouchY: 0, moving: "none" };
        m.current.isContentTouched = false;
        m.current.startedOnHeader = false;
      }
    };

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

  // ✅ 외부 제어용 함수
  const open = () => {
    const sheet = sheetRef?.current;
    if (!sheet) return;
    const { MIN_Y, MAX_Y } = m?.current?.bounds || { MIN_Y: 0, MAX_Y: 0 };
    sheet.style.transform = `translateY(${MIN_Y - MAX_Y}px)`;
    if (m?.current) {
      m.current.isOpen = true;
    }
    sheet.dataset.open = "1";
    onOpenChange?.(true);
  };

  const close = () => {
    const sheet = sheetRef?.current;
    if (!sheet) return;
    sheet.style.transform = `translateY(0)`;
    if (m?.current) {
      m.current.isOpen = false;
    }
    sheet.dataset.open = "0";
    onOpenChange?.(false);
  };

  return { open, close };
}
