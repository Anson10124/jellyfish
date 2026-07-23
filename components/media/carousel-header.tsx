import React from 'react';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { PrevButton, NextButton } from './carousel-buttons';


export interface CarouselHeaderProps {
  title?: string;
  subtitle?: string;
  onPrev: () => void;
  onNext: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
}

export function CarouselHeader({
  title,
  subtitle,
  onPrev,
  onNext,
  isPrevDisabled,
  isNextDisabled,
}: CarouselHeaderProps) {
  if (!title && !subtitle) return null;

  return (
    <div className={`mb-4 flex items-center justify-between ${PADDING_X_CLASSES}`}>
      <div>
        {title && <h2 className="text-base font-semibold tracking-tight text-white/90">{title}</h2>}
        {subtitle && <p className="text-xs sm:text-sm text-zinc-400 mt-1">{subtitle}</p>}
      </div>

      <div className="hidden md:flex items-center space-x-2">
        <PrevButton onClick={onPrev} disabled={isPrevDisabled} />
        <NextButton onClick={onNext} disabled={isNextDisabled} />
      </div>
    </div>
  );
}

export default CarouselHeader;
