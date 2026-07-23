import { GENRE_MAP, getGenreName } from '@/constants/genres';
import type { MediaItem, CastMember, CrewMember, VideoItem, Season, ProductionCountry } from '@/types/media';


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
  options: GetMediaSubtitleLabelOptions = {},
  t?: (key: string, defaultText?: string) => string
): string | undefined {
  const { type, mediaType, genreId } = options;

  // If genre = no label
  if (genreId) {
    return undefined;
  }

  // If trending = show media type
  if (type === 'trending') {
    const rawType = (item.media_type as string) || (mediaType !== 'all' ? mediaType : undefined);
    if (rawType === 'movie') return t ? t('common.movie', 'Movie') : 'Movie';
    if (rawType === 'tv') return t ? t('common.tvShow', 'TV Show') : 'TV Show';
    return undefined;
  }

  // If popular = show genre
  if (item.genre_ids && item.genre_ids.length > 0) {
    const primaryGenreId = item.genre_ids[0];
    return getGenreName(primaryGenreId, t);
  }

  if (item.genres && item.genres.length > 0) {
    const genreObj = item.genres[0];
    return getGenreName(genreObj.id, t) || genreObj.name;
  }

  return undefined;
}

export function formatRuntime(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
}

export function formatCurrency(amount?: number): string | null {
  if (amount === undefined || amount <= 0) return null;
  return `$${amount.toLocaleString()}`;
}

export function getMediaHref(id?: number | string, mediaType: string = 'movie'): string | undefined {
  if (!id) return undefined;
  return mediaType === 'tv' ? `/tv/${id}` : `/movie/${id}`;
}

export function getOfficialTrailerKey(videos?: VideoItem[]): string | null {
  if (!videos || videos.length === 0) return null;
  const trailer =
    videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official) ||
    videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
    videos[0];
  return trailer?.key || null;
}

export function processCastAndCrew(
  credits?: { cast?: CastMember[]; crew?: CrewMember[] },
  limit = 16
): (CastMember | CrewMember)[] {
  if (!credits) return [];
  const rawCast = credits.cast ? credits.cast.slice(0, limit) : [];
  const rawCrew = credits.crew || [];

  const uniqueCrew: CrewMember[] = [];
  const seenCrewIds = new Set<number>();

  for (const member of rawCrew) {
    if (!seenCrewIds.has(member.id)) {
      seenCrewIds.add(member.id);
      uniqueCrew.push({ ...member });
    } else {
      const existing = uniqueCrew.find((c) => c.id === member.id);
      if (existing && member.job && existing.job && !existing.job.includes(member.job)) {
        existing.job = `${existing.job}, ${member.job}`;
      }
    }
  }

  return [...rawCast, ...uniqueCrew.slice(0, limit)];
}

export function formatCountryOfOrigin(item: {
  production_countries?: ProductionCountry[];
  origin_country?: string[];
}): string | null {
  if (item.production_countries && item.production_countries.length > 0) {
    return item.production_countries.map((c) => c.name).join(' & ');
  }
  if (item.origin_country && item.origin_country.length > 0) {
    return item.origin_country.join(', ');
  }
  return null;
}

export function formatAirYears(firstAirDate?: string, lastAirDate?: string): string | null {
  const firstAirYear = firstAirDate ? new Date(firstAirDate).getFullYear() : null;
  const lastAirYear = lastAirDate ? new Date(lastAirDate).getFullYear() : null;
  if (!firstAirYear || isNaN(firstAirYear)) return null;
  if (lastAirYear && !isNaN(lastAirYear) && lastAirYear !== firstAirYear) {
    return `${firstAirYear} - ${lastAirYear}`;
  }
  return `${firstAirYear}`;
}

export function sortSeasons(seasons?: Season[]): Season[] {
  if (!seasons || seasons.length === 0) return [];
  const regular = seasons
    .filter((s) => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number);
  const specials = seasons.filter((s) => s.season_number <= 0);
  return [...regular, ...specials];
}

