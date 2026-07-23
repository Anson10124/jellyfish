'use client';

import React from 'react';
import { MOVIE_GENRES, getGenreName } from '@/constants/genres';
import { useTranslation } from '@/hooks/use-translation';
import { PADDING_X_CLASSES } from '@/constants/carousel';

interface GenreBarProps {
  selectedGenreId: number | null;
  onSelectGenre: (genreId: number | null) => void;
}

export function GenreBar({ selectedGenreId, onSelectGenre }: GenreBarProps) {
  const { t } = useTranslation();

  return (
    <div className={`w-full overflow-x-auto no-scrollbar py-3 ${PADDING_X_CLASSES}`}>
      <div className="flex items-center gap-2 min-w-max">
        <button
          type="button"
          onClick={() => onSelectGenre(null)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
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
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white text-black shadow-md scale-[1.02]'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white ring-1 ring-white/10'
              }`}
            >
              {genreName}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GenreBar;
