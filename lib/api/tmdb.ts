const API_BASE_URL = '/api/tmdb';

export async function tmdbFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  return response.json();
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
    page = 1
  ) => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/trending/${mediaType}/${timeWindow}?page=${page}`);
  },

  // Popular Movies
  getPopularMovies: <T = Record<string, unknown>>(page = 1) => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/movie/popular?page=${page}`);
  },

  // Popular TV Shows
  getPopularTV: <T = Record<string, unknown>>(page = 1) => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/tv/popular?page=${page}`);
  },

  // Discover by Genre
  getByGenre: <T = Record<string, unknown>>(
    mediaType: 'movie' | 'tv' = 'movie',
    genreId: number,
    page = 1
  ) => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/discover/${mediaType}?with_genres=${genreId}&page=${page}`);
  },

  // Search
  searchMulti: <T = Record<string, unknown>>(query: string, page = 1) => {
    return tmdbFetch<TmdbPaginatedResponse<T>>(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`);
  },
};