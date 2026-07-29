'use client';

import React from 'react';
import { PADDING_X_CLASSES, SKELETON_WIDTH_CLASS } from '@/constants/carousel';
import { Skeleton } from '@/components/ui';

export interface CarouselSkeletonListProps {
  count?: number;
  widthClass?: string;
}

export function CarouselSkeletonList({
  count = 12,
  widthClass = SKELETON_WIDTH_CLASS,
}: CarouselSkeletonListProps) {
  return (
    <div className={`flex gap-4 overflow-hidden pt-2 pb-7 ${PADDING_X_CLASSES}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={widthClass}>
          <Skeleton className="aspect-[2/3] w-full rounded-[14px]" />
        </div>
      ))}
    </div>
  );
}

export interface LandscapeCarouselSkeletonListProps {
  count?: number;
}

export function LandscapeCarouselSkeletonList({
  count = 4,
}: LandscapeCarouselSkeletonListProps) {
  return (
    <div className={`flex gap-4 overflow-hidden py-2 ${PADDING_X_CLASSES}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[260px] sm:w-[300px] md:w-[340px] xl:w-[380px] shrink-0 space-y-2">
          <Skeleton className="w-full aspect-[16/9] rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default CarouselSkeletonList;

