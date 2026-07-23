'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Info } from 'lucide-react';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import { getMediaTitle } from '@/lib/utils/media-format';
import { useTmdbMedia } from '@/hooks/use-tmdb-media';
import { useTranslation } from '@/hooks/use-translation';
import { TmdbApi } from '@/lib/api/tmdb';
import { Skeleton } from '@/components/ui/skeleton';
import type { MediaItem } from '@/types/media';

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

  useEffect(() => {
    if (bannerItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerItems.length);
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [bannerItems.length, autoPlayInterval]);

  // Preload images & logos in active target language
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

  if (loading && !activeItem) {
    return (
      <div className="w-full h-[65vh] sm:h-[75vh] md:h-[82vh] lg:h-[88vh] bg-white/5 mb-1">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    );
  }

  if (!activeItem) return null;

  const title = getMediaTitle(activeItem);
  const backdropUrl = getTmdbImage(
    activeItem.backdrop_path || activeItem.poster_path,
    'original'
  );
  const activeLogoUrl = activeItem.id ? logosMap[activeItem.id] : null;
  const overview = activeItem.overview as string | undefined;

  return (
    <div className="relative w-full h-[65vh] sm:h-[75vh] md:h-[82vh] lg:h-[88vh] overflow-hidden bg-[#121215] border-none ring-0 rounded-none m-0 p-0 mb-1">
      <div className="absolute inset-0 select-none">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={activeItem.id}
            src={backdropUrl}
            alt={title}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
            className="h-full w-full object-cover object-center"
            draggable={false}
          />
        </AnimatePresence>
      </div>

      {/* Side Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#121215]/80 via-[#121215]/30 to-transparent w-full md:w-3/5 lg:w-1/2 z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#121215]/40 via-transparent to-transparent h-32 z-10" />

      {/* Bottom Overlay */}
      <div className="absolute bottom-0 inset-x-0 h-44 sm:h-56 md:h-72 lg:h-88 pointer-events-none z-20 overflow-hidden">
        {/* Progressive Blur */}
        <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black_0%,transparent_40%)]" />
        <div className="absolute inset-0 backdrop-blur-[4px] [mask-image:linear-gradient(to_top,black_0%,transparent_60%)]" />
        <div className="absolute inset-0 backdrop-blur-[8px] [mask-image:linear-gradient(to_top,black_0%,transparent_80%)]" />
        <div className="absolute inset-0 backdrop-blur-[16px] [mask-image:linear-gradient(to_top,black_0%,transparent_100%)]" />
        {/* Color Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 via-40% to-transparent" />
      </div>

      <div className={`relative z-30 flex h-full flex-col justify-end pb-12 sm:pb-16 md:pb-20 ${PADDING_X_CLASSES}`}>
        <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl">
          {/* Logo & Overview */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${activeItem.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            >
              <div className="mb-4">
                {activeLogoUrl ? (
                  <img
                    src={activeLogoUrl}
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
              {overview && (
                <p className="text-xs sm:text-sm md:text-base leading-relaxed text-white/75 line-clamp-2 md:line-clamp-3 max-w-xl drop-shadow">
                  {overview}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex items-center gap-2.5">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-[13px] bg-white/[0.92] px-4 text-[13px] font-semibold shadow-none transition hover:bg-white active:scale-[0.98] text-[#111111] cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              {t('common.watchNow', 'Watch now')}
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-[13px] px-4 text-[13px] font-medium transition hover:bg-white/[0.16] active:scale-[0.98] bg-white/[0.12] ring-1 ring-white/[0.08] backdrop-blur-[32px] text-white/[0.78] cursor-pointer"
            >
              <Info className="h-4 w-4" />
              {t('common.moreInfo', 'More info')}
            </button>
          </div>
        </div>

        {/* Carousel Indicators */}
        {bannerItems.length > 1 && (
          <div className="absolute bottom-6 right-6 sm:right-8 lg:right-14 z-30 flex items-center gap-2">
            {bannerItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`${t('carousel.goToSlide', 'Go to slide')} ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? 'w-7 bg-white'
                    : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Banner;
