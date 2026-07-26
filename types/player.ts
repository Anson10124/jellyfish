import type { JellyfinBaseItem } from './jellyfin';
import type { Episode } from './media';

export interface ActiveVideo {
  src: string;
  title: string;
  poster?: string;
  initialTimeInSeconds?: number;
  itemId?: string;
}

export interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  src?: string | null;
  title?: string;
  poster?: string;
  initialTimeInSeconds?: number;
  itemId?: string;
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
