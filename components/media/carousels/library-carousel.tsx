'use client';

import React from 'react';
import { EPISODE_SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import { LibraryCard } from '@/components/media/cards/library-card';
import { CarouselHeader } from './carousel-header';
import { CarouselWrapper } from './carousel-wrapper';
import { useJellyfinLibraries } from '@/hooks/use-jellyfin-libraries';
import { useEmblaNavigation } from '@/hooks/use-embla-navigation';
import { Skeleton } from '@/components/ui';
import { useTranslation } from '@/hooks/use-translation';
import Link from 'next/link';
import { Cable, FolderOpen } from 'lucide-react';

export interface LibraryCarouselProps {
  title?: string;
}

export function LibraryCarousel({ title }: LibraryCarouselProps) {
  const { t } = useTranslation();
  const { libraries, loading, isConnected, serverUrl } = useJellyfinLibraries();
  const { emblaRef, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  const carouselTitle = title || t('library.mediaLibraries', 'Media Libraries');

  // skeleton
  if (loading) {
    return (
      <div className="w-full overflow-x-clip my-6">
        <CarouselHeader title={carouselTitle} onPrev={() => {}} onNext={() => {}} isPrevDisabled isNextDisabled />
        <div className="flex gap-4 px-4 sm:px-8 md:px-12 lg:px-14 xl:px-16 2xl:px-20 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[260px] sm:w-[300px] md:w-[340px] xl:w-[380px] shrink-0 space-y-2">
              <Skeleton className="w-full aspect-[16/9] rounded-xl bg-white/5" />
              <Skeleton className="h-4 w-3/4 bg-white/5" />
              <Skeleton className="h-3 w-1/2 bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Case 1: User is not connected to Jellyfin server yet
  if (!isConnected) {
    return (
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-14 xl:px-16 2xl:px-20 py-8 my-4 rounded-2xl bg-[#141419]/60 border border-white/10 text-center max-w-2xl mx-auto flex flex-col items-center justify-center space-y-4">
        <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Cable className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">{t('library.connectPromptTitle', 'Connect Your Jellyfin Server')}</h3>
          <p className="text-sm text-neutral-400 max-w-md">
            {t('library.connectPromptDesc', 'Connect your Jellyfin server to access your personal movies, TV shows, and music libraries directly.')}
          </p>
        </div>
        <Link
          href="/connect"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition-all duration-200 shadow-lg shadow-emerald-500/20"
        >
          <span>{t('nav.connect', 'Connect Server')}</span>
        </Link>
      </div>
    );
  }

  // Case 2: Connected but no libraries found
  if (!libraries || libraries.length === 0) {
    return (
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-14 xl:px-16 2xl:px-20 py-8 my-4 text-center text-white/50 text-sm flex flex-col items-center gap-2">
        <FolderOpen className="w-8 h-8 text-neutral-500" />
        <h3 className="font-semibold text-white">{carouselTitle}</h3>
        <p>{t('library.noLibraries', 'No media libraries found on your Jellyfin server.')}</p>
      </div>
    );
  }

  return (
    <CarouselWrapper
      title={carouselTitle}
      subtitle={`${libraries.length} ${t('library.librariesCount', libraries.length === 1 ? 'library' : 'libraries')}`}
      isBeginning={isBeginning}
      isEnd={isEnd}
      onPrev={handlePrev}
      onNext={handleNext}
      emblaRef={emblaRef}
    >
      {libraries.map((lib) => (
        <div key={lib.Id} className={EPISODE_SLIDE_WIDTH_CLASS}>
          <LibraryCard library={lib} serverUrl={serverUrl} />
        </div>
      ))}
    </CarouselWrapper>
  );
}

export default LibraryCarousel;
