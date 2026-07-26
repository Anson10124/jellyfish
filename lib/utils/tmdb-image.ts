type ImageSize = 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original';

export function getTmdbImage(path: string | null | undefined, size: ImageSize = 'w500'): string {
  if (!path) {
    return 'https://placehold.co/500x750?text=No+Image';
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `https://image.tmdb.org/t/p/${size}${path}`;
}