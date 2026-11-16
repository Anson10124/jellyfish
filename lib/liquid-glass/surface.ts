/**
 * Glass surface profiles, ported from kube.io's "Liquid Glass in the Browser".
 *
 * Each function takes the distance from the outer edge of the shape, as a ratio
 * of the bezel width (0 = outer edge, 1 = where the bezel meets the flat top),
 * and returns the height of the glass at that point (0..1).
 */
export type SurfaceFn = (x: number) => number;

/** Quarter circle: steep at the edge, flattens quickly. */
export const convexCircle: SurfaceFn = (x) => Math.sqrt(1 - (1 - x) ** 2);

/** Squircle: like a circle, but with a smoother transition into the flat top. Apple's look. */
export const convexSquircle: SurfaceFn = (x) => Math.pow(1 - Math.pow(1 - x, 4), 1 / 4);

/** Dips inward. Pushes refracted rays outside the shape, so it needs content around it. */
export const concave: SurfaceFn = (x) => 1 - convexCircle(x);

/** Raised rim with a dip in the middle, like Apple's switch thumb. */
export const lip: SurfaceFn = (x) => {
  const smootherstep = 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
  return convexSquircle(x * 2) * (1 - smootherstep) + (concave(x) + 0.1) * smootherstep;
};

export const SURFACES = {
  convexCircle,
  convexSquircle,
  concave,
  lip,
} as const;

export type SurfaceName = keyof typeof SURFACES;
