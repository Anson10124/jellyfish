export interface MediaItem {
  id: number | string;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  media_type?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  overview?: string;
  tagline?: string;
  runtime?: number;
  status?: string;
  budget?: number;
  revenue?: number;
  original_language?: string;
  images?: {
    backdrops?: { file_path: string; width?: number; height?: number; vote_average?: number }[];
    logos?: { file_path: string; iso_639_1?: string }[];
  };
  [key: string]: unknown;
}

export interface CastMember {
  id: number;
  name: string;
  original_name?: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job?: string;
  department?: string;
  profile_path?: string | null;
}

export interface VideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface ProductionCompany {
  id: number;
  logo_path?: string | null;
  name: string;
  origin_country?: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface MovieDetails extends MediaItem {
  tagline?: string;
  runtime?: number;
  status?: string;
  budget?: number;
  revenue?: number;
  original_language?: string;
  origin_country?: string[];
  production_countries?: ProductionCountry[];
  production_companies?: ProductionCompany[];
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos?: {
    results: VideoItem[];
  };
  recommendations?: {
    results: MediaItem[];
  };
  similar?: {
    results: MediaItem[];
  };
  images?: {
    backdrops?: { file_path: string; width?: number; height?: number; vote_average?: number }[];
    logos?: { file_path: string; iso_639_1?: string }[];
  };
}
