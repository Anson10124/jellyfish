'use client';

import { useState, useCallback } from 'react';
import { useServerConfig } from '@/hooks/connect/use-server-config';
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
          audioTracks: source.audioTracks,
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
      if (!jellyfinConfig || !jellyfinItem?.Id) return;

      let targetItem: JellyfinBaseItem | null = jellyfinItem;
      let displayTitle = title;

      if (jellyfinItem.Type === 'Series' || jellyfinItem.Type === 'Season') {
        const episodes = await JellyfinService.getEpisodesForSeries(
          jellyfinConfig.serverUrl,
          jellyfinConfig.userId,
          jellyfinConfig.accessToken,
          jellyfinItem.Id
        );

        if (episodes && episodes.length > 0) {
          const resumeEp = episodes.find((ep) => (ep.UserData?.PlaybackPositionTicks ?? 0) > 0);
          const unwatchedEp = episodes.find((ep) => !ep.UserData?.Played);
          targetItem = resumeEp || unwatchedEp || episodes[0];

          if (targetItem) {
            const sNum = targetItem.ParentIndexNumber ?? 1;
            const eNum = targetItem.IndexNumber ?? 1;
            const epName = targetItem.Name || 'Episode';
            displayTitle = `${title} - S${sNum} E${eNum}: ${epName}`;
          }
        }
      }

      if (!targetItem || !targetItem.Id) return;
      const initialTime = ticksToSeconds(targetItem.UserData?.PlaybackPositionTicks);
      await resolveAndPlayMedia(targetItem, displayTitle, posterUrl, initialTime);
    },
    [jellyfinConfig, resolveAndPlayMedia]
  );

  const playEpisode = useCallback(
    async ({ jellyfinItem, seriesTitle, episode, posterUrl }: PlayEpisodeOptions) => {
      if (!jellyfinConfig || !jellyfinItem?.Id) return;

      let targetItem: JellyfinBaseItem | null = jellyfinItem;

      if (jellyfinItem.Type === 'Series' || jellyfinItem.Type === 'Season' || jellyfinItem.Type !== 'Episode') {
        const episodeItem = await JellyfinService.findEpisodeItem(
          jellyfinConfig.serverUrl,
          jellyfinConfig.userId,
          jellyfinConfig.accessToken,
          jellyfinItem.Id,
          episode.season_number,
          episode.episode_number
        );
        if (episodeItem) {
          targetItem = episodeItem;
        }
      }

      if (!targetItem || !targetItem.Id) return;

      const title = `${seriesTitle} - S${episode.season_number} E${episode.episode_number}: ${episode.name || targetItem.Name || 'Episode'}`;
      const poster = getTmdbImage(episode.still_path || posterUrl, 'original');
      const initialTime = ticksToSeconds(targetItem.UserData?.PlaybackPositionTicks);
      await resolveAndPlayMedia(targetItem, title, poster, initialTime);
    },
    [jellyfinConfig, resolveAndPlayMedia]
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
