'use client';

import React, { useCallback, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/free-mode';

import {
  PADDING_X_CLASSES,
  SWIPER_PADDING_X_CLASSES,
  TOP10_SLIDE_WIDTH_CLASS,
} from '@/constants/carousel';
import { Poster } from '@/components/media/poster';
import { Skeleton } from '@/components/ui/skeleton';
import { useTmdbMedia, type UseTmdbMediaOptions } from '@/hooks/use-tmdb-media';
import { getMediaSubtitleLabel, getMediaTitle, getMediaYear } from '@/lib/utils/media-format';
import type { MediaItem } from '@/types/media';
import { CarouselHeader } from './carousel-header';

export interface Top10CarouselProps extends UseTmdbMediaOptions {
  title?: string;
  subtitle?: string;
  limit?: number;
}

function TopRankNumber({ rank }: { rank: number }) {
  return (
    <svg
      viewBox={rank === 10 ? '0 0 135 135' : '0 0 85 135'}
      className="pointer-events-none absolute -left-1 sm:-left-2 bottom-[0px] z-0 h-[100px] sm:h-[116px] md:h-[130px] xl:h-[152px] 2xl:h-[174px] w-auto select-none"
      aria-hidden="true"
    >
      <text
        x={rank === 10 ? '48.5' : '42.5'}
        y="114"
        textAnchor="middle"
        fill="#121215"
        stroke="#ffffff4d"
        strokeWidth="1.5"
        strokeLinejoin="round"
        paintOrder="stroke fill"
        fontSize="96"
        fontWeight="900"
        fontFamily="var(--font-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        letterSpacing="-6"
      >
        {rank}
      </text>
    </svg>
  );
}

export function Top10Carousel({
  title = 'Top 10',
  subtitle,
  type = 'top_rated',
  mediaType = 'movie',
  limit = 10,
  initialItems,
}: Top10CarouselProps) {
  const { slides, loading } = useTmdbMedia({
    type,
    mediaType,
    infinite: false,
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

  const displayedSlides = slides.slice(0, limit);

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

      {loading ? (
        <div className={`flex gap-4 overflow-hidden pt-2 pb-7 ${PADDING_X_CLASSES}`}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="relative w-[150px] sm:w-[170px] md:w-[188px] xl:w-[218px] 2xl:w-[248px] shrink-0">
              <TopRankNumber rank={idx + 1} />
              <div className="relative z-10 ml-[38px] aspect-[2/3] w-[108px] sm:ml-[44px] sm:w-[122px] md:ml-[50px] md:w-[134px] xl:ml-[60px] xl:w-[154px] 2xl:ml-[68px] 2xl:w-[176px]">
                <Skeleton className="h-full w-full rounded-[14px]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          <Swiper
            modules={[FreeMode]}
            freeMode={{
              enabled: true,
              sticky: false,
              momentum: true,
              momentumRatio: 0.9,
              momentumVelocityRatio: 0.9,
              momentumBounce: true,
              momentumBounceRatio: 0.8,
            }}
            threshold={5}
            grabCursor={true}
            speed={400}
            resistanceRatio={0.85}
            touchAngle={45}
            slidesPerView="auto"
            spaceBetween={16}
            onSwiper={(swiper) => {
              setSwiperInstance(swiper);
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onProgress={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            className={`w-full !overflow-visible !pt-2 !pb-7 touch-pan-y ${SWIPER_PADDING_X_CLASSES}`}
          >
            {displayedSlides.map((item: MediaItem, index: number) => {
              const itemTitle = getMediaTitle(item);
              return (
                <SwiperSlide key={`${item.id}-${index}`} className={TOP10_SLIDE_WIDTH_CLASS}>
                  <div className="group relative w-full shrink-0 snap-start text-left select-none cursor-pointer">
                    <TopRankNumber rank={index + 1} />
                    <div className="relative z-10 ml-[38px] w-[108px] sm:ml-[44px] sm:w-[122px] md:ml-[50px] md:w-[134px] xl:ml-[60px] xl:w-[154px] 2xl:ml-[68px] 2xl:w-[176px]">
                      <Poster
                        title={itemTitle}
                        posterPath={item.poster_path || ''}
                        year={getMediaYear(item)}
                        label={getMediaSubtitleLabel(item, { type, mediaType })}
                        showDetails={false}
                      />
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      )}
    </div>
  );
}

export default Top10Carousel;
