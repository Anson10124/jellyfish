'use client';

import { useState, useCallback } from 'react';
import { useServerConfig } from '@/hooks/use-server-config';
import { JellyfinService } from '@/services/jellyfin.service';
import { ticksToSeconds } from '@/lib/utils/media-format';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
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

  const playMovie = useCallback(
    ({ jellyfinItem, title, posterUrl }: PlayMovieOptions) => {
      if (!jellyfinConfig || !jellyfinItem?.Id) return;

      const src = JellyfinService.getStreamUrl(
        jellyfinConfig.serverUrl,
        jellyfinItem.Id,
        jellyfinConfig.accessToken,
        jellyfinItem
      );
      const initialTimeInSeconds = ticksToSeconds(jellyfinItem?.UserData?.PlaybackPositionTicks);

      setActiveVideo({
        src,
        title,
        poster: posterUrl,
        initialTimeInSeconds,
        itemId: jellyfinItem.Id,
      });
    },
    [jellyfinConfig]
  );

  const playEpisode = useCallback(
    ({ jellyfinItem, seriesTitle, episode, posterUrl }: PlayEpisodeOptions) => {
      if (!jellyfinConfig || !jellyfinItem?.Id) return;

      const src = JellyfinService.getStreamUrl(
        jellyfinConfig.serverUrl,
        jellyfinItem.Id,
        jellyfinConfig.accessToken
      );

      const title = `${seriesTitle} - S${episode.season_number} E${episode.episode_number}: ${episode.name}`;
      const poster = getTmdbImage(episode.still_path || posterUrl, 'original');

      setActiveVideo({
        src,
        title,
        poster,
        initialTimeInSeconds: 0,
        itemId: jellyfinItem.Id,
      });
    },
    [jellyfinConfig]
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
