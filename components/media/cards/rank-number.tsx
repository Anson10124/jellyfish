'use client';

import React from 'react';

export interface RankNumberProps {
  rank: number;
  className?: string;
}

export function RankNumber({ rank, className }: RankNumberProps) {
  const isDoubleDigit = rank >= 10 && rank < 100;
  const isTripleDigit = rank >= 100;
  const viewBox = isTripleDigit ? '0 0 185 135' : isDoubleDigit ? '0 0 135 135' : '0 0 85 135';
  const x = isTripleDigit ? '85' : isDoubleDigit ? '48.5' : '42.5';

  return (
    <svg
      viewBox={viewBox}
      className={`pointer-events-none absolute -left-1 sm:-left-2 bottom-[0px] z-0 h-[100px] sm:h-[116px] md:h-[130px] xl:h-[152px] 2xl:h-[174px] w-auto select-none ${
        className || ''
      }`}
      aria-hidden="true"
    >
      <text
        x={x}
        y="114"
        textAnchor="middle"
        fill="transparent"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="1"
        strokeLinejoin="round"
        paintOrder="stroke fill"
        fontSize="96"
        fontWeight="900"
        fontFamily="var(--font-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        letterSpacing="-6"
      >
        {rank}
      </text>
    </svg>
  );
}

export default RankNumber;
