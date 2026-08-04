'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Info } from 'lucide-react';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import { getMediaTitle, getMediaHref, formatRuntime } from '@/lib/utils/media-format';
import { MediaBadges } from './media-badges';
import { useTmdbMedia } from '@/hooks/media/use-tmdb-media';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useIsMobile } from '@/hooks/device/use-mobile';
import { TmdbApi } from '@/lib/api/tmdb';
import type { MediaItem, MovieDetails, TVDetails } from '@/types/media';

export interface BannerProps {
  item?: MediaItem;
  items?: MediaItem[];
  type?: 'popular' | 'trending' | 'top_rated';
  mediaType?: 'movie' | 'tv' | 'all';
  autoPlayInterval?: number;
}

export function Banner({
  item: initialItem,
  items: initialItems,
  type = 'trending',
  mediaType = 'all',
  autoPlayInterval = 9000,
}: BannerProps) {
  const { t, tmdbLanguage } = useTranslation();
  const isMobile = useIsMobile();
  const { slides, loading } = useTmdbMedia({
    type,
    mediaType,
    infinite: false,
    initialItems,
  });

  const bannerItems = React.useMemo(() => {
    return initialItems && initialItems.length > 0
      ? initialItems
      : initialItem
      ? [initialItem]
      : slides.slice(0, 8);
  }, [initialItems, initialItem, slides]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [logosMap, setLogosMap] = useState<Record<string | number, string>>({});
  const [detailsMap, setDetailsMap] = useState<Record<string | number, MovieDetails | TVDetails>>({});

  useEffect(() => {
    if (bannerItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerItems.length);
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [bannerItems.length, autoPlayInterval]);

  // Preload images, details & logos
  useEffect(() => {
    if (!bannerItems || bannerItems.length === 0) return;

    let isMounted = true;
    const isoLang = tmdbLanguage.split('-')[0];

    bannerItems.forEach((item) => {
      const backdropPath = item.backdrop_path || item.poster_path;
      if (backdropPath) {
        const img = new Image();
        img.src = getTmdbImage(backdropPath, 'original');
      }

      const itemType = (item.media_type as 'movie' | 'tv') || (mediaType !== 'all' ? mediaType : 'movie');
      
      // Preload metadata
      TmdbApi.getMediaDetails<MovieDetails | TVDetails>(itemType, item.id, tmdbLanguage)
        .then((details) => {
          if (!isMounted) return;
          if (details) {
            setDetailsMap((prev) => ({ ...prev, [item.id]: details }));
            // Preload textless poster/backdrop if available
            const textlessPoster = details.images?.posters?.find((p) => p.iso_639_1 === null)?.file_path;
            const textlessBackdrop = details.images?.backdrops?.find((b) => b.iso_639_1 === null)?.file_path;
            const targetImage = isMobile
              ? textlessPoster || details.poster_path || textlessBackdrop || details.backdrop_path
              : textlessBackdrop || details.backdrop_path || details.poster_path;
            if (targetImage) {
              const img = new Image();
              img.src = getTmdbImage(targetImage, 'original');
            }
          }
        })
        .catch(() => {});

      // Preload logos
      TmdbApi.getImages(itemType, item.id, tmdbLanguage)
        .then((res) => {
          if (!isMounted) return;
          if (res?.logos && res.logos.length > 0) {
            const matchedLogo =
              res.logos.find((l) => l.iso_639_1 === isoLang) ||
              res.logos.find((l) => l.iso_639_1 === 'en') ||
              res.logos[0];
            if (matchedLogo?.file_path) {
              const url = getTmdbImage(matchedLogo.file_path, 'w500');
              const logoImg = new Image();
              logoImg.src = url;
              setLogosMap((prev) => ({ ...prev, [item.id]: url }));
            }
          }
        })
        .catch(() => {});
    });

    return () => {
      isMounted = false;
    };
  }, [bannerItems, mediaType, tmdbLanguage]);

  const activeItem = bannerItems[currentIndex] || initialItem;

  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setImageLoaded(false);
    });
  }, [activeItem?.id]);

  if (loading && !activeItem) {
    return (
      <div className="w-full h-[80vh] min-h-[500px] lg:h-[88vh] lg:min-h-[600px] bg-background mb-1" />
    );
  }

  if (!activeItem) return null;

  const activeDetails = activeItem.id ? detailsMap[activeItem.id] : null;
  const title = getMediaTitle(activeItem);
  const textlessPoster = activeDetails?.images?.posters?.find(
    (p) => p.iso_639_1 === null
  )?.file_path;
  const textlessBackdrop = activeDetails?.images?.backdrops?.find(
    (b) => b.iso_639_1 === null
  )?.file_path;

  const selectedImagePath = isMobile
    ? textlessPoster || activeItem.poster_path || textlessBackdrop || activeItem.backdrop_path
    : textlessBackdrop || activeItem.backdrop_path || activeItem.poster_path;

  const backdropUrl = getTmdbImage(
    selectedImagePath,
    'original'
  );
  const activeLogoUrl = activeItem.id ? logosMap[activeItem.id] : null;
  const overview = (activeDetails?.overview || activeItem.overview) as string | undefined;
  const tagline = activeDetails?.tagline || activeItem.tagline;

  const itemType = (activeItem.media_type as 'movie' | 'tv') || (mediaType !== 'all' ? mediaType : 'movie');
  const href = getMediaHref(activeItem.id, itemType);

  // Metadata badges
  const rawVote = activeDetails?.vote_average ?? activeItem.vote_average;
  const voteAverage = rawVote ? rawVote.toFixed(1) : null;

  const releaseDateStr =
    activeDetails?.release_date ||
    activeItem.release_date ||
    (activeDetails as TVDetails)?.first_air_date ||
    activeItem.first_air_date;
  const releaseYear = releaseDateStr ? new Date(releaseDateStr).getFullYear() : null;

  const runtimeVal = activeDetails?.runtime ?? activeItem.runtime;
  const formattedRuntime = runtimeVal ? formatRuntime(runtimeVal) : null;

  const tvSeasons = (activeDetails as TVDetails)?.number_of_seasons ?? (activeItem as TVDetails)?.number_of_seasons;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
      className="relative w-full h-[80vh] min-h-[500px] lg:h-[88vh] lg:min-h-[600px] overflow-hidden bg-background border-none ring-0 rounded-none m-0 p-0 mb-1"
    >
      <div className="absolute inset-0 select-none">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={activeItem.id}
            src={backdropUrl}
            alt={title}
            onLoad={() => setImageLoaded(true)}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: imageLoaded ? 1 : 0, scale: imageLoaded ? 1 : 1.04 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
            className="h-full w-full object-cover object-center"
            draggable={false}
          />
        </AnimatePresence>
      </div>

      {/* Side Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/20 to-transparent w-full md:w-3/5 lg:w-1/2"></div>

      {/* Bottom Overlay */}
      <div className="absolute bottom-0 inset-x-0 h-44 sm:h-56 md:h-72 lg:h-88 pointer-events-none z-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 via-40% to-transparent" />
      </div>

      <div className={`relative z-30 flex h-full flex-col justify-end pt-24 pb-14 lg:pb-20 ${PADDING_X_CLASSES}`}>
        <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto lg:mx-0">
          {/* Logo, Badges, Tagline, Overview & Buttons */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${activeItem.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              className="space-y-3 sm:space-y-4 text-center lg:text-left flex flex-col items-center lg:items-start pb-10 lg:pb-0"
            >
              <div>
                {activeLogoUrl ? (
                  <img
                    src={activeLogoUrl}
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

              {/* Metadata Badges (Hidden on < lg) */}
              <MediaBadges
                voteAverage={voteAverage}
                releaseYear={releaseYear}
                runtime={formattedRuntime}
                numberOfSeasons={tvSeasons}
                genres={activeDetails?.genres || activeItem.genres}
                genreIds={activeItem.genre_ids}
                maxGenres={3}
                className="hidden lg:flex"
              />

              {/* Tagline (Hidden on < lg) */}
              {tagline && (
                <p className="hidden lg:block text-sm lg:text-base italic text-foreground/80 drop-shadow">
                  &ldquo;{tagline}&rdquo;
                </p>
              )}

              {/* Overview */}
              {overview && (
                <p className="text-sm lg:text-base leading-relaxed text-foreground/80 line-clamp-2 lg:line-clamp-3 max-w-xl drop-shadow text-center lg:text-left mx-auto lg:mx-0">
                  {overview}
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 w-full">
                {href ? (
                  <Link
                    href={href}
                    prefetch={false}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold shadow-none transition hover:bg-primary/90 active:scale-[0.98] text-primary-foreground cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    {t('common.watchNow', 'Watch Now')}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold shadow-none transition hover:bg-primary/90 active:scale-[0.98] text-primary-foreground cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    {t('common.watchNow', 'Watch Now')}
                  </button>
                )}

                {href ? (
                  <Link
                    href={href}
                    prefetch={false}
                    className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-medium transition hover:bg-foreground/16 active:scale-[0.98] bg-foreground/12 ring-1 ring-border backdrop-blur-2xl text-foreground/80 cursor-pointer"
                  >
                    <Info className="h-4 w-4" />
                    {t('common.moreInfo', 'More Info')}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-medium transition hover:bg-foreground/16 active:scale-[0.98] bg-foreground/12 ring-1 ring-border backdrop-blur-2xl text-foreground/80 cursor-pointer"
                  >
                    <Info className="h-4 w-4" />
                    {t('common.moreInfo', 'More Info')}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Indicators */}
          {bannerItems.length > 1 && (
            <div className="absolute bottom-3.5 inset-x-0 lg:inset-x-auto lg:bottom-6 lg:right-14 z-30 flex items-center justify-center lg:justify-start gap-2">
              {bannerItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`${t('carousel.goToSlide', 'Go to slide')} ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? 'w-7 bg-foreground'
                      : 'w-2 bg-foreground/40 hover:bg-foreground/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Banner;

