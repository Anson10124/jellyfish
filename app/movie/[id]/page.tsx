'use client';

import React, { use } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import {
  getMediaTitle,
  formatRuntime,
  formatCurrency,
  processCastAndCrew,
  formatCountryOfOrigin,
} from '@/lib/utils/media-format';
import { formatLanguageName } from '@/lib/utils/language';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useMediaDetails } from '@/hooks/media/use-media-details';
import { useJellyfinAvailability } from '@/hooks/media/use-jellyfin-availability';
import { usePlayer } from '@/hooks/player/use-player';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import {
  CastCarousel,
  Carousel,
  CollectionCarousel,
  MediaDetailHero,
  MediaFactsGrid,
  JellyfinMediaInfo,
} from '@/components/media';
import { TrailerModal, VideoPlayerModal } from '@/components/player';
import { useIsMobile } from '@/hooks/device/use-mobile';
import type { MovieDetails } from '@/types/media';

interface MovieDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MovieDetailPage({ params }: MovieDetailPageProps) {
  const resolvedParams = use(params);
  const movieId = resolvedParams.id;
  const { t, formatDate, locale } = useTranslation();
  const isMobile = useIsMobile();

  const {
    activeVideo,
    isTrailerOpen,
    playMovie,
    closeVideo,
    playTrailer,
    closeTrailer,
  } = usePlayer();

  const { media: movie, logoUrl, trailerKey, loading } = useMediaDetails<MovieDetails>(
    movieId,
    'movie'
  );

  const { isAvailable, isChecking, jellyfinItem } = useJellyfinAvailability({
    id: movieId,
    title: movie?.title || movie?.name,
    year: movie?.release_date ? new Date(movie.release_date).getFullYear() : null,
    mediaType: 'movie',
  });

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-background text-foreground">
        <div className="w-full h-[80vh] min-h-[500px] sm:h-[80vh] sm:min-h-[560px] md:h-[82vh] lg:h-[88vh] bg-background" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-foreground">
        <h2 className="text-2xl font-bold">{t('movies.movieNotFound', 'Movie not found')}</h2>
        <Link
          href="/movie"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-sm font-semibold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('movies.backToMovies', 'Back to Movies')}
        </Link>
      </div>
    );
  }

  const title = getMediaTitle(movie);
  const textlessPoster = movie.images?.posters?.find((p) => p.iso_639_1 === null)?.file_path;
  const textlessBackdrop = movie.images?.backdrops?.find((b) => b.iso_639_1 === null)?.file_path;

  const rawBackdrop =
    textlessBackdrop ||
    (movie.images?.backdrops && movie.images.backdrops.length > 0
      ? movie.images.backdrops[0].file_path
      : movie.backdrop_path);

  const rawPoster = textlessPoster || movie.poster_path;
  const selectedImagePath = isMobile ? rawPoster || rawBackdrop : rawBackdrop || movie.poster_path;
  const backdropUrl = getTmdbImage(selectedImagePath, 'original');
  const isPosterFallback = !isMobile && !rawBackdrop && !!movie.poster_path;
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const formattedRuntime = formatRuntime(movie.runtime);
  const formattedBudget = formatCurrency(movie.budget);
  const formattedRevenue = formatCurrency(movie.revenue);
  const countryOfOrigin = formatCountryOfOrigin(movie);
  const voteAverage = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const castList = processCastAndCrew(movie.credits, 16);

  const handleWatchNow = () => {
    playMovie({
      jellyfinItem,
      title,
      posterUrl: backdropUrl,
    });
  };

  const factItems = [
    movie.release_date
      ? {
          key: 'release-date',
          label: t('movies.releaseDate', 'Release Date'),
          value: formatDate(movie.release_date),
        }
      : null,
    countryOfOrigin
      ? {
          key: 'country',
          label: t('movies.countryOfOrigin', 'Country of Origin'),
          value: countryOfOrigin,
        }
      : null,
    movie.original_language
      ? {
          key: 'language',
          label: t('movies.originalLanguage', 'Original Language'),
          value: formatLanguageName(movie.original_language, null, locale),
        }
      : null,
    formattedBudget
      ? {
          key: 'budget',
          label: t('movies.budget', 'Budget'),
          value: formattedBudget,
        }
      : null,
    formattedRevenue
      ? {
          key: 'revenue',
          label: t('movies.revenue', 'Revenue'),
          value: formattedRevenue,
        }
      : null,
  ];

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <MediaDetailHero
        title={title}
        backdropUrl={backdropUrl}
        logoUrl={logoUrl}
        tagline={movie.tagline}
        overview={movie.overview}
        voteAverage={voteAverage}
        releaseYear={releaseYear}
        runtime={formattedRuntime}
        genres={movie.genres}
        genreIds={movie.genre_ids}
        isPosterFallback={isPosterFallback}
        isChecking={isChecking}
        isAvailable={isAvailable}
        jellyfinItem={jellyfinItem}
        trailerKey={trailerKey}
        onWatchNow={handleWatchNow}
        onWatchTrailer={playTrailer}
      />

      <div className="relative z-20 w-full min-h-screen bg-background/65 backdrop-blur-2xl space-y-10 pt-4 border-t border-border">
        {/* Cast */}
        {castList.length > 0 && (
          <section className="relative z-10">
            <CastCarousel title={t('movies.castcrew', 'Cast & Crew')} cast={castList} />
          </section>
        )}

        {/* Facts */}
        <MediaFactsGrid items={factItems} title={t('movies.details', 'Details')} />

        {/* Collection */}
        {movie.belongs_to_collection && (
          <CollectionCarousel
            collectionId={movie.belongs_to_collection.id}
            collectionName={movie.belongs_to_collection.name}
          />
        )}

        {/* Similar & Recommended */}
        <div className="relative z-10 space-y-8">
          {movie.recommendations?.results && movie.recommendations.results.length > 0 && (
            <Carousel
              title={t('movies.recommendations', 'You may also like')}
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

        {/* Jellyfin Media Info */}
        {isAvailable && (
          <section className={`relative z-10 ${PADDING_X_CLASSES} pb-12`}>
            <JellyfinMediaInfo item={jellyfinItem} />
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
