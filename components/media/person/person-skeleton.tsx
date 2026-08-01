'use client';

import { Skeleton } from '@/components/ui';
import { PADDING_X_CLASSES, SKELETON_WIDTH_CLASS } from '@/constants/carousel';

export function PersonSkeleton() {
  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <div className="relative z-10 w-full pt-32 sm:pt-36 lg:pt-40 pb-24 space-y-14 lg:space-y-16">
        <div className={`max-w-7xl mx-auto ${PADDING_X_CLASSES}`}>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
            <div className="w-48 lg:w-72 shrink-0 space-y-4">
              <Skeleton className="aspect-[2/3] w-full rounded-2xl bg-foreground/10" />
              <div className="flex items-center justify-center lg:justify-start gap-2 pt-1">
                <Skeleton className="w-9 h-9 rounded-xl bg-foreground/10" />
                <Skeleton className="w-9 h-9 rounded-xl bg-foreground/10" />
                <Skeleton className="w-9 h-9 rounded-xl bg-foreground/10" />
                <Skeleton className="w-9 h-9 rounded-xl bg-foreground/10" />
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left space-y-5 w-full">
              <div>
                <Skeleton className="h-9 sm:h-11 lg:h-12 w-64 sm:w-80 lg:w-96 rounded-xl bg-foreground/10 mx-auto lg:mx-0" />
                <Skeleton className="h-5 w-32 rounded-lg bg-foreground/10 mx-auto lg:mx-0 mt-2" />
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                <Skeleton className="h-7 w-20 rounded-full bg-foreground/10" />
                <Skeleton className="h-7 w-36 rounded-full bg-foreground/10" />
                <Skeleton className="h-7 w-32 rounded-full bg-foreground/10" />
              </div>
              <div className="space-y-3 pt-2">
                <Skeleton className="h-6 w-28 rounded-lg bg-foreground/10 mx-auto lg:mx-0" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-md bg-foreground/10" />
                  <Skeleton className="h-4 w-[95%] rounded-md bg-foreground/10 mx-auto lg:mx-0" />
                  <Skeleton className="h-4 w-[90%] rounded-md bg-foreground/10 mx-auto lg:mx-0" />
                  <Skeleton className="h-4 w-[75%] rounded-md bg-foreground/10 mx-auto lg:mx-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <section className="space-y-4">
          <div className={`mb-4 flex items-center justify-between ${PADDING_X_CLASSES}`}>
            <Skeleton className="h-6 w-32 rounded-lg bg-foreground/10" />
            <div className="hidden md:flex items-center space-x-2">
              <Skeleton className="h-9 w-9 rounded-full bg-foreground/10" />
              <Skeleton className="h-9 w-9 rounded-full bg-foreground/10" />
            </div>
          </div>
          <div className={`flex gap-4 overflow-hidden pt-2 pb-7 ${PADDING_X_CLASSES}`}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className={SKELETON_WIDTH_CLASS}>
                <Skeleton className="aspect-[2/3] w-full rounded-[14px] bg-foreground/10" />
              </div>
            ))}
          </div>
        </section>
        <section className={`space-y-6 pt-4 ${PADDING_X_CLASSES}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Skeleton className="h-7 w-36 rounded-lg bg-foreground/10" />
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-48 rounded-xl bg-foreground/10" />
              <Skeleton className="h-9 w-44 rounded-xl bg-foreground/10" />
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-5">
            {Array.from({ length: 16 }).map((_, idx) => (
              <Skeleton key={idx} className="aspect-[2/3] w-full rounded-[14px] bg-foreground/10" />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default PersonSkeleton;