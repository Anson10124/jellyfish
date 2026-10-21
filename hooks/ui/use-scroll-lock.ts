'use client';

import { useEffect } from 'react';
import { getScrollRoot } from '@/lib/utils/scroll-root';

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return;

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlOverflowY = document.documentElement.style.overflowY;
    const originalBodyOverflow = document.body.style.overflow;
    const scrollRoot = getScrollRoot();
    const originalScrollRootOverflow = scrollRoot?.style.overflow ?? '';

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overflowY = 'hidden';
    document.body.style.overflow = 'hidden';
    if (scrollRoot) scrollRoot.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overflowY = originalHtmlOverflowY;
      document.body.style.overflow = originalBodyOverflow;
      if (scrollRoot) scrollRoot.style.overflow = originalScrollRootOverflow;
    };
  }, [isLocked]);
}

export default useScrollLock;
