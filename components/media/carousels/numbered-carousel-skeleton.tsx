'use client';

import React from 'react';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { Skeleton } from '@/components/ui';
import { RankNumber } from '@/components/media/cards/rank-number';

export interface NumberedCarouselSkeletonProps {
  count?: number;
}

export function NumberedCarouselSkeleton({ count = 6 }: NumberedCarouselSkeletonProps) {
  return (
    <div className="w-full overflow-x-clip">
      <div className={`flex gap-4 overflow-hidden pt-2 pb-7 ${PADDING_X_CLASSES}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="relative w-[150px] sm:w-[170px] md:w-[188px] xl:w-[218px] 2xl:w-[248px] shrink-0 flex-[0_0_auto]"
          >
            <RankNumber rank={idx + 1} />
            <div className="relative z-10 ml-[38px] aspect-[2/3] w-[108px] sm:ml-[44px] sm:w-[122px] md:ml-[50px] md:w-[134px] xl:ml-[60px] xl:w-[154px] 2xl:ml-[68px] 2xl:w-[176px]">
              <Skeleton className="h-full w-full rounded-[14px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NumberedCarouselSkeleton;
