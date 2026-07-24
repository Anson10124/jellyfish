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

export default CarouselSkeletonList;
