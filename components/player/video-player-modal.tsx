'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import '@videojs/react/video/skin.css';
import { createPlayer } from '@videojs/react';
import { VideoSkin, Video, videoFeatures } from '@videojs/react/video';
import { HlsJsVideo } from '@videojs/react/media/hlsjs-video';
import { useJellyfinPlayback } from '@/hooks/media/use-jellyfin-playback';
import { useScrollLock } from '@/hooks/ui/use-scroll-lock';
import { getStoredPlayerConfig, setStoredPlayerConfig } from '@/lib/storage/player-storage';
import type { VideoPlayerModalProps } from '@/types/player';

const Player = createPlayer({ features: videoFeatures });

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
  onFallbackTranscode,
}: VideoPlayerModalProps) {
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

  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number | null>(() => {
    const defaultSub = subtitles?.find((s) => s.isDefault);
    return defaultSub ? defaultSub.index : null;
  });

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
    }
  };

  const handleClose = () => {
    handleStop();
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  if (!isPlayerOpen || !src) return null;

  const isHls = Boolean(src && src.includes('.m3u8'));
  const VideoComponent = (isHls ? HlsJsVideo : Video) as React.ElementType;

  const sharedVideoProps = {
    ref: videoRef,
    src,
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