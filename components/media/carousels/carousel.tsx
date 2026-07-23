'use client';

import React, { useCallback, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/free-mode';

import {
  PADDING_X_CLASSES,
  SLIDE_WIDTH_CLASS,
  SKELETON_WIDTH_CLASS,
  CAROUSEL_BREAKPOINTS,
} from '@/constants/carousel';
import { Poster } from '@/components/media/cards';
import { Skeleton } from '@/components/ui';
import { useTmdbMedia, type UseTmdbMediaOptions } from '@/hooks/use-tmdb-media';
import { useTranslation } from '@/hooks/use-translation';
import { getMediaTitle, getMediaYear, getMediaSubtitleLabel } from '@/lib/utils/media-format';
import type { MediaItem } from '@/types/media';
import { PrevButton, NextButton } from './carousel-buttons';
import { CarouselHeader } from './carousel-header';

export type { MediaItem };
export { PrevButton, NextButton };

export interface CarouselProps extends UseTmdbMediaOptions {
  title?: string;
  subtitle?: string;
  items?: MediaItem[];
  renderItem?: (item: MediaItem, index: number) => React.ReactNode;
}

function CarouselSkeletonList() {
  return (
    <div className={`flex gap-4 overflow-hidden pt-2 pb-7 ${PADDING_X_CLASSES}`}>
      {Array.from({ length: 12 }).map((_, idx) => (
        <div key={idx} className={SKELETON_WIDTH_CLASS}>
          <Skeleton className="aspect-[2/3] w-full rounded-[14px]" />
        </div>
      ))}
    </div>
  );
}

export function Carousel({
  title,
  subtitle,
  type = 'popular',
  timeWindow = 'day',
  mediaType = 'movie',
  genreId,
  infinite = true,
  items: initialItems,
  renderItem,
}: CarouselProps) {
  const { t } = useTranslation();
  const { slides, loading, hasMoreToLoad, fetchMoreData } = useTmdbMedia({
    type,
    timeWindow,
    mediaType,
    genreId,
    infinite,
    initialItems,
  });

  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const handlePrev = useCallback(() => {
    swiperInstance?.slidePrev();
  }, [swiperInstance]);

  const handleNext = useCallback(() => {
    swiperInstance?.slideNext();
  }, [swiperInstance]);

  return (
    <div className="w-full overflow-x-clip">
      <CarouselHeader
        title={title}
        subtitle={subtitle}
        onPrev={handlePrev}
        onNext={handleNext}
        isPrevDisabled={isBeginning}
        isNextDisabled={isEnd && !hasMoreToLoad}
      />

      {loading ? (
        <CarouselSkeletonList />
      ) : (
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
              setIsBeginning((prev) => (prev !== swiper.isBeginning ? swiper.isBeginning : prev));
              setIsEnd((prev) => (prev !== swiper.isEnd ? swiper.isEnd : prev));
              const remainingPixels = Math.abs(swiper.maxTranslate() - swiper.translate);
              if (swiper.isEnd || remainingPixels < 600) {
                fetchMoreData();
              }
            }}
            onReachBeginning={() => {
              setIsBeginning(true);
              setIsEnd(false);
            }}
            onReachEnd={() => {
              setIsBeginning(false);
              setIsEnd(true);
              fetchMoreData();
            }}
            onFromEdge={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onToEdge={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onProgress={(swiper) => {
              const remainingPixels = Math.abs(swiper.maxTranslate() - swiper.translate);
              if (remainingPixels < 600) {
                fetchMoreData();
              }
            }}
            onUpdate={(swiper) => {
              setIsBeginning((prev) => (prev !== swiper.isBeginning ? swiper.isBeginning : prev));
              setIsEnd((prev) => (prev !== swiper.isEnd ? swiper.isEnd : prev));
            }}
            className="w-full !overflow-visible !pt-2 !pb-7 touch-pan-y select-none cursor-grab active:cursor-grabbing"
            wrapperClass="flex touch-pan-y"
          >
            {slides.map((item, index) => (
              <SwiperSlide key={`${item.id}-${index}`} className={SLIDE_WIDTH_CLASS}>
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
              </SwiperSlide>
            ))}

            {!initialItems && infinite && hasMoreToLoad && (
              <>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <SwiperSlide key={`skeleton-${idx}`} className={SLIDE_WIDTH_CLASS}>
                    <Skeleton className="aspect-[2/3] w-full rounded-[14px]" />
                  </SwiperSlide>
                ))}
              </>
            )}
          </Swiper>
        </div>
      )}
    </div>
  );
}

export default Carousel;
