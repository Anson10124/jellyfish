'use client';

import React, { useState, use } from 'react';
import { motion } from 'motion/react';
import { Play, Film, Bookmark, ArrowLeft, CloudDownload } from 'lucide-react';
import Link from 'next/link';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import {
  getMediaTitle,
  formatRuntime,
  processCastAndCrew,
  formatCountryOfOrigin,
  formatAirYears,
  sortSeasons,
} from '@/lib/utils/media-format';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useMediaDetails } from '@/hooks/media/use-media-details';
import { useJellyfinAvailability } from '@/hooks/media/use-jellyfin-availability';
import { usePlayer } from '@/hooks/player/use-player';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { Skeleton } from '@/components/ui';
import { CastCarousel, Carousel, SeasonCarousel, EpisodeCarousel, MediaBadges } from '@/components/media';
import { TrailerModal, VideoPlayerModal } from '@/components/player';
import type { Episode, TVDetails } from '@/types/media';

interface TvDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TvDetailPage({ params }: TvDetailPageProps) {
  const resolvedParams = use(params);
  const tvId = resolvedParams.id;
  const { t, formatDate } = useTranslation();
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);

  const {
    activeVideo,
    isTrailerOpen,
    playMovie,
    playEpisode,
    closeVideo,
    playTrailer,
    closeTrailer,
  } = usePlayer();

  const { media: tvShow, logoUrl, trailerKey, loading } = useMediaDetails<TVDetails>(
    tvId,
    'tv'
  );

  const { isAvailable, isChecking, jellyfinItem } = useJellyfinAvailability({
    id: tvId,
    title: tvShow?.name || tvShow?.original_name,
    year: tvShow?.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : null,
    mediaType: 'tv',
  });

  const handlePlaySeries = () => {
    playMovie({
      jellyfinItem,
      title: tvShow?.name || tvShow?.original_name || 'TV Show',
      posterUrl: getTmdbImage(tvShow?.backdrop_path || tvShow?.poster_path, 'original'),
    });
  };

  const handlePlayEpisode = (episode: Episode) => {
    playEpisode({
      jellyfinItem,
      seriesTitle: tvShow?.name || 'TV Show',
      episode,
      posterUrl: tvShow?.backdrop_path,
    });
  };

  const hasMissingEpisodes = React.useMemo(() => {
    if (!isAvailable || !jellyfinItem || !tvShow) return true;
    if (jellyfinItem.RecursiveItemCount !== undefined && tvShow.number_of_episodes !== undefined) {
      return jellyfinItem.RecursiveItemCount < tvShow.number_of_episodes;
    }
    return false;
  }, [isAvailable, jellyfinItem, tvShow]);

  const seasons = React.useMemo(() => {
    return sortSeasons(tvShow?.seasons);
  }, [tvShow?.seasons]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-background text-foreground">
        <div className="w-full h-[80vh] min-h-[500px] sm:h-[80vh] sm:min-h-[560px] md:h-[82vh] lg:h-[88vh] bg-background" />
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-foreground">
        <h2 className="text-2xl font-bold">{t('tv.tvShowNotFound', 'TV Show not found')}</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-sm font-semibold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back', 'Back')}
        </Link>
      </div>
    );
  }

  const title = getMediaTitle(tvShow);
  const rawBackdrop =
    tvShow.images?.backdrops && tvShow.images.backdrops.length > 0
      ? tvShow.images.backdrops[0].file_path
      : tvShow.backdrop_path;

  const backdropUrl = getTmdbImage(rawBackdrop || tvShow.poster_path, 'original');
  const isPosterFallback = !rawBackdrop && !!tvShow.poster_path;
  const formattedAirYears = formatAirYears(tvShow.first_air_date, tvShow.last_air_date);

  const episodeRuntime =
    tvShow.episode_run_time && tvShow.episode_run_time.length > 0
      ? formatRuntime(tvShow.episode_run_time[0])
      : null;

  const countryOfOrigin = formatCountryOfOrigin(tvShow);

  const networks =
    tvShow.networks && tvShow.networks.length > 0
      ? tvShow.networks.map((n) => n.name).join(', ')
      : null;

  const voteAverage = tvShow.vote_average ? tvShow.vote_average.toFixed(1) : null;
  const castList = processCastAndCrew(tvShow.credits, 16);

  const activeSeasonNumber =
    selectedSeasonNumber !== null
      ? selectedSeasonNumber
      : seasons.length > 0
        ? seasons[0].season_number
        : null;

  const selectedSeason = seasons.find((s) => s.season_number === activeSeasonNumber);

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <div className="fixed inset-0 h-screen w-screen select-none pointer-events-none z-0 overflow-hidden">
        <motion.img
          src={backdropUrl}
          alt={title}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          className={`h-full w-full object-cover object-center ${isPosterFallback ? 'blur-2xl opacity-35 scale-110' : ''
            }`}
          draggable={false}
        />
        {/* Side Overlay */}
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
              formattedAirYears={formattedAirYears}
              numberOfSeasons={tvShow.number_of_seasons}
              runtime={episodeRuntime}
              genres={tvShow.genres}
              genreIds={tvShow.genre_ids}
              className="hidden lg:flex"
            />
            
            {tvShow.tagline && (
              <p className="hidden lg:block text-sm lg:text-base italic text-foreground/80 drop-shadow text-center lg:text-left">
                &ldquo;{tvShow.tagline}&rdquo;
              </p>
            )}

            {tvShow.overview && (
              <p className="text-sm lg:text-base leading-relaxed text-foreground/80 line-clamp-2 lg:line-clamp-3 max-w-xl drop-shadow text-center lg:text-left mx-auto lg:mx-0">
                {tvShow.overview}
              </p>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 w-full">
              {isChecking ? (
                <Skeleton className="h-9 w-28 rounded-xl bg-foreground/10" />
              ) : isAvailable ? (
                <>
                  <button
                    type="button"
                    onClick={handlePlaySeries}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold shadow-none transition hover:bg-primary/90 active:scale-[0.98] text-primary-foreground cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    {t('common.watchNow', 'Watch Now')}
                  </button>

                  {hasMissingEpisodes && (
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-medium transition hover:bg-foreground/16 active:scale-[0.98] bg-foreground/12 ring-1 ring-border backdrop-blur-2xl text-foreground/80 cursor-pointer"
                    >
                      <CloudDownload className="h-4 w-4 text-foreground" />
                      {t('common.requestMore', 'Request More')}
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold shadow-none transition hover:bg-primary/90 active:scale-[0.98] text-primary-foreground cursor-pointer"
                >
                  <CloudDownload className="h-4 w-4" />
                  {t('common.request', 'Request')}
                </button>
              )}

              {trailerKey && (
                <button
                  type="button"
                  onClick={playTrailer}
                  className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-medium transition hover:bg-foreground/16 active:scale-[0.98] bg-foreground/12 ring-1 ring-border backdrop-blur-2xl text-foreground/80 cursor-pointer"
                >
                  <Film className="h-4 w-4 text-red-400" />
                  {t('movies.watchTrailer', 'Watch Trailer')}
                </button>
              )}

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/12 ring-1 ring-border backdrop-blur-2xl text-foreground/80 hover:bg-foreground/16 active:scale-[0.98] transition cursor-pointer"
                aria-label="Add to watchlist"
              >
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full min-h-screen bg-background/65 backdrop-blur-2xl space-y-10 pt-4 border-t border-border">

        {/* Season & Episodes */}
        {seasons.length > 0 && (
          <section className="relative z-10 space-y-6">
            <SeasonCarousel
              title={t('tv.seasons', 'Seasons')}
              seasons={seasons}
              selectedSeasonNumber={activeSeasonNumber ?? undefined}
              onSelectSeason={(seasonNum) => setSelectedSeasonNumber(seasonNum)}
            />

            {/* Episodes Carousel */}
            {selectedSeason && (
              <div className="pt-2">
                <EpisodeCarousel
                  tvId={tvId}
                  season={selectedSeason}
                  onPlayEpisode={handlePlayEpisode}
                />
              </div>
            )}
          </section>
        )}

        {/* Cast & Crew */}
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
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground mb-4">
            {t('movies.details', 'Details')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 text-xs sm:text-sm">
            {tvShow.first_air_date && (
              <div>
                <p className="text-foreground/50 font-medium">{t('tv.firstAirDate', 'First Air Date')}</p>
                <p className="text-foreground/90 font-semibold mt-1">{formatDate(tvShow.first_air_date)}</p>
              </div>
            )}
            {tvShow.last_air_date && (
              <div>
                <p className="text-foreground/50 font-medium">{t('tv.lastAirDate', 'Last Air Date')}</p>
                <p className="text-foreground/90 font-semibold mt-1">{formatDate(tvShow.last_air_date)}</p>
              </div>
            )}
            {tvShow.number_of_seasons !== undefined && (
              <div>
                <p className="text-foreground/50 font-medium">{t('tv.numberOfSeasons', 'Seasons')}</p>
                <p className="text-foreground/90 font-semibold mt-1">{tvShow.number_of_seasons}</p>
              </div>
            )}
            {tvShow.number_of_episodes !== undefined && (
              <div>
                <p className="text-foreground/50 font-medium">{t('tv.numberOfEpisodes', 'Total Episodes')}</p>
                <p className="text-foreground/90 font-semibold mt-1">{tvShow.number_of_episodes}</p>
              </div>
            )}
            {tvShow.status && (
              <div>
                <p className="text-foreground/50 font-medium">{t('movies.status', 'Status')}</p>
                <p className="text-foreground/90 font-semibold mt-1">{tvShow.status}</p>
              </div>
            )}
            {countryOfOrigin && (
              <div>
                <p className="text-foreground/50 font-medium">{t('movies.countryOfOrigin', 'Country of Origin')}</p>
                <p className="text-foreground/90 font-semibold mt-1">{countryOfOrigin}</p>
              </div>
            )}
            {tvShow.original_language && (
              <div>
                <p className="text-foreground/50 font-medium">{t('movies.originalLanguage', 'Original Language')}</p>
                <p className="text-foreground/90 font-semibold mt-1 uppercase">{tvShow.original_language}</p>
              </div>
            )}
            {networks && (
              <div>
                <p className="text-foreground/50 font-medium">{t('tv.networks', 'Networks')}</p>
                <p className="text-foreground/90 font-semibold mt-1">{networks}</p>
              </div>
            )}
          </div>
        </section>

        {/* Similar & Recommended */}
        <div className="relative z-10 space-y-8">
          {tvShow.recommendations?.results && tvShow.recommendations.results.length > 0 && (
            <Carousel
              title={t('movies.recommendations', 'Recommended for You')}
              mediaType="tv"
              items={tvShow.recommendations.results}
              infinite={false}
            />
          )}

          {tvShow.similar?.results && tvShow.similar.results.length > 0 && (
            <Carousel
              title={t('tv.similarTvShows', 'Similar TV Shows')}
              mediaType="tv"
              items={tvShow.similar.results}
              infinite={false}
            />
          )}
        </div>
      </div>

      {/* Trailer Player */}
      {trailerKey && (
        <TrailerModal
          isOpen={isTrailerOpen}
          onClose={closeTrailer}
          videoKey={trailerKey}
          title={title}
        />
      )}

      {/* Video Player Modal */}
      <VideoPlayerModal activeVideo={activeVideo} onClose={closeVideo} />
    </main>
  );
}
