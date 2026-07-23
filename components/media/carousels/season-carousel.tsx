'use client';

import React, { useCallback, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/free-mode';

import {
  SLIDE_WIDTH_CLASS,
  CAROUSEL_BREAKPOINTS,
} from '@/constants/carousel';
import type { Season } from '@/types/media';
import { SeasonCard } from '@/components/media/cards/season-card';
import { CarouselHeader } from './carousel-header';

import { useSwiperNavigation } from '@/hooks/use-swiper-navigation';

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

  if (!seasons || seasons.length === 0) return null;

  return (
    <div className="w-full overflow-x-clip">
      <CarouselHeader
        title={title}
        subtitle={subtitle}
        onPrev={handlePrev}
        onNext={handleNext}
        isPrevDisabled={isBeginning}
        isNextDisabled={isEnd}
      />

      <div className="relative">
        <Swiper
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
          {seasons.map((season) => (
            <SwiperSlide key={season.id || season.season_number} className={SLIDE_WIDTH_CLASS}>
              <SeasonCard
                season={season}
                isSelected={selectedSeasonNumber === season.season_number}
                onClick={() => onSelectSeason?.(season.season_number)}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

export default SeasonCarousel;
