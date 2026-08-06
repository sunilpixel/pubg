'use client';

import { memo, useId } from 'react';
import type { Operator } from '@/lib/types';

/**
 * Operator portrait — a helmeted silhouette lit from behind in the operator's
 * signature hue. Eyes/visor are tagged `.eye-glow` so the card's hover rig can
 * bring them up independently of everything else.
 */

type Props = { operator: Operator; className?: string };

function OperatorPortraitBase({ operator, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${n}-${uid}`;
  const h = operator.hue;
  const accent = `hsl(${h} 92% 60%)`;
  const deep = `hsl(${h} 70% 22%)`;

  return (
    <svg viewBox="0 0 320 400" className={className} role="presentation" aria-hidden="true">
      <defs>
        <radialGradient id={id('rim')} cx="0.5" cy="0.32" r="0.62">
          <stop offset="0%" stopColor={accent} stopOpacity="0.5" />
          <stop offset="55%" stopColor={deep} stopOpacity="0.22" />
          <stop offset="100%" stopColor="#04060a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('gear')} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#3a4249" />
          <stop offset="42%" stopColor="#1c2126" />
          <stop offset="100%" stopColor="#080a0c" />
        </linearGradient>
        <linearGradient id={id('visor')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.85" />
          <stop offset="50%" stopColor={deep} stopOpacity="0.7" />
          <stop offset="100%" stopColor="#04070a" stopOpacity="0.9" />
        </linearGradient>
        <filter id={id('glow')} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id={id('weave')} width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 5 L5 0" stroke="#fff" strokeOpacity="0.045" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Backlight halo */}
      <ellipse cx="160" cy="150" rx="150" ry="160" fill={`url(#${id('rim')})`} />

      {/* Shoulders / plate carrier */}
      <path
        d="M18 400 Q26 300 92 272 L228 272 Q294 300 302 400 Z"
        fill={`url(#${id('gear')})`}
        stroke="#04060a"
      />
      <path d="M18 400 Q26 300 92 272 L228 272 Q294 300 302 400 Z" fill={`url(#${id('weave')})`} />
      {/* Plate carrier detail */}
      <rect x="106" y="286" width="108" height="70" rx="6" fill="#12161a" />
      <rect x="118" y="296" width="36" height="22" rx="3" fill="#0a0d10" />
      <rect x="166" y="296" width="36" height="22" rx="3" fill="#0a0d10" />
      <rect x="118" y="326" width="84" height="8" rx="4" fill={accent} opacity="0.35" />
      {/* Shoulder patch */}
      <rect x="44" y="304" width="34" height="26" rx="4" fill="#0d1013" />
      <path d="M52 316 L61 308 L70 316 L61 324 Z" fill={accent} opacity="0.7" />

      {/* Neck */}
      <path d="M132 240 L188 240 L192 278 L128 278 Z" fill="#161a1e" />

      {/* Helmet shell */}
      <path
        d="M62 158 Q62 56 160 56 Q258 56 258 158 L258 186 Q258 196 246 196 L74 196 Q62 196 62 186 Z"
        fill={`url(#${id('gear')})`}
        stroke="#04060a"
        strokeWidth="1.5"
      />
      <path
        d="M62 158 Q62 56 160 56 Q258 56 258 158 L258 186 Q258 196 246 196 L74 196 Q62 196 62 186 Z"
        fill={`url(#${id('weave')})`}
      />
      {/* Helmet top-light */}
      <path d="M78 122 Q100 68 160 66 Q220 68 242 122" fill="none" stroke="#fff" strokeOpacity="0.09" strokeWidth="7" />

      {/* NVG mount + rail */}
      <rect x="140" y="44" width="40" height="18" rx="4" fill="#12161a" />
      <rect x="150" y="30" width="20" height="18" rx="3" fill="#1c2126" />
      <rect x="66" y="140" width="14" height="46" rx="4" fill="#12161a" />
      <rect x="240" y="140" width="14" height="46" rx="4" fill="#12161a" />

      {/* Visor / goggles */}
      <path
        d="M78 150 Q160 132 242 150 L242 184 Q160 200 78 184 Z"
        fill={`url(#${id('visor')})`}
        stroke="#04060a"
      />
      {/* Specular streak across the visor */}
      <path d="M92 156 Q160 142 228 156" stroke="#fff" strokeOpacity="0.3" strokeWidth="4" fill="none" />

      {/* Eye glow — two hot points behind the visor */}
      <g className="eye-glow" opacity="0.55">
        <ellipse cx="120" cy="167" rx="13" ry="7" fill={accent} filter={`url(#${id('glow')})`} />
        <ellipse cx="200" cy="167" rx="13" ry="7" fill={accent} filter={`url(#${id('glow')})`} />
        <ellipse cx="120" cy="167" rx="5" ry="3" fill="#fff" opacity="0.9" />
        <ellipse cx="200" cy="167" rx="5" ry="3" fill="#fff" opacity="0.9" />
      </g>

      {/* Respirator / lower face mask */}
      <path
        d="M104 196 L216 196 L208 236 Q198 256 160 256 Q122 256 112 236 Z"
        fill="#1a1f24"
        stroke="#04060a"
      />
      <path d="M104 196 L216 196 L214 206 L106 206 Z" fill="#2a3136" />
      {/* Filter canisters */}
      <circle cx="122" cy="224" r="15" fill="#0f1215" stroke="#2a3136" strokeWidth="2" />
      <circle cx="198" cy="224" r="15" fill="#0f1215" stroke="#2a3136" strokeWidth="2" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <g key={i}>
            <circle cx={122 + Math.cos(a) * 7} cy={224 + Math.sin(a) * 7} r="2" fill="#05070a" />
            <circle cx={198 + Math.cos(a) * 7} cy={224 + Math.sin(a) * 7} r="2" fill="#05070a" />
          </g>
        );
      })}
      {/* Exhale valve */}
      <path d="M150 240 L170 240 L166 252 L154 252 Z" fill="#0a0d10" />

      {/* Comms boom */}
      <path
        d="M246 176 Q276 196 262 232 Q252 250 226 244"
        fill="none"
        stroke="#1c2126"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="224" cy="243" r="7" fill="#12161a" />
      <circle cx="224" cy="243" r="2.6" fill={accent} opacity="0.8" />

      {/* IR strobe on the helmet */}
      <circle cx="238" cy="112" r="4" fill={accent} opacity="0.9" filter={`url(#${id('glow')})`} />
    </svg>
  );
}

export const OperatorPortrait = memo(OperatorPortraitBase);
