'use client';

import { memo } from 'react';
import { stableId } from '@/lib/utils';
import type { Vehicle } from '@/lib/types';

/**
 * Side-elevation vehicle illustrations.
 *
 * Wheels live in their own `.wheel` groups with a hub marker so rotation is
 * actually legible, headlights are tagged `.headlight` / `.beam` so the hover
 * rig can switch them on, and the body sits in `.chassis` so it can bounce on
 * ignition independently of the wheels.
 */

type Props = {
  vehicle: Vehicle;
  className?: string;
};

const GROUND = 196;

function Wheel({
  cx,
  r,
  id,
  spokes = 5,
  tread = true,
}: {
  cx: number;
  r: number;
  id: (n: string) => string;
  spokes?: number;
  tread?: boolean;
}) {
  return (
    <g className="wheel" style={{ transformOrigin: `${cx}px ${GROUND - r}px` }}>
      {/* Tyre */}
      <circle cx={cx} cy={GROUND - r} r={r} fill="#0a0c0e" />
      <circle cx={cx} cy={GROUND - r} r={r} fill={`url(#${id('rubber')})`} />
      {/* Tread blocks */}
      {tread &&
        Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <rect
              key={i}
              x={cx - 2}
              y={GROUND - r - r}
              width="4"
              height="7"
              rx="1"
              fill="#1b2024"
              transform={`rotate(${(a * 180) / Math.PI} ${cx} ${GROUND - r})`}
            />
          );
        })}
      {/* Rim */}
      <circle cx={cx} cy={GROUND - r} r={r * 0.58} fill={`url(#${id('rim')})`} />
      <circle cx={cx} cy={GROUND - r} r={r * 0.58} fill="none" stroke="#0a0c0e" strokeWidth="1.5" />
      {/* Spokes — the visual proof of rotation */}
      {Array.from({ length: spokes }, (_, i) => {
        const a = (i / spokes) * Math.PI * 2;
        return (
          <rect
            key={i}
            x={cx - 2.4}
            y={GROUND - r - r * 0.52}
            width="4.8"
            height={r * 0.46}
            rx="2.4"
            fill="#39424a"
            transform={`rotate(${(a * 180) / Math.PI} ${cx} ${GROUND - r})`}
          />
        );
      })}
      <circle cx={cx} cy={GROUND - r} r={r * 0.16} fill="#5a656d" />
      <circle cx={cx} cy={GROUND - r} r={r * 0.07} fill="#0a0c0e" />
    </g>
  );
}

function VehicleArtBase({ vehicle, className }: Props) {
  const uid = stableId(`vehicle:${vehicle.id}`);
  const id = (n: string) => `${n}-${uid}`;
  const accent = vehicle.accent;

  return (
    <svg viewBox="0 0 520 240" className={className} role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id={id('paint')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5f6a72" />
          <stop offset="18%" stopColor="#3a4249" />
          <stop offset="58%" stopColor="#232a2f" />
          <stop offset="100%" stopColor="#0d1013" />
        </linearGradient>
        <linearGradient id={id('paint2')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2c343a" />
          <stop offset="50%" stopColor="#1a1f24" />
          <stop offset="100%" stopColor="#0a0d10" />
        </linearGradient>
        <linearGradient id={id('glass')} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#9fd4ea" stopOpacity="0.65" />
          <stop offset="45%" stopColor="#2b4a5c" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#06090c" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={id('rim')} cx="0.36" cy="0.32" r="0.7">
          <stop offset="0%" stopColor="#8b969e" />
          <stop offset="60%" stopColor="#3a4249" />
          <stop offset="100%" stopColor="#14181b" />
        </radialGradient>
        <radialGradient id={id('rubber')} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0%" stopColor="#2a3136" />
          <stop offset="70%" stopColor="#12161a" />
          <stop offset="100%" stopColor="#05070a" />
        </radialGradient>
        {/* Travelling reflection band swept across the bodywork */}
        <linearGradient id={id('reflect')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="42%" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="58%" stopColor={accent} stopOpacity="0.32" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={id('bodyClip')}>
          <rect x="0" y="0" width="520" height="240" />
        </clipPath>
        <filter id={id('lamp')} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* Contact shadow */}
      <ellipse cx="262" cy={GROUND + 6} rx="200" ry="11" fill="#000" opacity="0.62" />

      {/* Headlight beam — hidden until the hover rig switches it on */}
      <g className="beam" opacity="0">
        <path
          d="M488 150 L520 118 L520 190 L488 168 Z"
          fill={accent}
          opacity="0.16"
          filter={`url(#${id('lamp')})`}
        />
      </g>

      <g className="chassis">
        {vehicle.chassis === 'suv' && (
          <>
            <path
              d="M92 172 L84 138 Q84 128 96 126 L146 122 L182 84 Q188 76 202 76 L346 76 Q360 76 366 86 L392 124 L448 130 Q462 132 462 144 L462 172 Z"
              fill={`url(#${id('paint')})`}
              stroke="#04060a"
            />
            {/* Greenhouse */}
            <path d="M196 84 L272 84 L272 122 L166 122 Z" fill={`url(#${id('glass')})`} />
            <path d="M282 84 L342 84 L370 122 L282 122 Z" fill={`url(#${id('glass')})`} />
            {/* Roof rack */}
            <rect x="200" y="70" width="146" height="6" rx="3" fill="#1b2024" />
            <rect x="212" y="62" width="8" height="10" rx="2" fill="#1b2024" />
            <rect x="326" y="62" width="8" height="10" rx="2" fill="#1b2024" />
            {/* Body line */}
            <path d="M96 140 L456 146" stroke="#fff" strokeOpacity="0.09" strokeWidth="3" />
            {/* Bull bar */}
            <path d="M462 146 L482 146 L482 172 L462 172 Z" fill="#1b2024" />
            <rect x="468" y="132" width="6" height="42" rx="3" fill="#2a3136" />
            <Wheel cx={148} r={38} id={id} spokes={6} />
            <Wheel cx={402} r={38} id={id} spokes={6} />
            <circle className="headlight" cx={478} cy={152} r={9} fill="#3a4249" />
            <circle className="headlight-glow" cx={478} cy={152} r={9} fill={accent} opacity="0" />
            <circle className="taillight" cx={90} cy={150} r={5} fill="#4a1d20" />
          </>
        )}

        {vehicle.chassis === 'buggy' && (
          <>
            {/* Roll cage */}
            <path
              d="M150 168 L158 104 Q160 92 176 92 L306 92 Q322 92 326 104 L338 168"
              fill="none"
              stroke={`url(#${id('paint')})`}
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path d="M162 118 L330 118" stroke="#2a3136" strokeWidth="7" />
            <path d="M158 104 L108 150" stroke="#2a3136" strokeWidth="8" strokeLinecap="round" />
            <path d="M326 104 L392 146" stroke="#2a3136" strokeWidth="8" strokeLinecap="round" />
            {/* Tub */}
            <path
              d="M120 170 L128 146 L360 146 L372 170 Z"
              fill={`url(#${id('paint2')})`}
              stroke="#04060a"
            />
            {/* Seats */}
            <path d="M196 146 L196 116 L216 116 L214 146 Z" fill="#1b2024" />
            <path d="M242 146 L242 116 L262 116 L260 146 Z" fill="#1b2024" />
            {/* Engine block, exposed at the rear */}
            <rect x="322" y="122" width="46" height="26" rx="4" fill="#14181b" />
            <rect x="330" y="110" width="8" height="14" rx="3" fill="#3a4249" />
            <rect x="346" y="106" width="8" height="18" rx="3" fill="#3a4249" />
            <Wheel cx={132} r={42} id={id} spokes={5} />
            <Wheel cx={382} r={42} id={id} spokes={5} />
            <circle className="headlight" cx={400} cy={134} r={10} fill="#3a4249" />
            <circle className="headlight-glow" cx={400} cy={134} r={10} fill={accent} opacity="0" />
          </>
        )}

        {vehicle.chassis === 'bike' && (
          <>
            {/* Frame */}
            <path
              d="M164 162 L214 118 L286 118 L322 160"
              fill="none"
              stroke={`url(#${id('paint')})`}
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path d="M214 118 L250 162" stroke="#2a3136" strokeWidth="9" strokeLinecap="round" />
            {/* Engine */}
            <rect x="222" y="132" width="48" height="34" rx="6" fill="#1b2024" />
            {Array.from({ length: 5 }, (_, i) => (
              <rect key={i} x={226} y={136 + i * 6} width="40" height="2.6" rx="1.3" fill="#3a4249" />
            ))}
            {/* Tank + seat */}
            <path d="M212 118 Q244 100 282 112 L284 126 L212 128 Z" fill={`url(#${id('paint')})`} />
            <path d="M282 112 L330 108 Q340 108 338 118 L286 124 Z" fill="#12161a" />
            {/* Forks + bars */}
            <path d="M164 162 L192 100" stroke="#5a656d" strokeWidth="6" strokeLinecap="round" />
            <path d="M180 104 L214 96" stroke="#2a3136" strokeWidth="5" strokeLinecap="round" />
            {/* Exhaust */}
            <path d="M270 158 Q310 160 336 150" stroke="#5a656d" strokeWidth="7" fill="none" strokeLinecap="round" />
            <Wheel cx={158} r={40} id={id} spokes={8} />
            <Wheel cx={334} r={40} id={id} spokes={8} />
            <circle className="headlight" cx={176} cy={100} r={11} fill="#3a4249" />
            <circle className="headlight-glow" cx={176} cy={100} r={11} fill={accent} opacity="0" />
          </>
        )}

        {vehicle.chassis === 'apc' && (
          <>
            <path
              d="M76 174 L76 132 Q76 122 90 120 L150 112 L186 82 Q192 76 206 76 L392 76 Q406 76 410 86 L430 118 L458 126 Q470 130 470 142 L470 174 Z"
              fill={`url(#${id('paint')})`}
              stroke="#04060a"
            />
            {/* Sloped armour facets */}
            <path d="M186 82 L410 82 L430 118 L150 118 Z" fill="#252c32" opacity="0.7" />
            {/* Vision blocks */}
            <rect x="214" y="92" width="42" height="16" rx="2" fill={`url(#${id('glass')})`} />
            <rect x="272" y="92" width="42" height="16" rx="2" fill={`url(#${id('glass')})`} />
            {/* Turret cupola */}
            <rect x="300" y="52" width="72" height="26" rx="6" fill={`url(#${id('paint2')})`} />
            <rect x="368" y="58" width="86" height="8" rx="4" fill="#2a3136" />
            {/* Armour bolts */}
            {Array.from({ length: 9 }, (_, i) => (
              <circle key={i} cx={110 + i * 40} cy={140} r="2.6" fill="#0a0c0e" />
            ))}
            <path d="M80 152 L468 158" stroke="#fff" strokeOpacity="0.07" strokeWidth="3" />
            <Wheel cx={140} r={36} id={id} spokes={6} />
            <Wheel cx={262} r={36} id={id} spokes={6} />
            <Wheel cx={404} r={36} id={id} spokes={6} />
            <circle className="headlight" cx={462} cy={140} r={8} fill="#3a4249" />
            <circle className="headlight-glow" cx={462} cy={140} r={8} fill={accent} opacity="0" />
          </>
        )}

        {vehicle.chassis === 'boat' && (
          <>
            {/* Hull */}
            <path
              d="M70 158 L462 150 L486 176 Q400 198 250 198 Q126 198 92 178 Z"
              fill={`url(#${id('paint')})`}
              stroke="#04060a"
            />
            <path d="M84 168 L470 160" stroke="#fff" strokeOpacity="0.1" strokeWidth="3" />
            {/* Deck + console */}
            <path d="M180 150 L320 150 L316 116 Q314 108 300 108 L200 108 Q186 108 184 118 Z" fill={`url(#${id('paint2')})`} />
            <rect x="206" y="116" width="88" height="22" rx="3" fill={`url(#${id('glass')})`} />
            {/* Antenna + light bar */}
            <path d="M296 108 L302 66" stroke="#5a656d" strokeWidth="3" strokeLinecap="round" />
            <rect x="230" y="100" width="42" height="7" rx="3" fill="#1b2024" />
            {/* Outboards */}
            <rect x="66" y="150" width="26" height="40" rx="5" fill="#14181b" />
            <rect x="72" y="186" width="14" height="16" rx="3" fill="#2a3136" />
            {/* Bow wake — a stand-in for wheels on the water */}
            <g className="wheel" style={{ transformOrigin: '470px 176px' }}>
              <path d="M460 176 q22 -10 34 4 q-18 12 -34 -4Z" fill="#8fb8cc" opacity="0.35" />
            </g>
            <circle className="headlight" cx={470} cy={156} r={7} fill="#3a4249" />
            <circle className="headlight-glow" cx={470} cy={156} r={7} fill={accent} opacity="0" />
          </>
        )}

        {vehicle.chassis === 'muscle' && (
          <>
            <path
              d="M62 176 L60 148 Q60 138 74 134 L156 124 L206 92 Q214 86 232 86 L330 86 Q348 86 358 94 L406 126 L470 134 Q484 136 484 148 L484 176 Z"
              fill={`url(#${id('paint')})`}
              stroke="#04060a"
            />
            {/* Fastback glass */}
            <path d="M216 94 L326 94 L352 124 L184 124 Z" fill={`url(#${id('glass')})`} />
            {/* Hood scoop */}
            <path d="M392 118 L438 122 L436 130 L390 126 Z" fill="#14181b" />
            {/* Side stripe in the vehicle's accent */}
            <path d="M76 150 L472 156" stroke={accent} strokeWidth="4" opacity="0.55" />
            <path d="M76 158 L472 164" stroke={accent} strokeWidth="2" opacity="0.3" />
            {/* Side pipes */}
            <rect x="196" y="168" width="120" height="8" rx="4" fill="#5a656d" />
            <Wheel cx={140} r={36} id={id} spokes={5} />
            <Wheel cx={396} r={36} id={id} spokes={5} />
            <circle className="headlight" cx={476} cy={146} r={8} fill="#3a4249" />
            <circle className="headlight-glow" cx={476} cy={146} r={8} fill={accent} opacity="0" />
            <rect className="taillight" x={58} y={144} width={8} height={12} rx={3} fill="#4a1d20" />
          </>
        )}
      </g>

      {/* Exhaust plume, revealed on ignition */}
      <g className="exhaust" opacity="0">
        <circle cx="70" cy="170" r="12" fill="#8b969e" opacity="0.25" />
        <circle cx="52" cy="164" r="17" fill="#8b969e" opacity="0.16" />
        <circle cx="30" cy="158" r="22" fill="#8b969e" opacity="0.1" />
      </g>

      {/* Bodywork reflection sweep */}
      <g clipPath={`url(#${id('bodyClip')})`} style={{ mixBlendMode: 'overlay' }}>
        <rect
          className="vehicle-reflect"
          x="-300"
          y="0"
          width="200"
          height="240"
          fill={`url(#${id('reflect')})`}
          transform="skewX(-20)"
        />
      </g>
    </svg>
  );
}

export const VehicleArt = memo(VehicleArtBase);
