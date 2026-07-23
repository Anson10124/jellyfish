'use client';

import React from 'react';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import type { Season } from '@/types/media';
import { useTranslation } from '@/hooks/use-translation';
import { Layers } from 'lucide-react';

export interface SeasonCardProps {
  season: Season;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SeasonCard({
  season,
  isSelected = false,
  onClick,
  className = '',
}: SeasonCardProps) {
  const { t } = useTranslation();
  const year = season.air_date ? new Date(season.air_date).getFullYear() : null;
  const epCountLabel = season.episode_count
    ? `${season.episode_count} ${t('tv.episodes', season.episode_count === 1 ? 'episode' : 'episodes')}`
    : null;

  const subtitle = [year, epCountLabel].filter(Boolean).join(' • ');

  const imageUrl = season.poster_path
    ? getTmdbImage(season.poster_path, 'w342')
    : null;

  return (
    <div
      onClick={onClick}
      className={`group w-full shrink-0 text-left select-none cursor-pointer ${className}`}
    >
      <div
        className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-white/4 shadow-lg transition duration-300 ${
          isSelected
            ? 'ring-2 ring-white scale-[1.04] shadow-white/10 shadow-2xl'
            : 'ring-1 ring-white/5 group-hover:scale-[1.025] group-hover:ring-white/40'
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={season.name}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="object-cover w-full h-full pointer-events-none select-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-white/40 p-4 text-center">
            <Layers className="h-10 w-10 mb-2 stroke-[1.5]" />
            <span className="text-xs font-medium line-clamp-2">{season.name}</span>
          </div>
        )}
      </div>

      <div className="mt-2 min-w-0">
        <p
          className={`truncate text-[12px] font-semibold transition-colors duration-300 sm:text-[13px] ${
            isSelected ? 'text-white font-bold' : 'text-white/80 group-hover:text-white'
          }`}
        >
          {season.name}
        </p>
        {subtitle && (
          <p className="mt-0.5 truncate text-[11px] font-medium leading-none text-white/60 drop-shadow-xl">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default SeasonCard;
