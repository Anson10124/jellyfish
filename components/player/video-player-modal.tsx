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
import { getStoredPlayerConfig, setStoredPlayerConfig } from '@/lib/storage/player-storage';
import { getStoredDeviceId } from '@/lib/storage/server-storage';
import type { VideoPlayerModalProps, AudioTrack } from '@/types/player';

const Player = createPlayer({ features: videoFeatures });

function generatePlaySessionId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function buildTranscodeUrl(
  base: string,
  itemId: string,
  mediaSourceId: string,
  audioStreamIndex: number,
  token: string
): string {
  const deviceId = getStoredDeviceId();
  const params = new URLSearchParams({
    DeviceId: deviceId,
    MediaSourceId: mediaSourceId,
    PlaySessionId: generatePlaySessionId(),
    AudioStreamIndex: audioStreamIndex.toString(),
    VideoCodec: 'av1,hevc,h264,vp9',
    AudioCodec: 'aac',
    VideoBitrate: '140000000',
    AudioBitrate: '384000',
    TranscodingMaxAudioChannels: '2',
    MaxAudioChannels: '2',
    RequireAvc: 'false',
    EnableAudioVbrEncoding: 'true',
    SegmentContainer: 'mp4',
    MinSegments: '1',
    BreakOnNonKeyFrames: 'false',
    api_key: token,
  });
  return `${base}/videos/${itemId}/master.m3u8?${params.toString()}`;
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

    const $state = (store as any).$state as { patch: (partial: Record<string, unknown>) => void };

    const inject = () => {
      const current = (store as any).audioTrackList as any[] | undefined;
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

    const unsubscribe = store.subscribe(() => {
      inject();
    });

    return () => {
      unsubscribe();
    };
  }, [store, audioTracks.length, selectedAudioIndex]);

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
  subtitles: propSubtitles,
  audioTracks: propAudioTracks,
  onFallbackTranscode,
}: VideoPlayerModalProps) {
  const { jellyfinConfig } = useServerConfig();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isPlayerOpen = isOpen ?? Boolean(activeVideo);
  const src = activeVideo?.src ?? propSrc;
  const title = activeVideo?.title ?? propTitle;
  const poster = activeVideo?.poster ?? propPoster;
  const initialTimeInSeconds = activeVideo?.initialTimeInSeconds ?? propInitialTime;
  const itemId = activeVideo?.itemId ?? propItemId;
  const playMethod = activeVideo?.playMethod ?? propPlayMethod;
  const subtitles = activeVideo?.subtitles ?? propSubtitles;
  const audioTracks = activeVideo?.audioTracks ?? propAudioTracks;

  const [overrideSrc, setOverrideSrc] = useState<string | null>(null);

  useEffect(() => {
    setOverrideSrc(null);
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

  const switchAudioTrack = useCallback(
    (track: AudioTrack) => {
      if (track.index === selectedAudioIndex) return;

      setSelectedAudioIndex(track.index);

      const video = videoRef.current;
      if (!video || !jellyfinConfig || !itemId) return;

      const currentTime = video.currentTime;
      const base = jellyfinConfig.serverUrl.replace(/\/$/, '');
      const mediaSourceId = activeVideo?.mediaSourceId || itemId;

      const newUrl = buildTranscodeUrl(base, itemId, mediaSourceId, track.index, jellyfinConfig.accessToken);
      setOverrideSrc(newUrl);

      const restoreTime = () => {
        if (currentTime > 0 && video.duration && currentTime < video.duration) {
          video.currentTime = currentTime;
        }
        video.removeEventListener('loadedmetadata', restoreTime);
      };
      video.addEventListener('loadedmetadata', restoreTime);
    },
    [selectedAudioIndex, jellyfinConfig, itemId, activeVideo?.mediaSourceId]
  );

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
    if (initialTimeInSeconds > 0 && initialTimeInSeconds < video.duration) {
      video.currentTime = initialTimeInSeconds;
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
      const transcodeUrl = JellyfinService.getStreamUrl(
        jellyfinConfig.serverUrl,
        itemId,
        jellyfinConfig.accessToken
      );
      setOverrideSrc(transcodeUrl);
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
            aria-label="Close video player"
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