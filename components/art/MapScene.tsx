'use client';

import { memo, useId, useMemo } from 'react';
import { ridged } from '@/lib/noise';
import type { BattleMap } from '@/lib/types';

/**
 * A layered diorama for each battle map.
 *
 * Six depth planes — sky, far ridge, mid ridge, fog band, treeline, foreground
 * — each tagged with a `data-depth` the parent uses to drive parallax. Ridges
 * are generated from the same ridged-noise function as the 3D terrain, so a
 * given map always draws the same silhouette.
 */

type Props = {
  map: BattleMap;
  className?: string;
};

/** Build an SVG path for one ridge line across the full width. */
function ridgePath(seed: number, amplitude: number, base: number, segments = 90): string {
  let d = `M0 ${base}`;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = base - ridged(t * 5 + seed, seed * 1.7, 4) * amplitude;
    d += ` L${(t * 1000).toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L1000 400 L0 400 Z`;
}

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

        <linearGradient id={`fog-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor={arctic ? '#dbeaf4' : '#c9d3da'} stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <filter id={`blur-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* ------------------------------- SKY ------------------------------- */}
      <g data-depth="0.06">
        <rect width="1000" height="400" fill={`url(#sky-${uid})`} />
        {/* Low sun / caldera glow */}
        <circle cx={desert ? 720 : 300} cy="180" r="190" fill={`url(#sun-${uid})`} />
      </g>

      {/* ------------------------------ CLOUDS ----------------------------- */}
      {/* Two bands at different depths so they separate as the card parallaxes */}
      <g data-depth="0.16" data-cloud="slow" opacity={arctic ? 0.55 : 0.35}>
        {[0, 1, 2, 3].map((i) => (
          <ellipse
            key={i}
            cx={110 + i * 265}
            cy={62 + (i % 2) * 26}
            rx={130 + i * 16}
            ry={19 + (i % 3) * 6}
            fill={arctic ? '#cfe0ec' : '#9fb0bd'}
            opacity="0.3"
            filter={`url(#blur-${uid})`}
          />
        ))}
      </g>
      <g data-depth="0.28" data-cloud="fast" opacity="0.3">
        {[0, 1, 2].map((i) => (
          <ellipse
            key={i}
            cx={220 + i * 340}
            cy={116 + (i % 2) * 18}
            rx={168}
            ry={22}
            fill={volcanic ? '#7a4030' : '#8fa2b0'}
            opacity="0.34"
            filter={`url(#blur-${uid})`}
          />
        ))}
      </g>

      {/* ---------------------------- FAR RIDGE ---------------------------- */}
      <g data-depth="0.34">
        <path d={far} fill={`url(#far-${uid})`} opacity="0.75" />
      </g>

      {/* ---------------------------- MID RIDGE ---------------------------- */}
      <g data-depth="0.52">
        <path d={mid} fill={`url(#mid-${uid})`} opacity="0.92" />
        {/* Volcanic lava seams tracing the mid ridge */}
        {volcanic ? (
          <path
            d={mid}
            fill="none"
            stroke="#ff6a1a"
            strokeWidth="2.5"
            opacity="0.75"
            style={{ filter: 'drop-shadow(0 0 8px #ff6a1a)' }}
          />
        ) : null}
      </g>

      {/* ------------------------------- FOG ------------------------------- */}
      <g data-depth="0.62" data-fog>
        <rect x="-200" y="250" width="1400" height="72" fill={`url(#fog-${uid})`} opacity="0.85" />
      </g>
      <g data-depth="0.7" data-fog="slow">
        <rect x="-200" y="292" width="1400" height="60" fill={`url(#fog-${uid})`} opacity="0.6" />
      </g>

      {/* ---------------------------- NEAR RIDGE --------------------------- */}
      <g data-depth="0.78">
        <path d={near} fill="#05070a" opacity="0.96" />
      </g>

      {/* ----------------------------- TREELINE ---------------------------- */}
      <g data-depth="0.88" data-trees>
        {Array.from({ length: 26 }, (_, i) => {
          const x = 8 + i * 39 + ((i * 37) % 17);
          const h = jungle ? 62 + ((i * 23) % 34) : 34 + ((i * 19) % 26);
          const y = 336;
          return (
            <g key={i} style={{ transformOrigin: `${x}px ${y}px` }} className="map-tree">
              {jungle ? (
                // Palm: a curved trunk and a fan of fronds
                <>
                  <path
                    d={`M${x} ${y} Q${x + 5} ${y - h * 0.6} ${x + 2} ${y - h}`}
                    stroke="#0a0f0a"
                    strokeWidth="3"
                    fill="none"
                  />
                  {[-38, -14, 14, 38].map((a) => (
                    <path
                      key={a}
                      d={`M${x + 2} ${y - h} q${a * 0.5} ${-10} ${a} ${6}`}
                      stroke="#0a0f0a"
                      strokeWidth="3.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  ))}
                </>
              ) : desert ? (
                // Saguaro cactus
                <>
                  <rect x={x - 2} y={y - h} width="4.5" height={h} rx="2" fill="#0a0d0a" />
                  <path
                    d={`M${x} ${y - h * 0.55} h-8 v-${h * 0.3}`}
                    stroke="#0a0d0a"
                    strokeWidth="4"
                    fill="none"
                  />
                </>
              ) : (
                // Conifer
                <>
                  <rect x={x - 1.4} y={y - h * 0.28} width="2.8" height={h * 0.28} fill="#080b09" />
                  <path
                    d={`M${x} ${y - h} L${x + h * 0.3} ${y - h * 0.25} L${x - h * 0.3} ${y - h * 0.25} Z`}
                    fill={arctic ? '#0d1418' : '#0a1009'}
                  />
                  <path
                    d={`M${x} ${y - h * 0.78} L${x + h * 0.36} ${y - h * 0.1} L${x - h * 0.36} ${y - h * 0.1} Z`}
                    fill={arctic ? '#0a1015' : '#080d07'}
                  />
                  {arctic ? (
                    <path
                      d={`M${x} ${y - h} L${x + h * 0.14} ${y - h * 0.7} L${x - h * 0.14} ${y - h * 0.7} Z`}
                      fill="#cfe0ec"
                      opacity="0.45"
                    />
                  ) : null}
                </>
              )}
            </g>
          );
        })}
      </g>

      {/* ---------------------------- FOREGROUND --------------------------- */}
      <g data-depth="1">
        <path
          d="M0 372 Q160 352 320 368 T640 366 T1000 358 L1000 400 L0 400 Z"
          fill="#020304"
        />
        {/* Grade the base into the card background */}
        <rect x="0" y="330" width="1000" height="70" fill="url(#void-fade)" opacity="0.5" />
      </g>

      <defs>
        <linearGradient id="void-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#030405" stopOpacity="0" />
          <stop offset="100%" stopColor="#030405" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export const MapScene = memo(MapSceneBase);
