'use client';

import React from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { useTranslation } from '@/hooks/ui/use-translation';
import { formatTimeLeft } from '@/lib/utils/media-format';
import type { JellyfinBaseItem } from '@/types/jellyfin';

export interface PlayButtonProps {
  jellyfinItem?: JellyfinBaseItem | null;
  episodes?: JellyfinBaseItem[];
  onClick: () => void;
  className?: string;
}

export function PlayButton({
  jellyfinItem,
  episodes = [],
  onClick,
  className = '',
}: PlayButtonProps) {
  const { t } = useTranslation();

  const getWatchStatus = () => {
    if (!jellyfinItem) return 'watchNow';

    if (episodes && episodes.length > 0) {
      const hasEpisodeInProgress = episodes.some(
        (ep) => (ep.UserData?.PlaybackPositionTicks ?? 0) > 0
      );
      if (hasEpisodeInProgress) {
        return 'resume';
      }

      const hasFinished = jellyfinItem.UserData?.Played || episodes.every((ep) => ep.UserData?.Played);
      if (hasFinished) {
        return 'watchAgain';
      }

      const hasStarted = episodes.some((ep) => ep.UserData?.Played);
      if (hasStarted) {
        return 'resume';
      }

      return 'watchNow';
    }

    if (jellyfinItem.UserData) {
      if (jellyfinItem.UserData.PlaybackPositionTicks && jellyfinItem.UserData.PlaybackPositionTicks > 0) {
        return 'resume';
      }
      if (jellyfinItem.UserData.Played) {
        return 'watchAgain';
      }
    }

    return 'watchNow';
  };

  const status = getWatchStatus();
  let icon = <Play className="h-4 w-4 fill-current" />;
  let label = t('common.watchNow', 'Watch Now');

  if (status === 'resume') {
    let timeLeft: string | null = null;
    if (episodes && episodes.length > 0) {
      // Find the episode in progress to get time left, if available
      const resumeEp = episodes.find((ep) => (ep.UserData?.PlaybackPositionTicks ?? 0) > 0);
      timeLeft = resumeEp?.RunTimeTicks && resumeEp.UserData?.PlaybackPositionTicks
        ? formatTimeLeft(resumeEp.UserData.PlaybackPositionTicks, resumeEp.RunTimeTicks)
        : null;
    } else if (jellyfinItem) {
      timeLeft = jellyfinItem.RunTimeTicks && jellyfinItem.UserData?.PlaybackPositionTicks
        ? formatTimeLeft(jellyfinItem.UserData.PlaybackPositionTicks, jellyfinItem.RunTimeTicks)
        : null;
    }
    label = timeLeft ? `${t('common.resume', 'Resume')} • ${timeLeft}` : t('common.resume', 'Resume');
  } else if (status === 'watchAgain') {
    icon = <RotateCcw className="h-4 w-4" />;
    label = t('common.watchAgain', 'Watch Again');
  }

  const defaultClasses = "inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold shadow-none transition hover:bg-primary/90 active:scale-[0.98] text-primary-foreground cursor-pointer";

  return (
    <button
      type="button"
      onClick={onClick}
      className={className || defaultClasses}
    >
      {icon}
      {label}
    </button>
  );
}

export default PlayButton;
