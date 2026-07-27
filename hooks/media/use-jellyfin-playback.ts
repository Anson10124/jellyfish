import { useEffect, useRef, useCallback } from 'react';
import { useServerConfig } from '@/hooks/connect/use-server-config';
import { JellyfinService } from '@/services/jellyfin.service';
import { secondsToTicks } from '@/lib/utils/media-format';

export interface UseJellyfinPlaybackOptions {
  itemId?: string;
  isOpen: boolean;
  playMethod?: 'DirectPlay' | 'Transcode' | 'DirectStream';
}

export function useJellyfinPlayback({ itemId, isOpen, playMethod = 'DirectPlay' }: UseJellyfinPlaybackOptions) {
  const { jellyfinConfig, isConnected } = useServerConfig();
  const currentTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const isStartedRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { serverUrl, accessToken } = jellyfinConfig || {};
  const canReport = Boolean(isConnected && serverUrl && accessToken && itemId && isOpen);

  const handleStart = useCallback(
    (initialTimeInSeconds: number = 0) => {
      if (!canReport || !serverUrl || !accessToken || !itemId) return;
      currentTimeRef.current = initialTimeInSeconds;
      isStartedRef.current = true;

      const ticks = secondsToTicks(initialTimeInSeconds);
      JellyfinService.reportPlaybackStart(serverUrl, accessToken, itemId, ticks, playMethod);
    },
    [canReport, serverUrl, accessToken, itemId, playMethod]
  );

  const handleTimeUpdate = useCallback((seconds: number) => {
    currentTimeRef.current = seconds;
  }, []);

  const handleStateChange = useCallback(
    (isPaused: boolean) => {
      isPausedRef.current = isPaused;
      if (canReport && serverUrl && accessToken && itemId && isStartedRef.current) {
        const ticks = secondsToTicks(currentTimeRef.current);
        JellyfinService.reportPlaybackProgress(serverUrl, accessToken, itemId, ticks, isPaused, playMethod);
      }
    },
    [canReport, serverUrl, accessToken, itemId, playMethod]
  );

  const handleStop = useCallback(() => {
    if (isStartedRef.current && serverUrl && accessToken && itemId) {
      const ticks = secondsToTicks(currentTimeRef.current);
      JellyfinService.reportPlaybackStopped(serverUrl, accessToken, itemId, ticks);
      isStartedRef.current = false;
    }
  }, [serverUrl, accessToken, itemId]);

  // Periodic heartbeat reporting playback progress every 5s
  useEffect(() => {
    if (!canReport || !serverUrl || !accessToken || !itemId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (isStartedRef.current) {
        const ticks = secondsToTicks(currentTimeRef.current);
        JellyfinService.reportPlaybackProgress(
          serverUrl,
          accessToken,
          itemId,
          ticks,
          isPausedRef.current,
          playMethod
        );
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [canReport, serverUrl, accessToken, itemId, playMethod]);

  // Stop reporting on unmount if still active
  useEffect(() => {
    return () => {
      if (isStartedRef.current && serverUrl && accessToken && itemId) {
        const ticks = secondsToTicks(currentTimeRef.current);
        JellyfinService.reportPlaybackStopped(serverUrl, accessToken, itemId, ticks);
        isStartedRef.current = false;
      }
    };
  }, [serverUrl, accessToken, itemId]);

  return {
    handleStart,
    handleTimeUpdate,
    handleStateChange,
    handleStop,
  };
}

export default useJellyfinPlayback;
