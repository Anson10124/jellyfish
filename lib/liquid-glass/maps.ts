/**
 * Displacement and specular map generation for the liquid glass filter.
 *
 * Ported from kube.io's "Liquid Glass in the Browser: Refraction with CSS and SVG"
 * (https://kube.io/blog/liquid-glass-css-svg/). The idea:
 *
 * 1. Pretend the element is a slab of glass whose edge (the "bezel") curves down
 *    following a surface profile. Light comes straight down at the screen.
 * 2. Use Snell's law to work out, for each distance from the edge, how far
 *    sideways the ray is bent before it hits the background. This only has to be
 *    done once along a single slice, because every point at the same distance
 *    from the edge bends the same amount.
 * 3. Paint that sideways shift into an image: red = horizontal shift,
 *    green = vertical shift, 128 = no shift. The SVG filter primitive
 *    feDisplacementMap then uses that image to move backdrop pixels around.
 * 4. Paint a second image with a thin rim of light along the edge (the
 *    "specular" highlight), brightest where the edge faces the light direction.
 */
import type { SurfaceFn } from './surface';

/**
 * How far (in px) a vertical ray is shifted sideways at each distance from the
 * edge. Index i covers distance i / samples of the bezel width. Positive values
 * mean "towards the inside of the shape".
 */
export function computeDisplacementProfile(
  glassThickness: number,
  bezelWidth: number,
  surface: SurfaceFn,
  refractiveIndex = 1.5,
  samples = 128,
): number[] {
  // Ratio of refractive indices going from air (1) into glass.
  const eta = 1 / refractiveIndex;

  // Snell's law in vector form, simplified for an incident ray that points
  // straight down. Returns null on total internal reflection.
  const refract = (normalX: number, normalY: number): [number, number] | null => {
    const dot = normalY;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null;
    const kSqrt = Math.sqrt(k);
    return [-(eta * dot + kSqrt) * normalX, eta - (eta * dot + kSqrt) * normalY];
  };

  return Array.from({ length: samples }, (_, i) => {
    const x = i / samples;
    const y = surface(x);

    // Surface slope by finite difference, then the (unit) surface normal.
    const dx = x < 1 ? 0.0001 : -0.0001;
    const derivative = (surface(x + dx) - y) / dx;
    const length = Math.sqrt(derivative * derivative + 1);
    const refracted = refract(-derivative / length, -1 / length);
    if (!refracted) return 0;

    // Distance the ray still has to travel down before it hits the background.
    const remainingHeight = y * bezelWidth + glassThickness;
    return refracted[0] * (remainingHeight / refracted[1]);
  });
}

export interface ShapeGeometry {
  /** Size of the element in CSS pixels. */
  width: number;
  height: number;
  /** Corner radius in CSS pixels. */
  radius: number;
  /** Width of the curved edge in CSS pixels. Clamped to the radius. */
  bezelWidth: number;
  /** Map resolution multiplier (usually the device pixel ratio). */
  dpr: number;
}

interface PixelVisitor {
  (index: number, cos: number, sin: number, distanceFromSide: number, edgeOpacity: number): void;
}

/**
 * Walk the pixels of a rounded rectangle that fall inside the bezel and call
 * `visit` with the direction of the edge (cos/sin, pointing outward) and how far
 * the pixel is from the outer edge. Straight edges are treated as a circle
 * "stretched" through the middle, which is how the article handles rounded
 * rectangles.
 */
function forEachBezelPixel(
  bufferWidth: number,
  bufferHeight: number,
  radius: number,
  bezel: number,
  antiAlias: number,
  visit: PixelVisitor,
) {
  const radiusSquared = radius ** 2;
  const outerSquared = (radius + antiAlias) ** 2;
  const innerSquared = Math.max(0, radius - bezel) ** 2;
  const widthBetween = bufferWidth - radius * 2;
  const heightBetween = bufferHeight - radius * 2;

  for (let py = 0; py < bufferHeight; py++) {
    const y =
      py < radius ? py - radius : py >= bufferHeight - radius ? py - radius - heightBetween : 0;

    for (let px = 0; px < bufferWidth; px++) {
      const x =
        px < radius ? px - radius : px >= bufferWidth - radius ? px - radius - widthBetween : 0;

      const distanceSquared = x * x + y * y;
      if (distanceSquared > outerSquared || distanceSquared < innerSquared) continue;

      const distance = Math.sqrt(distanceSquared);
      if (distance === 0) continue;

      const edgeOpacity =
        distanceSquared < radiusSquared ? 1 : 1 - (distance - radius) / antiAlias;

      visit((py * bufferWidth + px) * 4, x / distance, y / distance, radius - distance, edgeOpacity);
    }
  }
}

function bufferSize(geometry: ShapeGeometry) {
  const width = Math.max(1, Math.round(geometry.width * geometry.dpr));
  const height = Math.max(1, Math.round(geometry.height * geometry.dpr));
  const radius = Math.min(geometry.radius, geometry.width / 2, geometry.height / 2) * geometry.dpr;
  // The corner math assumes the bezel fits inside the corner radius.
  const bezel = Math.max(0, Math.min(geometry.bezelWidth * geometry.dpr, radius - 1));
  return { width, height, radius, bezel };
}

/**
 * Red/green displacement map. `maxDisplacement` normalises the profile so the
 * strongest shift uses the full channel range; the filter's `scale` attribute
 * turns it back into pixels.
 */
export function createDisplacementMap(
  geometry: ShapeGeometry,
  profile: number[],
  maxDisplacement: number,
): ImageData {
  const { width, height, radius, bezel } = bufferSize(geometry);
  const image = new ImageData(width, height);
  // 0xff008080 in little-endian RGBA = (128, 128, 0, 255): "no displacement".
  new Uint32Array(image.data.buffer).fill(0xff008080);
  if (bezel <= 0 || maxDisplacement <= 0) return image;

  const data = image.data;
  forEachBezelPixel(width, height, radius, bezel, 1, (i, cos, sin, distanceFromSide, opacity) => {
    const sample = profile[((distanceFromSide / bezel) * profile.length) | 0] ?? 0;
    // Shift towards the inside of the shape (opposite of the outward edge direction).
    const dX = (-cos * sample) / maxDisplacement;
    const dY = (-sin * sample) / maxDisplacement;
    data[i] = 128 + dX * 127 * opacity;
    data[i + 1] = 128 + dY * 127 * opacity;
    data[i + 2] = 0;
    data[i + 3] = 255;
  });
  return image;
}

/**
 * Thin rim of light along the edge. Brightest where the edge direction lines up
 * with `lightAngle` (and the opposite side, like light passing through glass).
 */
export function createSpecularMap(geometry: ShapeGeometry, lightAngle = Math.PI / 3): ImageData {
  const { width, height, radius } = bufferSize(geometry);
  const dpr = geometry.dpr;
  const image = new ImageData(width, height);
  const lightX = Math.cos(lightAngle);
  const lightY = Math.sin(lightAngle);
  // The highlight only lives in the outermost ~2px, so a narrow band is enough.
  const band = Math.min(radius, 2 * dpr);

  const data = image.data;
  forEachBezelPixel(width, height, radius, band, dpr, (i, cos, sin, distanceFromSide, opacity) => {
    const facing = Math.abs(cos * lightX - sin * lightY);
    const t = 1 - distanceFromSide / dpr;
    const falloff = t * t < 1 ? Math.sqrt(1 - t * t) : 0;
    const coefficient = facing * falloff;
    const color = 255 * coefficient;
    data[i] = color;
    data[i + 1] = color;
    data[i + 2] = color;
    data[i + 3] = color * coefficient * opacity;
  });
  return image;
}

export function imageDataToUrl(image: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  if (!context) return '';
  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
}
