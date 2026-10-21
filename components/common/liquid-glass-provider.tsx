'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { GlassContent, GlassScene, type GlassDiagnostic } from '@glass-sdk/liquid-glass';

import { LiquidGlassContext, useLiquidGlassActive } from '@/components/ui/liquid-glass';
import { useLiquidGlass } from '@/hooks/ui/use-liquid-glass';
import { useReduceMotion } from '@/hooks/ui/use-reduce-motion';
import { SCROLL_ROOT_ATTRIBUTE } from '@/lib/utils/scroll-root';

type GpuSupport = 'pending' | 'supported' | 'unsupported';

let gpuSupportPromise: Promise<boolean> | null = null;

// The glass material maps are rendered with WebGPU; without an adapter the surfaces would be see-through.
function detectWebGpu(): Promise<boolean> {
  gpuSupportPromise ??= (async () => {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    if (!gpu || !window.isSecureContext) return false;
    try {
      return (await gpu.requestAdapter()) != null;
    } catch {
      return false;
    }
  })();
  return gpuSupportPromise;
}

/**
 * App-wide glass scene. When the Liquid Glass setting is on, glass surfaces rendered inside it
 * (see <LiquidGlass>) refract the page content wrapped in <LiquidGlassContent>.
 */
export function LiquidGlassScene({ children }: { children: React.ReactNode }) {
  const [enabled] = useLiquidGlass();
  const [reduceMotion] = useReduceMotion();
  const { resolvedTheme } = useTheme();
  const [gpuSupport, setGpuSupport] = useState<GpuSupport>('pending');
  const [failed, setFailed] = useState(false);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const contextValue = useMemo(() => ({ active: true, root }), [root]);

  useEffect(() => {
    if (!enabled || gpuSupport !== 'pending') return;
    let cancelled = false;
    detectWebGpu().then((supported) => {
      if (!cancelled) setGpuSupport(supported ? 'supported' : 'unsupported');
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, gpuSupport]);

  const active = enabled && gpuSupport === 'supported' && !failed;

  useEffect(() => {
    document.documentElement.classList.toggle('liquid-glass', active);
  }, [active]);

  const handleDiagnostic = useCallback((diagnostic: GlassDiagnostic) => {
    if (!diagnostic.error) return;
    console.error('Liquid Glass disabled after a renderer error:', diagnostic.error);
    setFailed(true);
  }, []);

  if (!active) return <>{children}</>;

  return (
    <GlassScene
      material="regular"
      appearance={resolvedTheme === 'light' ? 'light' : 'dark'}
      motion={reduceMotion ? 'none' : 'full'}
      maxSurfaces={32}
      onDiagnostic={handleDiagnostic}
      // Bounded to the viewport: the page scrolls inside LiquidGlassContent instead of the window
      className="h-dvh overflow-hidden"
      ref={setRoot}
    >
      <LiquidGlassContext.Provider value={contextValue}>{children}</LiquidGlassContext.Provider>
    </GlassScene>
  );
}

/**
 * The live page content that glass surfaces refract. Renders its children unchanged when glass is off.
 *
 * With glass on it is also the page's scroll container. When the window scrolls, the browser moves the
 * page before the glass can re-measure, so fixed glass visibly trails behind; inside this scrollport the
 * glass and its filter stay put while the content scrolls underneath.
 */
export function LiquidGlassContent({ children }: { children: React.ReactNode }) {
  const active = useLiquidGlassActive();
  if (!active) return <>{children}</>;
  return <ScrollingGlassContent>{children}</ScrollingGlassContent>;
}

function ScrollingGlassContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scrollRootRef = useRef<HTMLDivElement>(null);

  // Next.js resets the document's scroll on navigation, which no longer scrolls the page
  useEffect(() => {
    scrollRootRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <GlassContent
      layout="scroll"
      ref={scrollRootRef}
      {...{ [SCROLL_ROOT_ATTRIBUTE]: '' }}
      className="liquid-glass-scroll-root flex flex-col bg-background"
    >
      {children}
    </GlassContent>
  );
}
