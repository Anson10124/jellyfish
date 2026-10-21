// With Liquid Glass on, the page scrolls inside the glass content element instead of the window,
// so the glass stays pinned while the browser scrolls (see LiquidGlassContent).
export const SCROLL_ROOT_ATTRIBUTE = 'data-scroll-root';

export function getScrollRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector<HTMLElement>(`[${SCROLL_ROOT_ATTRIBUTE}]`);
}

export function scrollPageBy(options: ScrollToOptions): void {
  (getScrollRoot() ?? window).scrollBy(options);
}
