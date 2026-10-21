'use client';

import React, { useEffect } from 'react';
import { MotionConfig, MotionGlobalConfig } from 'motion/react';

import { useReduceMotion } from '@/hooks/ui/use-reduce-motion';
import { getReduceMotion } from '@/lib/storage/content-preferences';

// MotionConfig's reducedMotion/skipAnimations are only read when each element mounts, and
// reducedMotion only stops transform animations. The global flag is checked every time an
// animation starts, so it also covers elements already on screen and opacity/height tweens.
// Set it at load too so animations that run during hydration are skipped.
if (typeof window !== 'undefined') {
  MotionGlobalConfig.skipAnimations = getReduceMotion();
}

export function ReduceMotionProvider({ children }: { children: React.ReactNode }) {
  const [reduceMotion] = useReduceMotion();

  useEffect(() => {
    MotionGlobalConfig.skipAnimations = reduceMotion;
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  // The setting already defaults to the OS preference, so an explicit "off" should mean full motion.
  return <MotionConfig reducedMotion="never">{children}</MotionConfig>;
}
