'use client';

import React from 'react';
import { EPISODE_SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import { LandscapeMediaCard } from '@/components/media/cards/landscape-media-card';
import { CarouselHeader } from './carousel-header';
import { CarouselWrapper } from './carousel-wrapper';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';
import { LandscapeCarouselSkeletonList } from './carousel-skeleton';
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
        <LandscapeCarouselSkeletonList count={4} />
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
