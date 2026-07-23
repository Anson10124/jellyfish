'use client';

import { useCallback, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';

export interface UseSwiperNavigationReturn {
  swiperInstance: SwiperType | null;
  setSwiperInstance: (swiper: SwiperType | null) => void;
  isBeginning: boolean;
  setIsBeginning: React.Dispatch<React.SetStateAction<boolean>>;
  isEnd: boolean;
  setIsEnd: React.Dispatch<React.SetStateAction<boolean>>;
  handlePrev: () => void;
  handleNext: () => void;
  onSwiperInit: (swiper: SwiperType) => void;
  updateEdgeState: (swiper: SwiperType) => void;
}

export function useSwiperNavigation(): UseSwiperNavigationReturn {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const handlePrev = useCallback(() => {
    swiperInstance?.slidePrev();
  }, [swiperInstance]);

  const handleNext = useCallback(() => {
    swiperInstance?.slideNext();
  }, [swiperInstance]);

  const updateEdgeState = useCallback((swiper: SwiperType) => {
    setIsBeginning((prev) => (prev !== swiper.isBeginning ? swiper.isBeginning : prev));
    setIsEnd((prev) => (prev !== swiper.isEnd ? swiper.isEnd : prev));
  }, []);

  const onSwiperInit = useCallback((swiper: SwiperType) => {
    setSwiperInstance(swiper);
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  }, []);

  return {
    swiperInstance,
    setSwiperInstance,
    isBeginning,
    setIsBeginning,
    isEnd,
    setIsEnd,
    handlePrev,
    handleNext,
    onSwiperInit,
    updateEdgeState,
  };
}

export default useSwiperNavigation;
