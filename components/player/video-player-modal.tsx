'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import '@videojs/react/video/skin.css';
import { createPlayer } from '@videojs/react';
import { VideoSkin, Video, videoFeatures } from '@videojs/react/video';
import { HlsJsVideo } from '@videojs/react/media/hlsjs-video';
import { useJellyfinPlayback } from '@/hooks/media/use-jellyfin-playback';
import { useServerConfig } from '@/hooks/connect/use-server-config';
import { JellyfinService } from '@/services/jellyfin.service';
import { useScrollLock } from '@/hooks/ui/use-scroll-lock';
import { useTranslation } from '@/hooks/ui/use-translation';
import { getStoredPlayerConfig, setStoredPlayerConfig } from '@/lib/storage/player-storage';
import { getStoredDeviceId } from '@/lib/storage/server-storage';
import { toast } from '@/components/ui/toast';
import { QUALITY_OPTIONS, getFilteredQualityOptions, type VideoPlayerModalProps, type AudioTrack, type QualityOptionId, type QualityOption } from '@/types/player';

const Player = createPlayer({ features: videoFeatures });

interface VideoJsAudioTrack {
  id: string;
  kind: string;
  label: string;
  language: string;
  enabled: boolean;
}

interface VideoJsRendition {
  id: string;
  label?: string;
  height?: number;
  width?: number;
  bitrate?: number;
  selected?: boolean;
  active?: boolean;
}

interface VideoJsPlayerStoreState {
  audioTrackList?: VideoJsAudioTrack[];
  selectAudioTrack?: (value: string) => void;
  videoRenditionList?: VideoJsRendition[];
  selectVideoRendition?: (value: string) => void;
}

interface VideoJsPlayerStore {
  $state: {
    patch: (partial: Partial<VideoJsPlayerStoreState> | Record<string, unknown>) => void;
  };
  audioTrackList?: VideoJsAudioTrack[];
  videoRenditionList?: VideoJsRendition[];
  subscribe: (callback: () => void) => () => void;
}

interface JellyfinAudioBridgeProps {
  audioTracks: AudioTrack[];
  selectedAudioIndex: number;
  onSelectTrack: (track: AudioTrack) => void;
}

function JellyfinAudioBridge({ audioTracks, selectedAudioIndex, onSelectTrack }: JellyfinAudioBridgeProps) {
  const store = Player.usePlayer();

  const onSelectTrackRef = useRef(onSelectTrack);
  onSelectTrackRef.current = onSelectTrack;
  const audioTracksRef = useRef(audioTracks);
  audioTracksRef.current = audioTracks;
  const selectedAudioIndexRef = useRef(selectedAudioIndex);
  selectedAudioIndexRef.current = selectedAudioIndex;

  useEffect(() => {
    if (!store || audioTracks.length <= 1) return;

    const typedStore = store as unknown as VideoJsPlayerStore;
    const $state = typedStore.$state;

    const inject = () => {
      const current = typedStore.audioTrackList;
      const needsInject =
        !current ||
        current.length !== audioTracksRef.current.length ||
        current.some(
          (t, i) =>
            t.id !== String(audioTracksRef.current[i].index) ||
            t.enabled !== (audioTracksRef.current[i].index === selectedAudioIndexRef.current)
        );

      if (needsInject) {
        $state.patch({
          audioTrackList: audioTracksRef.current.map((t) => ({
            id: String(t.index),
            kind: 'main',
            label: t.title,
            language: t.language,
            enabled: t.index === selectedAudioIndexRef.current,
          })),
          selectAudioTrack: (value: string) => {
            const track = audioTracksRef.current.find((t) => String(t.index) === value);
            if (track) onSelectTrackRef.current(track);
          },
        });
      }
    };

    inject();

    const unsubscribe = typedStore.subscribe(() => {
      inject();
    });

    return () => {
      unsubscribe();
    };
  }, [store, audioTracks.length, selectedAudioIndex]);

  return null;
}

interface JellyfinQualityBridgeProps {
  selectedQualityId: QualityOptionId;
  onSelectQuality: (qualityId: QualityOptionId) => void;
  sourceWidth?: number;
  sourceHeight?: number;
  sourceBitrate?: number;
}

function JellyfinQualityBridge({
  selectedQualityId,
  onSelectQuality,
  sourceWidth,
  sourceHeight,
  sourceBitrate,
}: JellyfinQualityBridgeProps) {
  const store = Player.usePlayer();

  const onSelectQualityRef = useRef(onSelectQuality);
  onSelectQualityRef.current = onSelectQuality;
  const selectedQualityIdRef = useRef(selectedQualityId);
  selectedQualityIdRef.current = selectedQualityId;

  const filteredOptions = React.useMemo(
    () => getFilteredQualityOptions(sourceWidth, sourceHeight, sourceBitrate),
    [sourceWidth, sourceHeight, sourceBitrate]
  );
  const nonAutoOptions = React.useMemo(
    () => filteredOptions.filter((q: QualityOption) => q.id !== 'auto'),
    [filteredOptions]
  );
  const filteredOptionsRef = useRef(filteredOptions);
  filteredOptionsRef.current = filteredOptions;

  useEffect(() => {
    if (!store) return;

    const typedStore = store as unknown as VideoJsPlayerStore;
    const $state = typedStore.$state;

    const inject = () => {
      const current = typedStore.videoRenditionList;
      const needsInject =
        !current ||
        current.length !== nonAutoOptions.length ||
        current.some(
          (r, i) =>
            r.id !== nonAutoOptions[i].id ||
            r.selected !== (nonAutoOptions[i].id === selectedQualityIdRef.current)
        );

      if (needsInject) {
        $state.patch({
          videoRenditionList: nonAutoOptions.map((q: QualityOption) => ({
            id: q.id,
            label: q.label,
            height: q.maxHeight,
            bitrate: q.bitrate,
            selected: q.id === selectedQualityIdRef.current,
          })),
          selectVideoRendition: (value: string) => {
            const opt = filteredOptionsRef.current.find((q: QualityOption) => q.id === value);
            if (opt) {
              onSelectQualityRef.current(opt.id);
            } else if (value === 'auto') {
              onSelectQualityRef.current('auto');
            }
          },
        });
      }
    };

    inject();

    const unsubscribe = typedStore.subscribe(() => {
      inject();
    });

    return () => {
      unsubscribe();
    };
  }, [store, selectedQualityId, nonAutoOptions]);

  return null;
}

export function VideoPlayerModal({
  isOpen,
  onClose,
  activeVideo,
  src: propSrc,
  title: propTitle,
  poster: propPoster,
  initialTimeInSeconds: propInitialTime = 0,
  itemId: propItemId,
  playMethod: propPlayMethod,
  sourceWidth: propSourceWidth,
  sourceHeight: propSourceHeight,
  sourceBitrate: propSourceBitrate,
  subtitles: propSubtitles,
  audioTracks: propAudioTracks,
  onFallbackTranscode,
}: VideoPlayerModalProps) {
  const { t } = useTranslation();
  const { jellyfinConfig } = useServerConfig();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const restoreTimeListenerRef = useRef<(() => void) | null>(null);

  const isPlayerOpen = isOpen ?? Boolean(activeVideo);
  const src = activeVideo?.src ?? propSrc;
  const title = activeVideo?.title ?? propTitle;
  const poster = activeVideo?.poster ?? propPoster;
  const initialTimeInSeconds = activeVideo?.initialTimeInSeconds ?? propInitialTime;
  const itemId = activeVideo?.itemId ?? propItemId;
  const playMethod = activeVideo?.playMethod ?? propPlayMethod;
  const sourceWidth = activeVideo?.sourceWidth ?? propSourceWidth;
  const sourceHeight = activeVideo?.sourceHeight ?? propSourceHeight;
  const sourceBitrate = activeVideo?.sourceBitrate ?? propSourceBitrate;
  const subtitles = activeVideo?.subtitles ?? propSubtitles;
  const audioTracks = activeVideo?.audioTracks ?? propAudioTracks;

  const [overrideSrc, setOverrideSrc] = useState<string | null>(null);
  const [selectedQualityId, setSelectedQualityId] = useState<QualityOptionId>(() => {
    return getStoredPlayerConfig().preferredQuality;
  });

  const hasAppliedInitialTimeRef = useRef(false);
  const pendingSeekTimeRef = useRef<number | null>(null);
  const cleanupRestoreListenerRef = useRef<(() => void) | null>(null);

  const availableOptions = React.useMemo(
    () => getFilteredQualityOptions(sourceWidth, sourceHeight, sourceBitrate),
    [sourceWidth, sourceHeight, sourceBitrate]
  );

  useEffect(() => {
    const isOptionValid = availableOptions.some((q) => q.id === selectedQualityId);
    if (!isOptionValid) {
      setSelectedQualityId('auto');
    }
  }, [availableOptions, selectedQualityId]);

  useEffect(() => {
    setOverrideSrc(null);
    hasAppliedInitialTimeRef.current = false;
    pendingSeekTimeRef.current = null;
  }, [src]);

  const effectiveSrc = overrideSrc || src;
  const isHls = Boolean(effectiveSrc && effectiveSrc.includes('.m3u8'));

  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number | null>(() => {
    const defaultSub = subtitles?.find((s) => s.isDefault);
    return defaultSub ? defaultSub.index : null;
  });

  const hasMultipleAudio = audioTracks && audioTracks.length > 1;
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number>(() => {
    const defaultTrack = audioTracks?.find((t) => t.isDefault) ?? audioTracks?.[0];
    return defaultTrack?.index ?? 0;
  });

  useEffect(() => {
    const defaultTrack = audioTracks?.find((t) => t.isDefault) ?? audioTracks?.[0];
    setSelectedAudioIndex(defaultTrack?.index ?? 0);
  }, [src, audioTracks]);

  const prepareTimeRestoration = useCallback((targetTime: number) => {
    const video = videoRef.current;
    if (!video || targetTime <= 0) return;

    pendingSeekTimeRef.current = targetTime;

    if (cleanupRestoreListenerRef.current) {
      cleanupRestoreListenerRef.current();
    }

    const restoreTime = () => {
      const seekTo = pendingSeekTimeRef.current;
      if (seekTo !== null && seekTo > 0 && videoRef.current) {
        try {
          videoRef.current.currentTime = seekTo;
        } catch (err) {
          console.warn('Failed to restore playhead position:', err);
        }
        pendingSeekTimeRef.current = null;
      }
    };

    video.addEventListener('loadedmetadata', restoreTime, { once: true });
    video.addEventListener('canplay', restoreTime, { once: true });

    cleanupRestoreListenerRef.current = () => {
      video.removeEventListener('loadedmetadata', restoreTime);
      video.removeEventListener('canplay', restoreTime);
      cleanupRestoreListenerRef.current = null;
    };
  }, []);

  const switchAudioTrack = useCallback(
    (track: AudioTrack) => {
      if (track.index === selectedAudioIndex) return;

      setSelectedAudioIndex(track.index);

      const video = videoRef.current;
      if (!video || !jellyfinConfig || !itemId) return;

      const currentTime = video.currentTime;
      prepareTimeRestoration(currentTime);

      const mediaSourceId = activeVideo?.mediaSourceId || itemId;
      const opt = QUALITY_OPTIONS.find((q) => q.id === selectedQualityId);
      const newUrl = JellyfinService.getStreamUrl(
        jellyfinConfig.serverUrl,
        itemId,
        jellyfinConfig.accessToken,
        null,
        {
          videoBitrate: opt?.bitrate,
          maxHeight: opt?.maxHeight,
          audioStreamIndex: track.index,
          mediaSourceId,
        }
      );
      setOverrideSrc(newUrl);
    },
    [selectedAudioIndex, jellyfinConfig, itemId, activeVideo?.mediaSourceId, selectedQualityId, prepareTimeRestoration]
  );

  const changeQuality = useCallback(
    (qualityId: QualityOptionId) => {
      setSelectedQualityId(qualityId);
      setStoredPlayerConfig({ preferredQuality: qualityId });

      const video = videoRef.current;
      if (!video || !jellyfinConfig || !itemId) return;

      const currentTime = video.currentTime;
      prepareTimeRestoration(currentTime);

      const opt = QUALITY_OPTIONS.find((q) => q.id === qualityId);
      const mediaSourceId = activeVideo?.mediaSourceId || itemId;

      if (qualityId === 'auto' || !opt?.bitrate) {
        setOverrideSrc(null);
      } else {
        const newUrl = JellyfinService.getStreamUrl(
          jellyfinConfig.serverUrl,
          itemId,
          jellyfinConfig.accessToken,
          null,
          {
            videoBitrate: opt.bitrate,
            maxHeight: opt.maxHeight,
            audioStreamIndex: selectedAudioIndex,
            mediaSourceId,
          }
        );
        setOverrideSrc(newUrl);
      }
    },
    [jellyfinConfig, itemId, activeVideo?.mediaSourceId, selectedAudioIndex, prepareTimeRestoration]
  );

  useEffect(() => {
    return () => {
      if (cleanupRestoreListenerRef.current) {
        cleanupRestoreListenerRef.current();
      }
    };
  }, []);

  useScrollLock(isPlayerOpen);

  const { handleStart, handleTimeUpdate, handleStateChange, handleStop } = useJellyfinPlayback({
    itemId,
    isOpen: isPlayerOpen,
    playMethod,
  });

  useEffect(() => {
    if (subtitles && subtitles.length > 0) {
      const defaultSub = subtitles.find((s) => s.isDefault);
      setSelectedSubtitleIndex(defaultSub ? defaultSub.index : null);
    } else {
      setSelectedSubtitleIndex(null);
    }
  }, [subtitles, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitles || subtitles.length === 0) return;

    const textTracks = video.textTracks;
    if (!textTracks) return;

    const handleTrackChange = () => {
      for (let i = 0; i < textTracks.length; i++) {
        const track = textTracks[i];
        if (track.mode === 'showing') {
          const subByIndex = subtitles[i];
          if (subByIndex) {
            setSelectedSubtitleIndex((prev: number | null) => (prev !== subByIndex.index ? subByIndex.index : prev));
            return;
          }
          const matchedByTitle = subtitles.find((s) => s.title === track.label);
          if (matchedByTitle) {
            setSelectedSubtitleIndex((prev: number | null) => (prev !== matchedByTitle.index ? matchedByTitle.index : prev));
            return;
          }
        }
      }
      setSelectedSubtitleIndex((prev: number | null) => (prev !== null ? null : prev));
    };

    textTracks.addEventListener('change', handleTrackChange);
    return () => {
      textTracks.removeEventListener('change', handleTrackChange);
    };
  }, [subtitles]);

  useEffect(() => {
    if (!isPlayerOpen || !videoRef.current) return;
    const video = videoRef.current;
    const { volume, muted } = getStoredPlayerConfig();
    video.volume = volume;
    video.muted = muted;
  }, [isPlayerOpen, src]);

  useEffect(() => {
    if (!isPlayerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleStop();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerOpen, onClose, handleStop]);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const { volume, muted } = getStoredPlayerConfig();
    video.volume = volume;
    video.muted = muted;

    if (!hasAppliedInitialTimeRef.current) {
      hasAppliedInitialTimeRef.current = true;
      if (initialTimeInSeconds > 0 && video.duration && initialTimeInSeconds < video.duration) {
        video.currentTime = initialTimeInSeconds;
      }
    }
  };

  const handleVolumeChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setStoredPlayerConfig({
      volume: video.volume,
      muted: video.muted,
    });
  };

  const handlePlayEvent = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    handleStart(e.currentTarget.currentTime);
    handleStateChange(false);
  };

  const handlePauseEvent = () => {
    handleStateChange(true);
  };

  const handleEndedEvent = () => {
    handleStateChange(true);
    handleStop();
  };

  const handleErrorEvent = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('Video player error event:', e.currentTarget.error);
    if (onFallbackTranscode) {
      onFallbackTranscode();
    } else if (jellyfinConfig && itemId && effectiveSrc && !effectiveSrc.includes('.m3u8')) {
      console.warn('DirectPlay failed in browser, attempting HLS transcode fallback...');
      toast.info(title || 'Playback', 'DirectPlay failed, switching to transcoding fallback...');
      const transcodeUrl = JellyfinService.getStreamUrl(
        jellyfinConfig.serverUrl,
        itemId,
        jellyfinConfig.accessToken
      );
      setOverrideSrc(transcodeUrl);
    } else {
      toast.error(
        t('errors.playbackError', 'Failed to load video playback stream.'),
        e.currentTarget.error?.message
      );
    }
  };

  const handleClose = () => {
    handleStop();
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  if (!isPlayerOpen || !effectiveSrc) return null;

  const VideoComponent = (isHls ? HlsJsVideo : Video) as React.ElementType;

  const sharedVideoProps = {
    ref: videoRef,
    src: effectiveSrc,
    poster,
    crossOrigin: 'anonymous' as const,
    playsInline: true,
    autoPlay: true,
    onLoadedMetadata: handleLoadedMetadata,
    onVolumeChange: handleVolumeChange,
    onPlay: handlePlayEvent,
    onPause: handlePauseEvent,
    onEnded: handleEndedEvent,
    onError: handleErrorEvent,
    onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) =>
      handleTimeUpdate(e.currentTarget.currentTime),
    className: 'w-full h-full object-contain bg-black',
  };

  return (
    <AnimatePresence>
      <div
        ref={containerRef}
        className="fixed inset-0 z-[100] w-screen h-screen bg-black flex flex-col justify-center items-center overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-5 transition-opacity duration-300 pointer-events-auto">
          <h2 className="text-base sm:text-lg font-semibold text-white truncate max-w-2xl drop-shadow-md">
            {title}
          </h2>

          <button
            onClick={handleClose}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer backdrop-blur-md"
            aria-label={t('player.closeVideoPlayer', 'Close video player')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full h-full flex items-center justify-center bg-black"
        >
          <Player.Provider>
            {hasMultipleAudio && (
              <JellyfinAudioBridge
                audioTracks={audioTracks!}
                selectedAudioIndex={selectedAudioIndex}
                onSelectTrack={switchAudioTrack}
              />
            )}

            <JellyfinQualityBridge
              selectedQualityId={selectedQualityId}
              onSelectQuality={changeQuality}
              sourceWidth={sourceWidth}
              sourceHeight={sourceHeight}
              sourceBitrate={sourceBitrate}
            />

            <VideoSkin className="w-full h-full border-none rounded-none bg-black">
              <VideoComponent {...sharedVideoProps}>
                {subtitles?.map((sub) => {
                  const isSelected = selectedSubtitleIndex === sub.index;
                  return (
                    <track
                      key={sub.index}
                      kind="subtitles"
                      src={isSelected ? sub.vttUrl : undefined}
                      srcLang={sub.language}
                      label={sub.title}
                      default={sub.isDefault}
                    />
                  );
                })}
              </VideoComponent>
            </VideoSkin>
          </Player.Provider>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default VideoPlayerModal;