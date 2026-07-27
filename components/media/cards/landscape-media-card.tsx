'use client';

import React from 'react';
import { JellyfinService } from '@/services/jellyfin.service';
import type { JellyfinBaseItem } from '@/types/jellyfin';
import { Play, Film } from 'lucide-react';
import { formatTimeLeft } from '@/lib/utils/media-format';

export interface LandscapeMediaCardProps {
  item: JellyfinBaseItem;
  serverUrl?: string;
  className?: string;
  onPlay?: (item: JellyfinBaseItem) => void;
}

export function LandscapeMediaCard({
  item,
  serverUrl,
  className = '',
  onPlay,
}: LandscapeMediaCardProps) {
  const isEpisode = item.Type === 'Episode';

  const positionTicks = item.UserData?.PlaybackPositionTicks || 0;
  const totalTicks = item.RunTimeTicks || 0;
  const progressPercentage =
    totalTicks > 0 ? Math.min(100, Math.max(0, (positionTicks / totalTicks) * 100)) : 0;

  const timeLeftStr = formatTimeLeft(positionTicks, totalTicks);

  const title = isEpisode ? item.SeriesName || item.Name : item.Name;
  const baseSubtitle = isEpisode
    ? item.ParentIndexNumber !== undefined && item.IndexNumber !== undefined
      ? `S${item.ParentIndexNumber}:E${item.IndexNumber}`
      : ''
    : item.ProductionYear
    ? `${item.ProductionYear}`
    : '';

  const subtitle = baseSubtitle
    ? timeLeftStr
      ? `${baseSubtitle} • ${timeLeftStr}`
      : baseSubtitle
    : timeLeftStr || '';

  const imageUrl =
    serverUrl && item.Id
      ? JellyfinService.getImageUrl(serverUrl, item.Id, {
          width: 500,
          type: item.BackdropImageTags && item.BackdropImageTags.length > 0 ? 'Backdrop' : 'Primary',
        })
      : '';

  const logoItemId = isEpisode ? item.SeriesId || item.Id : item.Id;
  const logoUrl =
    serverUrl && logoItemId
      ? JellyfinService.getImageUrl(serverUrl, logoItemId, {
          width: 400,
          type: 'Logo',
        })
      : null;

  return (
    <div
      onClick={() => onPlay?.(item)}
      className={`group w-full shrink-0 text-left select-none cursor-pointer ${className}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-white/5 shadow-lg ring-1 ring-white/10 transition duration-300 group-hover:scale-[1.025] group-hover:ring-white/40">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="object-cover w-full h-full pointer-events-none select-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-white/40 p-4 text-center">
            <Film className="h-10 w-10 mb-2 stroke-[1.5]" />
            <span className="text-xs font-medium truncate max-w-full">{title}</span>
          </div>
        )}

        {logoUrl && (
          <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none z-10">
            <img
              src={logoUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
              className="max-h-[55%] max-w-[75%] object-contain drop-shadow-md"
            />
          </div>
        )}

        {progressPercentage > 0 && (
          <div className="absolute bottom-2.5 left-3 right-3 h-1 rounded-full bg-black/40 backdrop-blur-md overflow-hidden z-20">
            <div
              className="h-full rounded-full bg-white transition-all duration-300 shadow-md"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center z-30">
          <div className="flex items-center justify-center h-11 w-11 rounded-full bg-white/90 text-[#121215] shadow-xl">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      <div className="mt-2.5 min-w-0">
        <p className="truncate text-[13px] font-semibold transition-colors duration-300 group-hover:text-white sm:text-[14px] text-white/90">
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 truncate text-[11px] font-medium leading-none text-white/50">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default LandscapeMediaCard;
