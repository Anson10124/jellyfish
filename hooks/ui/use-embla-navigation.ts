'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType, EmblaPluginType, EmblaCarouselType } from 'embla-carousel';

import { getLayoutOffsetPx } from '@/constants/carousel';

export interface UseEmblaNavigationOptions {
  options?: EmblaOptionsType;
  plugins?: EmblaPluginType[];
  onScroll?: (emblaApi: EmblaCarouselType) => void;
}

export function useEmblaNavigation(config?: UseEmblaNavigationOptions) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      dragFree: true,
      align: () => getLayoutOffsetPx(),
      containScroll: 'trimSnaps',
      ...config?.options,
    },
    config?.plugins
  );

  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const updateEdgeState = useCallback(() => {
    if (!emblaApi) return;
    setIsBeginning(!emblaApi.canScrollPrev());
    setIsEnd(!emblaApi.canScrollNext());

    if (config?.onScroll) {
      config.onScroll(emblaApi);
    }
  }, [emblaApi, config]);

  const handlePrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const handleNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    Promise.resolve().then(() => {
      updateEdgeState();
    });
    emblaApi.on('select', updateEdgeState);
    emblaApi.on('reInit', updateEdgeState);
    emblaApi.on('scroll', updateEdgeState);

    return () => {
      emblaApi.off('select', updateEdgeState);
      emblaApi.off('reInit', updateEdgeState);
      emblaApi.off('scroll', updateEdgeState);
    };
  }, [emblaApi, updateEdgeState]);

  useEffect(() => {
    if (!emblaApi) return;

    const rootNode = emblaApi.rootNode();
    if (rootNode) {
      (rootNode as unknown as { __emblaApi?: EmblaCarouselType }).__emblaApi = emblaApi;
      const carouselParent = rootNode.closest<HTMLElement>('[data-carousel-container="true"]');
      if (carouselParent) {
        (carouselParent as unknown as { __emblaApi?: EmblaCarouselType }).__emblaApi = emblaApi;
      }
    }
  }, [emblaApi]);

  return {
    emblaRef,
    emblaApi,
    isBeginning,
    setIsBeginning,
    isEnd,
    setIsEnd,
    handlePrev,
    handleNext,
    updateEdgeState,
  };
}

export default useEmblaNavigation;
