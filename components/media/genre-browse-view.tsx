'use client';

import React from 'react';
import { Poster } from './cards';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';
import { useGenreMedia } from '@/hooks/use-genre-media';
import { getMediaTitle, getMediaYear, getMediaSubtitleLabel } from '@/lib/utils/media-format';
import { PADDING_X_CLASSES } from '@/constants/carousel';

interface GenreBrowseViewProps {
  params: Promise<{ id: string }>;
  mediaType: 'movie' | 'tv';
}

export function GenreBrowseView({ params, mediaType }: GenreBrowseViewProps) {
  const { t } = useTranslation();
  const { genreTitle, items, loading, loadingMore, observerRef } = useGenreMedia({
    params,
    mediaType,
  });

  return (
    <section className={`w-full space-y-6 ${PADDING_X_CLASSES}`}>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
        {genreTitle}
      </h2>

      {loading && items.length === 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-5">
          {Array.from({ length: 20 }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-[2/3] w-full rounded-[14px]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-5">
            {items.map((item, idx) => (
              <Poster
                key={`${item.id}-${idx}`}
                id={item.id}
                mediaType={mediaType}
                title={getMediaTitle(item)}
                posterPath={item.poster_path || ''}
                year={getMediaYear(item)}
                label={getMediaSubtitleLabel(item, { mediaType }, t)}
              />
            ))}
          </div>

          <div ref={observerRef} className="w-full pt-4">
            {loadingMore && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-5">
                {Array.from({ length: 20 }).map((_, idx) => (
                  <Skeleton key={idx} className="aspect-[2/3] w-full rounded-[14px]" />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default GenreBrowseView;
