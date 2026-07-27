'use client';

import React from 'react';
import { MediaLandscapeCarousel } from './media-landscape-carousel';
import { useNextUp } from '@/hooks/use-next-up';
import { useTranslation } from '@/hooks/use-translation';
import type { JellyfinBaseItem } from '@/types/jellyfin';

export interface NextUpCarouselProps {
  title?: string;
  subtitle?: string;
  onPlayItem?: (item: JellyfinBaseItem) => void;
}

export function NextUpCarousel({
  title,
  subtitle,
  onPlayItem,
}: NextUpCarouselProps) {
  const { t } = useTranslation();
  const { items, loading, isConnected, serverUrl } = useNextUp(12);

  const carouselTitle = title || t('library.nextUp', 'Next Up');
  const carouselSubtitle = subtitle || t('library.nextUpSubtitle', 'Next episodes in your series');

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

export default NextUpCarousel;
