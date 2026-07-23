'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/free-mode';

import {
  EPISODE_SLIDE_WIDTH_CLASS,
  CAROUSEL_BREAKPOINTS,
} from '@/constants/carousel';
import type { Season } from '@/types/media';
import { EpisodeCard } from '@/components/media/cards/episode-card';
import { CarouselHeader } from './carousel-header';
import { useTranslation } from '@/hooks/use-translation';
import { useTvSeasonDetails } from '@/hooks/use-tv-season-details';
import { useSwiperNavigation } from '@/hooks/use-swiper-navigation';
import { Skeleton } from '@/components/ui';

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
  const {
    isBeginning,
    isEnd,
    handlePrev,
    handleNext,
    onSwiperInit,
    updateEdgeState,
    setIsBeginning,
    setIsEnd,
  } = useSwiperNavigation();

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
    <div className="w-full overflow-x-clip">
      <CarouselHeader
        title={carouselTitle}
        subtitle={`${episodes.length} ${t('tv.episodes', episodes.length === 1 ? 'episode' : 'episodes')}`}
        onPrev={handlePrev}
        onNext={handleNext}
        isPrevDisabled={isBeginning}
        isNextDisabled={isEnd}
      />

      <div className="relative">
        <Swiper
          key={`season-${season.season_number}`}
          modules={[FreeMode]}
          freeMode={{
            enabled: true,
            sticky: false,
            momentum: true,
            momentumRatio: 1,
            momentumVelocityRatio: 1,
            momentumBounce: false,
          }}
          threshold={1}
          grabCursor={true}
          speed={400}
          resistanceRatio={0}
          touchAngle={75}
          touchEventsTarget="container"
          touchReleaseOnEdges={true}
          passiveListeners={true}
          slidesPerView="auto"
          spaceBetween={0}
          slidesOffsetBefore={16}
          slidesOffsetAfter={16}
          breakpoints={CAROUSEL_BREAKPOINTS}
          onSwiper={onSwiperInit}
          onSlideChange={updateEdgeState}
          onReachBeginning={() => {
            setIsBeginning(true);
            setIsEnd(false);
          }}
          onReachEnd={() => {
            setIsBeginning(false);
            setIsEnd(true);
          }}
          onFromEdge={updateEdgeState}
          onToEdge={updateEdgeState}
          onUpdate={updateEdgeState}
          className="w-full !overflow-visible !pt-2 !pb-7 touch-pan-y select-none cursor-grab active:cursor-grabbing"
          wrapperClass="flex touch-pan-y"
        >
          {episodes.map((ep) => (
            <SwiperSlide key={ep.id || ep.episode_number} className={EPISODE_SLIDE_WIDTH_CLASS}>
              <EpisodeCard episode={ep} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

export default EpisodeCarousel;
