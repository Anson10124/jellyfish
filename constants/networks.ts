// TMDB network IDs shown in the "Networks" row on the TV browse page.
// Names are fallbacks only; the real name and logo come from /network/{id}.
export interface FeaturedNetwork {
  id: number;
  name: string;
}

export const FEATURED_NETWORKS: FeaturedNetwork[] = [
  { id: 213, name: 'Netflix' },
  { id: 2552, name: 'Apple TV' },
  { id: 49, name: 'HBO' },
  { id: 2739, name: 'Disney+' },
  { id: 1024, name: 'Prime Video' },
  { id: 453, name: 'Hulu' },
  { id: 3186, name: 'HBO Max' },
  { id: 4330, name: 'Paramount+' },
  { id: 3353, name: 'Peacock' },
  { id: 1112, name: 'Crunchyroll' },
  { id: 88, name: 'FX' },
  { id: 174, name: 'AMC' },
  { id: 67, name: 'Showtime' },
  { id: 4, name: 'BBC One' },
];

export type NetworkSort = 'popular' | 'top_rated' | 'newest';

export const NETWORK_SORT_QUERIES: Record<NetworkSort, string> = {
  popular: 'sort_by=popularity.desc',
  top_rated: 'sort_by=vote_average.desc&vote_count.gte=200',
  newest: 'sort_by=first_air_date.desc&vote_count.gte=5',
};
