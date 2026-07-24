import React, { CSSProperties, useMemo } from 'react';

export interface ProgressiveBlurProps {
  position?: 'top' | 'bottom' | 'left' | 'right';
  strength?: number;
  height?: string;
  width?: string;
  divCount?: number;
  zIndex?: number;
  className?: string;
  style?: CSSProperties;
  fade?: boolean | string;
  fadeOpacity?: number;
  children?: React.ReactNode;
}

const DIRECTION_MAP: Record<string, string> = {
  top: 'to top',
  bottom: 'to bottom',
  left: 'to left',
  right: 'to right',
};

const FADE_DIRECTION_MAP: Record<string, string> = {
  top: 'to bottom',
  bottom: 'to top',
  left: 'to right',
  right: 'to left',
};

const ProgressiveBlur: React.FC<ProgressiveBlurProps> = ({
  position = 'top',
  strength = 1,
  height = '6rem',
  width,
  divCount = 5,
  zIndex = 40,
  className = '',
  style = {},
  fade = false,
  fadeOpacity = 0.8,
  children,
}) => {
  const direction = DIRECTION_MAP[position] || 'to bottom';
  const isVertical = position === 'top' || position === 'bottom';

  const blurDivs = useMemo(() => {
    const increment = 100 / divCount;
    return Array.from({ length: divCount }, (_, index) => {
      const i = index + 1;
      const progress = i / divCount;
      const blurValue = 0.0625 * (progress * divCount + 1) * strength;

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const divStyle: CSSProperties = {
        maskImage: `linear-gradient(${direction}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
      };

      return <div key={i} className="absolute inset-0 pointer-events-none" style={divStyle} />;
    });
  }, [divCount, strength, direction]);

  const fadeOverlay = useMemo(() => {
    if (!fade) return null;
    const colorStr = typeof fade === 'string' ? fade : '#121215';
    let rgba = colorStr;
    if (colorStr.startsWith('#')) {
      const hex = colorStr.replace('#', '');
      const fullHex = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
      const r = parseInt(fullHex.substring(0, 2), 16) || 18;
      const g = parseInt(fullHex.substring(2, 4), 16) || 18;
      const b = parseInt(fullHex.substring(4, 6), 16) || 21;
      rgba = `rgba(${r}, ${g}, ${b}, ${fadeOpacity})`;
    }
    const fadeDirection = FADE_DIRECTION_MAP[position] || 'to bottom';
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(${fadeDirection}, ${rgba}, transparent)`,
        }}
      />
    );
  }, [fade, fadeOpacity, position]);

  const containerStyle: CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex,
    [position]: 0,
    ...(isVertical
      ? { left: 0, right: 0, height, width: width || '100%' }
      : { top: 0, bottom: 0, width: width || height, height: '100%' }),
    ...style,
  };

  return (
    <div className={`progressive-blur pointer-events-none ${className}`} style={containerStyle}>
      <div className="relative w-full h-full pointer-events-none">
        {blurDivs}
        {fadeOverlay}
      </div>
      {children && <div className="relative">{children}</div>}
    </div>
  );
};

export default React.memo(ProgressiveBlur);

