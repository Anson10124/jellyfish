import type { JellyfinBaseItem } from './jellyfin';
import type { Episode } from './media';

export interface SubtitleTrack {
  index: number;
  language: string;
  title: string;
  isDefault: boolean;
  vttUrl: string;
}

export interface AudioTrack {
  index: number;
  language: string;
  title: string;
  isDefault: boolean;
  channels?: number;
  codec?: string;
}

export interface PlaybackSourceResult {
  url: string;
  isHls: boolean;
  playMethod: 'DirectPlay' | 'Transcode' | 'DirectStream';
  mediaSourceId?: string;
  sourceWidth?: number;
  sourceHeight?: number;
  sourceBitrate?: number;
  subtitles?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
}

export interface ActiveVideo {
  src: string;
  title: string;
  poster?: string;
  initialTimeInSeconds?: number;
  itemId?: string;
  playMethod?: 'DirectPlay' | 'Transcode' | 'DirectStream';
  mediaSourceId?: string;
  sourceWidth?: number;
  sourceHeight?: number;
  sourceBitrate?: number;
  isHls?: boolean;
  subtitles?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
}

export interface VideoPlayerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  activeVideo?: ActiveVideo | null;
  src?: string | null;
  title?: string;
  poster?: string;
  initialTimeInSeconds?: number;
  itemId?: string;
  playMethod?: 'DirectPlay' | 'Transcode' | 'DirectStream';
  sourceWidth?: number;
  sourceHeight?: number;
  sourceBitrate?: number;
  subtitles?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
  onFallbackTranscode?: () => void;
}

export interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoKey?: string;
  title?: string;
}

export type QualityOptionId =
  | 'auto'
  | '4k-120m'
  | '4k-80m'
  | '4k-40m'
  | '4k-25m'
  | '4k-20m'
  | '4k-15m'
  | '1080p-40m'
  | '1080p-20m'
  | '1080p-15m'
  | '1080p-10m'
  | '1080p-6m'
  | '720p-8m'
  | '720p-4m'
  | '720p-2m'
  | '480p-3m'
  | '480p-1.5m'
  | '360p-750k'
  | '240p-420k';

export interface QualityOption {
  id: QualityOptionId;
  label: string;
  bitrate?: number;
  maxHeight?: number;
}

export const QUALITY_OPTIONS: QualityOption[] = [
  { id: '4k-120m', label: '4K - 120 Mbps', bitrate: 120000000, maxHeight: 2160 },
  { id: '4k-80m', label: '4K - 80 Mbps', bitrate: 80000000, maxHeight: 2160 },
  { id: '4k-40m', label: '4K - 40 Mbps', bitrate: 40000000, maxHeight: 2160 },
  { id: '4k-25m', label: '4K - 25 Mbps', bitrate: 25000000, maxHeight: 2160 },
  { id: '4k-20m', label: '4K - 20 Mbps', bitrate: 20000000, maxHeight: 2160 },
  { id: '4k-15m', label: '4K - 15 Mbps', bitrate: 15000000, maxHeight: 2160 },
  { id: '1080p-40m', label: '1080p - 40 Mbps', bitrate: 40000000, maxHeight: 1080 },
  { id: '1080p-20m', label: '1080p - 20 Mbps', bitrate: 20000000, maxHeight: 1080 },
  { id: '1080p-15m', label: '1080p - 15 Mbps', bitrate: 15000000, maxHeight: 1080 },
  { id: '1080p-10m', label: '1080p - 10 Mbps', bitrate: 10000000, maxHeight: 1080 },
  { id: '1080p-6m', label: '1080p - 6 Mbps', bitrate: 6000000, maxHeight: 1080 },
  { id: '720p-8m', label: '720p - 8 Mbps', bitrate: 8000000, maxHeight: 720 },
  { id: '720p-4m', label: '720p - 4 Mbps', bitrate: 4000000, maxHeight: 720 },
  { id: '720p-2m', label: '720p - 2 Mbps', bitrate: 2000000, maxHeight: 720 },
  { id: '480p-3m', label: '480p - 3 Mbps', bitrate: 3000000, maxHeight: 480 },
  { id: '480p-1.5m', label: '480p - 1.5 Mbps', bitrate: 1500000, maxHeight: 480 },
  { id: '360p-750k', label: '360p - 750 kbps', bitrate: 750000, maxHeight: 360 },
  { id: '240p-420k', label: '240p - 420 kbps', bitrate: 420000, maxHeight: 240 },
];

export function getFilteredQualityOptions(
  sourceWidth?: number,
  sourceHeight?: number,
  sourceBitrate?: number
): QualityOption[] {
  let effectiveMaxHeight: number | undefined = sourceHeight;

  if (sourceWidth || sourceHeight) {
    const w = sourceWidth || 0;
    const h = sourceHeight || 0;
    const maxDim = Math.max(w, h);
    const minDim = Math.min(w, h);

    if (maxDim >= 3200 || minDim >= 1400) {
      effectiveMaxHeight = 2160;
    } else if (maxDim >= 1600 || minDim >= 800) {
      effectiveMaxHeight = 1080;
    } else if (maxDim >= 1000 || minDim >= 500) {
      effectiveMaxHeight = 720;
    } else if (maxDim >= 600 || minDim >= 350) {
      effectiveMaxHeight = 480;
    }
  }

  // Filter out resolution tiers strictly above the source file's max height
  const resFiltered = QUALITY_OPTIONS.filter((opt) => {
    if (opt.id === 'auto') return true;
    if (effectiveMaxHeight && opt.maxHeight && opt.maxHeight > effectiveMaxHeight) {
      return false;
    }
    return true;
  });

  if (!sourceBitrate) {
    return resFiltered;
  }

  // Group by resolution tier and filter bitrates higher than source (with 15% tolerance).
  // If all options in a tier exceed source bitrate, keep the lowest bitrate option for that tier.
  const maxBitrate = sourceBitrate * 1.15;
  const result: QualityOption[] = [];

  const heights = Array.from(new Set(resFiltered.map((opt) => opt.maxHeight)));

  for (const h of heights) {
    const group = resFiltered.filter((opt) => opt.maxHeight === h);
    if (h === undefined) {
      result.push(...group);
      continue;
    }

    const underCap = group.filter((opt) => opt.bitrate && opt.bitrate < maxBitrate);
    if (underCap.length > 0) {
      result.push(...underCap);
    } else {
      const lowest = group.reduce((prev, curr) =>
        (curr.bitrate || 0) < (prev.bitrate || 0) ? curr : prev
      );
      result.push(lowest);
    }
  }

  return resFiltered.filter((opt) => result.includes(opt));
}

export interface PlayMovieOptions {
  jellyfinItem?: JellyfinBaseItem | null;
  title: string;
  posterUrl?: string;
}

export interface PlayEpisodeOptions {
  jellyfinItem?: JellyfinBaseItem | null;
  seriesTitle: string;
  episode: Episode;
  posterUrl?: string;
}
