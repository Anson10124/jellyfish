'use client';

import React, { useState, useEffect, use } from 'react';
import { ArrowLeft } from 'lucide-react';
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
import { formatLanguageName } from '@/lib/utils/language';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useMediaDetails } from '@/hooks/media/use-media-details';
import { useTvSeasonCredits } from '@/hooks/media/use-tv-season-credits';
import { useJellyfinAvailability } from '@/hooks/media/use-jellyfin-availability';
import { usePlayer } from '@/hooks/player/use-player';
import { useServerConfig } from '@/hooks/connect/use-server-config';
import { JellyfinService } from '@/services/jellyfin.service';
import type { JellyfinBaseItem } from '@/types/jellyfin';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import {
  CastCarousel,
  Carousel,
  SeasonCarousel,
  EpisodeCarousel,
  MediaDetailHero,
  MediaFactsGrid,
  JellyfinMediaInfo,
} from '@/components/media';
import { TrailerModal, VideoPlayerModal } from '@/components/player';
import { useIsMobile } from '@/hooks/device/use-mobile';
import type { Episode, TVDetails } from '@/types/media';

interface TvDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TvDetailPage({ params }: TvDetailPageProps) {
  const resolvedParams = use(params);
  const tvId = resolvedParams.id;
  const { t, formatDate, locale } = useTranslation();
  const isMobile = useIsMobile();
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

  const { jellyfinConfig } = useServerConfig();
  const [episodes, setEpisodes] = useState<JellyfinBaseItem[]>([]);

  useEffect(() => {
    if (!jellyfinConfig || !isAvailable || !jellyfinItem || jellyfinItem.Type !== 'Series') {
      return;
    }

    let isMounted = true;

    JellyfinService.getEpisodesForSeries(
      jellyfinConfig.serverUrl,
      jellyfinConfig.userId,
      jellyfinConfig.accessToken,
      jellyfinItem.Id!
    )
      .then((eps) => {
        if (isMounted) {
          setEpisodes(eps);
        }
      })
      .catch((err) => {
        console.warn('Failed to load episodes for series watch status:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [jellyfinConfig, isAvailable, jellyfinItem]);

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

  const seasons = React.useMemo(() => {
    return sortSeasons(tvShow?.seasons);
  }, [tvShow?.seasons]);

  const activeSeasonNumber =
    selectedSeasonNumber !== null
      ? selectedSeasonNumber
      : seasons.length > 0
        ? seasons[0].season_number
        : null;

  const selectedSeason = seasons.find((s) => s.season_number === activeSeasonNumber);

  const { credits: seasonCredits } = useTvSeasonCredits(tvId, activeSeasonNumber);

  const castList = React.useMemo(() => {
    if (seasonCredits && ((seasonCredits.cast && seasonCredits.cast.length > 0) || (seasonCredits.crew && seasonCredits.crew.length > 0))) {
      return processCastAndCrew(seasonCredits, 16);
    }
    return processCastAndCrew(tvShow?.credits, 16);
  }, [seasonCredits, tvShow?.credits]);

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
  const textlessPoster = tvShow.images?.posters?.find((p) => p.iso_639_1 === null)?.file_path;
  const textlessBackdrop = tvShow.images?.backdrops?.find((b) => b.iso_639_1 === null)?.file_path;

  const rawBackdrop =
    textlessBackdrop ||
    (tvShow.images?.backdrops && tvShow.images.backdrops.length > 0
      ? tvShow.images.backdrops[0].file_path
      : tvShow.backdrop_path);

  const rawPoster = textlessPoster || tvShow.poster_path;
  const selectedImagePath = isMobile ? rawPoster || rawBackdrop : rawBackdrop || tvShow.poster_path;
  const backdropUrl = getTmdbImage(selectedImagePath, 'original');
  const isPosterFallback = !isMobile && !rawBackdrop && !!tvShow.poster_path;
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

  const factItems = [
    tvShow.first_air_date
      ? {
          key: 'first-air-date',
          label: t('tv.firstAirDate', 'First Air Date'),
          value: formatDate(tvShow.first_air_date),
        }
      : null,
    tvShow.last_air_date
      ? {
          key: 'last-air-date',
          label: t('tv.lastAirDate', 'Last Air Date'),
          value: formatDate(tvShow.last_air_date),
        }
      : null,
    tvShow.number_of_seasons !== undefined
      ? {
          key: 'seasons-count',
          label: t('tv.numberOfSeasons', 'Seasons'),
          value: tvShow.number_of_seasons,
        }
      : null,
    tvShow.number_of_episodes !== undefined
      ? {
          key: 'episodes-count',
          label: t('tv.numberOfEpisodes', 'Total Episodes'),
          value: tvShow.number_of_episodes,
        }
      : null,
    tvShow.status
      ? {
          key: 'status',
          label: t('movies.status', 'Status'),
          value: tvShow.status,
        }
      : null,
    countryOfOrigin
      ? {
          key: 'country',
          label: t('movies.countryOfOrigin', 'Country of Origin'),
          value: countryOfOrigin,
        }
      : null,
    tvShow.original_language
      ? {
          key: 'language',
          label: t('movies.originalLanguage', 'Original Language'),
          value: formatLanguageName(tvShow.original_language, null, locale),
        }
      : null,
    networks
      ? {
          key: 'networks',
          label: t('tv.networks', 'Networks'),
          value: networks,
        }
      : null,
  ];

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <MediaDetailHero
        title={title}
        backdropUrl={backdropUrl}
        logoUrl={logoUrl}
        tagline={tvShow.tagline}
        overview={tvShow.overview}
        voteAverage={voteAverage}
        releaseYear={formattedAirYears}
        runtime={episodeRuntime}
        genres={tvShow.genres}
        genreIds={tvShow.genre_ids}
        isPosterFallback={isPosterFallback}
        isChecking={isChecking}
        isAvailable={isAvailable}
        jellyfinItem={jellyfinItem}
        trailerKey={trailerKey}
        onWatchNow={handlePlaySeries}
        onWatchTrailer={playTrailer}
      />

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
              subtitle={selectedSeason?.name}
              cast={castList}
            />
          </section>
        )}

        {/* Facts */}
        <MediaFactsGrid items={factItems} title={t('movies.details', 'Details')} />

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

        {/* Jellyfin Media Info & Languages */}
        {isAvailable && (
          <section className={`relative z-10 ${PADDING_X_CLASSES} pb-12`}>
            <JellyfinMediaInfo item={jellyfinItem} fallbackMediaSource={episodes?.[0]?.MediaSources?.[0]} />
          </section>
        )}
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
