'use client';

import { memo, useMemo } from 'react';
import { ridged } from '@/lib/noise';
import { stableId } from '@/lib/utils';
import type { GalleryShot } from '@/lib/data/world';

/**
 * Field-capture artwork for the gallery.
 *
 * Each shot is composed from a graded sky, two noise-generated ridges and a
 * scene-specific foreground, so the eight captures share a visual language
 * while remaining individually recognisable.
 */

type Props = { shot: GalleryShot; className?: string };

function ridgePath(seed: number, amplitude: number, base: number): string {
  let d = `M0 ${base}`;
  for (let i = 0; i <= 70; i++) {
    const t = i / 70;
    d += ` L${(t * 800).toFixed(1)} ${(base - ridged(t * 4.5 + seed, seed, 4) * amplitude).toFixed(1)}`;
  }
  return `${d} L800 600 L0 600 Z`;
}

function ShotArtBase({ shot, className }: Props) {
  const uid = stableId(`shot:${shot.id}`);
  const id = (n: string) => `${n}-${uid}`;
  const h = shot.hue;

  const far = useMemo(() => ridgePath(h * 0.07, 74, 330), [h]);
  const near = useMemo(() => ridgePath(h * 0.13 + 5, 46, 400), [h]);

  return (
    <svg
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor={`hsl(${h} 34% 6%)`} />
          <stop offset="38%" stopColor={`hsl(${h} 46% 16%)`} />
          <stop offset="68%" stopColor={`hsl(${h} 72% 34%)`} />
          <stop offset="100%" stopColor={`hsl(${h} 84% 52%)`} />
        </linearGradient>
        <radialGradient id={id('sun')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={`hsl(${h} 100% 76%)`} stopOpacity="0.95" />
          <stop offset="40%" stopColor={`hsl(${h} 96% 56%)`} stopOpacity="0.35" />
          <stop offset="100%" stopColor={`hsl(${h} 96% 56%)`} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('grade')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#030405" stopOpacity="0.1" />
          <stop offset="72%" stopColor="#030405" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#030405" stopOpacity="0.95" />
        </linearGradient>
        <filter id={id('soft')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      {/* Sky */}
      <rect width="800" height="600" fill={`url(#${id('sky')})`} />
      <circle cx="560" cy="300" r="230" fill={`url(#${id('sun')})`} />

      {/* Atmospheric bands */}
      {[0, 1, 2].map((i) => (
        <ellipse
          key={i}
          cx={180 + i * 250}
          cy={130 + i * 40}
          rx={220}
          ry={26}
          fill={`hsl(${h} 40% 60%)`}
          opacity="0.12"
          filter={`url(#${id('soft')})`}
        />
      ))}

      {/* Ridges */}
      <path d={far} fill={`hsl(${h} 32% 9%)`} opacity="0.9" />
      <path d={near} fill="#05070a" />

      {/* -------------------------- Scene foreground -------------------------- */}
      {shot.scene === 'ridge' && (
        <g>
          {/* Lone operator on the crest */}
          <g transform="translate(300 372)">
            <ellipse cx="0" cy="6" rx="26" ry="4" fill="#000" opacity="0.5" />
            <path d="M-5 0 L-7 -34 L6 -34 L4 0 Z" fill="#04060a" />
            <circle cx="0" cy="-42" r="9" fill="#04060a" />
            <path d="M-7 -30 L-26 -20 L-24 -16 L-5 -25 Z" fill="#04060a" />
            <path d="M-26 -20 L-46 -24" stroke="#04060a" strokeWidth="4" strokeLinecap="round" />
          </g>
          {/* Grass tufts */}
          {Array.from({ length: 40 }, (_, i) => (
            <path
              key={i}
              d={`M${20 + i * 20} 420 q3 -18 ${i % 2 ? 8 : -8} -26`}
              stroke="#0a0f0a"
              strokeWidth="2"
              fill="none"
            />
          ))}
        </g>
      )}

      {shot.scene === 'city' && (
        <g>
          {Array.from({ length: 11 }, (_, i) => {
            const w = 48 + ((i * 31) % 46);
            const ht = 90 + ((i * 67) % 190);
            const x = i * 74;
            return (
              <g key={i}>
                <rect x={x} y={420 - ht} width={w} height={ht} fill="#06080b" />
                {Array.from({ length: Math.floor(ht / 26) }, (_, r) =>
                  Array.from({ length: Math.floor(w / 18) }, (_, c) => {
                    const lit = (i * 7 + r * 5 + c * 3) % 5 === 0;
                    return (
                      <rect
                        key={`${r}-${c}`}
                        x={x + 7 + c * 18}
                        y={420 - ht + 12 + r * 26}
                        width="8"
                        height="11"
                        fill={lit ? `hsl(${h} 90% 62%)` : '#0d1114'}
                        opacity={lit ? 0.75 : 1}
                      />
                    );
                  }),
                )}
              </g>
            );
          })}
          {/* Shipping containers */}
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={70 + i * 170}
              y={430}
              width={140}
              height={44}
              rx="3"
              fill={i % 2 ? '#1b2f3a' : '#3a1f1b'}
            />
          ))}
        </g>
      )}

      {shot.scene === 'drop' && (
        <g>
          {/* Canopy */}
          <g transform="translate(420 130)">
            {Array.from({ length: 6 }, (_, i) => {
              const x0 = -84 + i * 28;
              return (
                <path
                  key={i}
                  d={`M${x0} 40 Q${x0 + 14} -22 ${x0 + 28} 40 Q${x0 + 14} 54 ${x0} 40 Z`}
                  fill={i % 2 ? '#b8452f' : '#cdbfa2'}
                  opacity="0.95"
                />
              );
            })}
            {Array.from({ length: 6 }, (_, i) => (
              <path key={i} d={`M${-80 + i * 32} 42 L0 118`} stroke="#cdbfa2" strokeWidth="1" opacity="0.6" />
            ))}
            <rect x="-22" y="118" width="44" height="34" rx="3" fill="#3d3221" />
          </g>
          {/* Red signal smoke on the ground */}
          <ellipse cx="420" cy="430" rx="120" ry="90" fill="#e01730" opacity="0.24" filter={`url(#${id('soft')})`} />
          <ellipse cx="420" cy="380" rx="70" ry="120" fill="#ff3a2f" opacity="0.16" filter={`url(#${id('soft')})`} />
        </g>
      )}

      {shot.scene === 'convoy' && (
        <g>
          {/* Road */}
          <path d="M0 480 L800 440 L800 600 L0 600 Z" fill="#0a0c0f" />
          <path d="M40 512 L760 476" stroke={`hsl(${h} 60% 60%)`} strokeWidth="3" strokeDasharray="34 26" opacity="0.35" />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${170 + i * 210} ${470 - i * 12}) scale(${1 - i * 0.14})`}>
              <path d="M-64 0 L-58 -30 L14 -34 L38 -12 L64 -8 L64 0 Z" fill="#04060a" />
              <circle cx="-38" cy="4" r="12" fill="#04060a" />
              <circle cx="38" cy="4" r="12" fill="#04060a" />
              <circle cx="62" cy="-14" r="6" fill={`hsl(${h} 96% 68%)`} opacity="0.9" />
            </g>
          ))}
          {/* Dust trail */}
          <ellipse cx="140" cy="486" rx="150" ry="42" fill="#b5a288" opacity="0.2" filter={`url(#${id('soft')})`} />
        </g>
      )}

      {shot.scene === 'storm' && (
        <g>
          {/* The blue wall */}
          <rect x="440" y="0" width="360" height="600" fill={`hsl(${h} 92% 52%)`} opacity="0.24" />
          <rect x="440" y="0" width="10" height="600" fill={`hsl(${h} 100% 72%)`} opacity="0.85" />
          <rect x="428" y="0" width="34" height="600" fill={`hsl(${h} 100% 70%)`} opacity="0.3" filter={`url(#${id('soft')})`} />
          {/* Falling snow */}
          {Array.from({ length: 60 }, (_, i) => (
            <circle
              key={i}
              cx={(i * 73) % 800}
              cy={(i * 137) % 560}
              r={1 + (i % 3) * 0.7}
              fill="#e8f2f8"
              opacity="0.55"
            />
          ))}
        </g>
      )}

      {shot.scene === 'night' && (
        <g>
          {/* Tunnel mouth */}
          <path d="M250 600 L250 380 Q400 300 550 380 L550 600 Z" fill="#020304" />
          <path
            d="M250 380 Q400 300 550 380"
            fill="none"
            stroke={`hsl(${h} 90% 62%)`}
            strokeWidth="3"
            opacity="0.6"
          />
          {/* Light spill */}
          <ellipse cx="400" cy="470" rx="90" ry="130" fill={`hsl(${h} 96% 60%)`} opacity="0.2" filter={`url(#${id('soft')})`} />
          {/* Two contacts */}
          {[350, 448].map((x, i) => (
            <g key={x} transform={`translate(${x} 520)`}>
              <path d="M-5 0 L-6 -28 L6 -28 L5 0 Z" fill="#04060a" />
              <circle cx="0" cy="-35" r="8" fill="#04060a" />
              <circle cx={i ? 3 : -3} cy="-35" r="2.2" fill={`hsl(${h} 100% 70%)`} />
            </g>
          ))}
        </g>
      )}

      {shot.scene === 'bridge' && (
        <g>
          {/* Water */}
          <rect x="0" y="440" width="800" height="160" fill={`hsl(${h + 180} 40% 12%)`} />
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={(i * 91) % 800} y={452 + (i % 6) * 22} width={70} height="2" fill="#fff" opacity="0.06" />
          ))}
          {/* Deck */}
          <rect x="0" y="392" width="800" height="26" fill="#0a0d10" />
          {/* Truss arches */}
          {[0, 1].map((i) => (
            <path
              key={i}
              d={`M${60 + i * 380} 392 Q${250 + i * 380} 268 ${440 + i * 380} 392`}
              fill="none"
              stroke="#0d1114"
              strokeWidth="12"
            />
          ))}
          {/* Verticals */}
          {Array.from({ length: 16 }, (_, i) => (
            <rect key={i} x={70 + i * 46} y={330} width="5" height="62" fill="#0d1114" />
          ))}
          {/* Piers */}
          <rect x="380" y="392" width="40" height="120" fill="#080b0e" />
          {/* Muzzle flash on the deck */}
          <circle cx="524" cy="384" r="16" fill="#ffd166" opacity="0.9" filter={`url(#${id('soft')})`} />
        </g>
      )}

      {shot.scene === 'crater' && (
        <g>
          {/* Lava seams */}
          <path d={near} fill="none" stroke="#ff6a1a" strokeWidth="4" opacity="0.85" filter={`url(#${id('soft')})`} />
          <path d={near} fill="none" stroke="#ffd166" strokeWidth="1.6" opacity="0.9" />
          {/* Flowing lava on the floor */}
          <path
            d="M0 500 Q200 468 380 502 T800 486 L800 600 L0 600 Z"
            fill="#2a0f08"
          />
          <path
            d="M0 500 Q200 468 380 502 T800 486"
            fill="none"
            stroke="#ff4a10"
            strokeWidth="7"
            opacity="0.9"
            filter={`url(#${id('soft')})`}
          />
          {/* Rising embers */}
          {Array.from({ length: 30 }, (_, i) => (
            <circle
              key={i}
              cx={(i * 97) % 800}
              cy={300 + ((i * 53) % 240)}
              r={1.4 + (i % 3) * 0.8}
              fill="#ffb066"
              opacity="0.7"
            />
          ))}
        </g>
      )}

      {/* Cinematic grade */}
      <rect width="800" height="600" fill={`url(#${id('grade')})`} />
    </svg>
  );
}

export const ShotArt = memo(ShotArtBase);
