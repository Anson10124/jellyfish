'use client';

import React, { createContext, useContext } from 'react';
import { useRender } from '@base-ui/react/use-render';
import { GlassSurface, type GlassSurfaceProps } from '@glass-sdk/liquid-glass';

import { cn } from '@/lib/utils';

interface LiquidGlassContextValue {
  /** True only inside a running <LiquidGlassScene>; glass components throw outside a GlassScene. */
  active: boolean;
  /** The scene element. Glass popups must be portaled inside it to refract the page. */
  root: HTMLElement | null;
}

export const LiquidGlassContext = createContext<LiquidGlassContextValue>({ active: false, root: null });

export function useLiquidGlassActive(): boolean {
  return useContext(LiquidGlassContext).active;
}

/** Where to portal overlays: the glass scene when it is running, otherwise document.body. */
export function useLiquidGlassPortalContainer(): HTMLElement | null {
  const { root } = useContext(LiquidGlassContext);
  return root ?? (typeof document === 'undefined' ? null : document.body);
}

export interface LiquidGlassProps extends Omit<GlassSurfaceProps, 'render' | 'ref'> {
  render?: useRender.RenderProp;
  ref?: React.Ref<HTMLElement>;
  /** Classes applied only when Liquid Glass is on (e.g. a lighter border). */
  glassClassName?: string;
  /** Classes applied only when Liquid Glass is off, typically the frosted background and border it replaces. */
  fallbackClassName?: string;
}

/**
 * Base glass surface for the app. Renders a refractive GlassSurface when the Liquid Glass setting is on
 * and WebGPU is available, otherwise the same element with `fallbackClassName`.
 */
export function LiquidGlass({
  className,
  glassClassName,
  fallbackClassName,
  render,
  ref,
  material,
  appearance,
  radius,
  concentric,
  refraction,
  tint,
  interactive,
  morphFrom,
  morph,
  neck,
  morphEnter,
  fluid,
  motion,
  ...props
}: LiquidGlassProps) {
  const active = useLiquidGlassActive();

  const fallback = useRender({
    render: render ?? <div />,
    ref,
    props: { ...props, className: cn(className, fallbackClassName) },
    enabled: !active,
  });

  if (!active) return fallback;

  return (
    <GlassSurface
      {...props}
      ref={ref}
      render={render}
      material={material}
      appearance={appearance}
      radius={radius}
      concentric={concentric}
      refraction={refraction}
      tint={tint}
      interactive={interactive}
      morphFrom={morphFrom}
      morph={morph}
      neck={neck}
      morphEnter={morphEnter}
      fluid={fluid}
      motion={motion}
      data-liquid-glass=""
      className={cn('liquid-glass-surface', className, glassClassName)}
    />
  );
}
