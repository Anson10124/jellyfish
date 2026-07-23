'use client';

import React, { useCallback, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/free-mode';

import { Poster } from '@/components/media/poster';
import { Skeleton } from '@/components/ui/skeleton';
import { useTmdbMedia } from '@/hooks/use-tmdb-media';
import { getMediaTitle, getMediaYear, getMediaSubtitleLabel } from '@/lib/utils/media-format';

export interface MediaItem {
  id: number | string;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  media_type?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  [key: string]: unknown;
}

export interface CarouselProps {
  title?: string;
  subtitle?: string;
  type?: 'popular' | 'trending';
  timeWindow?: 'day' | 'week';
  mediaType?: 'movie' | 'tv' | 'all';
  genreId?: number;
  infinite?: boolean;
  items?: MediaItem[];
  renderItem?: (item: MediaItem, index: number) => React.ReactNode;
}

export const PrevButton: React.FC<React.ComponentPropsWithRef<'button'>> = ({
  disabled,
  className = '',
  ...restProps
}) => {
  return (
    <button
      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/80 text-white border border-zinc-700/50 shadow-md backdrop-blur-md transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${className}`}
      type="button"
      disabled={disabled}
      aria-label="Previous slide"
      {...restProps}
    >
      <svg className="h-4 w-4 fill-current" viewBox="0 0 532 532">
        <path d="M355.66 11.354c13.793-13.805 36.208-13.805 50.001 0 13.785 13.804 13.785 36.238 0 50.034L201.22 266l204.442 204.61c13.785 13.805 13.785 36.239 0 50.044-13.793 13.796-36.208 13.796-50.002 0a5994246.277 5994246.277 0 0 0-229.332-229.454 35.065 35.065 0 0 1-10.326-25.126c0-9.2 3.393-18.26 10.326-25.2C172.192 194.973 332.731 34.31 355.66 11.354Z" />
      </svg>
    </button>
  );
};

export const NextButton: React.FC<React.ComponentPropsWithRef<'button'>> = ({
  disabled,
  className = '',
  ...restProps
}) => {
  return (
    <button
      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/80 text-white border border-zinc-700/50 shadow-md backdrop-blur-md transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${className}`}
      type="button"
      disabled={disabled}
      aria-label="Next slide"
      {...restProps}
    >
      <svg className="h-4 w-4 fill-current" viewBox="0 0 532 532">
        <path d="M176.34 520.646c-13.793 13.805-36.208 13.805-50.001 0-13.785-13.804-13.785-36.238 0-50.034L330.78 266 126.34 61.391c-13.785-13.805-13.785-36.239 0-50.044 13.793-13.796 36.208-13.796 50.002 0 22.928 22.947 206.395 206.507 229.332 229.454a35.065 35.065 0 0 1 10.326 25.126c0 9.2-3.393 18.26-10.326 25.2-45.865 45.901-206.404 206.564-229.332 229.52Z" />
      </svg>
    </button>
  );
};

const PADDING_X_CLASSES = 'px-4 sm:px-8 md:px-12 lg:px-14 xl:px-16 2xl:px-20';
const SWIPER_PADDING_X_CLASSES = '!px-4 sm:!px-8 md:!px-12 lg:!px-14 xl:!px-16 2xl:!px-20';

export default function Carousel({
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

  const slideWidthClass = "!w-[104px] sm:!w-[116px] md:!w-[128px] xl:!w-[148px] 2xl:!w-[170px] shrink-0";
  const skeletonWidthClass = "w-[104px] sm:w-[116px] md:w-[128px] xl:w-[148px] 2xl:w-[170px] shrink-0";

  return (
    <div className="w-full overflow-x-clip">
      {(title || subtitle) && (
        <div className={`mb-4 flex items-center justify-between ${PADDING_X_CLASSES}`}>
          <div>
            {title && <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h2>}
            {subtitle && <p className="text-xs sm:text-sm text-zinc-400 mt-1">{subtitle}</p>}
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <PrevButton onClick={handlePrev} disabled={isBeginning} />
            <NextButton onClick={handleNext} disabled={isEnd && !hasMoreToLoad} />
          </div>
        </div>
      )}

      {loading ? (
        <div className={`flex gap-4 overflow-hidden pt-2 pb-7 ${PADDING_X_CLASSES}`}>
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className={skeletonWidthClass}>
              <Skeleton className="aspect-[2/3] w-full rounded-[14px]" />
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
              momentumBounce: false,
            }}
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
              if (swiper.progress >= 0.6) {
                fetchMoreData();
              }
            }}
            onUpdate={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            className={`w-full !overflow-visible !pt-2 !pb-7 ${SWIPER_PADDING_X_CLASSES}`}
          >
            {slides.map((item, index) => (
              <SwiperSlide key={`${item.id}-${index}`} className={slideWidthClass}>
                {renderItem ? (
                  renderItem(item, index)
                ) : (
                  <Poster
                    title={getMediaTitle(item)}
                    posterPath={item.poster_path || ''}
                    year={getMediaYear(item)}
                    label={getMediaSubtitleLabel(item, { type, mediaType, genreId })}
                  />
                )}
              </SwiperSlide>
            ))}

            {!initialItems && infinite && hasMoreToLoad && (
              <>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <SwiperSlide key={`skeleton-${idx}`} className={slideWidthClass}>
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