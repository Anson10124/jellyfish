export interface MediaCategoryConfig {
  id: string;
  titleKey: string;
  defaultTitle: string;
  type?: 'popular' | 'trending' | 'top_rated';
  timeWindow?: 'day' | 'week';
  mediaType: 'movie' | 'tv' | 'all';
  genreId?: number;
  infinite?: boolean;
}

export function getMovieBrowseCategories(): MediaCategoryConfig[] {
  return [
    {
      id: 'trending-movies',
      titleKey: 'movies.trendingThisWeek',
      defaultTitle: 'Trending Movies This Week',
      type: 'trending',
      mediaType: 'movie',
      timeWindow: 'week',
      infinite: true,
    },
    {
      id: 'popular-movies',
      titleKey: 'movies.popular',
      defaultTitle: 'Popular Movies',
      type: 'popular',
      mediaType: 'movie',
      infinite: true,
    },
    {
      id: 'action-movies',
      titleKey: 'movies.action',
      defaultTitle: 'Action Blockbusters',
      genreId: 28,
      mediaType: 'movie',
      infinite: true,
    },
    {
      id: 'scifi-movies',
      titleKey: 'movies.sciFi',
      defaultTitle: 'Sci-Fi & Fantasy',
      genreId: 878,
      mediaType: 'movie',
      infinite: true,
    },
    {
      id: 'comedy-movies',
      titleKey: 'movies.comedy',
      defaultTitle: 'Comedy Hits',
      genreId: 35,
      mediaType: 'movie',
      infinite: true,
    },
    {
      id: 'horror-movies',
      titleKey: 'movies.horror',
      defaultTitle: 'Horror & Thriller',
      genreId: 27,
      mediaType: 'movie',
      infinite: true,
    },
    {
      id: 'drama-movies',
      titleKey: 'movies.drama',
      defaultTitle: 'Dramatic Masterpieces',
      genreId: 18,
      mediaType: 'movie',
      infinite: true,
    },
  ];
}

export function getTvBrowseCategories(): MediaCategoryConfig[] {
  return [
    {
      id: 'trending-tv',
      titleKey: 'tv.trendingThisWeek',
      defaultTitle: 'Trending Shows This Week',
      type: 'trending',
      mediaType: 'tv',
      timeWindow: 'week',
      infinite: true,
    },
    {
      id: 'popular-tv',
      titleKey: 'tv.popular',
      defaultTitle: 'Popular TV Shows',
      type: 'popular',
      mediaType: 'tv',
      infinite: true,
    },
    {
      id: 'action-tv',
      titleKey: 'tv.action',
      defaultTitle: 'Action & Adventure',
      genreId: 10759,
      mediaType: 'tv',
      infinite: true,
    },
    {
      id: 'scifi-tv',
      titleKey: 'tv.sciFi',
      defaultTitle: 'Sci-Fi & Fantasy',
      genreId: 10765,
      mediaType: 'tv',
      infinite: true,
    },
    {
      id: 'comedy-tv',
      titleKey: 'tv.comedy',
      defaultTitle: 'Comedy Series',
      genreId: 35,
      mediaType: 'tv',
      infinite: true,
    },
    {
      id: 'drama-tv',
      titleKey: 'tv.drama',
      defaultTitle: 'Dramatic Series',
      genreId: 18,
      mediaType: 'tv',
      infinite: true,
    },
    {
      id: 'mystery-tv',
      titleKey: 'tv.mystery',
      defaultTitle: 'Mystery & Crime',
      genreId: 9648,
      mediaType: 'tv',
      infinite: true,
    },
    {
      id: 'animation-tv',
      titleKey: 'tv.animation',
      defaultTitle: 'Animated Series',
      genreId: 16,
      mediaType: 'tv',
      infinite: true,
    },
  ];
}
