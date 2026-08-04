'use client';

import React from 'react';
import { EPISODE_SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import type { Episode, Season } from '@/types/media';
import { EpisodeCard } from '@/components/media/cards/episode-card';
import { CarouselHeader } from './carousel-header';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useTvSeasonDetails } from '@/hooks/media/use-tv-season-details';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';
import { LandscapeCarouselSkeletonList } from './carousel-skeleton';
import { CarouselWrapper } from './carousel-wrapper';

interface EpisodeCarouselProps {
  tvId: string | number;
  season: Season;
  title?: string;
  onPlayEpisode?: (episode: Episode) => void;
}

export function EpisodeCarousel({
  tvId,
  season,
  title,
  onPlayEpisode,
}: EpisodeCarouselProps) {
  const { t } = useTranslation();
  const { episodes, loading } = useTvSeasonDetails(tvId, season?.season_number);
  const { emblaRef, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  const carouselTitle = title || `${season.name} ${t('tv.episodes', 'Episodes')}`;

  if (loading) {
    return (
      <div className="w-full overflow-x-clip">
        <CarouselHeader title={carouselTitle} onPrev={() => {}} onNext={() => {}} isPrevDisabled isNextDisabled />
        <LandscapeCarouselSkeletonList count={4} />
      </div>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-14 xl:px-16 2xl:px-20 py-4 text-foreground/50 text-sm">
        <h3 className="font-semibold text-foreground mb-1">{carouselTitle}</h3>
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
          <EpisodeCard episode={ep} onPlay={onPlayEpisode} />
        </div>
      ))}
    </CarouselWrapper>
  );
}

export default EpisodeCarousel;
