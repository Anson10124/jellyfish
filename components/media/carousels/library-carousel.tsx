'use client';

import React from 'react';
import { EPISODE_SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import { LibraryCard } from '@/components/media/cards/library-card';
import { CarouselHeader } from './carousel-header';
import { CarouselWrapper } from './carousel-wrapper';
import { useJellyfinLibraries } from '@/hooks/media/use-jellyfin-libraries';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';
import { LandscapeCarouselSkeletonList } from './carousel-skeleton';
import { useTranslation } from '@/hooks/ui/use-translation';
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
        <LandscapeCarouselSkeletonList count={4} />
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
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-14 xl:px-16 2xl:px-20 py-8 my-4 text-center text-foreground/50 text-sm flex flex-col items-center gap-2">
        <FolderOpen className="w-8 h-8 text-foreground/30" />
        <h3 className="font-semibold text-foreground">{carouselTitle}</h3>
        <p>{t('library.noLibraries', 'No media libraries found on your Jellyfin server.')}</p>
      </div>
    );
  }

  return (
    <CarouselWrapper
      title={carouselTitle}
      subtitle={`${libraries.length} ${libraries.length === 1 ? t('library.libraryCount', 'library') : t('library.librariesCount', 'libraries')}`}
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
