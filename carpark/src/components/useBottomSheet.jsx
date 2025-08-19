import { useEffect, useRef } from "react";

/**
 * BottomSheet drag logic
 * - 레이아웃을 읽어 MIN_Y/MAX_Y를 동적으로 계산
 * - 방향 + 이동량 + 속도(플링) 기준으로 스냅
 * - 헤더 탭(거의 이동 0) 시 토글
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

    // ---- 동적 바운드 계산 ----
    const initialTop = sheet.getBoundingClientRect().y; // 접힘 위치
    const H = host.clientHeight;
    const MIN_Y = H - sheet.clientHeight; // 펼침 위치
    const MAX_Y = initialTop;

    m.current.bounds = { MIN_Y, MAX_Y };

    const setOpenState = (open) => {
      const { MIN_Y, MAX_Y } = m.current.bounds;
      sheet.style.transform = open
        ? `translateY(${MIN_Y - MAX_Y}px)`
        : `translateY(0)`;
      m.current.isOpen = open;
      sheet.dataset.open = open ? "1" : "0";
      onOpenChange?.(open);
    };

    // 초기: 접힘
    setOpenState(false);

    // 컨텐츠 스크롤 시작 표시
    const onContentStart = () => {
      m.current.isContentTouched = true;
    };

    const onStart = (e) => {
      const t = e.touches ? e.touches[0] : e;
      const now = performance.now();
      m.current.touchStart.sheetY = sheet.getBoundingClientRect().y;
      m.current.touchStart.touchY = t.clientY;
      m.current.touchStart.time = now;

      m.current.touchMove.prevTouchY = t.clientY;
      m.current.lastMove = { y: t.clientY, time: now };

      m.current.startedOnHeader = true; // 헤더에서만 시작
      m.current.isContentTouched = false;
    };

    const canMove = () => {
      if (!m.current.startedOnHeader) return false;

      // 컨텐츠 쪽을 잡고 있는 제스처라면:
      // 완전 펼침 + 아래로 끌기 + scrollTop==0 일 때만 시트를 내리게 허용
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

      // 시트 제스처가 잡혔을 때만 기본동작 차단
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
      const range = Math.max(1, MAX_Y - MIN_Y); // 이동 가능한 총 거리

      // 동적 임계값: 전체 범위의 18%, 최대 36px
      const DIST_THRESHOLD = Math.min(36, range * 0.18);
      // 탭 판단: 8px 미만
      const TAP_THRESHOLD = 8;

      const currY = sheet.getBoundingClientRect().y;
      const moved = currY - m.current.touchStart.sheetY;

      // 마지막 120ms으로 속도 계산 (px/ms)
      const dt = Math.max(1, performance.now() - m.current.lastMove.time);
      const dy = m.current.lastMove.y - m.current.touchStart.touchY;
      const velocity = dy / dt; // 음수면 위로 휙

      // 1) 거의 이동이 없으면 헤더 탭으로 간주 → 토글 (열기 쪽 우선)
      if (Math.abs(moved) < TAP_THRESHOLD) {
        setOpenState(!m.current.isOpen || true); // 닫혀있으면 열기, 열려있어도 유지
        reset();
        return;
      }

      // 2) 플링(속도) 기준 스냅: 작은 움직임이어도 쉽게 열림/닫힘
      const OPEN_FLING_V = -0.35; // 위로 0.35px/ms 이상
      const CLOSE_FLING_V = 0.35; // 아래로 0.35px/ms 이상
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

      // 3) 거리 기준 스냅: 임계값 이상이면 방향대로
      if (Math.abs(moved) >= DIST_THRESHOLD) {
        if (m.current.touchMove.moving === "up") setOpenState(true);
        else setOpenState(false);
      } else {
        // 4) 임계 미만: 가까운 쪽으로 스냅 (열기 쪽 약간 가중)
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
