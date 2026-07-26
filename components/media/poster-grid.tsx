'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PADDING_X_CLASSES } from '@/constants/carousel';

export interface PosterGridProps {
  title?: string;
  loading: boolean;
  loadingMore?: boolean;
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
  observerRef?: React.Ref<HTMLDivElement>;
  skeletonCount?: number;
  className?: string;
  children?: React.ReactNode;
}

export function PosterGrid({
  title,
  loading,
  loadingMore = false,
  isEmpty = false,
  emptyState = null,
  observerRef,
  skeletonCount = 20,
  className = '',
  children,
}: PosterGridProps) {
  return (
    <section className={`w-full space-y-6 ${PADDING_X_CLASSES} ${className}`}>
      {title && (
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {title}
        </h2>
      )}

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-5">
          {Array.from({ length: skeletonCount }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-[2/3] w-full rounded-[14px]" />
          ))}
        </div>
      ) : isEmpty ? (
        emptyState
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-5">
            {children}
          </div>

          {observerRef && (
            <div ref={observerRef} className="w-full pt-4">
              {loadingMore && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-5">
                  {Array.from({ length: skeletonCount }).map((_, idx) => (
                    <Skeleton key={idx} className="aspect-[2/3] w-full rounded-[14px]" />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default PosterGrid;
