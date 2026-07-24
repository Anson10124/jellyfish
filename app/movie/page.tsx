'use client';

import React, { useState } from 'react';
import { Carousel, Top10Carousel, GenreBar, Poster } from '@/components/media';
import { useTranslation } from '@/hooks/use-translation';
import { useTmdbMedia } from '@/hooks/use-tmdb-media';
import { getMediaTitle, getMediaYear, getMediaSubtitleLabel } from '@/lib/utils/media-format';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { Skeleton } from '@/components/ui/skeleton';

export default function MoviesPage() {
  const { t } = useTranslation();
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);

  // Filtered movies grid when a genre is selected
  const { slides: genreMovies, loading: genreLoading } = useTmdbMedia({
    type: 'popular',
    mediaType: 'movie',
    genreId: selectedGenreId || undefined,
    infinite: true,
  });

  return (
    <main className="w-full max-w-full overflow-x-clip pt-20 pb-16 space-y-8">
      <GenreBar
        selectedGenreId={selectedGenreId}
        onSelectGenre={(genreId) => setSelectedGenreId(genreId)}
      />

      {selectedGenreId !== null ? (
        <section className={`w-full space-y-6 ${PADDING_X_CLASSES}`}>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {t(`genres.${selectedGenreId}`, 'Movies')}
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
      ) : (
        <>
          <Carousel
            title={t('movies.trendingThisWeek', 'Trending Movies This Week')}
            type="trending"
            mediaType="movie"
            timeWindow="week"
            infinite={true}
          />

          <Carousel
            title={t('movies.popular', 'Popular Movies')}
            type="popular"
            mediaType="movie"
            infinite={true}
          />

          <Carousel
            title={t('movies.action', 'Action Blockbusters')}
            genreId={28}
            mediaType="movie"
            infinite={true}
          />

          <Carousel
            title={t('movies.sciFi', 'Sci-Fi & Fantasy')}
            genreId={878}
            mediaType="movie"
            infinite={true}
          />

          <Carousel
            title={t('movies.comedy', 'Comedy Hits')}
            genreId={35}
            mediaType="movie"
            infinite={true}
          />

          <Carousel
            title={t('movies.horror', 'Horror & Thriller')}
            genreId={27}
            mediaType="movie"
            infinite={true}
          />

          <Carousel
            title={t('movies.drama', 'Dramatic Masterpieces')}
            genreId={18}
            mediaType="movie"
            infinite={true}
          />
        </>
      )}
    </main>
  );
}
