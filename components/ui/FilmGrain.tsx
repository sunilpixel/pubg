'use client';

import { memo } from 'react';

/**
 * The global cinematic treatment: fractal film grain, a scanline sweep, a
 * chromatic vignette and a subtle top-down volumetric haze.
 *
 * All of it is fixed-position, pointer-events:none and composited on the GPU,
 * so it costs one extra layer and no layout work. The grain is a single
 * feTurbulence tile animated by transform rather than by regenerating noise —
 * regenerating would pin a core to 100%.
 */
function FilmGrainBase() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[95]" aria-hidden="true">
      {/* Grain */}
      <svg className="absolute h-0 w-0">
        <filter id="bp-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.35 0"
          />
        </filter>
      </svg>

      <div
        className="absolute -inset-[60%] opacity-[0.16] mix-blend-overlay"
        style={{
          filter: 'url(#bp-grain)',
          animation: 'grain-shift 1.1s steps(6, end) infinite',
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

      {/* Slow travelling scan bar */}
      <div
        className="absolute inset-x-0 h-40 opacity-[0.045]"
        style={{
          background:
            'linear-gradient(180deg, transparent, rgb(255 255 255 / 0.8), transparent)',
          animation: 'scan 9s linear infinite',
          willChange: 'transform',
        }}
      />
    </div>
  );
}

export const FilmGrain = memo(FilmGrainBase);
