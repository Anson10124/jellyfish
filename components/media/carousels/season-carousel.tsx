'use client';

import React from 'react';
import { SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import type { Season } from '@/types/media';
import { SeasonCard } from '@/components/media/cards/season-card';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';
import { CarouselWrapper } from './carousel-wrapper';

interface SeasonCarouselProps {
  title?: string;
  subtitle?: string;
  seasons: Season[];
  selectedSeasonNumber?: number;
  onSelectSeason?: (seasonNumber: number) => void;
}

export function SeasonCarousel({
  title = 'Seasons',
  subtitle,
  seasons,
  selectedSeasonNumber,
  onSelectSeason,
}: SeasonCarouselProps) {
  const { emblaRef, emblaApi, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  React.useEffect(() => {
    if (!emblaApi || selectedSeasonNumber === undefined || !seasons || seasons.length === 0) return;
    const index = seasons.findIndex((s) => s.season_number === selectedSeasonNumber);
    if (index !== -1) {
      emblaApi.scrollTo(index);
    }
  }, [emblaApi, selectedSeasonNumber, seasons]);

  if (!seasons || seasons.length === 0) return null;

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
      {seasons.map((season) => (
        <div key={season.id || season.season_number} className={SLIDE_WIDTH_CLASS}>
          <SeasonCard
            season={season}
            isSelected={selectedSeasonNumber === season.season_number}
            onClick={() => onSelectSeason?.(season.season_number)}
          />
        </div>
      ))}
    </CarouselWrapper>
  );
}

export default SeasonCarousel;
