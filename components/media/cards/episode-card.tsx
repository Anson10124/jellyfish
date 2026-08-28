'use client';

import React from 'react';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import { formatRuntime } from '@/lib/utils/media-format';
import { useTranslation } from '@/hooks/ui/use-translation';
import type { Episode } from '@/types/media';
import { Play, Film } from 'lucide-react';

export interface EpisodeCardProps {
  episode: Episode;
  className?: string;
  onPlay?: (episode: Episode) => void;
}

export function EpisodeCard({ episode, className = '', onPlay }: EpisodeCardProps) {
  const { formatDate } = useTranslation();
  const imageUrl = episode.still_path
    ? getTmdbImage(episode.still_path, 'w500')
    : null;

  const runtimeStr = formatRuntime(episode.runtime);
  const formattedAirDate = formatDate(episode.air_date);
  const subtitle = [formattedAirDate, runtimeStr].filter(Boolean).join(' • ');

  return (
    <div
      tabIndex={0}
      data-focusable="true"
      onClick={() => onPlay?.(episode)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onPlay?.(episode);
        }
      }}
      className={`group/ep w-full shrink-0 text-left select-none cursor-pointer focus:outline-none focus-visible:outline-none rounded-xl ${className}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-foreground/4 shadow-lg ring-1 ring-border transition-all duration-200 group-hover/ep:scale-[1.025] group-hover/ep:ring-foreground/40 group-focus-visible/ep:scale-[1.03] group-focus-visible/ep:ring-2 group-focus-visible/ep:ring-white">
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
          <div className="w-full h-full flex flex-col items-center justify-center bg-foreground/5 text-foreground/40 p-4 text-center">
            <Film className="h-10 w-10 mb-2 stroke-[1.5]" />
            <span className="text-xs font-medium">Episode {episode.episode_number}</span>
          </div>
        )}

        {/* Hover Overlay with Play Button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/ep:opacity-100 group-focus-visible/ep:opacity-100 transition duration-200 flex items-center justify-center">
          <div className="flex items-center justify-center h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-xl">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      <div className="mt-2.5 min-w-0">
        <p className="truncate text-[13px] font-semibold transition-colors duration-200 group-hover/ep:text-foreground group-focus-visible/ep:text-foreground sm:text-[14px] text-foreground/90">
          {episode.episode_number}. {episode.name}
        </p>
        {subtitle && (
          <p className="mt-0.5 truncate text-[11px] font-medium leading-none text-foreground/50">
            {subtitle}
          </p>
        )}
        {episode.overview && (
          <p className="mt-1 text-[11px] text-foreground/60 line-clamp-2 leading-relaxed">
            {episode.overview}
          </p>
        )}
      </div>
    </div>
  );
}

export default EpisodeCard;
