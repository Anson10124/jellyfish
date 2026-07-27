'use client';

import React from 'react';
import { EPISODE_SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import { LandscapeMediaCard } from '@/components/media/cards/landscape-media-card';
import { CarouselHeader } from './carousel-header';
import { CarouselWrapper } from './carousel-wrapper';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';
import { Skeleton } from '@/components/ui';
import type { JellyfinBaseItem } from '@/types/jellyfin';

export interface MediaLandscapeCarouselProps {
  title: string;
  subtitle?: string;
  items: JellyfinBaseItem[];
  loading?: boolean;
  isConnected?: boolean;
  serverUrl?: string;
  onPlayItem?: (item: JellyfinBaseItem) => void;
}

export function MediaLandscapeCarousel({
  title,
  subtitle,
  items,
  loading = false,
  isConnected = true,
  serverUrl,
  onPlayItem,
}: MediaLandscapeCarouselProps) {
  const { emblaRef, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  if (loading) {
    return (
      <div className="w-full overflow-x-clip my-6">
        <CarouselHeader title={title} subtitle={subtitle} onPrev={() => {}} onNext={() => {}} isPrevDisabled isNextDisabled />
        <div className="flex gap-4 px-4 sm:px-8 md:px-12 lg:px-14 xl:px-16 2xl:px-20 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[260px] sm:w-[300px] md:w-[340px] xl:w-[380px] shrink-0 space-y-2">
              <Skeleton className="w-full aspect-[16/9] rounded-xl bg-white/5" />
              <Skeleton className="h-4 w-3/4 bg-white/5" />
              <Skeleton className="h-3 w-1/2 bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isConnected || !items || items.length === 0) {
    return null;
  }

  return (
    <CarouselWrapper
      title={title}
      subtitle={subtitle}
      isBeginning={isBeginning}
      isEnd={isEnd}
      onPrev={handlePrev}
      onNext={handleNext}
      emblaRef={emblaRef}
    >
      {items.map((item) => (
        <div key={item.Id} className={EPISODE_SLIDE_WIDTH_CLASS}>
          <LandscapeMediaCard item={item} serverUrl={serverUrl} onPlay={onPlayItem} />
        </div>
      ))}
    </CarouselWrapper>
  );
}

export default MediaLandscapeCarousel;
