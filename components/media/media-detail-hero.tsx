'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Film, Bookmark, CloudDownload } from 'lucide-react';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { Skeleton } from '@/components/ui';
import { MediaBadges } from './media-badges';
import { PlayButton } from './play-button';
import { useTranslation } from '@/hooks/ui/use-translation';
import type { JellyfinBaseItem } from '@/types/jellyfin';

export interface MediaDetailHeroProps {
  title: string;
  backdropUrl: string;
  logoUrl?: string | null;
  tagline?: string | null;
  overview?: string | null;
  voteAverage?: string | null;
  releaseYear?: number | string | null;
  runtime?: string | null;
  genres?: { id: number; name: string }[];
  genreIds?: number[];
  isPosterFallback?: boolean;
  isChecking?: boolean;
  isAvailable?: boolean;
  jellyfinItem?: JellyfinBaseItem | null;
  trailerKey?: string | null;
  onWatchNow: () => void;
  onWatchTrailer?: () => void;
  onAddToWatchlist?: () => void;
}

export function MediaDetailHero({
  title,
  backdropUrl,
  logoUrl,
  tagline,
  overview,
  voteAverage,
  releaseYear,
  runtime,
  genres,
  genreIds,
  isPosterFallback = false,
  isChecking = false,
  isAvailable = false,
  jellyfinItem,
  trailerKey,
  onWatchNow,
  onWatchTrailer,
  onAddToWatchlist,
}: MediaDetailHeroProps) {
  const { t } = useTranslation();

  return (
    <>
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
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/20 to-transparent w-full md:w-3/5 lg:w-1/2" />
      </div>

      <div className="relative z-10 w-full h-[80vh] min-h-[500px] lg:h-[88vh] lg:min-h-[600px]">
        <div className={`relative z-20 flex h-full flex-col justify-end pt-24 pb-14 lg:pb-20 ${PADDING_X_CLASSES}`}>
          <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl text-center lg:text-left space-y-3 sm:space-y-4 mx-auto lg:mx-0 flex flex-col items-center lg:items-start pb-10 lg:pb-0">
            <div>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={title}
                  className="max-h-24 sm:max-h-36 md:max-h-48 lg:max-h-56 w-auto max-w-[260px] sm:max-w-[400px] lg:max-w-[500px] object-contain mx-auto lg:mx-0 drop-shadow-lg"
                  draggable={false}
                />
              ) : (
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground drop-shadow-lg line-clamp-2 text-center lg:text-left">
                  {title}
                </h1>
              )}
            </div>

            <MediaBadges
              voteAverage={voteAverage}
              releaseYear={releaseYear}
              runtime={runtime}
              genres={genres}
              genreIds={genreIds}
              className="hidden lg:flex"
            />

            {tagline && (
              <p className="hidden lg:block text-sm lg:text-base italic text-foreground/80 drop-shadow text-center lg:text-left">
                &ldquo;{tagline}&rdquo;
              </p>
            )}

            {overview && (
              <p className="text-sm lg:text-base leading-relaxed text-foreground/80 line-clamp-2 lg:line-clamp-3 max-w-xl drop-shadow text-center lg:text-left mx-auto lg:mx-0">
                {overview}
              </p>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 w-full">
              {isChecking ? (
                <Skeleton className="h-9 w-28 rounded-xl bg-foreground/10" />
              ) : isAvailable ? (
                <PlayButton jellyfinItem={jellyfinItem} onClick={onWatchNow} />
              ) : (
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold shadow-none transition hover:bg-primary/90 active:scale-[0.98] text-primary-foreground cursor-pointer"
                >
                  <CloudDownload className="h-4 w-4" />
                  {t('common.request', 'Request')}
                </button>
              )}

              {trailerKey && onWatchTrailer && (
                <button
                  type="button"
                  onClick={onWatchTrailer}
                  className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-medium transition hover:bg-foreground/16 active:scale-[0.98] bg-foreground/12 ring-1 ring-border backdrop-blur-2xl text-foreground/80 cursor-pointer"
                >
                  <Film className="h-4 w-4 text-red-400" />
                  {t('movies.watchTrailer', 'Watch Trailer')}
                </button>
              )}

              <button
                type="button"
                onClick={onAddToWatchlist}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/12 ring-1 ring-border backdrop-blur-2xl text-foreground/80 hover:bg-foreground/16 active:scale-[0.98] transition cursor-pointer"
                aria-label={t('common.addToWatchlist', 'Add to watchlist')}
              >
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
