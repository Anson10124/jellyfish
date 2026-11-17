/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getTmdbImage } from '@/lib/utils/tmdb-image';

export interface NetworkLogoProps {
  name: string;
  logoPath?: string | null;
  /** Sizing for the image, e.g. "h-8 max-w-[70%]" */
  className?: string;
  /** Styling for the text shown when there is no logo */
  fallbackClassName?: string;
}

/**
 * TMDB network logos are mostly dark, colored PNGs that disappear on a dark background.
 * They are drawn as a single tone that follows the theme: black in light mode, white in dark mode.
 */
export function NetworkLogo({ name, logoPath, className, fallbackClassName }: NetworkLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!logoPath || failed) {
    return (
      <span className={cn('font-black tracking-tight text-foreground text-center leading-tight', fallbackClassName)}>
        {name}
      </span>
    );
  }

  return (
    <img
      src={getTmdbImage(logoPath, 'w500')}
      alt={name}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn('object-contain select-none pointer-events-none brightness-0 dark:invert', className)}
    />
  );
}

export default NetworkLogo;
