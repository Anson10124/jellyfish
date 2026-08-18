import React from 'react';
import Link from 'next/link';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { PrevButton, NextButton } from './carousel-buttons';

export interface CarouselHeaderProps {
  title?: string;
  subtitle?: string;
  titleHref?: string;
  onPrev: () => void;
  onNext: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
}

export function CarouselHeader({
  title,
  subtitle,
  titleHref,
  onPrev,
  onNext,
  isPrevDisabled,
  isNextDisabled,
}: CarouselHeaderProps) {
  if (!title && !subtitle) return null;

  return (
    <div className={`mb-4 flex items-center justify-between ${PADDING_X_CLASSES}`}>
      <div>
        {title && (
          titleHref ? (
            <Link
              href={titleHref}
              className="inline-block focus:outline-none select-none"
            >
              <h2 className="text-base font-semibold tracking-tight text-foreground/90 transition-colors duration-200 hover:text-foreground hover:underline hover:underline-offset-4 decoration-foreground/40 hover:decoration-foreground">
                {title}
              </h2>
            </Link>
          ) : (
            <h2 className="text-base font-semibold tracking-tight text-foreground/90">{title}</h2>
          )
        )}
        {subtitle && <p className="text-xs sm:text-sm text-foreground/60 mt-1">{subtitle}</p>}
      </div>

      <div className="hidden md:flex items-center space-x-2">
        <PrevButton onClick={onPrev} disabled={isPrevDisabled} />
        <NextButton onClick={onNext} disabled={isNextDisabled} />
      </div>
    </div>
  );
}

export default CarouselHeader;

