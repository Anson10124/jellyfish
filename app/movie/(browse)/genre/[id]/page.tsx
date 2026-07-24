'use client';

import React, { use, useEffect, useRef } from 'react';
import { Poster } from '@/components/media';
import { useTranslation } from '@/hooks/use-translation';
import { useTmdbMedia } from '@/hooks/use-tmdb-media';
import { getMediaTitle, getMediaYear, getMediaSubtitleLabel } from '@/lib/utils/media-format';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { getGenreName } from '@/constants/genres';

interface GenrePageProps {
  params: Promise<{ id: string }>;
}

export default function MovieGenrePage({ params }: GenrePageProps) {
  const resolvedParams = use(params);
  const genreIdNum = parseInt(resolvedParams.id, 10);
  const validGenreId = isNaN(genreIdNum) ? undefined : genreIdNum;

  const { t } = useTranslation();
  const observerRef = useRef<HTMLDivElement | null>(null);

  const {
    slides: genreMovies,
    loading: genreLoading,
    loadingMore,
    hasMore,
    loadMore,
  } = useTmdbMedia({
    type: 'popular',
    mediaType: 'movie',
    genreId: validGenreId,
    infinite: true,
  });

  const genreTitle = validGenreId ? getGenreName(validGenreId, t) : t('common.movies', 'Movies');

  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasMore || loadingMore || genreLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !genreLoading) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, genreLoading, loadMore]);

  return (
    <section className={`w-full space-y-6 ${PADDING_X_CLASSES}`}>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
        {genreTitle}
      </h2>

      {genreLoading && genreMovies.length === 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-5">
          {Array.from({ length: 20 }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-[2/3] w-full rounded-[14px]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-5">
            {genreMovies.map((movie, idx) => (
              <Poster
                key={`${movie.id}-${idx}`}
                id={movie.id}
                mediaType="movie"
                title={getMediaTitle(movie)}
                posterPath={movie.poster_path || ''}
                year={getMediaYear(movie)}
                label={getMediaSubtitleLabel(movie, { mediaType: 'movie' }, t)}
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

