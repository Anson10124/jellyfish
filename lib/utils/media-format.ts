import { GENRE_MAP } from '@/constants/genres';
import type { MediaItem } from '@/types/media';

export function getMediaTitle(item: MediaItem): string {
  return item.title || item.name || 'Untitled';
}

export function getMediaYear(item: MediaItem): number {
  const dateStr = item.release_date || item.first_air_date;
  if (!dateStr) return 0;
  const year = new Date(dateStr).getFullYear();
  return isNaN(year) ? 0 : year;
}

export interface GetMediaSubtitleLabelOptions {
  type?: 'popular' | 'trending' | 'top_rated';
  mediaType?: 'movie' | 'tv' | 'all';
  genreId?: number;
}

export function getMediaSubtitleLabel(
  item: MediaItem,
  options: GetMediaSubtitleLabelOptions = {}
): string | undefined {
  const { type, mediaType, genreId } = options;

  // If genre = no label
  if (genreId) {
    return undefined;
  }

  // If trending = show media type
  if (type === 'trending') {
    const rawType = (item.media_type as string) || (mediaType !== 'all' ? mediaType : undefined);
    if (rawType === 'movie') return 'Movie';
    if (rawType === 'tv') return 'TV Show';
    return undefined;
  }

  // If popular = show genre
  if (item.genre_ids && item.genre_ids.length > 0) {
    const primaryGenreId = item.genre_ids[0];
    return GENRE_MAP[primaryGenreId];
  }

  if (item.genres && item.genres.length > 0) {
    return item.genres[0].name;
  }

  return undefined;
}
