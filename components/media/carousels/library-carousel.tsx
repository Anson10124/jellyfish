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
import { FolderOpen } from 'lucide-react';

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
    return null;
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
