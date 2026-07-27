'use client';

import React from 'react';
import { MediaLandscapeCarousel } from './media-landscape-carousel';
import { useContinueWatching } from '@/hooks/media/use-continue-watching';
import { useTranslation } from '@/hooks/ui/use-translation';
import type { JellyfinBaseItem } from '@/types/jellyfin';

export interface ContinueWatchingCarouselProps {
  title?: string;
  subtitle?: string;
  onPlayItem?: (item: JellyfinBaseItem) => void;
}

export function ContinueWatchingCarousel({
  title,
  subtitle,
  onPlayItem,
}: ContinueWatchingCarouselProps) {
  const { t } = useTranslation();
  const { items, loading, isConnected, serverUrl } = useContinueWatching(12);

  const carouselTitle = title || t('library.continueWatching', 'Continue Watching');
  const carouselSubtitle = subtitle || t('library.continueWatchingSubtitle', 'Pick up where you left off');

  return (
    <MediaLandscapeCarousel
      title={carouselTitle}
      subtitle={carouselSubtitle}
      items={items}
      loading={loading}
      isConnected={isConnected}
      serverUrl={serverUrl}
      onPlayItem={onPlayItem}
    />
  );
}

export default ContinueWatchingCarousel;
