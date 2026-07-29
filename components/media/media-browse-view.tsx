'use client';

import React from 'react';
import { Carousel } from './carousels';
import { useTranslation } from '@/hooks/ui/use-translation';
import {
  getMovieBrowseCategories,
  getTvBrowseCategories,
} from '@/services/media-service';

interface MediaBrowseViewProps {
  mediaType: 'movie' | 'tv';
}

export function MediaBrowseView({ mediaType }: MediaBrowseViewProps) {
  const { t } = useTranslation();

  const categories =
    mediaType === 'tv'
      ? getTvBrowseCategories()
      : getMovieBrowseCategories();

  return (
    <>
      {categories.map((cat) => (
        <Carousel
          key={cat.id}
          title={t(cat.titleKey, cat.defaultTitle)}
          type={cat.type}
          mediaType={cat.mediaType}
          timeWindow={cat.timeWindow}
          genreId={cat.genreId}
          infinite={cat.infinite ?? true}
        />
      ))}
    </>
  );
}

export default MediaBrowseView;
