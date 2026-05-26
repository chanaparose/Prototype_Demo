/**
 * Rect for fixed-position tour overlay (spotlight + card arrow).
 * On iOS Safari, getBoundingClientRect() is layout-viewport based while
 * position:fixed uses the visual viewport — adjust by visualViewport offset.
 */
export function getTourTargetRect(el: Element): DOMRect {
  const rect = el.getBoundingClientRect();
  const vv = window.visualViewport;
  if (!vv) return rect;

  const left = rect.left - vv.offsetLeft;
  const top = rect.top - vv.offsetTop;
  return new DOMRect(left, top, rect.width, rect.height);
}

export function isTourTargetMostlyVisible(el: Element, margin = 72): boolean {
  const rect = getTourTargetRect(el);
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const vw = window.visualViewport?.width ?? window.innerWidth;
  return (
    rect.top >= margin &&
    rect.left >= 8 &&
    rect.bottom <= vh - margin &&
    rect.right <= vw - 8
  );
}
