import type { JellyfinBaseItem } from './jellyfin';
import type { Episode } from './media';

export interface SubtitleTrack {
  index: number;
  language: string;
  title: string;
  isDefault: boolean;
  vttUrl: string;
}

export interface PlaybackSourceResult {
  url: string;
  isHls: boolean;
  playMethod: 'DirectPlay' | 'Transcode' | 'DirectStream';
  mediaSourceId?: string;
  subtitles?: SubtitleTrack[];
}

export interface ActiveVideo {
  src: string;
  title: string;
  poster?: string;
  initialTimeInSeconds?: number;
  itemId?: string;
  playMethod?: 'DirectPlay' | 'Transcode' | 'DirectStream';
  mediaSourceId?: string;
  isHls?: boolean;
  subtitles?: SubtitleTrack[];
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
  subtitles?: SubtitleTrack[];
  onFallbackTranscode?: () => void;
}

export interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoKey?: string;
  title?: string;
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
