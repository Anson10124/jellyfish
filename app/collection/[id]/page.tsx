/* eslint-disable @next/next/no-img-element */
'use client';

import React, { use, useMemo } from 'react';
import { ArrowLeft, Star, Calendar, Film } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useCollection } from '@/hooks/media/use-collection';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import { getMediaTitle, getMediaYear } from '@/lib/utils/media-format';
import { getGenreName } from '@/constants/genres';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { Skeleton } from '@/components/ui';

interface CollectionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const resolvedParams = use(params);
  const collectionId = resolvedParams.id;
  const { t, formatDate } = useTranslation();

  const { collection, parts, loading, error } = useCollection(collectionId);

  // Derive franchise metadata from parts
  const { backdropUrl, posterUrl, yearRange, avgRating, genreNames } = useMemo(() => {
    if (!collection) {
      return {
        backdropUrl: null,
        posterUrl: null,
        yearRange: null,
        avgRating: null,
        genreNames: [] as string[],
      };
    }

    const backdrop =
      collection.backdrop_path ||
      parts.find((p) => p.backdrop_path)?.backdrop_path ||
      null;

    const poster =
      collection.poster_path ||
      parts.find((p) => p.poster_path)?.poster_path ||
      null;

    const years = parts
      .map((p) => getMediaYear(p))
      .filter((y) => y > 0);

    const yearSpan =
      years.length > 0
        ? Math.min(...years) === Math.max(...years)
          ? String(Math.min(...years))
          : `${Math.min(...years)} – ${Math.max(...years)}`
        : null;

    const ratedParts = parts.filter((p) => typeof p.vote_average === 'number' && p.vote_average > 0);
    const average =
      ratedParts.length > 0
        ? (ratedParts.reduce((sum, p) => sum + (p.vote_average || 0), 0) / ratedParts.length).toFixed(1)
        : null;

    // Collect unique genres
    const genreIdSet = new Set<number>();
    parts.forEach((p) => {
      p.genre_ids?.forEach((gid) => genreIdSet.add(gid));
    });
    const genres = Array.from(genreIdSet)
      .map((gid) => getGenreName(gid, t))
      .filter(Boolean)
      .slice(0, 4);

    return {
      backdropUrl: backdrop ? getTmdbImage(backdrop, 'original') : null,
      posterUrl: poster ? getTmdbImage(poster, 'w500') : null,
      yearRange: yearSpan,
      avgRating: average,
      genreNames: genres,
    };
  }, [collection, parts, t]);

  if (loading) {
    return (
      <div className="relative min-h-screen w-full bg-background text-foreground">
        <div className={`pt-32 pb-16 ${PADDING_X_CLASSES} space-y-8`}>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <Skeleton className="w-48 sm:w-56 aspect-[2/3] rounded-2xl shrink-0" />
            <div className="space-y-4 w-full max-w-2xl">
              <Skeleton className="h-10 w-3/4 rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-28 rounded-lg" />
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-foreground px-4">
        <h2 className="text-2xl font-bold">{t('movies.movieNotFound', 'Collection not found')}</h2>
        <Link
          href="/movie"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-sm font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('movies.backToMovies', 'Back to Movies')}
        </Link>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
      {backdropUrl && (
        <div className="fixed inset-0 h-screen w-screen select-none pointer-events-none z-0 overflow-hidden">
          <img
            src={backdropUrl}
            alt={collection.name}
            className="h-full w-full object-cover object-center blur-3xl opacity-40 scale-110"
            draggable={false}
          />
        </div>
      )}

      <div className="relative z-10 w-full pt-28 sm:pt-32 lg:pt-36 pb-20 space-y-12 lg:space-y-14">
        {/* Hero Showcase */}
        <div className={PADDING_X_CLASSES}>
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-center md:items-start text-center md:text-left">
            {/* Collection Poster */}
            {posterUrl && (
              <div className="relative w-44 sm:w-56 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/15 shrink-0 bg-foreground/5">
                <img
                  src={posterUrl}
                  alt={collection.name}
                  className="w-full h-full object-cover select-none"
                  draggable={false}
                />
              </div>
            )}

            {/* Collection Details */}
            <div className="flex-1 space-y-4 max-w-3xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground drop-shadow-md">
                {collection.name}
              </h1>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-foreground/10 text-xs sm:text-sm font-medium text-foreground/90">
                  <Film className="h-3.5 w-3.5 opacity-70" />
                  {parts.length} {parts.length === 1 ? 'Movie' : 'Movies'}
                </span>

                {yearRange && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-foreground/10 text-xs sm:text-sm font-medium text-foreground/90">
                    <Calendar className="h-3.5 w-3.5 opacity-70" />
                    {yearRange}
                  </span>
                )}

                {avgRating && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-foreground/10 text-xs sm:text-sm font-medium text-foreground/90">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {avgRating}
                  </span>
                )}

                {genreNames.map((genre) => (
                  <span
                    key={genre}
                    className="px-2.5 py-1 rounded-lg bg-foreground/5 text-xs sm:text-sm font-medium text-foreground/75 border border-border/40"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Overview */}
              {collection.overview && (
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed pt-2 max-w-2xl">
                  {collection.overview}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Movies List Section */}
        <section className={`relative z-10 space-y-5 ${PADDING_X_CLASSES}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {parts.length} {parts.length === 1 ? 'movie' : 'movies'}
            </h2>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5">
            {parts.map((item, index) => {
              const itemTitle = getMediaTitle(item);
              const dateStr = item.release_date ? formatDate(item.release_date) : null;
              const posterPath = item.poster_path ? getTmdbImage(item.poster_path, 'w342') : null;

              return (
                <Link
                  key={item.id}
                  href={`/movie/${item.id}`}
                  className="group relative flex flex-row overflow-hidden rounded-2xl border border-transparent hover:bg-foreground/3 hover:border-border/40 transition-all duration-300 p-3 sm:p-4 md:p-5 gap-4 sm:gap-6 items-start select-none cursor-pointer"
                >
                  {/* Poster Image */}
                  <div className="relative aspect-[2/3] w-20 sm:w-28 md:w-32 lg:w-36 rounded-xl overflow-hidden shadow-md ring-1 ring-border/60 shrink-0 group-hover:scale-[1.02] transition-transform duration-300 bg-foreground/5">
                    {posterPath ? (
                      <img
                        src={posterPath}
                        alt={itemTitle}
                        loading="lazy"
                        decoding="async"
                        className="object-cover w-full h-full pointer-events-none select-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-foreground/5 text-foreground/40 text-xs text-center p-2">
                        {itemTitle}
                      </div>
                    )}
                  </div>

                  {/* Content / Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-start py-0.5 sm:py-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
                        {itemTitle}
                      </h3>
                    </div>

                    {dateStr && (
                      <p className="text-xs sm:text-sm font-medium text-foreground/60 mt-1">
                        {dateStr}
                      </p>
                    )}

                    {item.overview && (
                      <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed mt-2.5 sm:mt-3 line-clamp-3 sm:line-clamp-4">
                        {item.overview}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
