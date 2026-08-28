'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  isDirectionKey,
  isEnterKey,
  isBackKey,
} from '@/lib/spatial-navigation/tv-remote-keys';
import { navigateSpatial } from '@/lib/spatial-navigation/spatial-navigation';

export interface TVNavigationProviderProps {
  children: React.ReactNode;
}

export function TVNavigationProvider({ children }: TVNavigationProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable);

      const direction = isDirectionKey(e);
      if (direction) {
        if (isInput && (direction === 'left' || direction === 'right')) {
          return;
        }

        e.preventDefault();
        document.body.classList.add('tv-navigation-active');
        navigateSpatial(direction);
        return;
      }

      if (isEnterKey(e)) {
        if (activeEl && activeEl !== document.body) {
          if (
            activeEl.tagName !== 'BUTTON' &&
            activeEl.tagName !== 'A' &&
            activeEl.tagName !== 'INPUT'
          ) {
            e.preventDefault();
            activeEl.click();
          }
        }
        return;
      }

      if (isBackKey(e)) {
        if (isInput && (e.key === 'Backspace' || e.keyCode === 8)) {
          return;
        }

        const closeBtn = document.querySelector<HTMLElement>(
          '[data-close-modal="true"], button[aria-label*="Close" i], button[aria-label*="close" i]'
        );
        if (closeBtn && isElementVisible(closeBtn)) {
          e.preventDefault();
          closeBtn.click();
          return;
        }

        const searchClearBtn = document.querySelector<HTMLElement>('[data-search-clear="true"]');
        if (searchClearBtn && isElementVisible(searchClearBtn)) {
          e.preventDefault();
          searchClearBtn.click();
          return;
        }

        if (pathname && pathname !== '/') {
          e.preventDefault();
          router.back();
        }
      }
    },
    [pathname, router]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });

    const handlePointerDown = () => {
      document.body.classList.remove('tv-navigation-active');
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [handleGlobalKeyDown]);

  return <>{children}</>;
}

function isElementVisible(el: HTMLElement): boolean {
  if (!el || (el.offsetWidth === 0 && el.offsetHeight === 0 && el.offsetParent === null)) {
    const style = window.getComputedStyle(el);
    if (style.position !== 'fixed' && style.position !== 'sticky') return false;
  }
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

export default TVNavigationProvider;
