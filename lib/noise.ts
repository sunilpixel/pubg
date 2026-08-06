/**
 * Tiny deterministic value-noise + fBm.
 *
 * Enough fidelity to displace a terrain mesh and drive smoke drift, without
 * pulling in a noise library for ~40 lines of maths. Deterministic so the
 * terrain is identical on every load (and between SSR and client).
 */

const hash = (x: number, y: number): number => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
};

const smooth = (t: number) => t * t * (3 - 2 * t);

/** 2D value noise in [-1, 1]. */
export function noise2D(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);

  const u = smooth(xf);
  const v = smooth(yf);

  const value = a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  return value * 2 - 1;
}

/** Fractal Brownian motion — layered octaves for natural-looking terrain. */
export function fbm(x: number, y: number, octaves = 4, lacunarity = 2.05, gain = 0.5): number {
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    sum += noise2D(x * frequency, y * frequency) * amplitude;
    norm += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return sum / norm;
}

/**
 * Ridged noise — sharp crests, useful for the distant mountain silhouette.
 */
export function ridged(x: number, y: number, octaves = 4): number {
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise2D(x * frequency, y * frequency));
    sum += n * n * amplitude;
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return sum / norm;
}
