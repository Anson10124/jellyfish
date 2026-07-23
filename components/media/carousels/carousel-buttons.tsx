'use client';

import React from 'react';
import { useTranslation } from '@/hooks/use-translation';

export const PrevButton: React.FC<React.ComponentPropsWithRef<'button'>> = ({
  disabled,
  className = '',
  'aria-label': ariaLabel,
  ...restProps
}) => {
  const { t } = useTranslation();
  return (
    <button
      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/80 text-white border border-zinc-700/50 shadow-md backdrop-blur-md transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${className}`}
      type="button"
      disabled={disabled}
      aria-label={ariaLabel || t('carousel.previousSlide', 'Previous slide')}
      {...restProps}
    >
      <svg className="h-4 w-4 fill-current" viewBox="0 0 532 532">
        <path d="M355.66 11.354c13.793-13.805 36.208-13.805 50.001 0 13.785 13.804 13.785 36.238 0 50.034L201.22 266l204.442 204.61c13.785 13.805 13.785 36.239 0 50.044-13.793 13.796-36.208 13.796-50.002 0a5994246.277 5994246.277 0 0 0-229.332-229.454 35.065 35.065 0 0 1-10.326-25.126c0-9.2 3.393-18.26 10.326-25.2C172.192 194.973 332.731 34.31 355.66 11.354Z" />
      </svg>
    </button>
  );
};

export const NextButton: React.FC<React.ComponentPropsWithRef<'button'>> = ({
  disabled,
  className = '',
  'aria-label': ariaLabel,
  ...restProps
}) => {
  const { t } = useTranslation();
  return (
    <button
      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/80 text-white border border-zinc-700/50 shadow-md backdrop-blur-md transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${className}`}
      type="button"
      disabled={disabled}
      aria-label={ariaLabel || t('carousel.nextSlide', 'Next slide')}
      {...restProps}
    >
      <svg className="h-4 w-4 fill-current" viewBox="0 0 532 532">
        <path d="M176.34 520.646c-13.793 13.805-36.208 13.805-50.001 0-13.785-13.804-13.785-36.238 0-50.034L330.78 266 126.34 61.391c-13.785-13.805-13.785-36.239 0-50.044 13.793-13.796 36.208-13.796 50.002 0 22.928 22.947 206.395 206.507 229.332 229.454a35.065 35.065 0 0 1 10.326 25.126c0 9.2-3.393 18.26-10.326 25.2-45.865 45.901-206.404 206.564-229.332 229.52Z" />
      </svg>
    </button>
  );
};
