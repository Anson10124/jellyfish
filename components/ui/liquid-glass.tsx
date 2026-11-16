'use client';

import React, { useCallback, useEffect, useId, useMemo, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  SURFACES,
  computeDisplacementProfile,
  createDisplacementMap,
  createSpecularMap,
  imageDataToUrl,
  type SurfaceName,
} from '@/lib/liquid-glass';

/**
 * SVG filters inside `backdrop-filter` (which the refraction relies on) only work
 * in Chromium-based browsers. `CSS.supports` reports true elsewhere too, so we
 * have to check the engine. Chrome on iOS ("CriOS") is WebKit underneath.
 */
function detectSupport(): boolean {
  if (typeof navigator === 'undefined') return false;
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } })
    .userAgentData?.brands;
  if (brands?.some((b) => b.brand === 'Chromium')) return true;
  const ua = navigator.userAgent;
  return /\b(Chrome|Chromium)\/\d+/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

let supportCache: boolean | null = null;
const subscribeNoop = () => () => {};
const getSupport = () => (supportCache ??= detectSupport());
const getServerSupport = () => false;

/** True when the browser can render the refracting liquid glass (Chromium only). */
export function useLiquidGlassSupport(): boolean {
  return useSyncExternalStore(subscribeNoop, getSupport, getServerSupport);
}

// Brighten / darken what's behind the glass so text on top stays readable.
const TONE_MATRIX = {
  dark: '0.85 0 0 0 -0.08 0 0.85 0 0 -0.08 0 0 0.85 0 -0.08 0 0 0 1 0',
  light: '1.03 0 0 0 0.2 0 1.03 0 0 0.2 0 0 1.03 0 0.2 0 0 0 1 0',
} as const;

export interface LiquidGlassOptions {
  /** Corner radius in px. Defaults to the element's computed border radius. */
  radius?: number;
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
   * When the bezel is wider than the corner radius allows, shrink the bezel and the
   * glass thickness together, so small surfaces get the same glass shape scaled down
   * instead of bending light far outside themselves. Defaults to true.
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

type GlassMode = 'self' | 'layer';

/**
 * True when an ancestor has its own backdrop-filter, filter, mask or clip-path. Such an
 * ancestor becomes the "backdrop root", so the glass would only see that ancestor's
 * content, not the page. In that case we keep the fallback look and skip the filter.
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

export interface LiquidGlassHandle<T extends HTMLElement> {
  /** Callback ref for the glass element: `ref={glass.attach}`. */
  attach: (element: T | null) => void;
  /** True once the glass is rendering. Use it to swap fallback classes for glass ones. */
  active: boolean;
  /** `backdrop-filter` style for the element ("self" mode) or its glass layer ("layer" mode). */
  style: React.CSSProperties | undefined;
  /** The SVG filter definition, rendered into document.body. Render it anywhere. */
  filter: React.ReactNode;
}

/**
 * Refracting "liquid glass" based on kube.io's SVG displacement technique
 * (https://kube.io/blog/liquid-glass-css-svg/).
 *
 * In "self" mode (the default) the filter goes on the element itself, exactly where
 * a `backdrop-blur` class would. That keeps the element's own fade animations
 * working. "layer" mode is for containers that hold other glass surfaces; see
 * `<LiquidGlass>`.
 *
 * Browsers without support never become `active`, so callers keep their usual
 * blur classes there.
 */
export function useLiquidGlass<T extends HTMLElement = HTMLElement>(
  options: LiquidGlassOptions & { mode?: GlassMode; disabled?: boolean } = {},
): LiquidGlassHandle<T> {
  const {
    mode = 'self',
    disabled = false,
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

  const supported = useLiquidGlassSupport() && !disabled;
  const { resolvedTheme } = useTheme();
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<{ width: number; height: number; radius: number } | null>(null);
  const filterId = `liquid-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const maps = useMemo(() => {
    if (!supported || !size || size.width < 2 || size.height < 2) return null;
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
  }, [supported, size, bezelWidth, glassThickness, refractiveIndex, surface, lightAngle, fitToRadius]);

  const active = maps !== null && size !== null;

  // Track the size of the area the filter covers, in whole pixels so sub-pixel jitter
  // doesn't rebuild the maps. Also re-measure when the glass switches on: swapping a
  // fallback border for padding changes the box without resizing the content box, so
  // ResizeObserver alone would miss it.
  useEffect(() => {
    if (!supported || !element) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      if (isInsideBackdropRoot(element)) {
        setSize(null);
        return;
      }
      const style = getComputedStyle(element);
      const outerRadius = parseFloat(style.borderTopLeftRadius) || 0;
      // "self": the filter covers the border box. "layer": the layer fills the padding box.
      const width = mode === 'self' ? element.offsetWidth : element.clientWidth;
      const height = mode === 'self' ? element.offsetHeight : element.clientHeight;
      const cssRadius =
        mode === 'self'
          ? outerRadius
          : Math.max(0, outerRadius - (parseFloat(style.borderTopWidth) || 0));
      const radius = Math.round(Math.min(radiusProp ?? cssRadius, width / 2, height / 2));
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
  }, [element, supported, mode, radiusProp, active]);

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

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as React.RefObject<T | null>).current = value;
}

/** Combine two refs (objects or callbacks) into one stable callback ref. */
export function useMergedRef<T>(
  a: React.Ref<T> | undefined,
  b: React.Ref<T> | undefined,
): React.RefCallback<T> {
  return useCallback(
    (value: T | null) => {
      assignRef(a, value);
      assignRef(b, value);
    },
    [a, b],
  );
}

type GlassTag = 'div' | 'nav' | 'header' | 'section' | 'aside';

export interface LiquidGlassProps extends LiquidGlassOptions, React.HTMLAttributes<HTMLElement> {
  as?: GlassTag;
  /** Classes for the glass layer itself, e.g. a tint (`bg-white/60`). */
  glassClassName?: string;
  /** Classes for the element while the glass is active (e.g. padding that replaces a fallback border). */
  activeClassName?: string;
  /** Classes used only when it is not (e.g. the regular blur look). */
  fallbackClassName?: string;
}

/**
 * Liquid glass container that draws the glass on a separate layer behind its
 * children. Use it for containers that hold other glass surfaces (like the navbar):
 * a backdrop-filter on the container itself would make it the backdrop root of
 * everything inside, so nested glass would only see the container.
 *
 * The element must be positioned (e.g. `relative` or `fixed`) for the layer to fit it.
 */
export function LiquidGlass({
  as: Tag = 'div',
  radius,
  bezelWidth,
  glassThickness,
  refractiveIndex,
  surface,
  blur,
  refraction,
  specularOpacity,
  specularSaturation,
  lightAngle,
  tone,
  fitToRadius = false,
  glassClassName,
  activeClassName,
  fallbackClassName,
  className,
  children,
  ...rest
}: LiquidGlassProps) {
  const { attach, active, style, filter } = useLiquidGlass<HTMLElement>({
    mode: 'layer',
    radius,
    bezelWidth,
    glassThickness,
    refractiveIndex,
    surface,
    blur,
    refraction,
    specularOpacity,
    specularSaturation,
    lightAngle,
    tone,
    fitToRadius,
  });

  return (
    <Tag
      ref={attach as React.Ref<never>}
      // Keep the fallback look until the maps are ready, so there's no flash of bare content.
      className={cn(className, active ? cn('isolate', activeClassName) : fallbackClassName)}
      {...rest}
    >
      {filter}
      {active && (
        <span
          aria-hidden
          className={cn('pointer-events-none absolute inset-0 -z-10', glassClassName)}
          style={{
            ...style,
            borderRadius: 'inherit',
            // Own compositing layer, as in the article, for smoother scrolling.
            transform: 'translateZ(0)',
          }}
        />
      )}
      {children}
    </Tag>
  );
}

/**
 * Glass look for menus and panels: the article's music player tint (same as the navbar).
 * Borders turn transparent instead of disappearing, so nothing shifts when the glass
 * switches on; the rim highlight takes their place.
 */
export const GLASS_PANEL_CLASS = 'bg-white/60 dark:bg-[#222222]/60 border-transparent';

/** Glass settings for menus and panels: more blur than the player, so small text stays readable. */
export const GLASS_PANEL_OPTIONS: LiquidGlassOptions = { blur: 6 };

type GlassSurfaceProps<C extends React.ElementType> = {
  /** Element or component to render (e.g. 'button', Link, motion.div). Defaults to 'div'. */
  as?: C;
  /** Glass settings passed to `useLiquidGlass`. */
  glass?: LiquidGlassOptions & { disabled?: boolean };
  /** Classes added while the glass is active. */
  glassClassName?: string;
  /** Classes used when it is not (e.g. today's `backdrop-blur` look). */
  fallbackClassName?: string;
} & Omit<React.ComponentPropsWithRef<C>, 'as'>;

/**
 * A leaf liquid glass surface (tag, button, dropdown, card): the filter goes on the
 * element itself, in place of a `backdrop-blur` class. Its own opacity/scale
 * animations keep working. Don't nest other glass surfaces inside it; use
 * `<LiquidGlass>` for containers like the navbar.
 */
export function GlassSurface<C extends React.ElementType = 'div'>({
  as,
  glass: options,
  glassClassName,
  fallbackClassName,
  className,
  style,
  ref,
  children,
  ...rest
}: GlassSurfaceProps<C>) {
  const { attach, active, style: glassStyle, filter } = useLiquidGlass(options);
  const mergedRef = useMergedRef(attach, ref as React.Ref<HTMLElement> | undefined);
  const Component: React.ElementType = as ?? 'div';

  return (
    <Component
      ref={mergedRef}
      className={cn(className, active ? glassClassName : fallbackClassName)}
      style={glassStyle ? { ...style, ...glassStyle } : style}
      {...rest}
    >
      {filter}
      {children}
    </Component>
  );
}
