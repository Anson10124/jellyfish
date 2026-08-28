import { NavigationDirection } from './tv-remote-keys';
import { getLayoutOffsetPx } from '@/constants/carousel';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex="0"]',
  '[data-focusable="true"]',
].join(', ');

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

function getElementRect(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return {
    left: r.left,
    top: r.top,
    right: r.right,
    bottom: r.bottom,
    width: r.width,
    height: r.height,
    centerX: r.left + r.width / 2,
    centerY: r.top + r.height / 2,
  };
}

function isElementVisible(el: HTMLElement): boolean {
  if (!el || el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0) {
    // Check if fixed/sticky
    const style = window.getComputedStyle(el);
    if (style.position !== 'fixed' && style.position !== 'sticky') return false;
  }
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  if (el.hasAttribute('aria-hidden') && el.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  return true;
}


export function getActiveNavigationScope(): HTMLElement | Document {
  // Check for open modals or high z-index overlays
  const modals = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[role="dialog"], [data-modal="true"], .modal-content, [data-search-dropdown="true"], [data-user-menu="true"]'
    )
  ).filter((m) => isElementVisible(m));

  if (modals.length > 0) {
    return modals[modals.length - 1];
  }

  return document;
}

export function getFocusableElements(scope: HTMLElement | Document = getActiveNavigationScope()): HTMLElement[] {
  const elements = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return elements.filter((el) => {
    if (!isElementVisible(el)) return false;
    if (el.tabIndex === -1 && !el.hasAttribute('data-focusable')) return false;
    return true;
  });
}

function calculateDirectionScore(
  curRect: Rect,
  candRect: Rect,
  direction: NavigationDirection,
  isSameCarousel: boolean
): number {
  let primaryDist = 0;
  let orthogonalDist = 0;
  let hasOverlap = false;

  switch (direction) {
    case 'right': {
      primaryDist = candRect.left >= curRect.right
        ? candRect.left - curRect.right
        : Math.abs(candRect.centerX - curRect.centerX);
      orthogonalDist = Math.abs(candRect.centerY - curRect.centerY);
      hasOverlap = candRect.top < curRect.bottom && candRect.bottom > curRect.top;
      break;
    }
    case 'left': {
      primaryDist = curRect.left >= candRect.right
        ? curRect.left - candRect.right
        : Math.abs(curRect.centerX - candRect.centerX);
      orthogonalDist = Math.abs(candRect.centerY - curRect.centerY);
      hasOverlap = candRect.top < curRect.bottom && candRect.bottom > curRect.top;
      break;
    }
    case 'down': {
      primaryDist = candRect.top >= curRect.bottom
        ? candRect.top - curRect.bottom
        : Math.abs(candRect.centerY - curRect.centerY);
      orthogonalDist = Math.abs(candRect.centerX - curRect.centerX);
      hasOverlap = candRect.left < curRect.right && candRect.right > curRect.left;
      break;
    }
    case 'up': {
      primaryDist = curRect.top >= candRect.bottom
        ? curRect.top - candRect.bottom
        : Math.abs(curRect.centerY - candRect.centerY);
      orthogonalDist = Math.abs(candRect.centerX - curRect.centerX);
      hasOverlap = candRect.left < curRect.right && candRect.right > curRect.left;
      break;
    }
  }

  // Weight primary distance vs orthogonal distance
  let score = primaryDist + orthogonalDist * 2.2;

  // Overlap bonus: strongly prefer elements aligned with current element
  if (hasOverlap) {
    score *= 0.6;
  }

  // Carousel continuity bonus: for left/right inside same carousel, strongly prioritize
  if ((direction === 'left' || direction === 'right') && isSameCarousel) {
    score *= 0.3;
  }

  // If navigating down/up and it's inside the same carousel, penalize to prefer moving to other rows
  if ((direction === 'up' || direction === 'down') && isSameCarousel) {
    score *= 2.5;
  }

  return score;
}

function isCandidateInDirection(
  curRect: Rect,
  candRect: Rect,
  direction: NavigationDirection
): boolean {
  const threshold = 3; // Slight tolerance for subpixel alignments
  switch (direction) {
    case 'right':
      return candRect.centerX > curRect.centerX + threshold || candRect.left >= curRect.left + threshold;
    case 'left':
      return candRect.centerX < curRect.centerX - threshold || candRect.right <= curRect.right - threshold;
    case 'down':
      return candRect.centerY > curRect.centerY + threshold || candRect.top >= curRect.top + threshold;
    case 'up':
      return candRect.centerY < curRect.centerY - threshold || candRect.bottom <= curRect.bottom - threshold;
  }
}

export function syncCarouselForElement(targetEl: HTMLElement): void {
  try {
    const carouselContainer = targetEl.closest<HTMLElement>('[data-carousel-container="true"]');
    if (!carouselContainer) return;

    // Check for attached emblaApi
    const emblaApi = (carouselContainer as unknown as { __emblaApi?: { scrollTo: (index: number) => void; slideNodes: () => HTMLElement[] } }).__emblaApi;
    if (emblaApi && typeof emblaApi.scrollTo === 'function') {
      const slides = emblaApi.slideNodes ? emblaApi.slideNodes() : [];
      const slideIndex = slides.findIndex((slide) => slide.contains(targetEl) || slide === targetEl);
      if (slideIndex >= 0) {
        const targetRect = targetEl.getBoundingClientRect();
        const leftOffset = getLayoutOffsetPx();
        const isComfortablyVisible =
          targetRect.left >= leftOffset - 12 &&
          targetRect.right <= (typeof window !== 'undefined' ? window.innerWidth : 1920) - leftOffset + 12;

        if (!isComfortablyVisible) {
          emblaApi.scrollTo(slideIndex);
        }
        return;
      }
    }

    // Fallback: smooth scroll within carousel track
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  } catch (err) {
    console.debug('Carousel sync error:', err);
  }
}

export function navigateSpatial(direction: NavigationDirection): boolean {
  const scope = getActiveNavigationScope();
  const candidates = getFocusableElements(scope);

  if (candidates.length === 0) return false;

  let currentEl = document.activeElement as HTMLElement | null;

  // Validate if current activeElement is a valid focusable candidate
  if (!currentEl || currentEl === document.body || !candidates.includes(currentEl)) {
    // Pick the most appropriate initial element
    // 1. Look for any element currently marked as data-nav-active or data-active
    const activeNav = candidates.find((el) => el.getAttribute('aria-current') === 'page' || el.classList.contains('active'));
    if (activeNav) {
      activeNav.focus();
      syncCarouselForElement(activeNav);
      return true;
    }

    // 2. Pick top-left visible element in viewport
    const visibleCandidates = candidates.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.top <= window.innerHeight && r.left >= 0 && r.left <= window.innerWidth;
    });

    const initial = visibleCandidates.length > 0 ? visibleCandidates[0] : candidates[0];
    initial.focus();
    syncCarouselForElement(initial);
    return true;
  }

  const curRect = getElementRect(currentEl);
  const curCarousel = currentEl.closest('[data-carousel-container="true"]');

  // Filter candidates that lie in the target direction
  const directionalCandidates = candidates.filter((cand) => {
    if (cand === currentEl) return false;
    const candRect = getElementRect(cand);
    return isCandidateInDirection(curRect, candRect, direction);
  });

  if (directionalCandidates.length === 0) {
    // If inside a carousel and pressing left/right at edges, do nothing or bounce
    return false;
  }

  // Find the candidate with the lowest distance score
  let bestCandidate: HTMLElement | null = null;
  let lowestScore = Infinity;

  for (const cand of directionalCandidates) {
    const candRect = getElementRect(cand);
    const isSameCarousel = Boolean(curCarousel && cand.closest('[data-carousel-container="true"]') === curCarousel);
    const score = calculateDirectionScore(curRect, candRect, direction, isSameCarousel);

    if (score < lowestScore) {
      lowestScore = score;
      bestCandidate = cand;
    }
  }

  if (bestCandidate) {
    bestCandidate.focus({ preventScroll: true });
    syncCarouselForElement(bestCandidate);

    // Scroll vertical window view if element is outside comfortable viewing area
    const newRect = bestCandidate.getBoundingClientRect();
    const topMargin = 80;
    const bottomMargin = 80;

    if (newRect.top < topMargin) {
      window.scrollBy({ top: newRect.top - topMargin, behavior: 'smooth' });
    } else if (newRect.bottom > window.innerHeight - bottomMargin) {
      window.scrollBy({ top: newRect.bottom - (window.innerHeight - bottomMargin), behavior: 'smooth' });
    }

    return true;
  }

  return false;
}
