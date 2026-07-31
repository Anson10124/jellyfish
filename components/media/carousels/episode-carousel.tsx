'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import type { EmblaCarouselType } from 'embla-carousel';
import { EPISODE_SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import type { Episode, Season } from '@/types/media';
import { EpisodeCard } from '@/components/media/cards/episode-card';
import { CarouselHeader } from './carousel-header';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useAllTvEpisodes } from '@/hooks/media/use-all-tv-episodes';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';
import { LandscapeCarouselSkeletonList } from './carousel-skeleton';
import { CarouselWrapper } from './carousel-wrapper';

interface EpisodeCarouselProps {
  tvId: string | number;
  seasons: Season[];
  activeSeasonNumber?: number;
  onSeasonInView?: (seasonNumber: number) => void;
  onScrollToSeason?: (seasonNumber: number) => void;
  onPlayEpisode?: (episode: Episode) => void;
  title?: string;
}

export function EpisodeCarousel({
  tvId,
  seasons,
  activeSeasonNumber,
  onSeasonInView,
  onPlayEpisode,
  title,
}: EpisodeCarouselProps) {
  const { t } = useTranslation();
  const { episodes, seasonIndices, loading } = useAllTvEpisodes(tvId, seasons);

  const episodesRef = useRef(episodes);
  episodesRef.current = episodes;
  const seasonIndicesRef = useRef(seasonIndices);
  seasonIndicesRef.current = seasonIndices;
  const onSeasonInViewRef = useRef(onSeasonInView);
  onSeasonInViewRef.current = onSeasonInView;
  const lastReportedSeasonRef = useRef<number | undefined>(activeSeasonNumber);

  const isClickScrollRef = useRef(false);

  const handleEmblaScroll = useCallback(
    (emblaApi: EmblaCarouselType) => {
      if (!emblaApi || isClickScrollRef.current) return;
      const eps = episodesRef.current;
      if (!eps || eps.length === 0) return;

      const slidesInView = emblaApi.slidesInView();
      if (slidesInView.length === 0) return;

      const seasonCounts: Record<number, number> = {};
      for (const idx of slidesInView) {
        const ep = eps[idx];
        if (ep && ep.season_number !== undefined) {
          seasonCounts[ep.season_number] = (seasonCounts[ep.season_number] || 0) + 1;
        }
      }

      let dominantSeason: number | undefined;
      let maxCount = 0;
      for (const [seasonStr, count] of Object.entries(seasonCounts)) {
        if (count > maxCount) {
          maxCount = count;
          dominantSeason = Number(seasonStr);
        }
      }

      if (
        dominantSeason !== undefined &&
        dominantSeason !== lastReportedSeasonRef.current
      ) {
        lastReportedSeasonRef.current = dominantSeason;
        onSeasonInViewRef.current?.(dominantSeason);
      }
    },
    []
  );

  const { emblaRef, emblaApi, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation({
    onScroll: handleEmblaScroll,
  });

  useEffect(() => {
    if (!emblaApi) return;
    const detectSeason = () => {
      if (isClickScrollRef.current) {
        isClickScrollRef.current = false;
        return;
      }
      handleEmblaScroll(emblaApi);
    };
    emblaApi.on('settle', detectSeason);
    emblaApi.on('slidesInView', detectSeason);
    return () => {
      emblaApi.off('settle', detectSeason);
      emblaApi.off('slidesInView', detectSeason);
    };
  }, [emblaApi, handleEmblaScroll]);

  const prevClickedSeasonRef = useRef<number | undefined>(undefined);

  const scrollToSeason = useCallback(
    (seasonNumber: number) => {
      if (!emblaApi || loading) return;
      const targetIndex = seasonIndicesRef.current[seasonNumber];
      if (targetIndex !== undefined) {
        isClickScrollRef.current = true;
        lastReportedSeasonRef.current = seasonNumber;
        emblaApi.scrollTo(targetIndex);
      }
    },
    [emblaApi, loading]
  );

  useEffect(() => {
    if (activeSeasonNumber === undefined || loading || !emblaApi) return;
    if (activeSeasonNumber === prevClickedSeasonRef.current) return;

    prevClickedSeasonRef.current = activeSeasonNumber;

    if (activeSeasonNumber !== lastReportedSeasonRef.current) {
      scrollToSeason(activeSeasonNumber);
    }
  }, [activeSeasonNumber, loading, emblaApi, scrollToSeason]);

  const activeSeason = seasons.find((s) => s.season_number === activeSeasonNumber);
  const activeSeasonName = activeSeason?.name;
  const currentSeasonEpisodeCount = activeSeason
    ? (episodes.filter((ep) => ep.season_number === activeSeasonNumber).length || activeSeason.episode_count || 0)
    : episodes.length;

  const episodesLabel = t('tv.episodes', 'episodes');
  const carouselTitle = activeSeasonName
    ? `${activeSeasonName} ${episodesLabel}`
    : title || episodesLabel;
  const subtitle = `${currentSeasonEpisodeCount} ${t('tv.episodes', currentSeasonEpisodeCount === 1 ? 'episode' : 'episodes')}`;

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
        <p>{t('tv.noEpisodes', 'No episodes available for this show.')}</p>
      </div>
    );
  }

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
      {episodes.map((ep, idx) => (
        <div key={ep.id || `${ep.season_number}-${ep.episode_number}-${idx}`} className={EPISODE_SLIDE_WIDTH_CLASS}>
          <EpisodeCard episode={ep} onPlay={onPlayEpisode} />
        </div>
      ))}
    </CarouselWrapper>
  );
}

export default EpisodeCarousel;
