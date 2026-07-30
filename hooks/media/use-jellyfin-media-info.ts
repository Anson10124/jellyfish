import { useMemo } from 'react';
import type { JellyfinBaseItem, JellyfinMediaSource } from '@/types/jellyfin';
import { extractFormattedMediaInfo, extractLanguageSupportTable } from '@/lib/utils/media-info';
import { useTranslation } from '@/hooks/ui/use-translation';

export interface UseJellyfinMediaInfoOptions {
  item?: JellyfinBaseItem | null;
  fallbackMediaSource?: JellyfinMediaSource | null;
}

export function useJellyfinMediaInfo({ item, fallbackMediaSource }: UseJellyfinMediaInfoOptions) {
  const { locale } = useTranslation();

  const mediaSource = useMemo(() => {
    return item?.MediaSources?.[0] || fallbackMediaSource || null;
  }, [item?.MediaSources, fallbackMediaSource]);

  const info = useMemo(() => {
    return extractFormattedMediaInfo(mediaSource);
  }, [mediaSource]);

  const languages = useMemo(() => {
    return extractLanguageSupportTable(mediaSource, locale);
  }, [mediaSource, locale]);

  return {
    mediaSource,
    info,
    languages,
    hasContent: Boolean(mediaSource) && (Object.keys(info).length > 0 || languages.length > 0),
  };
}
