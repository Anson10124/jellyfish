'use client';

import React from 'react';
import { TOP10_SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import { Poster } from './poster';
import { RankNumber } from './rank-number';
import { getMediaTitle, getMediaYear } from '@/lib/utils/media-format';
import type { MediaItem } from '@/types/media';

export interface NumberedMediaCardProps {
  item: MediaItem;
  rank: number;
  mediaType?: 'movie' | 'tv' | 'all' | string;
  label?: string;
}

export function NumberedMediaCard({
  item,
  rank,
  mediaType = 'movie',
  label,
}: NumberedMediaCardProps) {
  const itemTitle = getMediaTitle(item);
  const resolvedMediaType =
    (item.media_type as 'movie' | 'tv') || (mediaType === 'tv' ? 'tv' : 'movie');

  return (
    <div className={TOP10_SLIDE_WIDTH_CLASS}>
      <div className="group relative w-full shrink-0 text-left select-none cursor-pointer">
        <RankNumber rank={rank} />
        <div className="relative z-10 ml-[38px] w-[108px] sm:ml-[44px] sm:w-[122px] md:ml-[50px] md:w-[134px] xl:ml-[60px] xl:w-[154px] 2xl:ml-[68px] 2xl:w-[176px]">
          <Poster
            id={item.id}
            mediaType={resolvedMediaType}
            title={itemTitle}
            posterPath={item.poster_path || ''}
            year={getMediaYear(item)}
            label={label}
            showDetails={false}
          />
        </div>
      </div>
    </div>
  );
}

export default NumberedMediaCard;
