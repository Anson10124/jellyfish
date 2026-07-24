'use client';

import React from 'react';
import { EPISODE_SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import type { Season } from '@/types/media';
import { EpisodeCard } from '@/components/media/cards/episode-card';
import { CarouselHeader } from './carousel-header';
import { useTranslation } from '@/hooks/use-translation';
import { useTvSeasonDetails } from '@/hooks/use-tv-season-details';
import { useEmblaNavigation } from '@/hooks/use-embla-navigation';
import { Skeleton } from '@/components/ui';
import { CarouselWrapper } from './carousel-wrapper';

interface EpisodeCarouselProps {
  tvId: string | number;
  season: Season;
  title?: string;
}

export function EpisodeCarousel({
  tvId,
  season,
  title,
}: EpisodeCarouselProps) {
  const { t } = useTranslation();
  const { episodes, loading } = useTvSeasonDetails(tvId, season?.season_number);
  const { emblaRef, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  const carouselTitle = title || `${season.name} ${t('tv.episodes', 'Episodes')}`;

  if (loading) {
    return (
      <div className="w-full overflow-x-clip">
        <CarouselHeader title={carouselTitle} onPrev={() => {}} onNext={() => {}} isPrevDisabled isNextDisabled />
        <div className="flex gap-4 px-4 sm:px-8 md:px-12 lg:px-14 xl:px-16 2xl:px-20 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[260px] sm:w-[300px] md:w-[340px] shrink-0 space-y-2">
              <Skeleton className="w-full aspect-[16/9] rounded-xl bg-white/5" />
              <Skeleton className="h-4 w-3/4 bg-white/5" />
              <Skeleton className="h-3 w-1/2 bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-14 xl:px-16 2xl:px-20 py-4 text-white/50 text-sm">
        <h3 className="font-semibold text-white mb-1">{carouselTitle}</h3>
        <p>{t('tv.noEpisodes', 'No episodes available for this season.')}</p>
      </div>
    );
  }

  return (
    <CarouselWrapper
      title={carouselTitle}
      subtitle={`${episodes.length} ${t('tv.episodes', episodes.length === 1 ? 'episode' : 'episodes')}`}
      isBeginning={isBeginning}
      isEnd={isEnd}
      onPrev={handlePrev}
      onNext={handleNext}
      emblaRef={emblaRef}
    >
      {episodes.map((ep) => (
        <div key={ep.id || ep.episode_number} className={EPISODE_SLIDE_WIDTH_CLASS}>
          <EpisodeCard episode={ep} />
        </div>
      ))}
    </CarouselWrapper>
  );
}

export default EpisodeCarousel;
