'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { MOVIE_GENRES, TV_GENRES, getGenreName } from '@/constants/genres';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useIsMobile } from '@/hooks/device/use-mobile';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';
import { LiquidGlass } from '@/components/ui/liquid-glass';

interface GenreBarProps {
  mediaType?: 'movie' | 'tv';
  selectedGenreId?: number | null;
  onSelectGenre?: (genreId: number | null) => void;
}

export function GenreBar({
  mediaType = 'movie',
  selectedGenreId: propSelectedGenreId,
  onSelectGenre,
}: GenreBarProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const params = useParams();
  const pathname = usePathname();

  const genres = mediaType === 'tv' ? TV_GENRES : MOVIE_GENRES;
  const baseUrl = mediaType === 'tv' ? '/tv' : '/movie';

  const { emblaRef, emblaApi } = useEmblaNavigation({
    options: {
      dragFree: true,
      align: 'start',
      containScroll: 'trimSnaps',
    },
  });

  let activeGenreId: number | null = null;
  if (propSelectedGenreId !== undefined) {
    activeGenreId = propSelectedGenreId;
  } else if (params?.id && typeof params.id === 'string' && pathname?.includes(`${baseUrl}/genre/`)) {
    const parsed = parseInt(params.id, 10);
    activeGenreId = isNaN(parsed) ? null : parsed;
  }

  useEffect(() => {
    if (!emblaApi || !isMobile) return;
    const activeIndex =
      activeGenreId === null
        ? 0
        : genres.findIndex((g) => g.id === activeGenreId) + 1;

    if (activeIndex >= 0) {
      emblaApi.scrollTo(activeIndex, false);
    }
  }, [emblaApi, isMobile, activeGenreId, genres]);

  // Selected chips stay solid; the rest are glass so the page shows through the sticky bar
  const getChipProps = (isSelected: boolean) => ({
    radius: 'capsule' as const,
    'data-focusable': 'true',
    tabIndex: 0,
    className: `shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:scale-[1.05] ${
      isSelected
        ? 'bg-foreground text-background shadow-md scale-[1.02]'
        : 'text-foreground/70 hover:bg-foreground/20 hover:text-foreground'
    }`,
    glassClassName: isSelected ? undefined : 'bg-card/25',
    fallbackClassName: isSelected ? 'backdrop-blur-xl' : 'bg-card/65 ring-1 ring-foreground/10 backdrop-blur-xl',
  });

  const renderGenreButtons = () => (
    <>
      {onSelectGenre ? (
        <LiquidGlass render={<button type="button" />} onClick={() => onSelectGenre(null)} {...getChipProps(activeGenreId === null)}>
          {t('common.all', 'All')}
        </LiquidGlass>
      ) : (
        <LiquidGlass render={<Link href={baseUrl} prefetch={false} />} {...getChipProps(activeGenreId === null)}>
          {t('common.all', 'All')}
        </LiquidGlass>
      )}

      {genres.map((genre) => {
        const chipProps = getChipProps(activeGenreId === genre.id);
        const genreName = getGenreName(genre.id, t) || genre.name;

        if (onSelectGenre) {
          return (
            <LiquidGlass
              key={genre.id}
              render={<button type="button" />}
              onClick={() => onSelectGenre(genre.id)}
              {...chipProps}
            >
              {genreName}
            </LiquidGlass>
          );
        }

        return (
          <LiquidGlass
            key={genre.id}
            render={<Link href={`${baseUrl}/genre/${genre.id}`} prefetch={false} />}
            {...chipProps}
          >
            {genreName}
          </LiquidGlass>
        );
      })}
    </>
  );

  return (
    <div className="sticky top-20 z-30 w-full mb-2">
      {isMobile ? (
        <div className="overflow-hidden select-none" ref={emblaRef}>
          <div className={`flex items-center gap-2 py-3 touch-pan-y ${PADDING_X_CLASSES}`}>
            {renderGenreButtons()}
          </div>
        </div>
      ) : (
        <div className={`py-3 ${PADDING_X_CLASSES}`}>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-5xl mx-auto">
            {renderGenreButtons()}
          </div>
        </div>
      )}
    </div>
  );
}

export default GenreBar;