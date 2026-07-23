import { getImageLanguageParam } from '@/lib/i18n/config';

const API_BASE_URL = '/api/tmdb';

const responseCache = new Map<string, any>();
const pendingRequests = new Map<string, Promise<any>>();

export async function tmdbFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cacheKey = `${options.method || 'GET'}:${endpoint}`;

  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey) as T;
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey) as Promise<T>;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`TMDb API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      responseCache.set(cacheKey, data);
      return data;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

export interface TmdbPaginatedResponse<T = Record<string, unknown>> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export const TmdbApi = {
  // Trending
  getTrending: <T = Record<string, unknown>>(
    mediaType: 'movie' | 'tv' | 'all' = 'all',
    timeWindow: 'day' | 'week' = 'day',
    page = 1,
    language = 'en-US'
  ) => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/trending/${mediaType}/${timeWindow}?page=${page}&language=${language}`);
  },

  // Top Rated
  getTopRated: <T = Record<string, unknown>>(mediaType: 'movie' | 'tv' = 'movie', page = 1, language = 'en-US') => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/${mediaType}/top_rated?page=${page}&language=${language}`);
  },

  // Popular Movies
  getPopularMovies: <T = Record<string, unknown>>(page = 1, language = 'en-US') => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/movie/popular?page=${page}&language=${language}`);
  },

  // Popular TV Shows
  getPopularTV: <T = Record<string, unknown>>(page = 1, language = 'en-US') => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/tv/popular?page=${page}&language=${language}`);
  },

  // Discover by Genre
  getByGenre: <T = Record<string, unknown>>(
    mediaType: 'movie' | 'tv' = 'movie',
    genreId: number,
    page = 1,
    language = 'en-US'
  ) => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/discover/${mediaType}?with_genres=${genreId}&page=${page}&language=${language}`);
  },

  // Search
  searchMulti: <T = Record<string, unknown>>(query: string, page = 1, language = 'en-US') => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/search/multi?query=${encodeURIComponent(query)}&page=${page}&language=${language}`);
  },

  // Generic Media Details (Movie or TV)
  getMediaDetails: <T = Record<string, unknown>>(mediaType: 'movie' | 'tv', id: number | string, language = 'en-US') => {
    return tmdbFetch<T>(
      `/${mediaType}/${id}?append_to_response=credits,recommendations,similar,videos,images&include_image_language=${language.split('-')[0]},en,null&language=${language}`
    );
  },

  // Generic Media Credits
  getMediaCredits: <T = Record<string, unknown>>(mediaType: 'movie' | 'tv', id: number | string, language = 'en-US') => {
    return tmdbFetch<T>(`/${mediaType}/${id}/credits?language=${language}`);
  },

  // Generic Media Recommendations
  getMediaRecommendations: <T = Record<string, unknown>>(mediaType: 'movie' | 'tv', id: number | string, page = 1, language = 'en-US') => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/${mediaType}/${id}/recommendations?page=${page}&language=${language}`);
  },

  // Generic Media Similar
  getMediaSimilar: <T = Record<string, unknown>>(mediaType: 'movie' | 'tv', id: number | string, page = 1, language = 'en-US') => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/${mediaType}/${id}/similar?page=${page}&language=${language}`);
  },

  // Generic Media Videos
  getMediaVideos: <T = Record<string, unknown>>(mediaType: 'movie' | 'tv', id: number | string, language = 'en-US') => {
    return tmdbFetch<T>(`/${mediaType}/${id}/videos?language=${language}`);
  },

  // Backwards compatibility aliases
  getMovieDetails: <T = Record<string, unknown>>(id: number | string, language = 'en-US') =>
    TmdbApi.getMediaDetails<T>('movie', id, language),
  getMovieCredits: <T = Record<string, unknown>>(id: number | string, language = 'en-US') =>
    TmdbApi.getMediaCredits<T>('movie', id, language),
  getMovieRecommendations: <T = Record<string, unknown>>(id: number | string, page = 1, language = 'en-US') =>
    TmdbApi.getMediaRecommendations<T>('movie', id, page, language),
  getMovieSimilar: <T = Record<string, unknown>>(id: number | string, page = 1, language = 'en-US') =>
    TmdbApi.getMediaSimilar<T>('movie', id, page, language),
  getMovieVideos: <T = Record<string, unknown>>(id: number | string, language = 'en-US') =>
    TmdbApi.getMediaVideos<T>('movie', id, language),


  // Images (Logos, Backdrops)
  getImages: (mediaType: 'movie' | 'tv', id: number | string, language = 'en-US') => {
    const includeLanguage = getImageLanguageParam(language);
    return tmdbFetch<{ logos?: { file_path: string; iso_639_1?: string }[] }>(
      `/${mediaType}/${id}/images?include_image_language=${includeLanguage}`
    );
  },

  // TV Season Details
  getTvSeasonDetails: <T = Record<string, unknown>>(
    tvId: number | string,
    seasonNumber: number,
    language = 'en-US'
  ) => {
    return tmdbFetch<T>(`/tv/${tvId}/season/${seasonNumber}?language=${language}`);
  },
};