'use client';

import { memo } from 'react';

/**
 * The global cinematic treatment: film grain, vignette, colour grade and a
 * scanline sweep.
 *
 * PERFORMANCE NOTE — this used to apply `filter: url(#grain)` (an feTurbulence)
 * to a element 2.2× the size of the viewport, and animate it. SVG filters are
 * re-rasterised on every animation step and are frequently CPU-bound, which
 * made this the most expensive thing on the page by a wide margin.
 *
 * Now the turbulence is baked once into a 140×140 data-URI tile. The browser
 * decodes it a single time, tiles it as a plain background image, and the
 * animation only touches `background-position` — a compositor-only property.
 * Visually near-identical; costs effectively nothing.
 */

const NOISE_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

function FilmGrainBase() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[95]" aria-hidden="true">
      {/* Grain — a tiled, pre-rasterised noise texture.
          Oversized by 20% so the jitter transform never exposes an edge, and
          animated via transform (compositor-only) rather than
          background-position (which would repaint the full-screen layer). This
          is one of the few elements that genuinely animates every frame, so it
          earns its will-change. */}
      <div
        className="absolute -inset-[20%] opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage: NOISE_TILE,
          backgroundRepeat: 'repeat',
          animation: 'grain-shift 0.9s steps(5, end) infinite',
          willChange: 'transform',
        }}
      />

      {/* Vignette — heavier at the corners than a plain radial to keep the
          centre of frame genuinely clean. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 42%, transparent 38%, rgb(0 0 0 / 0.45) 78%, rgb(0 0 0 / 0.85) 100%)',
        }}
      />

      {/* Cool-to-warm colour grade, the way a DI pass would leave it */}
      <div
        className="absolute inset-0 opacity-25 mix-blend-soft-light"
        style={{
          background:
            'linear-gradient(160deg, rgb(40 90 140 / 0.7) 0%, transparent 42%, rgb(255 106 26 / 0.6) 100%)',
        }}
      />

      {/* CRT-ish scanlines, very low opacity */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgb(255 255 255 / 0.6) 0px, rgb(255 255 255 / 0.6) 1px, transparent 1px, transparent 3px)',
        }}
      />
    </div>
  );
}

export const FilmGrain = memo(FilmGrainBase);
