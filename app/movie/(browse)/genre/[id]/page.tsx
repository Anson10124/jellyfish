'use client';

import React, { use } from 'react';
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

  const { slides: genreMovies, loading: genreLoading } = useTmdbMedia({
    type: 'popular',
    mediaType: 'movie',
    genreId: validGenreId,
    infinite: true,
  });

  const genreTitle = validGenreId ? getGenreName(validGenreId, t) : t('common.movies', 'Movies');

  return (
    <section className={`w-full space-y-6 ${PADDING_X_CLASSES}`}>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
        {genreTitle}
      </h2>

      {genreLoading && genreMovies.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-[2/3] w-full rounded-[14px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
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
      )}
    </section>
  );
}
