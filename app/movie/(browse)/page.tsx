'use client';

import React from 'react';
import { Carousel } from '@/components/media';
import { useTranslation } from '@/hooks/use-translation';

export default function MoviesPage() {
  const { t } = useTranslation();

  return (
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
  );
}
