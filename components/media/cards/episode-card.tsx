'use client';

import React from 'react';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import { formatRuntime } from '@/lib/utils/media-format';
import { useTranslation } from '@/hooks/use-translation';
import type { Episode } from '@/types/media';
import { Play, Film } from 'lucide-react';

export interface EpisodeCardProps {
  episode: Episode;
  className?: string;
}

export function EpisodeCard({ episode, className = '' }: EpisodeCardProps) {
  const { formatDate } = useTranslation();
  const imageUrl = episode.still_path
    ? getTmdbImage(episode.still_path, 'w500')
    : null;

  const runtimeStr = formatRuntime(episode.runtime);
  const formattedAirDate = formatDate(episode.air_date);
  const subtitle = [formattedAirDate, runtimeStr].filter(Boolean).join(' • ');

  return (
    <div className={`group w-full shrink-0 text-left select-none cursor-pointer ${className}`}>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-white/4 shadow-lg ring-1 ring-white/5 transition duration-300 group-hover:scale-[1.025] group-hover:ring-white/40">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={episode.name}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="object-cover w-full h-full pointer-events-none select-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-white/40 p-4 text-center">
            <Film className="h-10 w-10 mb-2 stroke-[1.5]" />
            <span className="text-xs font-medium">Episode {episode.episode_number}</span>
          </div>
        )}

        {/* Hover Overlay with Play Button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
          <div className="flex items-center justify-center h-11 w-11 rounded-full bg-white/90 text-[#121215] shadow-xl">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      <div className="mt-2.5 min-w-0">
        <p className="truncate text-[13px] font-semibold transition-colors duration-300 group-hover:text-white sm:text-[14px] text-white/90">
          {episode.episode_number}. {episode.name}
        </p>
        {subtitle && (
          <p className="mt-0.5 truncate text-[11px] font-medium leading-none text-white/50">
            {subtitle}
          </p>
        )}
        {episode.overview && (
          <p className="mt-1 text-[11px] text-white/60 line-clamp-2 leading-relaxed">
            {episode.overview}
          </p>
        )}
      </div>
    </div>
  );
}

export default EpisodeCard;
