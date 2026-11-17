'use client';

import React from 'react';
import { SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import { Poster } from '@/components/media/cards';
import { CarouselWrapper } from './carousel-wrapper';
import { useBookmarks } from '@/hooks/media/use-bookmarks';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';
import { useTranslation } from '@/hooks/ui/use-translation';

export interface BookmarksCarouselProps {
  title?: string;
}

/** Titles saved with the bookmark button on movie/TV pages. Stored locally, so it works without a server. */
export function BookmarksCarousel({ title }: BookmarksCarouselProps) {
  const { t } = useTranslation();
  const bookmarks = useBookmarks();
  const { emblaRef, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  if (bookmarks.length === 0) return null;

  const count = bookmarks.length;
  const subtitle = `${count} ${
    count === 1 ? t('library.watchlistCount', 'title') : t('library.watchlistCountPlural', 'titles')
  }`;

  return (
    <CarouselWrapper
      title={title || t('library.watchlist', 'Watchlist')}
      subtitle={subtitle}
      isBeginning={isBeginning}
      isEnd={isEnd}
      onPrev={handlePrev}
      onNext={handleNext}
      emblaRef={emblaRef}
    >
      {bookmarks.map((item) => (
        <div key={`${item.mediaType}-${item.id}`} className={SLIDE_WIDTH_CLASS}>
          <Poster
            id={item.id}
            mediaType={item.mediaType}
            title={item.title}
            posterPath={item.posterPath || ''}
            year={item.year ?? undefined}
            label={item.mediaType === 'tv' ? t('common.tvShow', 'TV Show') : t('common.movie', 'Movie')}
          />
        </div>
      ))}
    </CarouselWrapper>
  );
}

export default BookmarksCarousel;
