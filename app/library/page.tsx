'use client';

import React from 'react';
import Link from 'next/link';
import { LibraryCarousel, ContinueWatchingCarousel, NextUpCarousel } from '@/components/media/carousels';
import { VideoPlayerModal } from '@/components/player';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useServerConfig } from '@/hooks/connect/use-server-config';
import { usePlayer } from '@/hooks/player/use-player';
import { JellyfinService } from '@/services/jellyfin.service';
import type { JellyfinBaseItem } from '@/types/jellyfin';

export default function LibraryPage() {
  const { t } = useTranslation();
  const { isConnected, isInitialized, jellyfinConfig } = useServerConfig();
  const { activeVideo, playMovie, closeVideo } = usePlayer();

  const handlePlayResumeItem = (item: JellyfinBaseItem) => {
    const isEpisode = item.Type === 'Episode';
    const title = isEpisode && item.SeriesName
      ? `${item.SeriesName} - S${item.ParentIndexNumber ?? 1}E${item.IndexNumber ?? 1}: ${item.Name}`
      : item.Name;

    const posterUrl = jellyfinConfig?.serverUrl
      ? JellyfinService.getImageUrl(jellyfinConfig.serverUrl, item.Id, {
          width: 500,
          type: item.BackdropImageTags && item.BackdropImageTags.length > 0 ? 'Backdrop' : 'Primary',
        })
      : undefined;

    playMovie({
      jellyfinItem: item,
      title,
      posterUrl,
    });
  };

  return (
    <main className={`min-h-screen w-full pb-16 pt-28 ${!isConnected && isInitialized ? 'flex items-center justify-center' : ''}`}>
      <div className="w-full space-y-8">
        {!isInitialized ? null : !isConnected ? (
          <div className="w-full px-6 py-8 rounded-2xl text-center max-w-2xl mx-auto flex flex-col items-center justify-center space-y-6">
            <div className="space-y-1">
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
          </div>
        ) : (
          <div className="w-full space-y-10">
            <ContinueWatchingCarousel onPlayItem={handlePlayResumeItem} />
            <NextUpCarousel onPlayItem={handlePlayResumeItem} />
            <LibraryCarousel />
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal activeVideo={activeVideo} onClose={closeVideo} />
    </main>
  );
}
