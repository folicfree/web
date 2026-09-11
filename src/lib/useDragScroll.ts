"use client";

import { useRef } from "react";

// Mouse drag-to-scroll for horizontal carousels (touch already swipes natively
// via CSS scroll snap). Also suppresses the click that would otherwise fire
// after a drag, so cards don't navigate when you meant to scroll. Pass the
// component's own track ref so the handler reads the same element used for
// arrow-button scrolling.

export function useDragScroll(publicRef: React.RefObject<HTMLDivElement | null>) {
  const state = useRef({ dragging: false, moved: false, startX: 0, scrollLeft: 0 });

  const getEl = () => publicRef?.current;

  const onPointerDown = (e: React.PointerEvent) => {
    const el = getEl();
    if (!el || e.pointerType === "touch") return; // touch scrolls natively
    state.current = { dragging: true, moved: false, startX: e.clientX, scrollLeft: el.scrollLeft };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = getEl();
    if (!el || !state.current.dragging) return;
    const dx = e.clientX - state.current.startX;
    if (Math.abs(dx) > 6) {
      state.current.moved = true;
      el.setPointerCapture(e.pointerId);
      el.scrollLeft = state.current.scrollLeft - dx;
    }
  };
  const endDrag = () => { state.current.dragging = false; };
  const onClickCapture = (e: React.MouseEvent) => {
    if (state.current.moved) { e.preventDefault(); e.stopPropagation(); state.current.moved = false; }
  };

  const onDragStart = (e: React.DragEvent) => { e.preventDefault(); }; // kill native link/image drag — it hijacks the pointer

return { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerLeave: endDrag, onDragStart, onClickCapture };
}
