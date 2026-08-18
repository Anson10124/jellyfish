'use client';

import React from 'react';
import { NumberedMediaCard } from '@/components/media/cards';
import { useTmdbMedia, type UseTmdbMediaOptions } from '@/hooks/media/use-tmdb-media';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';
import { getMediaSubtitleLabel } from '@/lib/utils/media-format';
import type { MediaItem } from '@/types/media';
import { CarouselWrapper } from './carousel-wrapper';
import { NumberedCarouselSkeleton } from './numbered-carousel-skeleton';

export interface Top10CarouselProps extends UseTmdbMediaOptions {
  title?: string;
  subtitle?: string;
  limit?: number;
}

export function Top10Carousel({
  title,
  subtitle,
  type = 'top_rated',
  mediaType = 'movie',
  limit = 10,
  initialItems,
}: Top10CarouselProps) {
  const { t } = useTranslation();
  const carouselTitle = title ?? t('common.top10', 'Top 10');
  const { slides, loading } = useTmdbMedia({
    type,
    mediaType,
    initialItems,
  });

  const { emblaRef, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  const displayedSlides = slides.slice(0, limit);

  if (loading) {
    return <NumberedCarouselSkeleton count={6} />;
  }

  if (displayedSlides.length === 0) return null;

  return (
    <CarouselWrapper
      title={carouselTitle}
      subtitle={subtitle}
      isBeginning={isBeginning}
      isEnd={isEnd}
      onPrev={handlePrev}
      onNext={handleNext}
      emblaRef={emblaRef}
    >
      {displayedSlides.map((item: MediaItem, index: number) => (
        <NumberedMediaCard
          key={`${item.id}-${index}`}
          item={item}
          rank={index + 1}
          mediaType={mediaType}
          label={getMediaSubtitleLabel(item, { type, mediaType }, t)}
        />
      ))}
    </CarouselWrapper>
  );
}

export default Top10Carousel;

