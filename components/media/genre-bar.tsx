'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { MOVIE_GENRES, TV_GENRES, getGenreName } from '@/constants/genres';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useIsMobile } from '@/hooks/device/use-mobile';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';

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

  const renderGenreButtons = () => (
    <>
      {onSelectGenre ? (
        <button
          type="button"
          onClick={() => onSelectGenre(null)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer backdrop-blur-xl ${
            activeGenreId === null
              ? 'bg-white text-black shadow-md scale-[1.02]'
              : 'bg-[#3b3b45]/65 text-white/70 hover:bg-white/20 hover:text-white ring-1 ring-white/10'
          }`}
        >
          {t('common.all', 'All')}
        </button>
      ) : (
        <Link
          href={baseUrl}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer backdrop-blur-xl ${
            activeGenreId === null
              ? 'bg-white text-black shadow-md scale-[1.02]'
              : 'bg-[#3b3b45]/65 text-white/70 hover:bg-white/20 hover:text-white ring-1 ring-white/10'
          }`}
        >
          {t('common.all', 'All')}
        </Link>
      )}

      {genres.map((genre) => {
        const isSelected = activeGenreId === genre.id;
        const genreName = getGenreName(genre.id, t) || genre.name;
        const buttonClasses = `shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer bg-[#121215]/65 backdrop-blur-xl ${
          isSelected
            ? 'bg-white text-black shadow-md scale-[1.02]'
            : 'text-white/70 hover:bg-white/20 hover:text-white ring-1 ring-white/10'
        }`;

        if (onSelectGenre) {
          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => onSelectGenre(genre.id)}
              className={buttonClasses}
            >
              {genreName}
            </button>
          );
        }

        return (
          <Link
            key={genre.id}
            href={`${baseUrl}/genre/${genre.id}`}
            className={buttonClasses}
          >
            {genreName}
          </Link>
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