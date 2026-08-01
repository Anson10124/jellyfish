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
    backdrops?: { file_path: string; width?: number; height?: number; vote_average?: number; iso_639_1?: string | null }[];
    posters?: { file_path: string; width?: number; height?: number; vote_average?: number; iso_639_1?: string | null }[];
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
    backdrops?: { file_path: string; width?: number; height?: number; vote_average?: number; iso_639_1?: string | null }[];
    posters?: { file_path: string; width?: number; height?: number; vote_average?: number; iso_639_1?: string | null }[];
    logos?: { file_path: string; iso_639_1?: string }[];
  };
}

export interface Season {
  id: number;
  name: string;
  overview?: string;
  poster_path?: string | null;
  season_number: number;
  episode_count: number;
  air_date?: string;
}

export interface Episode {
  id: number;
  name: string;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  air_date?: string;
  episode_number: number;
  season_number: number;
  still_path?: string | null;
  runtime?: number;
  crew?: CrewMember[];
  guest_stars?: CastMember[];
}

export interface TvSeasonDetails {
  _id?: string;
  air_date?: string;
  episodes: Episode[];
  name: string;
  overview?: string;
  id: number;
  poster_path?: string | null;
  season_number: number;
}

export interface TVDetails extends MediaItem {
  name?: string;
  original_name?: string;
  first_air_date?: string;
  last_air_date?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  episode_run_time?: number[];
  tagline?: string;
  status?: string;
  original_language?: string;
  origin_country?: string[];
  production_countries?: ProductionCountry[];
  production_companies?: ProductionCompany[];
  created_by?: { id: number; name: string; profile_path?: string | null }[];
  networks?: { id: number; name: string; logo_path?: string | null }[];
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
    backdrops?: { file_path: string; width?: number; height?: number; vote_average?: number; iso_639_1?: string | null }[];
    posters?: { file_path: string; width?: number; height?: number; vote_average?: number; iso_639_1?: string | null }[];
    logos?: { file_path: string; iso_639_1?: string }[];
  };
}

export interface PersonExternalIds {
  imdb_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  tiktok_id?: string | null;
  youtube_id?: string | null;
  wikidata_id?: string | null;
}

export interface PersonCastCredit extends MediaItem {
  character?: string;
  credit_id?: string;
  order?: number;
  media_type: 'movie' | 'tv';
}

export interface PersonCrewCredit extends MediaItem {
  job?: string;
  department?: string;
  credit_id?: string;
  media_type: 'movie' | 'tv';
}

export interface PersonProfileImage {
  aspect_ratio: number;
  height: number;
  width: number;
  file_path: string;
  vote_average?: number;
  vote_count?: number;
}

export interface PersonDetails {
  id: number;
  name: string;
  also_known_as?: string[];
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  gender?: number;
  homepage?: string | null;
  imdb_id?: string | null;
  known_for_department?: string;
  place_of_birth?: string | null;
  popularity?: number;
  profile_path?: string | null;
  external_ids?: PersonExternalIds;
  combined_credits?: {
    cast: PersonCastCredit[];
    crew: PersonCrewCredit[];
  };
  images?: {
    profiles?: PersonProfileImage[];
  };
}


