'use client';

import React from 'react';
import { SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import type { CastMember, CrewMember } from '@/types/media';
import { CastCard } from '@/components/media/cards';
import { useEmblaNavigation } from '@/hooks/use-embla-navigation';
import { CarouselWrapper } from './carousel-wrapper';

export type CastOrCrewMember = CastMember | CrewMember;

interface CastCarouselProps {
  title?: string;
  subtitle?: string;
  cast: CastOrCrewMember[];
}

export function CastCarousel({
  title = 'Top Cast',
  subtitle,
  cast,
}: CastCarouselProps) {
  const { emblaRef, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  if (!cast || cast.length === 0) return null;

  return (
    <CarouselWrapper
      title={title}
      subtitle={subtitle}
      isBeginning={isBeginning}
      isEnd={isEnd}
      onPrev={handlePrev}
      onNext={handleNext}
      emblaRef={emblaRef}
    >
      {cast.map((item, index) => (
        <div key={`${item.id}-${index}`} className={SLIDE_WIDTH_CLASS}>
          <CastCard cast={item} />
        </div>
      ))}
    </CarouselWrapper>
  );
}

export default CastCarousel;
