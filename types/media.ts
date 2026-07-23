export interface MediaItem {
  id: number | string;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  media_type?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  [key: string]: unknown;
}
