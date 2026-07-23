import { GENRE_MAP } from '@/constants/genres';

export function getGenreNames(genreIds: number[] = [], limit = 2): string {
  if (!genreIds.length) return '';
  
  return genreIds
    .map((id) => GENRE_MAP[id])
    .filter(Boolean)
    .slice(0, limit)
    .join(' • ');
}