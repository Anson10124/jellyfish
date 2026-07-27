'use client';

import { useState, useCallback } from 'react';
import { useServerConfig } from '@/hooks/use-server-config';
import { JellyfinService } from '@/services/jellyfin.service';
import { ticksToSeconds } from '@/lib/utils/media-format';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import type { JellyfinBaseItem } from '@/types/jellyfin';
import type { ActiveVideo, PlayMovieOptions, PlayEpisodeOptions } from '@/types/player';

export function usePlayer() {
  const { jellyfinConfig } = useServerConfig();
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const playVideo = useCallback((video: ActiveVideo) => {
    setActiveVideo(video);
  }, []);

  const closeVideo = useCallback(() => {
    setActiveVideo(null);
  }, []);

  const playTrailer = useCallback(() => {
    setIsTrailerOpen(true);
  }, []);

  const closeTrailer = useCallback(() => {
    setIsTrailerOpen(false);
  }, []);

  const resolveAndPlayMedia = useCallback(
    async (
      jellyfinItem: JellyfinBaseItem,
      title: string,
      poster?: string,
      initialTimeInSeconds: number = 0
    ) => {
      if (!jellyfinConfig || !jellyfinItem.Id) return;

      try {
        const source = await JellyfinService.getPlaybackSource(
          jellyfinConfig.serverUrl,
          jellyfinItem.Id,
          jellyfinConfig.accessToken,
          jellyfinConfig.userId
        );

        setActiveVideo({
          src: source.url,
          title,
          poster,
          initialTimeInSeconds,
          itemId: jellyfinItem.Id,
          playMethod: source.playMethod,
          mediaSourceId: source.mediaSourceId,
          isHls: source.isHls,
          subtitles: source.subtitles,
        });
      } catch (err) {
        console.warn('Failed to fetch PlaybackInfo, falling back to direct stream:', err);
        const fallbackUrl = JellyfinService.getStreamUrl(
          jellyfinConfig.serverUrl,
          jellyfinItem.Id,
          jellyfinConfig.accessToken,
          jellyfinItem
        );
        setActiveVideo({
          src: fallbackUrl,
          title,
          poster,
          initialTimeInSeconds,
          itemId: jellyfinItem.Id,
          playMethod: 'DirectPlay',
        });
      }
    },
    [jellyfinConfig]
  );

  const playMovie = useCallback(
    async ({ jellyfinItem, title, posterUrl }: PlayMovieOptions) => {
      if (!jellyfinItem?.Id) return;
      const initialTime = ticksToSeconds(jellyfinItem.UserData?.PlaybackPositionTicks);
      await resolveAndPlayMedia(jellyfinItem, title, posterUrl, initialTime);
    },
    [resolveAndPlayMedia]
  );

  const playEpisode = useCallback(
    async ({ jellyfinItem, seriesTitle, episode, posterUrl }: PlayEpisodeOptions) => {
      if (!jellyfinItem?.Id) return;
      const title = `${seriesTitle} - S${episode.season_number} E${episode.episode_number}: ${episode.name}`;
      const poster = getTmdbImage(episode.still_path || posterUrl, 'original');
      await resolveAndPlayMedia(jellyfinItem, title, poster, 0);
    },
    [resolveAndPlayMedia]
  );

  return {
    activeVideo,
    isTrailerOpen,
    playVideo,
    closeVideo,
    playTrailer,
    closeTrailer,
    playMovie,
    playEpisode,
  };
}

export default usePlayer;
