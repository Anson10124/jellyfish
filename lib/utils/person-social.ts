import type { PersonExternalIds } from '@/types/media';

export interface PersonSocialUrls {
  imdbUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
}

export function getPersonSocialUrls(
  externalIds?: PersonExternalIds,
  imdbId?: string | null
): PersonSocialUrls {
  const finalImdbId = imdbId || externalIds?.imdb_id;
  return {
    imdbUrl: finalImdbId ? `https://www.imdb.com/name/${finalImdbId}` : null,
    instagramUrl: externalIds?.instagram_id ? `https://instagram.com/${externalIds.instagram_id}` : null,
    twitterUrl: externalIds?.twitter_id ? `https://twitter.com/${externalIds.twitter_id}` : null,
    facebookUrl: externalIds?.facebook_id ? `https://facebook.com/${externalIds.facebook_id}` : null,
    tiktokUrl: externalIds?.tiktok_id ? `https://tiktok.com/@${externalIds.tiktok_id}` : null,
    youtubeUrl: externalIds?.youtube_id ? `https://youtube.com/${externalIds.youtube_id}` : null,
  };
}
