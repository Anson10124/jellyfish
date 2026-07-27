'use client';

import React from 'react';
import { Poster } from './cards';
import { PosterGrid } from './poster-grid';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useGenreMedia } from '@/hooks/media/use-genre-media';
import { getMediaTitle, getMediaYear, getMediaSubtitleLabel } from '@/lib/utils/media-format';

interface GenreBrowseViewProps {
  params: Promise<{ id: string }>;
  mediaType: 'movie' | 'tv';
}

export function GenreBrowseView({ params, mediaType }: GenreBrowseViewProps) {
  const { t } = useTranslation();
  const { genreTitle, items, loading, loadingMore, observerRef } = useGenreMedia({
    params,
    mediaType,
  });

  return (
    <PosterGrid
      title={genreTitle}
      loading={loading}
      loadingMore={loadingMore}
      observerRef={observerRef}
    >
      {items.map((item, idx) => (
        <Poster
          key={`${item.id}-${idx}`}
          id={item.id}
          mediaType={mediaType}
          title={getMediaTitle(item)}
          posterPath={item.poster_path || ''}
          year={getMediaYear(item)}
          label={getMediaSubtitleLabel(item, { mediaType }, t)}
        />
      ))}
    </PosterGrid>
  );
}

export default GenreBrowseView;
