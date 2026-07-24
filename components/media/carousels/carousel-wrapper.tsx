'use client';

import React from 'react';
import { CAROUSEL_TRACK_CLASSES } from '@/constants/carousel';
import { CarouselHeader } from './carousel-header';

export interface CarouselWrapperProps {
  title?: string;
  subtitle?: string;
  isBeginning: boolean;
  isEnd: boolean;
  onPrev: () => void;
  onNext: () => void;
  emblaRef: (node: HTMLElement | null) => void;
  children: React.ReactNode;
}

export function CarouselWrapper({
  title,
  subtitle,
  isBeginning,
  isEnd,
  onPrev,
  onNext,
  emblaRef,
  children,
}: CarouselWrapperProps) {
  return (
    <div className="w-full overflow-x-clip">
      <CarouselHeader
        title={title}
        subtitle={subtitle}
        onPrev={onPrev}
        onNext={onNext}
        isPrevDisabled={isBeginning}
        isNextDisabled={isEnd}
      />

      <div className="relative overflow-hidden" ref={emblaRef}>
        <div className={CAROUSEL_TRACK_CLASSES}>{children}</div>
      </div>
    </div>
  );
}

export default CarouselWrapper;
