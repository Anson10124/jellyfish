'use client';

import React, { useEffect, useId, useMemo, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useRender } from '@base-ui/react/use-render';
import { useTheme } from 'next-themes';

import { useLiquidGlass } from '@/hooks/ui/use-liquid-glass';
import { cn } from '@/lib/utils';
import {
  SURFACES,
  computeDisplacementProfile,
  createDisplacementMap,
  createSpecularMap,
  imageDataToUrl,
  type SurfaceName,
} from '@/lib/liquid-glass';

/*
 * Liquid Glass, based on kube.io's "Liquid Glass in the Browser: Refraction with CSS and SVG"
 * (https://kube.io/blog/liquid-glass-css-svg/).
 *
 * With the Liquid Glass setting on:
 * - Chromium refracts the backdrop through an SVG displacement filter built from Snell's law,
 *   with a rim highlight (see lib/liquid-glass).
 * - Safari and Firefox accept SVG filters in backdrop-filter but draw nothing, so they get a
 *   frosted blur with a sheen and rim instead.
 * With it off, surfaces render their `fallbackClassName`.
 */

type GlassRenderer = 'svg' | 'frosted';

let rendererCache: GlassRenderer | undefined;

function detectRenderer(): GlassRenderer {
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } })
    .userAgentData?.brands;
  if (brands?.some((b) => b.brand === 'Chromium')) return 'svg';
  const ua = navigator.userAgent;
  // Chrome on iOS ("CriOS") and friends are WebKit underneath.
  return /\b(Chrome|Chromium)\/\d+/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua) ? 'svg' : 'frosted';
}

const subscribeNever = () => () => {};
const getRenderer = () => (rendererCache ??= detectRenderer());
const getServerRenderer = () => null;

/** Which glass renderer this browser gets, or null during server rendering. */
function useGlassRenderer(): GlassRenderer | null {
  return useSyncExternalStore(subscribeNever, getRenderer, getServerRenderer);
}

// ---------------------------------------------------------------------------------------------
// Refraction filter (Chromium)
// ---------------------------------------------------------------------------------------------

// Brighten / darken what's behind the glass so text on top stays readable.
const TONE_MATRIX = {
  dark: '0.85 0 0 0 -0.08 0 0.85 0 0 -0.08 0 0 0.85 0 -0.08 0 0 0 1 0',
  light: '1.03 0 0 0 0.2 0 1.03 0 0 0.2 0 0 1.03 0 0.2 0 0 0 1 0',
} as const;

export interface LiquidGlassOptions {
  /** Width of the curved edge in px. */
  bezelWidth?: number;
  /** Thickness of the glass slab in px. Thicker glass bends light further. */
  glassThickness?: number;
  refractiveIndex?: number;
  surface?: SurfaceName;
  /** Blur of the backdrop in px (applied before refraction). */
  blur?: number;
  /** Multiplier on the physical displacement (0..1). */
  refraction?: number;
  /** Strength of the rim highlight (0..1). */
  specularOpacity?: number;
  /** Saturation boost of the colors seen through the rim. */
  specularSaturation?: number;
  /** Direction the rim light comes from, in radians. */
  lightAngle?: number;
  /** Darken (dark theme) or lighten (light theme) the backdrop for legibility. */
  tone?: boolean;
  /**
   * When the bezel is wider than the corner radius allows, shrink the bezel and the glass
   * thickness together, so small surfaces get the same glass shape scaled down instead of
   * bending light far outside themselves. Defaults to true.
   */
  fitToRadius?: boolean;
}

// Defaults match the music player demo from the article.
const DEFAULTS = {
  bezelWidth: 29,
  glassThickness: 90,
  refractiveIndex: 1.3,
  surface: 'convexSquircle' as SurfaceName,
  blur: 1,
  refraction: 1,
  specularOpacity: 0.4,
  specularSaturation: 6,
  lightAngle: Math.PI / 3,
};

interface GlassMaps {
  displacement: string;
  specular: string;
  maxDisplacement: number;
}

// Surfaces of the same size (carousel arrows, tags) share their generated maps.
const mapCache = new Map<string, GlassMaps>();
const MAP_CACHE_LIMIT = 64;

function getMaps(
  width: number,
  height: number,
  radius: number,
  bezelWidth: number,
  glassThickness: number,
  refractiveIndex: number,
  surface: SurfaceName,
  lightAngle: number,
  fitToRadius: boolean,
): GlassMaps {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let bezel = bezelWidth;
  let thickness = glassThickness;
  if (fitToRadius && bezelWidth > radius - 1) {
    bezel = Math.max(1, radius - 1);
    thickness = glassThickness * (bezel / bezelWidth);
  }

  const key = [width, height, radius, bezel, thickness, refractiveIndex, surface, lightAngle, dpr].join('|');
  const cached = mapCache.get(key);
  if (cached) return cached;

  // How far rays bend at each distance from the edge.
  const profile = computeDisplacementProfile(thickness, bezel, SURFACES[surface], refractiveIndex);
  const maxDisplacement = Math.max(...profile.map(Math.abs));
  const geometry = { width, height, radius, bezelWidth: bezel, dpr };
  const maps = {
    displacement: imageDataToUrl(createDisplacementMap(geometry, profile, maxDisplacement)),
    specular: imageDataToUrl(createSpecularMap(geometry, lightAngle)),
    maxDisplacement,
  };

  if (mapCache.size >= MAP_CACHE_LIMIT) mapCache.delete(mapCache.keys().next().value!);
  mapCache.set(key, maps);
  return maps;
}

/**
 * True when an ancestor has its own backdrop-filter, filter, mask or clip-path. Such an
 * ancestor becomes the "backdrop root", so the glass would only see that ancestor's content,
 * not the page. In that case we keep the fallback look and skip the filter.
 * (Opacity also does this, but only during fades, so it's deliberately not checked.)
 */
function isInsideBackdropRoot(element: HTMLElement): boolean {
  for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (
      style.backdropFilter !== 'none' ||
      style.filter !== 'none' ||
      style.maskImage !== 'none' ||
      style.clipPath !== 'none'
    ) {
      return true;
    }
  }
  return false;
}

interface GlassFilter<T extends HTMLElement> {
  /** Callback ref for the glass element. */
  attach: (element: T | null) => void;
  /** True once the filter is ready to render. */
  active: boolean;
  /** `backdrop-filter` style for the element. */
  style: React.CSSProperties | undefined;
  /** The SVG filter definition, portalled into document.body. Render it anywhere. */
  filter: React.ReactNode;
}

/**
 * Builds the refraction filter for one element: measures its border box and corner radius,
 * generates (or reuses) the displacement and specular maps, and returns the filter plus the
 * `backdrop-filter` style that points at it.
 */
function useGlassFilter<T extends HTMLElement>(
  options: LiquidGlassOptions & { enabled: boolean; radius?: number | 'capsule' },
): GlassFilter<T> {
  const {
    enabled,
    radius: radiusProp,
    bezelWidth = DEFAULTS.bezelWidth,
    glassThickness = DEFAULTS.glassThickness,
    refractiveIndex = DEFAULTS.refractiveIndex,
    surface = DEFAULTS.surface,
    blur = DEFAULTS.blur,
    refraction = DEFAULTS.refraction,
    specularOpacity = DEFAULTS.specularOpacity,
    specularSaturation = DEFAULTS.specularSaturation,
    lightAngle = DEFAULTS.lightAngle,
    tone = false,
    fitToRadius = true,
  } = options;

  const { resolvedTheme } = useTheme();
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<{ width: number; height: number; radius: number } | null>(null);
  const filterId = `liquid-glass-${useId().replace(/[^\w-]/g, '')}`;

  const maps = useMemo(() => {
    if (!enabled || !size || size.width < 2 || size.height < 2) return null;
    return getMaps(
      size.width,
      size.height,
      size.radius,
      bezelWidth,
      glassThickness,
      refractiveIndex,
      surface,
      lightAngle,
      fitToRadius,
    );
  }, [enabled, size, bezelWidth, glassThickness, refractiveIndex, surface, lightAngle, fitToRadius]);

  const active = maps !== null && size !== null;

  // Track the border box in whole pixels, so sub-pixel jitter doesn't rebuild the maps. Also
  // re-measure when the glass switches on: swapping a fallback border for a transparent one
  // or padding changes the box without resizing the content box, so ResizeObserver misses it.
  useEffect(() => {
    if (!enabled || !element) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      if (isInsideBackdropRoot(element)) {
        setSize(null);
        return;
      }
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const cssRadius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
      const wanted = radiusProp === 'capsule' ? Infinity : (radiusProp ?? cssRadius);
      const radius = Math.round(Math.min(wanted, width / 2, height / 2));
      setSize((prev) =>
        prev && prev.width === width && prev.height === height && prev.radius === radius
          ? prev
          : { width, height, radius },
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [element, enabled, radiusProp, active]);

  const toneMatrix = tone ? TONE_MATRIX[resolvedTheme === 'light' ? 'light' : 'dark'] : null;

  const filter =
    active && typeof document !== 'undefined'
      ? createPortal(
          <svg
            aria-hidden
            width="0"
            height="0"
            style={{ position: 'absolute', pointerEvents: 'none' }}
            colorInterpolationFilters="sRGB"
          >
            <defs>
              <filter id={filterId}>
                {toneMatrix && (
                  <feColorMatrix in="SourceGraphic" type="matrix" values={toneMatrix} result="toned" />
                )}
                <feGaussianBlur
                  in={toneMatrix ? 'toned' : 'SourceGraphic'}
                  stdDeviation={blur}
                  result="blurred"
                />
                <feImage
                  href={maps.displacement}
                  x={0}
                  y={0}
                  width={size.width}
                  height={size.height}
                  preserveAspectRatio="none"
                  result="displacement_map"
                />
                <feDisplacementMap
                  in="blurred"
                  in2="displacement_map"
                  scale={maps.maxDisplacement * refraction}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="displaced"
                />
                <feColorMatrix
                  in="displaced"
                  type="saturate"
                  values={String(specularSaturation)}
                  result="displaced_saturated"
                />
                <feImage
                  href={maps.specular}
                  x={0}
                  y={0}
                  width={size.width}
                  height={size.height}
                  preserveAspectRatio="none"
                  result="specular_layer"
                />
                {/* Extra-saturated colors show only where the rim highlight is */}
                <feComposite
                  in="displaced_saturated"
                  in2="specular_layer"
                  operator="in"
                  result="specular_saturated"
                />
                <feComponentTransfer in="specular_layer" result="specular_faded">
                  <feFuncA type="linear" slope={specularOpacity} />
                </feComponentTransfer>
                <feBlend in="specular_saturated" in2="displaced" mode="normal" result="with_saturation" />
                <feBlend in="specular_faded" in2="with_saturation" mode="normal" />
              </filter>
            </defs>
          </svg>,
          document.body,
        )
      : null;

  return {
    attach: setElement,
    active,
    style: active ? { backdropFilter: `url(#${filterId})` } : undefined,
    filter,
  };
}

// ---------------------------------------------------------------------------------------------
// Frosted renderer (Safari, Firefox)
// ---------------------------------------------------------------------------------------------

const FROSTED_FILTER = 'blur(12px) saturate(1.4) brightness(1.04)';

const SHEEN =
  'linear-gradient(135deg, light-dark(hsl(0 0% 100% / 0.42), hsl(0 0% 100% / 0.14)) 0%, transparent 42%, transparent 64%, light-dark(hsl(0 0% 100% / 0.18), hsl(0 0% 100% / 0.05)) 100%)';

const RIM =
  'linear-gradient(150deg, light-dark(hsl(0 0% 100% / 0.7), hsl(0 0% 100% / 0.34)), light-dark(hsl(0 0% 100% / 0.1), hsl(0 0% 100% / 0.03)) 45%, light-dark(hsl(0 0% 100% / 0.08), hsl(0 0% 100% / 0.02)) 60%, light-dark(hsl(0 0% 100% / 0.42), hsl(0 0% 100% / 0.18)))';

const RING = 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)';

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

// ---------------------------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------------------------

/**
 * Glass look for menus and panels: the article's music player tint (same as the navbar).
 * Borders turn transparent instead of disappearing, so nothing shifts when the glass switches
 * on; the rim highlight takes their place.
 */
export const GLASS_PANEL_CLASS = 'bg-white/60 dark:bg-[#222222]/60 border-transparent';

/** Glass settings for menus and panels: more blur than the player, so small text stays readable. */
export const GLASS_PANEL_OPTIONS: LiquidGlassOptions = { blur: 6 };

export interface LiquidGlassProps extends React.HTMLAttributes<HTMLElement> {
  render?: useRender.RenderProp;
  ref?: React.Ref<HTMLElement>;
  /**
   * Corner radius in px. "capsule" is half the shorter side. Defaults to the element's
   * computed border radius.
   */
  radius?: number | 'capsule';
  /** Refraction settings (Chromium). Defaults match the article's music player. */
  glass?: LiquidGlassOptions;
  /** Classes applied only when Liquid Glass is on (e.g. a background wash for legibility). */
  glassClassName?: string;
  /** Classes applied only when Liquid Glass is off, typically the frosted background and border it replaces. */
  fallbackClassName?: string;
}

/**
 * Base glass surface for the app. When the Liquid Glass setting is on, the element refracts what
 * is behind it (Chromium) or gets a frosted blur (other browsers). Otherwise it renders the same
 * element with `fallbackClassName`.
 *
 * The filter goes on the element itself, so its own fade and scale animations keep working.
 * Don't nest glass surfaces: the outer one would become the inner one's backdrop root.
 */
export function LiquidGlass({
  render,
  ref,
  radius,
  glass: options,
  className,
  glassClassName,
  fallbackClassName,
  style,
  children,
  ...props
}: LiquidGlassProps) {
  const [enabled] = useLiquidGlass();
  const renderer = useGlassRenderer();
  const { attach, active, style: filterStyle, filter } = useGlassFilter<HTMLElement>({
    ...options,
    radius,
    enabled: enabled && renderer === 'svg',
  });

  // Until the refraction maps are ready (or when the element sits under another backdrop root),
  // Chromium shows the regular fallback look.
  const mode: GlassRenderer | null = !enabled
    ? null
    : renderer === 'svg'
      ? active
        ? 'svg'
        : null
      : renderer;

  const glassStyle: React.CSSProperties | undefined =
    mode === 'svg'
      ? filterStyle
      : mode === 'frosted'
        ? { WebkitBackdropFilter: FROSTED_FILTER, backdropFilter: FROSTED_FILTER }
        : undefined;

  return useRender({
    render: render ?? <div />,
    ref: ref ? [ref, attach] : attach,
    props: {
      ...props,
      'data-liquid-glass': mode ?? undefined,
      className:
        mode === 'svg'
          ? cn(className, glassClassName)
          : mode === 'frosted'
            ? // Isolated so the frosted layers can sit at -z-10: above the element's background, under its content
              cn('relative isolate', className, glassClassName)
            : cn(className, fallbackClassName),
      style: glassStyle ? { ...style, ...glassStyle } : style,
      children: (
        <>
          {filter}
          {mode === 'frosted' && <FrostedLayers />}
          {children}
        </>
      ),
    },
  });
}
