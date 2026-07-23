'use client';

import React, { useState, use } from 'react';
import { motion } from 'motion/react';
import { Play, Film, Star, Clock, Calendar, Bookmark, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import {
  getMediaTitle,
  formatRuntime,
  formatCurrency,
  processCastAndCrew,
} from '@/lib/utils/media-format';
import { getGenreName } from '@/constants/genres';
import { useTranslation } from '@/hooks/use-translation';
import { useMediaDetails } from '@/hooks/use-media-details';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import CastCarousel from '@/components/media/cast-carousel';
import Carousel from '@/components/media/carousel';
import TrailerModal from '@/components/player/trailer-modal';
import type { MovieDetails } from '@/types/media';

interface MovieDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MovieDetailPage({ params }: MovieDetailPageProps) {
  const resolvedParams = use(params);
  const movieId = resolvedParams.id;
  const { t } = useTranslation();
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const { media: movie, logoUrl, trailerKey, loading } = useMediaDetails<MovieDetails>(
    movieId,
    'movie'
  );

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#121215] text-white">
        <div className="w-full h-[65vh] sm:h-[75vh] md:h-[82vh] lg:h-[88vh] bg-white/5">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-white">
        <h2 className="text-2xl font-bold">Movie not found</h2>
        <Link
          href="/movie"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back', 'Back to Movies')}
        </Link>
      </div>
    );
  }

  const title = getMediaTitle(movie);
  const rawBackdrop =
    movie.images?.backdrops && movie.images.backdrops.length > 0
      ? movie.images.backdrops[0].file_path
      : movie.backdrop_path;

  const backdropUrl = getTmdbImage(rawBackdrop || movie.poster_path, 'original');
  const isPosterFallback = !rawBackdrop && !!movie.poster_path;
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const formattedRuntime = formatRuntime(movie.runtime);
  const formattedBudget = formatCurrency(movie.budget);
  const formattedRevenue = formatCurrency(movie.revenue);

  const countryOfOrigin =
    movie.production_countries && movie.production_countries.length > 0
      ? movie.production_countries.map((c) => c.name).join(' & ')
      : movie.origin_country && movie.origin_country.length > 0
      ? movie.origin_country.join(', ')
      : null;

  const voteAverage = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const castList = processCastAndCrew(movie.credits, 16);

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-[#121215] text-white">
      <div className="fixed inset-0 h-screen w-screen select-none pointer-events-none z-0 overflow-hidden">
        <motion.img
          src={backdropUrl}
          alt={title}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          className={`h-full w-full object-cover object-center ${
            isPosterFallback ? 'blur-2xl opacity-35 scale-110' : ''
          }`}
          draggable={false}
        />
        {/* Side Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#121215]/70 via-[#121215]/20 to-transparent w-full md:w-3/5 lg:w-1/2" />
      </div>

      <div className="relative z-10 w-full h-[65vh] sm:h-[75vh] md:h-[82vh] lg:h-[88vh]">
        <div className={`relative z-20 flex h-full flex-col justify-end pb-12 sm:pb-16 md:pb-20 ${PADDING_X_CLASSES}`}>
          <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl text-left space-y-3 sm:space-y-4">
            <div>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={title}
                  className="max-h-28 sm:max-h-36 md:max-h-48 lg:max-h-56 w-auto max-w-[290px] sm:max-w-[400px] md:max-w-[500px] object-contain object-left drop-shadow-[0_8px_18px_rgba(0,0,0,0.95)]"
                  draggable={false}
                />
              ) : (
                <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl line-clamp-2">
                  {title}
                </h1>
              )}
            </div>

            {movie.tagline && (
              <p className="text-sm sm:text-base italic text-white/80 drop-shadow">
                &ldquo;{movie.tagline}&rdquo;
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-medium text-white/90">
              {voteAverage && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{voteAverage}</span>
                </div>
              )}

              {releaseYear && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 ring-1 ring-white/15">
                  <Calendar className="h-3.5 w-3.5 text-white/70" />
                  <span>{releaseYear}</span>
                </div>
              )}

              {formattedRuntime && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 ring-1 ring-white/15">
                  <Clock className="h-3.5 w-3.5 text-white/70" />
                  <span>{formattedRuntime}</span>
                </div>
              )}

              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {movie.genres.map((g) => (
                    <span
                      key={g.id}
                      className="px-2.5 py-1 rounded-md bg-white/10 text-white/80 ring-1 ring-white/10 text-xs"
                    >
                      {getGenreName(g.id, t) || g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {movie.overview && (
              <p className="text-xs sm:text-sm md:text-base leading-relaxed text-white/75 line-clamp-2 md:line-clamp-3 max-w-xl drop-shadow">
                {movie.overview}
              </p>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-[13px] bg-white/[0.92] px-4 text-[13px] font-semibold shadow-none transition hover:bg-white active:scale-[0.98] text-[#111111] cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                {t('common.watchNow', 'Watch Now')}
              </button>

              {trailerKey && (
                <button
                  type="button"
                  onClick={() => setIsTrailerOpen(true)}
                  className="inline-flex h-9 items-center gap-2 rounded-[13px] px-4 text-[13px] font-medium transition hover:bg-white/[0.16] active:scale-[0.98] bg-white/[0.12] ring-1 ring-white/[0.08] backdrop-blur-[32px] text-white/[0.78] cursor-pointer"
                >
                  <Film className="h-4 w-4 text-red-400" />
                  {t('movies.watchTrailer', 'Watch Trailer')}
                </button>
              )}

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[13px] bg-white/[0.12] ring-1 ring-white/[0.08] backdrop-blur-[32px] text-white/[0.78] hover:bg-white/[0.16] active:scale-[0.98] transition cursor-pointer"
                aria-label="Add to watchlist"
              >
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full min-h-screen bg-[#121215]/65 backdrop-blur-2xl space-y-10 pt-4 border-t border-white/10 rounded-tl-2xl rounded-tr-2xl">

        {/* Cast */}
        {castList.length > 0 && (
          <section className="relative z-10">
            <CastCarousel
              title={t('movies.castcrew', 'Cast & Crew')}
              cast={castList}
            />
          </section>
        )}

        {/* Facts */}
        <section className={`relative z-10 ${PADDING_X_CLASSES}`}>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mb-4">
            {t('movies.details', 'Details')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 text-xs sm:text-sm">
            {movie.release_date && (
              <div>
                <p className="text-white/50 font-medium">{t('movies.releaseDate', 'Release Date')}</p>
                <p className="text-white/90 font-semibold mt-1">{movie.release_date}</p>
              </div>
            )}
            {countryOfOrigin && (
              <div>
                <p className="text-white/50 font-medium">{t('movies.countryOfOrigin', 'Country of Origin')}</p>
                <p className="text-white/90 font-semibold mt-1">{countryOfOrigin}</p>
              </div>
            )}
            {movie.original_language && (
              <div>
                <p className="text-white/50 font-medium">{t('movies.originalLanguage', 'Original Language')}</p>
                <p className="text-white/90 font-semibold mt-1 uppercase">{movie.original_language}</p>
              </div>
            )}
            {formattedBudget && (
              <div>
                <p className="text-white/50 font-medium">{t('movies.budget', 'Budget')}</p>
                <p className="text-white/90 font-semibold mt-1">{formattedBudget}</p>
              </div>
            )}
            {formattedRevenue && (
              <div>
                <p className="text-white/50 font-medium">{t('movies.revenue', 'Revenue')}</p>
                <p className="text-white/90 font-semibold mt-1">{formattedRevenue}</p>
              </div>
            )}
          </div>
        </section>

        {/* Similar & Recommended */}
        <div className="relative z-10 space-y-8">
          {movie.recommendations?.results && movie.recommendations.results.length > 0 && (
            <Carousel
              title={t('movies.recommendations', 'Recommended for You')}
              mediaType="movie"
              items={movie.recommendations.results}
              infinite={false}
            />
          )}

          {movie.similar?.results && movie.similar.results.length > 0 && (
            <Carousel
              title={t('movies.similarMovies', 'Similar Movies')}
              mediaType="movie"
              items={movie.similar.results}
              infinite={false}
            />
          )}
        </div>
      </div>

      {/* Trailer Player */}
      {trailerKey && (
        <TrailerModal
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
          videoKey={trailerKey}
          title={title}
        />
      )}
    </main>
  );
}
