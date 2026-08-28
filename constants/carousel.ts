export const PADDING_X_CLASSES = 'px-4 sm:px-8 md:px-12 lg:px-14 xl:px-16 2xl:px-20';
export const CAROUSEL_TRACK_CLASSES = `flex touch-pan-y select-none cursor-grab active:cursor-grabbing pt-5 pb-8 ${PADDING_X_CLASSES}`;
export const SLIDE_WIDTH_CLASS = 'w-[120px] sm:w-[132px] md:w-[144px] xl:w-[164px] 2xl:w-[186px] pr-4 shrink-0 flex-[0_0_auto] min-w-0';
export const SKELETON_WIDTH_CLASS = 'w-[104px] sm:w-[116px] md:w-[128px] xl:w-[148px] 2xl:w-[170px] shrink-0 flex-[0_0_auto] min-w-0';
export const TOP10_SLIDE_WIDTH_CLASS = 'w-[166px] sm:w-[186px] md:w-[204px] xl:w-[234px] 2xl:w-[264px] pr-4 shrink-0 flex-[0_0_auto] min-w-0';
export const EPISODE_SLIDE_WIDTH_CLASS = 'w-[260px] sm:w-[300px] md:w-[340px] xl:w-[380px] pr-4 shrink-0 flex-[0_0_auto] min-w-0';

export function getLayoutOffsetPx(): number {
  if (typeof window === 'undefined') return 16;
  const w = window.innerWidth;
  if (w >= 1536) return 80;
  if (w >= 1280) return 64;
  if (w >= 1024) return 56;
  if (w >= 768) return 48;
  if (w >= 640) return 32;
  return 16;
}
