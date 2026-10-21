'use client';

import React, { useId, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { useRender } from '@base-ui/react/use-render';

import { useLiquidGlass } from '@/hooks/ui/use-liquid-glass';
import { cn } from '@/lib/utils';

type GlassRenderer = 'svg' | 'frosted';

// Displacement map shape: edge thickness as a fraction of the shorter side, then the inner fill and its softness.
const BORDER_WIDTH = 0;
const BRIGHTNESS = 50;
const OPACITY = 1;
const BLUR = 10;
// Per-channel displacement; the spread between them is the chromatic fringe on the edges.
const DISTORTION_SCALE = 45;
const CHANNEL_OFFSETS = { red: 10, green: 10, blue: 10 };
const SATURATION = 1;
// Real backdrop blur (px) applied before the refraction filter in Chromium.
const BACKDROP_BLUR = 4;


const FROSTED_FILTER = `blur(12px) saturate(${SATURATION * 1.4}) brightness(1.04)`;

const SHEEN =
  'linear-gradient(135deg, light-dark(hsl(0 0% 100% / 0.42), hsl(0 0% 100% / 0.14)) 0%, transparent 42%, transparent 64%, light-dark(hsl(0 0% 100% / 0.18), hsl(0 0% 100% / 0.05)) 100%)';

const RIM =
  'linear-gradient(150deg, light-dark(hsl(0 0% 100% / 0.7), hsl(0 0% 100% / 0.34)), light-dark(hsl(0 0% 100% / 0.1), hsl(0 0% 100% / 0.03)) 45%, light-dark(hsl(0 0% 100% / 0.08), hsl(0 0% 100% / 0.02)) 60%, light-dark(hsl(0 0% 100% / 0.42), hsl(0 0% 100% / 0.18)))';

const RING = 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)';

let renderer: GlassRenderer | undefined;

// Only Chromium renders SVG filters in backdrop-filter; Safari and Firefox accept the syntax but draw nothing,
// so they get a frosted blur instead.
function getGlassRenderer(): GlassRenderer {
  if (renderer) return renderer;
  const userAgent = navigator.userAgent;
  const isWebkit = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  renderer = !isWebkit && !isFirefox && CSS.supports('backdrop-filter', 'url(#glass)') ? 'svg' : 'frosted';
  return renderer;
}

const subscribeNever = () => () => {};

/**
 * Builds the displacement map for one surface: red and blue gradients bend the backdrop towards the edges,
 * and a blurred grey fill keeps the middle (almost) undistorted.
 */
function createDisplacementMap(width: number, height: number, radius: number): string {
  const edge = Math.min(width, height) * (BORDER_WIDTH * 0.5);
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#0000"/>
          <stop offset="100%" stop-color="red"/>
        </linearGradient>
        <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0000"/>
          <stop offset="100%" stop-color="blue"/>
        </linearGradient>
        <filter id="soft" filterUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="${BLUR}" />
        </filter>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" fill="black"></rect>
      <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#red)" />
      <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#blue)" style="mix-blend-mode: difference" />
      <rect x="${edge}" y="${edge}" width="${width - edge * 2}" height="${height - edge * 2}" rx="${radius}" fill="hsl(0 0% ${BRIGHTNESS}% / ${OPACITY})" filter="url(#soft)" />
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export interface LiquidGlassProps extends React.HTMLAttributes<HTMLElement> {
  render?: useRender.RenderProp;
  ref?: React.Ref<HTMLElement>;
  /** Corner radius in px, matching the element's rounded-* class. "capsule" is half the shorter side. */
  radius?: number | 'capsule';
  /** Classes applied only when Liquid Glass is on (e.g. a background wash for legibility). */
  glassClassName?: string;
  /** Classes applied only when Liquid Glass is off, typically the frosted background and border it replaces. */
  fallbackClassName?: string;
}

/**
 * Base glass surface for the app. When the Liquid Glass setting is on, the element refracts what is behind it
 * through an SVG displacement filter (Chromium) or a frosted blur (other browsers). Otherwise it renders the same
 * element with `fallbackClassName`.
 */
export function LiquidGlass({
  render,
  ref,
  radius = 16,
  className,
  glassClassName,
  fallbackClassName,
  style,
  children,
  ...props
}: LiquidGlassProps) {
  const [enabled] = useLiquidGlass();
  const glassRenderer = useSyncExternalStore(subscribeNever, getGlassRenderer, () => null);
  const mode = enabled ? glassRenderer : null;
  const filterId = `liquid-glass-${useId().replace(/[^\w-]/g, '')}`;
  const elementRef = useRef<HTMLElement>(null);
  const mapRef = useRef<SVGFEImageElement>(null);

  // Layout effect: without a map the filter would shift the whole backdrop for a frame
  useLayoutEffect(() => {
    const element = elementRef.current;
    const map = mapRef.current;
    if (mode !== 'svg' || !element || !map) return;

    const update = () => {
      const { offsetWidth: width, offsetHeight: height } = element;
      if (!width || !height) return;
      const cornerRadius = radius === 'capsule' ? Math.min(width, height) / 2 : radius;
      map.setAttribute('href', createDisplacementMap(width, height, cornerRadius));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [mode, radius]);

  const glassStyle: React.CSSProperties | undefined =
    mode === 'svg'
      ? { backdropFilter: `blur(${BACKDROP_BLUR}px) url(#${filterId}) saturate(${SATURATION})` }
      : mode === 'frosted'
        ? { WebkitBackdropFilter: FROSTED_FILTER, backdropFilter: FROSTED_FILTER }
        : undefined;

  return useRender({
    render: render ?? <div />,
    ref: ref ? [ref, elementRef] : elementRef,
    props: {
      ...props,
      'data-liquid-glass': mode ?? undefined,
      // Isolated so the layers below can sit at -z-10: above the element's background, under its content
      className: mode ? cn('relative isolate', className, glassClassName) : cn(className, fallbackClassName),
      style: { ...style, ...glassStyle },
      children: (
        <>
          {mode === 'svg' && <RefractionFilter id={filterId} mapRef={mapRef} />}
          {mode === 'svg' && <GlassRim />}
          {mode === 'frosted' && <FrostedLayers />}
          {children}
        </>
      ),
    },
  });
}

function RefractionFilter({ id, mapRef }: { id: string; mapRef: React.Ref<SVGFEImageElement> }) {
  const channels = [
    { name: 'red', offset: CHANNEL_OFFSETS.red, matrix: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' },
    { name: 'green', offset: CHANNEL_OFFSETS.green, matrix: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' },
    { name: 'blue', offset: CHANNEL_OFFSETS.blue, matrix: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' },
  ];

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full opacity-0">
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
          <feImage ref={mapRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
          {channels.map(({ name, offset, matrix }) => (
            <React.Fragment key={name}>
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={DISTORTION_SCALE + offset}
                xChannelSelector="R"
                yChannelSelector="G"
                result={`${name}-displaced`}
              />
              <feColorMatrix in={`${name}-displaced`} type="matrix" values={matrix} result={name} />
            </React.Fragment>
          ))}
          <feBlend in="red" in2="green" mode="screen" result="red-green" />
          <feBlend in="red-green" in2="blue" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}

// Subtle 1px highlight edge for the refraction renderer, lighter than the frosted rim.
function GlassRim() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] p-px opacity-60"
      style={{ background: RIM, WebkitMask: RING, WebkitMaskComposite: 'xor', mask: RING, maskComposite: 'exclude' }}
    />
  );
}

function FrostedLayers() {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
        style={{ background: 'light-dark(hsl(0 0% 100% / 0.12), hsl(0 0% 100% / 0.04))' }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
        style={{ background: SHEEN }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] p-[3px]"
        style={{ background: RIM, WebkitMask: RING, WebkitMaskComposite: 'xor', mask: RING, maskComposite: 'exclude' }}
      />
    </>
  );
}
