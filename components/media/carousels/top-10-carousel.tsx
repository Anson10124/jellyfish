'use client';

import React from 'react';
import { PADDING_X_CLASSES, TOP10_SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import { Poster } from '@/components/media/cards';
import { Skeleton } from '@/components/ui';
import { useTmdbMedia, type UseTmdbMediaOptions } from '@/hooks/use-tmdb-media';
import { useTranslation } from '@/hooks/use-translation';
import { useEmblaNavigation } from '@/hooks/use-embla-navigation';
import { getMediaSubtitleLabel, getMediaTitle, getMediaYear } from '@/lib/utils/media-format';
import type { MediaItem } from '@/types/media';
import { CarouselWrapper } from './carousel-wrapper';

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
  title,
  subtitle,
  type = 'top_rated',
  mediaType = 'movie',
  limit = 10,
  initialItems,
}: Top10CarouselProps) {
  const { t } = useTranslation();
  const carouselTitle = title ?? t('common.top10', 'Top 10');
  const { slides, loading } = useTmdbMedia({
    type,
    mediaType,
    initialItems,
  });

  const { emblaRef, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  const displayedSlides = slides.slice(0, limit);

  if (loading) {
    return (
      <div className="w-full overflow-x-clip">
        <div className={`flex gap-4 overflow-hidden pt-2 pb-7 ${PADDING_X_CLASSES}`}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="relative w-[150px] sm:w-[170px] md:w-[188px] xl:w-[218px] 2xl:w-[248px] shrink-0 flex-[0_0_auto]">
              <TopRankNumber rank={idx + 1} />
              <div className="relative z-10 ml-[38px] aspect-[2/3] w-[108px] sm:ml-[44px] sm:w-[122px] md:ml-[50px] md:w-[134px] xl:ml-[60px] xl:w-[154px] 2xl:ml-[68px] 2xl:w-[176px]">
                <Skeleton className="h-full w-full rounded-[14px]" />
              </div>
            </div>
          ))}
        </div>
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
      {displayedSlides.map((item: MediaItem, index: number) => {
        const itemTitle = getMediaTitle(item);
        return (
          <div key={`${item.id}-${index}`} className={TOP10_SLIDE_WIDTH_CLASS}>
            <div className="group relative w-full shrink-0 text-left select-none cursor-pointer">
              <TopRankNumber rank={index + 1} />
              <div className="relative z-10 ml-[38px] w-[108px] sm:ml-[44px] sm:w-[122px] md:ml-[50px] md:w-[134px] xl:ml-[60px] xl:w-[154px] 2xl:ml-[68px] 2xl:w-[176px]">
                <Poster
                  id={item.id}
                  mediaType={(item.media_type as 'movie' | 'tv') || mediaType}
                  title={itemTitle}
                  posterPath={item.poster_path || ''}
                  year={getMediaYear(item)}
                  label={getMediaSubtitleLabel(item, { type, mediaType }, t)}
                  showDetails={false}
                />
              </div>
            </div>
          </div>
        );
      })}
    </CarouselWrapper>
  );
}

export default Top10Carousel;
