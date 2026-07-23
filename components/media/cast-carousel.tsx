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
import type { CastMember, CrewMember } from '@/types/media';
import { CarouselHeader } from './carousel-header';
import { CastCard } from './cast-card';

export type CastOrCrewMember = CastMember | CrewMember;


interface CastCarouselProps {
  title?: string;
  subtitle?: string;
  cast: CastOrCrewMember[];
}

export default function CastCarousel({
  title = 'Top Cast',
  subtitle,
  cast,
}: CastCarouselProps) {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const handlePrev = useCallback(() => {
    swiperInstance?.slidePrev();
  }, [swiperInstance]);

  const handleNext = useCallback(() => {
    swiperInstance?.slideNext();
  }, [swiperInstance]);

  if (!cast || cast.length === 0) return null;

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
          onSwiper={(swiper) => {
            setSwiperInstance(swiper);
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          onSlideChange={(swiper) => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          onReachBeginning={() => {
            setIsBeginning(true);
            setIsEnd(false);
          }}
          onReachEnd={() => {
            setIsBeginning(false);
            setIsEnd(true);
          }}
          onFromEdge={(swiper) => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          onToEdge={(swiper) => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          onUpdate={(swiper) => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          className="w-full !overflow-visible !pt-2 !pb-7 touch-pan-y select-none cursor-grab active:cursor-grabbing"
          wrapperClass="flex touch-pan-y"
        >
          {cast.map((item, index) => (
            <SwiperSlide key={`${item.id}-${index}`} className={SLIDE_WIDTH_CLASS}>
              <CastCard cast={item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
