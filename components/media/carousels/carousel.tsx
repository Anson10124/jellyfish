'use client';

import React from 'react';
import { SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import { Poster } from '@/components/media/cards';
import { useTmdbMedia, type UseTmdbMediaOptions } from '@/hooks/use-tmdb-media';
import { useTranslation } from '@/hooks/use-translation';
import { useEmblaNavigation } from '@/hooks/use-embla-navigation';
import { getMediaTitle, getMediaYear, getMediaSubtitleLabel } from '@/lib/utils/media-format';
import type { MediaItem } from '@/types/media';
import { PrevButton, NextButton } from './carousel-buttons';
import { CarouselHeader } from './carousel-header';
import { CarouselWrapper } from './carousel-wrapper';
import { CarouselSkeletonList } from './carousel-skeleton';

export type { MediaItem };
export { PrevButton, NextButton };

export interface CarouselProps extends UseTmdbMediaOptions {
  title?: string;
  subtitle?: string;
  items?: MediaItem[];
  renderItem?: (item: MediaItem, index: number) => React.ReactNode;
}

export function Carousel({
  title,
  subtitle,
  type = 'popular',
  timeWindow = 'day',
  mediaType = 'movie',
  genreId,
  items: initialItems,
  renderItem,
}: CarouselProps) {
  const { t } = useTranslation();
  const { slides, loading } = useTmdbMedia({
    type,
    timeWindow,
    mediaType,
    genreId,
    initialItems,
  });

  const { emblaRef, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  if (loading) {
    return (
      <div className="w-full overflow-x-clip">
        <CarouselHeader title={title} subtitle={subtitle} onPrev={() => {}} onNext={() => {}} isPrevDisabled isNextDisabled />
        <CarouselSkeletonList />
      </div>
    );
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
      {slides.map((item, index) => (
        <div key={`${item.id}-${index}`} className={SLIDE_WIDTH_CLASS}>
          {renderItem ? (
            renderItem(item, index)
          ) : (
            <Poster
              id={item.id}
              mediaType={(item.media_type as 'movie' | 'tv') || mediaType}
              title={getMediaTitle(item)}
              posterPath={item.poster_path || ''}
              year={getMediaYear(item)}
              label={getMediaSubtitleLabel(item, { type, mediaType, genreId }, t)}
            />
          )}
        </div>
      ))}
    </CarouselWrapper>
  );
}

export default Carousel;
