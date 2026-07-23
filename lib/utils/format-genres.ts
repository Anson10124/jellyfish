import { getGenreName } from '@/constants/genres';

export function getGenreNames(
  genreIds: number[] = [],
  limit = 2,
  t?: (key: string, fallback?: string) => string
): string {
  if (!genreIds.length) return '';

  return genreIds
    .map((id) => getGenreName(id, t))
    .filter(Boolean)
    .slice(0, limit)
    .join(' • ');
}