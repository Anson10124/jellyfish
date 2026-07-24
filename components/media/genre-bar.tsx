'use client';

import React from 'react';
import { MOVIE_GENRES, getGenreName } from '@/constants/genres';
import { useTranslation } from '@/hooks/use-translation';
import { useIsMobile } from '@/hooks/device/use-mobile';
import { PADDING_X_CLASSES } from '@/constants/carousel';

interface GenreBarProps {
  selectedGenreId: number | null;
  onSelectGenre: (genreId: number | null) => void;
}

export function GenreBar({ selectedGenreId, onSelectGenre }: GenreBarProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const renderGenreButtons = () => (
    <>
      <button
        type="button"
        onClick={() => onSelectGenre(null)}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
          selectedGenreId === null
            ? 'bg-white text-black shadow-md scale-[1.02]'
            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white ring-1 ring-white/10'
        }`}
      >
        {t('common.all', 'All')}
      </button>

      {MOVIE_GENRES.map((genre) => {
        const isSelected = selectedGenreId === genre.id;
        const genreName = getGenreName(genre.id, t) || genre.name;
        return (
          <button
            key={genre.id}
            type="button"
            onClick={() => onSelectGenre(genre.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer bg-[#121215]/65 backdrop-blur-xl ${
              isSelected
                ? 'bg-white text-black shadow-md scale-[1.02]'
                : 'text-white/70 hover:bg-white/20 hover:text-white ring-1 ring-white/10'
            }`}
          >
            {genreName}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="sticky top-20 z-30 w-full">
      {isMobile ? (
        <div className={`overflow-x-auto no-scrollbar py-3 ${PADDING_X_CLASSES}`}>
          <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-2">
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

