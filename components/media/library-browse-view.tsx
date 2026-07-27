'use client';

import React from 'react';
import Link from 'next/link';
import { Poster } from './cards';
import { PosterGrid } from './poster-grid';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useLibraryMedia } from '@/hooks/media/use-library-media';
import { getJellyfinPosterInfo } from '@/lib/utils/media-format';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { FolderOpen } from 'lucide-react';

interface LibraryBrowseViewProps {
  params: Promise<{ id: string }>;
}

export function LibraryBrowseView({ params }: LibraryBrowseViewProps) {
  const { t } = useTranslation();
  const {
    libraryTitle,
    items,
    loading,
    loadingMore,
    observerRef,
    serverUrl,
    isConnected,
    isInitialized,
  } = useLibraryMedia({ params });

  if (isInitialized && !isConnected) {
    return (
      <section className={`w-full py-12 ${PADDING_X_CLASSES} flex flex-col items-center justify-center space-y-6 text-center`}>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">
            {t('library.connectPromptTitle', 'Connect Your Jellyfin Server')}
          </h3>
          <p className="text-sm text-neutral-400 max-w-md">
            {t('library.connectPromptDesc', 'Connect your Jellyfin server to access your personal movies, TV shows, and music libraries directly.')}
          </p>
        </div>
        <Link
          href="/connect"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-colors"
        >
          <span>{t('nav.connect', 'Connect Server')}</span>
        </Link>
      </section>
    );
  }

  const emptyState = (
    <div className="w-full py-16 text-center text-white/50 text-sm flex flex-col items-center gap-2">
      <FolderOpen className="w-8 h-8 text-neutral-500" />
      <p>{t('library.noItems', 'No media items found in this library.')}</p>
    </div>
  );

  return (
    <PosterGrid
      title={libraryTitle}
      loading={loading}
      loadingMore={loadingMore}
      isEmpty={items.length === 0}
      emptyState={emptyState}
      observerRef={observerRef}
    >
      {items.map((item, idx) => {
        const { mediaId, mediaType, primaryGenre, posterUrl } = getJellyfinPosterInfo(item, serverUrl);

        return (
          <Poster
            key={`${item.Id}-${idx}`}
            id={mediaId}
            mediaType={mediaType}
            title={item.Name}
            posterPath={posterUrl}
            year={item.ProductionYear}
            label={primaryGenre}
          />
        );
      })}
    </PosterGrid>
  );
}

export default LibraryBrowseView;
