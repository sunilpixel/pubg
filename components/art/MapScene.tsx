'use client';

import { memo, useId, useMemo } from 'react';
import { ridged } from '@/lib/noise';
import type { BattleMap } from '@/lib/types';

/**
 * A layered diorama for each battle map.
 *
 * Depth planes are tagged with `data-depth`, which the parent reads to drive
 * pointer parallax. Ridges come from the same ridged-noise function as the 3D
 * terrain, so a given map always draws the same silhouette.
 *
 * PERFORMANCE
 * -----------
 * Six of these render at once, so everything here is costed per-card ×6:
 *
 *  - Clouds were `<ellipse filter="url(#blur)">`. A `feGaussianBlur` is a real
 *    offscreen render pass, and there were seven per card — 42 filter passes
 *    across the section. They are now radial gradients whose falloff *is* the
 *    softness, which costs nothing.
 *  - Trees were 3–4 elements each × 26 trees. Now one `<path>` each (trunk and
 *    both canopy tiers as subpaths of a single element) and fewer of them.
 *  - Parallax planes were cut from ten to five. Every plane is a transform
 *    written inside a complex SVG on each pointer move, and that invalidates
 *    the raster; the planes that were dropped moved too little to notice.
 */

type Props = {
  map: BattleMap;
  className?: string;
};

/** Ridge silhouette across the full width. Segment count kept modest — these
 *  are read as a distant skyline, not a profile. */
function ridgePath(seed: number, amplitude: number, base: number, segments = 56): string {
  let d = `M0 ${base}`;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = base - ridged(t * 5 + seed, seed * 1.7, 3) * amplitude;
    d += ` L${(t * 1000).toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L1000 400 L0 400 Z`;
}

const TREE_COUNT = 14;

function MapSceneBase({ map, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const [cool, warm] = map.palette;
  const seed = useMemo(
    () => map.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 97,
    [map.id],
  );

  const far = useMemo(() => ridgePath(seed * 0.11, 62, 210), [seed]);
  const mid = useMemo(() => ridgePath(seed * 0.29 + 3, 44, 258), [seed]);
  const near = useMemo(() => ridgePath(seed * 0.47 + 9, 30, 300), [seed]);

  const arctic = map.terrain === 'arctic';
  const volcanic = map.terrain === 'volcanic';
  const desert = map.terrain === 'desert';
  const jungle = map.terrain === 'jungle';

  const treeFill = arctic ? '#0d1418' : jungle ? '#0a0f0a' : '#0a1009';

  return (
    <svg
      viewBox="0 0 1000 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={volcanic ? '#210b06' : arctic ? '#0d1a24' : '#0a1016'} />
          <stop offset="46%" stopColor={cool} stopOpacity="0.55" />
          <stop offset="76%" stopColor={warm} stopOpacity="0.55" />
          <stop offset="100%" stopColor={warm} stopOpacity="0.16" />
        </linearGradient>

        <linearGradient id={`far-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cool} stopOpacity="0.55" />
          <stop offset="100%" stopColor="#05070a" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id={`mid-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cool} stopOpacity="0.8" />
          <stop offset="100%" stopColor="#04060a" />
        </linearGradient>

        <radialGradient id={`sun-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={volcanic ? '#ff8a2e' : warm} stopOpacity="0.95" />
          <stop offset="42%" stopColor={warm} stopOpacity="0.28" />
          <stop offset="100%" stopColor={warm} stopOpacity="0" />
        </radialGradient>

        {/* Soft cloud body. The gradient's own falloff replaces what used to be
            a per-ellipse Gaussian blur filter. */}
        <radialGradient id={`cloud-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={arctic ? '#cfe0ec' : '#9fb0bd'} stopOpacity="0.34" />
          <stop offset="55%" stopColor={arctic ? '#cfe0ec' : '#9fb0bd'} stopOpacity="0.16" />
          <stop offset="100%" stopColor={arctic ? '#cfe0ec' : '#9fb0bd'} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`cloud2-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={volcanic ? '#7a4030' : '#8fa2b0'} stopOpacity="0.3" />
          <stop offset="60%" stopColor={volcanic ? '#7a4030' : '#8fa2b0'} stopOpacity="0.12" />
          <stop offset="100%" stopColor={volcanic ? '#7a4030' : '#8fa2b0'} stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`fog-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor={arctic ? '#dbeaf4' : '#c9d3da'} stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={`base-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#030405" stopOpacity="0" />
          <stop offset="100%" stopColor="#030405" />
        </linearGradient>
      </defs>

      {/* ------------------------------- SKY -------------------------------
          No `data-depth`: a full-bleed gradient shifting by a few pixels is
          invisible, so it was a transform write per frame for nothing. */}
      <g>
        <rect width="1000" height="400" fill={`url(#sky-${uid})`} />
        <circle cx={desert ? 720 : 300} cy="180" r="190" fill={`url(#sun-${uid})`} />
      </g>

      {/* ------------------------------ CLOUDS ----------------------------- */}
      <g data-cloud="slow" opacity={arctic ? 0.75 : 0.55}>
        {[0, 1, 2, 3].map((i) => (
          <ellipse
            key={i}
            cx={110 + i * 265}
            cy={62 + (i % 2) * 26}
            rx={150 + i * 16}
            ry={34 + (i % 3) * 8}
            fill={`url(#cloud-${uid})`}
          />
        ))}
      </g>
      <g data-depth="0.28" data-cloud="fast" opacity="0.55">
        {[0, 1, 2].map((i) => (
          <ellipse
            key={i}
            cx={220 + i * 340}
            cy={116 + (i % 2) * 18}
            rx={185}
            ry={40}
            fill={`url(#cloud2-${uid})`}
          />
        ))}
      </g>

      {/* ---------------------------- FAR RIDGE ---------------------------- */}
      <g data-depth="0.34">
        <path d={far} fill={`url(#far-${uid})`} opacity="0.75" />
      </g>

      {/* ------------------------- MID RIDGE + FOG -------------------------
          Merged into one plane. They sit within 0.1 of each other in depth, so
          separating them bought no visible parallax and doubled the writes. */}
      <g data-depth="0.55">
        <path d={mid} fill={`url(#mid-${uid})`} opacity="0.92" />
        {volcanic ? (
          <path d={mid} fill="none" stroke="#ff6a1a" strokeWidth="2.5" opacity="0.75" />
        ) : null}
        <g data-fog>
          <rect x="-200" y="250" width="1400" height="72" fill={`url(#fog-${uid})`} opacity="0.85" />
        </g>
      </g>

      <g data-fog="slow">
        <rect x="-200" y="292" width="1400" height="60" fill={`url(#fog-${uid})`} opacity="0.6" />
      </g>

      {/* ---------------------------- NEAR RIDGE --------------------------- */}
      <g>
        <path d={near} fill="#05070a" opacity="0.96" />
      </g>

      {/* ----------------------------- TREELINE ----------------------------
          One <path> per tree. Trunk and both canopy tiers are subpaths of a
          single element rather than three separate nodes. */}
      <g data-depth="0.88">
        {Array.from({ length: TREE_COUNT }, (_, i) => {
          const x = 14 + i * (1000 / TREE_COUNT) + ((i * 37) % 21);
          const h = jungle ? 62 + ((i * 23) % 34) : 34 + ((i * 19) % 26);
          const y = 336;

          if (jungle) {
            return (
              <path
                key={i}
                className="map-tree"
                style={{ transformOrigin: `${x}px ${y}px` }}
                d={
                  `M${x} ${y} Q${x + 5} ${y - h * 0.6} ${x + 2} ${y - h}` +
                  [-38, -14, 14, 38]
                    .map((a) => ` M${x + 2} ${y - h} q${a * 0.5} ${-10} ${a} ${6}`)
                    .join('')
                }
                stroke="#0a0f0a"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
            );
          }

          if (desert) {
            return (
              <path
                key={i}
                className="map-tree"
                style={{ transformOrigin: `${x}px ${y}px` }}
                d={`M${x} ${y} v${-h} M${x} ${y - h * 0.55} h-8 v${-h * 0.3}`}
                stroke="#0a0d0a"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
            );
          }

          return (
            <path
              key={i}
              className="map-tree"
              style={{ transformOrigin: `${x}px ${y}px` }}
              d={
                `M${x - 1.4} ${y} h2.8 v${-h * 0.28} h-2.8 Z ` +
                `M${x} ${y - h} L${x + h * 0.3} ${y - h * 0.25} L${x - h * 0.3} ${y - h * 0.25} Z ` +
                `M${x} ${y - h * 0.78} L${x + h * 0.36} ${y - h * 0.1} L${x - h * 0.36} ${y - h * 0.1} Z`
              }
              fill={treeFill}
            />
          );
        })}
      </g>

      {/* ---------------------------- FOREGROUND --------------------------- */}
      <g data-depth="1">
        <path d="M0 372 Q160 352 320 368 T640 366 T1000 358 L1000 400 L0 400 Z" fill="#020304" />
        <rect x="0" y="330" width="1000" height="70" fill={`url(#base-${uid})`} opacity="0.5" />
      </g>
    </svg>
  );
}

export const MapScene = memo(MapSceneBase);
