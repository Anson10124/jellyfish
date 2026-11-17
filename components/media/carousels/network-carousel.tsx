'use client';

import React from 'react';
import { NETWORK_SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import { FEATURED_NETWORKS } from '@/constants/networks';
import { NetworkCard } from '@/components/media/cards/network-card';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';
import { useTranslation } from '@/hooks/ui/use-translation';
import { CarouselWrapper } from './carousel-wrapper';

export interface NetworkCarouselProps {
  title?: string;
}

export function NetworkCarousel({ title }: NetworkCarouselProps) {
  const { t } = useTranslation();
  const { emblaRef, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  return (
    <CarouselWrapper
      title={title || t('network.networks', 'Networks')}
      isBeginning={isBeginning}
      isEnd={isEnd}
      onPrev={handlePrev}
      onNext={handleNext}
      emblaRef={emblaRef}
    >
      {FEATURED_NETWORKS.map((network) => (
        <div key={network.id} className={NETWORK_SLIDE_WIDTH_CLASS}>
          <NetworkCard id={network.id} fallbackName={network.name} />
        </div>
      ))}
    </CarouselWrapper>
  );
}

export default NetworkCarousel;
