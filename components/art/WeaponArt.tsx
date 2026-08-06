'use client';

import { memo, useId } from 'react';
import type { Silhouette } from '@/lib/types';

/**
 * Parametric weapon illustration.
 *
 * Every weapon in the vault is drawn from the same vector primitives, driven
 * by its `silhouette` spec — barrel length, magazine depth, optic, stock type.
 * Vector art means the vault ships with zero image payload, scales to a 4K
 * fullscreen Flip without resampling, and can be lit with CSS filters.
 *
 * Geometry convention: muzzle points right, viewBox is 460 × 170, and the bore
 * axis sits at y = 74.
 */

type Props = {
  spec: Silhouette;
  accent?: string;
  className?: string;
  /** Adds the animated specular sweep. Disable for many-at-once grids. */
  sheen?: boolean;
};

const BORE = 74;

function WeaponArtBase({ spec, accent = '#ff6a1a', className, sheen = true }: Props) {
  const uid = useId().replace(/[:]/g, '');
  const id = (name: string) => `${name}-${uid}`;

  const {
    kind,
    barrel = 1,
    mag = 1,
    optic = 'none',
    stock = 'none',
    grip = false,
    suppressor = false,
    drum = false,
  } = spec;

  return (
    <svg
      viewBox="0 0 460 170"
      className={className}
      role="presentation"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      <defs>
        {/* Primary gunmetal body — top-lit with a hard shadow underside. */}
        <linearGradient id={id('body')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a656d" />
          <stop offset="14%" stopColor="#39424a" />
          <stop offset="52%" stopColor="#20262b" />
          <stop offset="86%" stopColor="#12161a" />
          <stop offset="100%" stopColor="#080a0c" />
        </linearGradient>

        {/* Matte polymer — flatter, less specular than machined metal. */}
        <linearGradient id={id('poly')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2e3439" />
          <stop offset="45%" stopColor="#191d21" />
          <stop offset="100%" stopColor="#0a0c0e" />
        </linearGradient>

        {/* Cold blued steel for barrels and bolts. */}
        <linearGradient id={id('steel')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8e9aa3" />
          <stop offset="22%" stopColor="#4d565e" />
          <stop offset="60%" stopColor="#242a2f" />
          <stop offset="100%" stopColor="#0d1012" />
        </linearGradient>

        {/* Brass — cartridges and the odd trim detail. */}
        <linearGradient id={id('brass')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe0a3" />
          <stop offset="40%" stopColor="#c69334" />
          <stop offset="100%" stopColor="#6d4d12" />
        </linearGradient>

        <linearGradient id={id('accent')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0" />
          <stop offset="45%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>

        {/* Travelling specular highlight. */}
        <linearGradient id={id('sheen')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="46%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="54%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>

        <radialGradient id={id('glass')} cx="0.36" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#bff0ff" stopOpacity="0.95" />
          <stop offset="42%" stopColor="#2f7fa8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#04080c" stopOpacity="0.95" />
        </radialGradient>

        {/* Micro machining lines — reads as brushed metal at any zoom. */}
        <pattern id={id('mill')} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="none" />
          <path d="M0 4 L4 0" stroke="#fff" strokeOpacity="0.05" strokeWidth="1" />
        </pattern>

        <filter id={id('soft')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" />
        </filter>

        <clipPath id={id('sheenClip')}>
          <rect x="0" y="0" width="460" height="170" />
        </clipPath>
      </defs>

      {/* Contact shadow anchoring the weapon to its card. */}
      <ellipse
        cx="230"
        cy="146"
        rx="170"
        ry="9"
        fill="#000"
        opacity="0.55"
        filter={`url(#${id('soft')})`}
      />

      <g>
        {kind === 'assault-rifle' && (
          <Rifle id={id} barrel={barrel} mag={mag} stock={stock} grip={grip} suppressor={suppressor} />
        )}
        {kind === 'dmr' && (
          <Rifle id={id} barrel={barrel * 1.1} mag={mag} stock={stock} grip={grip} suppressor={suppressor} marksman />
        )}
        {kind === 'sniper-rifle' && (
          <Sniper id={id} barrel={barrel} mag={mag} suppressor={suppressor} />
        )}
        {kind === 'smg' && <Smg id={id} barrel={barrel} mag={mag} stock={stock} drum={drum} suppressor={suppressor} />}
        {kind === 'shotgun' && <Shotgun id={id} barrel={barrel} mag={mag} grip={grip} />}
        {kind === 'pistol' && <Pistol id={id} barrel={barrel} mag={mag} drum={drum} />}
        {kind === 'lmg' && <Lmg id={id} barrel={barrel} drum={drum} grip={grip} />}
        {kind === 'launcher' && <Launcher id={id} barrel={barrel} stock={stock} />}
        {kind === 'throwable' && <Throwable id={id} variant={mag} />}
        {kind === 'melee' && <Melee id={id} length={barrel} guard={grip} />}

        {optic !== 'none' && kind !== 'throwable' && kind !== 'melee' && (
          <Optic id={id} type={optic} accent={accent} kind={kind} />
        )}
      </g>

      {/* Accent underglow — a warm rim light from below the weapon. */}
      <rect x="60" y="132" width="340" height="2" fill={`url(#${id('accent')})`} opacity="0.6" />

      {sheen && (
        <g clipPath={`url(#${id('sheenClip')})`} style={{ mixBlendMode: 'overlay' }}>
          <rect
            className="weapon-sheen"
            x="-260"
            y="0"
            width="180"
            height="170"
            fill={`url(#${id('sheen')})`}
            transform="skewX(-22)"
          />
        </g>
      )}
    </svg>
  );
}

type PartProps = { id: (n: string) => string };

/* -------------------------------------------------------------------------- */
/* Shared parts                                                               */
/* -------------------------------------------------------------------------- */

/** Picatinny rail — a row of machined slots along the top of the receiver. */
function Rail({ id, x, width, y = 50 }: PartProps & { x: number; width: number; y?: number }) {
  const teeth = Math.max(3, Math.floor(width / 9));
  return (
    <g>
      <rect x={x} y={y} width={width} height={7} rx="1.5" fill={`url(#${id('steel')})`} />
      {Array.from({ length: teeth }, (_, i) => (
        <rect key={i} x={x + 3 + i * 9} y={y + 1} width={3} height={5} fill="#05070a" opacity="0.85" />
      ))}
    </g>
  );
}

function PistolGrip({ id, x = 152, angle = 14 }: PartProps & { x?: number; angle?: number }) {
  return (
    <g transform={`rotate(${angle} ${x} 92)`}>
      <path
        d={`M${x} 88 L${x + 30} 88 L${x + 25} 134 Q${x + 22} 141 ${x + 14} 140 L${x + 3} 138 Q${x - 3} 136 ${x - 2} 128 Z`}
        fill={`url(#${id('poly')})`}
        stroke="#04060a"
        strokeWidth="1"
      />
      {/* Stippled texture panel */}
      {Array.from({ length: 5 }, (_, r) => (
        <g key={r} opacity="0.5">
          {Array.from({ length: 4 }, (_, c) => (
            <circle key={c} cx={x + 8 + c * 5} cy={100 + r * 7} r="0.9" fill="#5b666e" />
          ))}
        </g>
      ))}
    </g>
  );
}

function TriggerGuard({ id, x = 178 }: PartProps & { x?: number }) {
  return (
    <g>
      <path
        d={`M${x} 90 Q${x + 4} 112 ${x + 22} 110 L${x + 34} 108 Q${x + 40} 106 ${x + 40} 96`}
        fill="none"
        stroke={`url(#${id('body')})`}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d={`M${x + 12} 92 L${x + 15} 104`} stroke="#8e9aa3" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Muzzle({ id, x, suppressor }: PartProps & { x: number; suppressor?: boolean }) {
  if (suppressor) {
    return (
      <g>
        <rect x={x} y={BORE - 12} width="62" height="24" rx="11" fill={`url(#${id('steel')})`} />
        <rect x={x} y={BORE - 12} width="62" height="24" rx="11" fill={`url(#${id('mill')})`} />
        {Array.from({ length: 5 }, (_, i) => (
          <rect key={i} x={x + 10 + i * 10} y={BORE - 12} width="1.6" height="24" fill="#04060a" opacity="0.6" />
        ))}
        <circle cx={x + 60} cy={BORE} r="5" fill="#000" />
      </g>
    );
  }
  return (
    <g>
      <rect x={x} y={BORE - 9} width="30" height="18" rx="3" fill={`url(#${id('steel')})`} />
      {/* Compensator ports */}
      <rect x={x + 6} y={BORE - 9} width="3" height="6" fill="#04060a" />
      <rect x={x + 14} y={BORE - 9} width="3" height="6" fill="#04060a" />
      <rect x={x + 22} y={BORE - 9} width="3" height="6" fill="#04060a" />
      <circle cx={x + 28} cy={BORE} r="5" fill="#000" />
      <circle cx={x + 28} cy={BORE} r="2.4" fill="#1a1e22" />
    </g>
  );
}

function Stock({ id, type }: PartProps & { type: Silhouette['stock'] }) {
  if (type === 'none') return null;

  if (type === 'skeleton') {
    return (
      <g>
        <rect x="34" y={BORE - 10} width="76" height="20" rx="4" fill={`url(#${id('poly')})`} />
        <path
          d="M34 64 L34 84 L20 88 L20 60 Z"
          fill={`url(#${id('poly')})`}
          stroke="#04060a"
          strokeWidth="1"
        />
        {/* Lightening cuts */}
        <rect x="44" y="69" width="20" height="10" rx="3" fill="#05070a" opacity="0.85" />
        <rect x="72" y="69" width="20" height="10" rx="3" fill="#05070a" opacity="0.85" />
      </g>
    );
  }

  if (type === 'folding') {
    return (
      <g>
        <rect x="52" y={BORE - 7} width="60" height="8" rx="4" fill={`url(#${id('steel')})`} />
        <rect x="52" y={BORE + 4} width="60" height="8" rx="4" fill={`url(#${id('steel')})`} />
        <rect x="40" y={BORE - 12} width="16" height="30" rx="4" fill={`url(#${id('poly')})`} />
      </g>
    );
  }

  return (
    <g>
      <path
        d="M28 58 L112 58 L112 92 L58 96 Q34 98 28 88 Z"
        fill={`url(#${id('poly')})`}
        stroke="#04060a"
        strokeWidth="1"
      />
      <path d="M28 58 L112 58 L112 63 L28 63 Z" fill="#fff" opacity="0.07" />
      {/* Recoil pad */}
      <rect x="22" y="58" width="9" height="34" rx="3" fill="#0a0c0e" />
      <path d="M46 68 L96 66" stroke="#000" strokeOpacity="0.5" strokeWidth="2" />
    </g>
  );
}

function CurvedMag({ id, x, depth, curve = 14 }: PartProps & { x: number; depth: number; curve?: number }) {
  if (depth <= 0) return null;
  const h = 34 * depth;
  return (
    <g>
      <path
        d={`M${x} 88 L${x + 34} 88 L${x + 34 + curve * 0.4} ${88 + h} Q${x + 30 + curve} ${96 + h} ${x + 14 + curve} ${94 + h} L${x + curve * 0.5} ${92 + h} Z`}
        fill={`url(#${id('poly')})`}
        stroke="#04060a"
        strokeWidth="1"
      />
      {/* Witness holes */}
      {Array.from({ length: Math.max(1, Math.round(depth * 3)) }, (_, i) => (
        <rect
          key={i}
          x={x + 12 + i * 2}
          y={98 + i * (h / (depth * 3.4))}
          width="7"
          height="3"
          rx="1.5"
          fill="#05070a"
        />
      ))}
      <path d={`M${x + 2} 90 L${x + 32} 90`} stroke="#fff" strokeOpacity="0.12" strokeWidth="2" />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Optics                                                                     */
/* -------------------------------------------------------------------------- */

function Optic({
  id,
  type,
  accent,
  kind,
}: PartProps & { type: Silhouette['optic']; accent: string; kind: Silhouette['kind'] }) {
  const y = kind === 'pistol' ? 62 : 22;
  const x = kind === 'pistol' ? 210 : 150;

  if (type === 'reflex') {
    return (
      <g transform={`translate(${x - 20} ${y + 16})`}>
        <rect x="0" y="0" width="46" height="30" rx="4" fill={`url(#${id('body')})`} />
        <rect x="5" y="4" width="36" height="20" rx="2" fill={`url(#${id('glass')})`} opacity="0.9" />
        <circle cx="23" cy="14" r="2.6" fill={accent} />
        <circle cx="23" cy="14" r="6" fill={accent} opacity="0.28" />
        <rect x="0" y="28" width="46" height="6" rx="2" fill="#0c0f12" />
      </g>
    );
  }

  const thermal = type === 'thermal';
  return (
    <g transform={`translate(${x - 30} ${y})`}>
      {/* Rings */}
      <rect x="24" y="10" width="12" height="30" rx="3" fill={`url(#${id('body')})`} />
      <rect x="104" y="10" width="12" height="30" rx="3" fill={`url(#${id('body')})`} />
      {/* Main tube */}
      <rect x="18" y="14" width="112" height="22" rx="11" fill={`url(#${id('steel')})`} />
      <rect x="18" y="14" width="112" height="22" rx="11" fill={`url(#${id('mill')})`} />
      <rect x="18" y="16" width="112" height="4" rx="2" fill="#fff" opacity="0.12" />
      {/* Ocular bell */}
      <rect x="2" y="9" width="20" height="32" rx="7" fill={`url(#${id('body')})`} />
      {/* Objective bell */}
      <rect x="126" y="6" width="26" height="38" rx="9" fill={`url(#${id('body')})`} />
      <ellipse cx="150" cy="25" rx="5" ry="17" fill={`url(#${id('glass')})`} />
      {thermal && <ellipse cx="150" cy="25" rx="5" ry="17" fill="#ff3a2f" opacity="0.5" />}
      {/* Elevation turret */}
      <rect x="60" y="2" width="20" height="14" rx="3" fill={`url(#${id('body')})`} />
      <rect x="63" y="0" width="14" height="4" rx="2" fill="#39424a" />
      {/* Mount feet */}
      <rect x="26" y="38" width="14" height="10" rx="2" fill="#12161a" />
      <rect x="102" y="38" width="14" height="10" rx="2" fill="#12161a" />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Weapon bodies                                                              */
/* -------------------------------------------------------------------------- */

function Rifle({
  id,
  barrel,
  mag,
  stock,
  grip,
  suppressor,
  marksman = false,
}: PartProps & {
  barrel: number;
  mag: number;
  stock: Silhouette['stock'];
  grip: boolean;
  suppressor?: boolean;
  marksman?: boolean;
}) {
  const handguardEnd = 250 + 74 * barrel;
  const barrelEnd = handguardEnd + (marksman ? 34 : 22);

  return (
    <g>
      <Stock id={id} type={stock === 'none' ? 'fixed' : stock} />

      {/* Barrel under the handguard */}
      <rect x={handguardEnd - 12} y={BORE - 6} width={barrelEnd - handguardEnd + 14} height="12" rx="6" fill={`url(#${id('steel')})`} />
      <Muzzle id={id} x={barrelEnd} suppressor={suppressor} />

      {/* Gas block + front sight base */}
      <rect x={handguardEnd - 6} y={BORE - 16} width="16" height="18" rx="3" fill={`url(#${id('body')})`} />

      {/* Handguard */}
      <rect x="240" y={BORE - 16} width={handguardEnd - 240} height="32" rx="5" fill={`url(#${id('body')})`} />
      <rect x="240" y={BORE - 16} width={handguardEnd - 240} height="32" rx="5" fill={`url(#${id('mill')})`} />
      {/* M-LOK slots */}
      {Array.from({ length: Math.floor((handguardEnd - 250) / 20) }, (_, i) => (
        <rect key={i} x={252 + i * 20} y={BORE + 2} width="12" height="5" rx="2.5" fill="#04060a" opacity="0.85" />
      ))}
      <rect x="240" y={BORE - 16} width={handguardEnd - 240} height="4" rx="2" fill="#fff" opacity="0.09" />

      {/* Upper receiver */}
      <path
        d="M112 52 L242 52 L242 92 L112 92 Z"
        fill={`url(#${id('body')})`}
        stroke="#04060a"
        strokeWidth="1"
      />
      <rect x="112" y="52" width="130" height="5" fill="#fff" opacity="0.09" />
      {/* Ejection port + brass */}
      <rect x="196" y="60" width="34" height="15" rx="3" fill="#04060a" />
      <rect x="200" y="63" width="24" height="9" rx="4" fill={`url(#${id('brass')})`} opacity="0.75" />
      {/* Charging handle */}
      <rect x="118" y="56" width="30" height="7" rx="3" fill={`url(#${id('steel')})`} />
      {/* Forward assist */}
      <circle cx="190" cy="84" r="4" fill="#12161a" />

      <Rail id={id} x={118} width={120} y={46} />

      <PistolGrip id={id} x={150} />
      <TriggerGuard id={id} x={176} />
      <CurvedMag id={id} x={200} depth={mag} curve={mag > 1.1 ? 22 : 12} />

      {grip && (
        <g>
          <rect x={288} y={BORE + 14} width="18" height="34" rx="6" fill={`url(#${id('poly')})`} />
          <rect x={290} y={BORE + 18} width="14" height="3" rx="1.5" fill="#000" opacity="0.5" />
          <rect x={290} y={BORE + 26} width="14" height="3" rx="1.5" fill="#000" opacity="0.5" />
        </g>
      )}
    </g>
  );
}

function Sniper({
  id,
  barrel,
  mag,
  suppressor,
}: PartProps & { barrel: number; mag: number; suppressor?: boolean }) {
  const barrelEnd = 250 + 96 * barrel;

  return (
    <g>
      {/* Chassis stock with thumbhole */}
      <path
        d="M16 56 L120 56 L120 96 L74 100 Q28 104 16 90 Z"
        fill={`url(#${id('poly')})`}
        stroke="#04060a"
        strokeWidth="1"
      />
      <path d="M16 56 L120 56 L120 62 L16 62 Z" fill="#fff" opacity="0.06" />
      <ellipse cx="66" cy="82" rx="20" ry="11" fill="#05070a" />
      {/* Cheek riser */}
      <rect x="86" y="44" width="52" height="14" rx="5" fill={`url(#${id('poly')})`} />
      {/* Recoil pad */}
      <rect x="10" y="56" width="10" height="38" rx="3" fill="#0a0c0e" />

      {/* Heavy fluted barrel */}
      <rect x={230} y={BORE - 8} width={barrelEnd - 230} height="16" rx="8" fill={`url(#${id('steel')})`} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={250 + i * 16} y={BORE - 6} width="9" height="12" rx="4" fill="#04060a" opacity="0.4" />
      ))}
      <Muzzle id={id} x={barrelEnd} suppressor={suppressor} />

      {/* Receiver */}
      <path d="M118 50 L246 50 L246 94 L118 94 Z" fill={`url(#${id('body')})`} stroke="#04060a" strokeWidth="1" />
      <rect x="118" y="50" width="128" height="5" fill="#fff" opacity="0.1" />

      {/* Bolt handle — the signature of the class */}
      <g>
        <rect x="206" y="60" width="34" height="11" rx="5" fill={`url(#${id('steel')})`} />
        <rect x="228" y="40" width="11" height="26" rx="5" fill={`url(#${id('steel')})`} transform="rotate(24 233 53)" />
        <circle cx="243" cy="36" r="7" fill={`url(#${id('body')})`} />
      </g>

      <Rail id={id} x={124} width={110} y={44} />
      <PistolGrip id={id} x={150} angle={10} />
      <TriggerGuard id={id} x={178} />
      <CurvedMag id={id} x={202} depth={mag} curve={6} />

      {/* Bipod */}
      <g stroke={`url(#${id('steel')})`} strokeWidth="5" strokeLinecap="round">
        <path d={`M${barrelEnd - 60} 84 L${barrelEnd - 82} 130`} />
        <path d={`M${barrelEnd - 60} 84 L${barrelEnd - 38} 130`} />
      </g>
    </g>
  );
}

function Smg({
  id,
  barrel,
  mag,
  stock,
  drum,
  suppressor,
}: PartProps & {
  barrel: number;
  mag: number;
  stock: Silhouette['stock'];
  drum?: boolean;
  suppressor?: boolean;
}) {
  const barrelEnd = 258 + 58 * barrel;

  return (
    <g>
      <Stock id={id} type={stock} />

      <rect x={248} y={BORE - 6} width={barrelEnd - 248} height="12" rx="6" fill={`url(#${id('steel')})`} />
      <Muzzle id={id} x={barrelEnd} suppressor={suppressor} />

      {/* Compact boxy receiver */}
      <path d="M120 48 L254 48 L254 96 L120 96 Z" fill={`url(#${id('body')})`} stroke="#04060a" strokeWidth="1" />
      <rect x="120" y="48" width="134" height="5" fill="#fff" opacity="0.1" />
      <rect x="120" y="48" width="134" height="48" fill={`url(#${id('mill')})`} />

      {/* Cooling slots */}
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x={210 + i * 9} y={BORE - 12} width="4" height="14" rx="2" fill="#04060a" opacity="0.7" />
      ))}
      <rect x="182" y="58" width="28" height="13" rx="3" fill="#04060a" />

      <Rail id={id} x={126} width={120} y={42} />

      {/* Top-fed horizontal drum (P90 style) */}
      {drum && (
        <g>
          <rect x="150" y="30" width="118" height="20" rx="8" fill={`url(#${id('poly')})`} opacity="0.92" />
          <rect x="156" y="34" width="106" height="12" rx="6" fill="#0b0e11" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={160 + i * 8.4} y="36" width="5" height="8" rx="2" fill={`url(#${id('brass')})`} opacity="0.6" />
          ))}
        </g>
      )}

      <PistolGrip id={id} x={148} angle={6} />
      <TriggerGuard id={id} x={174} />
      {!drum && <CurvedMag id={id} x={196} depth={mag} curve={8} />}

      {/* Forward vertical grip */}
      <rect x={228} y={BORE + 22} width="18" height="30" rx="6" fill={`url(#${id('poly')})`} />
    </g>
  );
}

function Shotgun({ id, barrel, mag, grip }: PartProps & { barrel: number; mag: number; grip: boolean }) {
  const barrelEnd = 232 + 104 * barrel;
  const doubleBarrel = mag === 0 && barrel >= 1.2;

  return (
    <g>
      {/* Wood-grain furniture */}
      <path d="M20 56 L124 56 L124 96 L70 102 Q30 106 20 90 Z" fill="#3a2415" stroke="#04060a" strokeWidth="1" />
      <path d="M28 62 L118 60 M30 72 L118 70 M32 82 L116 80" stroke="#5c3a20" strokeWidth="2" opacity="0.7" />
      <rect x="14" y="56" width="10" height="38" rx="3" fill="#0a0c0e" />

      {/* Barrel(s) */}
      <rect x={228} y={BORE - 11} width={barrelEnd - 228} height="14" rx="7" fill={`url(#${id('steel')})`} />
      {doubleBarrel && (
        <rect x={228} y={BORE + 3} width={barrelEnd - 228} height="14" rx="7" fill={`url(#${id('steel')})`} />
      )}
      {/* Bead sight */}
      <circle cx={barrelEnd - 8} cy={BORE - 12} r="3" fill="#ff6a1a" />
      <circle cx={barrelEnd + 2} cy={BORE - 4} r="6" fill="#000" />
      {doubleBarrel && <circle cx={barrelEnd + 2} cy={BORE + 10} r="6" fill="#000" />}

      {/* Magazine tube / pump */}
      {!doubleBarrel && (
        <>
          <rect x={244} y={BORE + 8} width={barrelEnd - 268} height="12" rx="6" fill={`url(#${id('steel')})`} />
          <g>
            <rect x={262} y={BORE + 4} width="66" height="22" rx="8" fill="#3a2415" />
            {Array.from({ length: 7 }, (_, i) => (
              <rect key={i} x={268 + i * 8} y={BORE + 6} width="3" height="18" rx="1.5" fill="#1d1108" opacity="0.8" />
            ))}
          </g>
        </>
      )}

      {/* Receiver */}
      <path d="M122 50 L236 50 L236 94 L122 94 Z" fill={`url(#${id('body')})`} stroke="#04060a" strokeWidth="1" />
      <rect x="122" y="50" width="114" height="5" fill="#fff" opacity="0.1" />
      <rect x="176" y="60" width="36" height="16" rx="3" fill="#04060a" />
      <rect x="180" y="63" width="26" height="10" rx="5" fill="#8c2b1f" />

      <TriggerGuard id={id} x={168} />
      {mag > 0 && <CurvedMag id={id} x={190} depth={mag} curve={4} />}
      {grip && <rect x={286} y={BORE + 26} width="18" height="30" rx="6" fill="#3a2415" />}

      {/* Shell loops on the stock */}
      {Array.from({ length: 4 }, (_, i) => (
        <rect key={i} x={38 + i * 18} y="60" width="12" height="16" rx="3" fill={`url(#${id('brass')})`} opacity="0.75" />
      ))}
    </g>
  );
}

function Pistol({ id, barrel, mag, drum }: PartProps & { barrel: number; mag: number; drum?: boolean }) {
  const slideEnd = 250 + 52 * barrel;

  if (drum) {
    // Revolver
    return (
      <g transform="translate(-10 6)">
        <rect x={262} y={BORE - 12} width={slideEnd - 250} height="18" rx="4" fill={`url(#${id('steel')})`} />
        <rect x={264} y={BORE - 12} width={slideEnd - 254} height="5" rx="2" fill="#fff" opacity="0.12" />
        <circle cx={slideEnd + 12} cy={BORE - 3} r="5" fill="#000" />
        {/* Ejector rod */}
        <rect x={266} y={BORE + 6} width={slideEnd - 258} height="8" rx="4" fill={`url(#${id('steel')})`} />

        {/* Cylinder */}
        <circle cx="238" cy={BORE - 2} r="28" fill={`url(#${id('body')})`} stroke="#04060a" strokeWidth="1.5" />
        <circle cx="238" cy={BORE - 2} r="28" fill={`url(#${id('mill')})`} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={238 + Math.cos(a) * 16}
              cy={BORE - 2 + Math.sin(a) * 16}
              r="6"
              fill="#04060a"
            />
          );
        })}
        <circle cx="238" cy={BORE - 2} r="4" fill="#39424a" />

        {/* Frame + hammer */}
        <path d="M182 52 L268 52 L268 82 L182 86 Z" fill={`url(#${id('body')})`} />
        <path d="M182 52 L196 40 L206 44 L198 56 Z" fill={`url(#${id('steel')})`} />
        <PistolGrip id={id} x={182} angle={22} />
        <TriggerGuard id={id} x={206} />
      </g>
    );
  }

  return (
    <g transform="translate(0 6)">
      {/* Slide */}
      <path
        d={`M186 44 L${slideEnd} 44 L${slideEnd} 72 L186 72 Z`}
        fill={`url(#${id('body')})`}
        stroke="#04060a"
        strokeWidth="1"
      />
      <rect x="186" y="44" width={slideEnd - 186} height="5" fill="#fff" opacity="0.11" />
      {/* Cocking serrations */}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={194 + i * 7} y="50" width="3" height="18" rx="1.5" fill="#04060a" opacity="0.7" />
      ))}
      <rect x={slideEnd - 46} y="52" width="26" height="12" rx="3" fill="#04060a" />
      <circle cx={slideEnd - 6} cy="58" r="5" fill="#000" />
      {/* Front + rear sight */}
      <rect x={slideEnd - 22} y="38" width="6" height="7" rx="1.5" fill="#12161a" />
      <rect x="192" y="38" width="9" height="7" rx="1.5" fill="#12161a" />

      {/* Frame */}
      <path d="M186 72 L268 72 L268 88 L186 90 Z" fill={`url(#${id('poly')})`} />
      {/* Accessory rail */}
      <rect x={228} y={88} width={40} height="8" rx="2" fill={`url(#${id('steel')})`} />

      <PistolGrip id={id} x={186} angle={20} />
      <TriggerGuard id={id} x={212} />
      {mag > 1.1 && (
        <path
          d={`M196 128 L226 126 L228 ${126 + 30 * (mag - 1)} L198 ${128 + 30 * (mag - 1)} Z`}
          fill={`url(#${id('poly')})`}
          stroke="#04060a"
        />
      )}
    </g>
  );
}

function Lmg({ id, barrel, drum, grip }: PartProps & { barrel: number; drum?: boolean; grip: boolean }) {
  const barrelEnd = 262 + 84 * barrel;

  return (
    <g>
      <Stock id={id} type="fixed" />

      {/* Heavy barrel with heat shield */}
      <rect x={252} y={BORE - 8} width={barrelEnd - 252} height="16" rx="8" fill={`url(#${id('steel')})`} />
      <rect x={266} y={BORE - 14} width={78} height="28" rx="8" fill={`url(#${id('body')})`} />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={274 + i * 12} y={BORE - 11} width="5" height="22" rx="2.5" fill="#04060a" opacity="0.8" />
      ))}
      <Muzzle id={id} x={barrelEnd} />

      {/* Receiver */}
      <path d="M112 46 L258 46 L258 98 L112 98 Z" fill={`url(#${id('body')})`} stroke="#04060a" strokeWidth="1" />
      <rect x="112" y="46" width="146" height="5" fill="#fff" opacity="0.1" />
      <rect x="112" y="46" width="146" height="52" fill={`url(#${id('mill')})`} />
      {/* Feed tray cover hinge */}
      <rect x="150" y="52" width="90" height="6" rx="3" fill="#0d1114" />

      <Rail id={id} x={128} width={104} y={40} />

      {/* Pan magazine (top) or ammo box (bottom) */}
      {drum ? (
        <g>
          <ellipse cx="196" cy="34" rx="46" ry="13" fill={`url(#${id('body')})`} />
          <ellipse cx="196" cy="32" rx="46" ry="13" fill={`url(#${id('poly')})`} />
          <ellipse cx="196" cy="32" rx="30" ry="8" fill="#0b0e11" />
          <ellipse cx="196" cy="32" rx="6" ry="3" fill="#39424a" />
        </g>
      ) : null}

      {/* Belt box */}
      <g>
        <rect x="196" y="96" width="62" height="42" rx="5" fill={`url(#${id('poly')})`} stroke="#04060a" />
        <rect x="202" y="102" width="50" height="6" rx="3" fill="#0b0e11" />
        {/* Exposed belt */}
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={200 + i * 9} y="90" width="6" height="10" rx="2" fill={`url(#${id('brass')})`} opacity="0.8" />
        ))}
      </g>

      <PistolGrip id={id} x={140} />
      <TriggerGuard id={id} x={168} />

      {grip && (
        <g stroke={`url(#${id('steel')})`} strokeWidth="5" strokeLinecap="round">
          <path d={`M${barrelEnd - 70} 88 L${barrelEnd - 92} 134`} />
          <path d={`M${barrelEnd - 70} 88 L${barrelEnd - 48} 134`} />
        </g>
      )}
    </g>
  );
}

function Launcher({ id, barrel, stock }: PartProps & { barrel: number; stock?: Silhouette['stock'] }) {
  const isRpg = barrel > 1.1;

  if (isRpg) {
    const tubeEnd = 300 + 60 * barrel;
    return (
      <g>
        {/* Backblast cone */}
        <path d="M22 50 L74 62 L74 88 L22 100 Z" fill={`url(#${id('body')})`} stroke="#04060a" />
        {/* Tube */}
        <rect x="70" y={BORE - 13} width={210} height="26" rx="8" fill={`url(#${id('body')})`} />
        <rect x="70" y={BORE - 13} width={210} height="26" rx="8" fill={`url(#${id('mill')})`} />
        <rect x="70" y={BORE - 13} width={210} height="5" rx="2" fill="#fff" opacity="0.09" />
        {/* Wooden heat guard */}
        <rect x="118" y={BORE - 17} width="86" height="34" rx="6" fill="#3a2415" />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={124 + i * 10} y={BORE - 15} width="3" height="30" fill="#22150b" opacity="0.6" />
        ))}

        {/* PG-7 warhead */}
        <g>
          <path
            d={`M280 ${BORE - 13} L306 ${BORE - 13} L${tubeEnd - 26} ${BORE - 24} Q${tubeEnd} ${BORE} ${tubeEnd - 26} ${BORE + 24} L306 ${BORE + 13} L280 ${BORE + 13} Z`}
            fill={`url(#${id('body')})`}
            stroke="#04060a"
          />
          <path
            d={`M${tubeEnd - 26} ${BORE - 24} Q${tubeEnd} ${BORE} ${tubeEnd - 26} ${BORE + 24}`}
            fill="#5a2010"
            opacity="0.6"
          />
          <rect x="286" y={BORE - 8} width="6" height="16" fill="#ff6a1a" opacity="0.8" />
        </g>

        <PistolGrip id={id} x={150} angle={8} />
        <TriggerGuard id={id} x={176} />
        {/* Front grip */}
        <rect x="212" y={BORE + 14} width="18" height="32" rx="6" fill="#3a2415" />
        {/* Iron ladder sight */}
        <rect x="196" y="34" width="5" height="24" rx="2" fill={`url(#${id('steel')})`} />
        <rect x="192" y="32" width="14" height="4" rx="2" fill={`url(#${id('steel')})`} />
      </g>
    );
  }

  // Break-action grenade launcher
  const muzzle = 296 + 46 * barrel;
  return (
    <g>
      <Stock id={id} type={stock === 'none' ? 'fixed' : stock} />
      {/* Fat 40mm tube */}
      <rect x="200" y={BORE - 20} width={muzzle - 200} height="40" rx="18" fill={`url(#${id('body')})`} />
      <rect x="200" y={BORE - 20} width={muzzle - 200} height="40" rx="18" fill={`url(#${id('mill')})`} />
      <rect x="204" y={BORE - 18} width={muzzle - 210} height="6" rx="3" fill="#fff" opacity="0.09" />
      <circle cx={muzzle - 6} cy={BORE} r="15" fill="#05070a" />
      <circle cx={muzzle - 6} cy={BORE} r="9" fill="#12161a" />

      {/* Hinge + receiver */}
      <path d="M124 52 L206 52 L206 96 L124 96 Z" fill={`url(#${id('body')})`} stroke="#04060a" />
      <circle cx="200" cy="94" r="6" fill={`url(#${id('steel')})`} />
      {/* Ladder sight */}
      <rect x="230" y="30" width="6" height="26" rx="2" fill={`url(#${id('steel')})`} />
      <rect x="224" y="28" width="18" height="4" rx="2" fill={`url(#${id('steel')})`} />

      <PistolGrip id={id} x={144} angle={12} />
      <TriggerGuard id={id} x={172} />
      {/* Wooden forend */}
      <rect x="212" y={BORE + 20} width="70" height="20" rx="8" fill="#3a2415" />
    </g>
  );
}

function Throwable({ id, variant }: PartProps & { variant: number }) {
  // 0 → frag, 0.5 → smoke canister, 1 → flashbang
  const type = variant === 0 ? 'frag' : variant <= 0.5 ? 'smoke' : 'flash';

  if (type === 'frag') {
    return (
      <g transform="translate(230 78)">
        {/* Body */}
        <ellipse cx="0" cy="0" rx="46" ry="52" fill={`url(#${id('body')})`} stroke="#04060a" strokeWidth="1.5" />
        <ellipse cx="0" cy="0" rx="46" ry="52" fill={`url(#${id('mill')})`} />
        {/* Fragmentation grid */}
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={`h${i}`}
            d={`M-44 ${-38 + i * 13} Q0 ${-32 + i * 13} 44 ${-38 + i * 13}`}
            stroke="#04060a"
            strokeWidth="2"
            fill="none"
            opacity="0.65"
          />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <path
            key={`v${i}`}
            d={`M${-34 + i * 17} -48 Q${-30 + i * 17} 0 ${-34 + i * 17} 48`}
            stroke="#04060a"
            strokeWidth="2"
            fill="none"
            opacity="0.55"
          />
        ))}
        <ellipse cx="-16" cy="-24" rx="16" ry="18" fill="#fff" opacity="0.07" />
        {/* Fuse assembly */}
        <rect x="-13" y="-66" width="26" height="18" rx="4" fill={`url(#${id('steel')})`} />
        <path d="M-13 -60 L-40 -66 L-42 -50 L-13 -50 Z" fill={`url(#${id('steel')})`} />
        <circle cx="-44" cy="-58" r="9" fill="none" stroke={`url(#${id('steel')})`} strokeWidth="4" />
        <rect x="-6" y="-52" width="12" height="8" fill="#8c2b1f" />
      </g>
    );
  }

  const bodyFill = type === 'smoke' ? '#2b3a2b' : '#2a2f36';
  const bandColor = type === 'smoke' ? '#9dff4d' : '#ffd166';

  return (
    <g transform="translate(230 76)">
      <rect x="-30" y="-54" width="60" height="104" rx="10" fill={bodyFill} stroke="#04060a" strokeWidth="1.5" />
      <rect x="-30" y="-54" width="60" height="104" rx="10" fill={`url(#${id('mill')})`} />
      <rect x="-26" y="-50" width="14" height="96" rx="7" fill="#fff" opacity="0.07" />
      {/* Identification band */}
      <rect x="-30" y="-14" width="60" height="12" fill={bandColor} opacity="0.85" />
      <rect x="-30" y="14" width="60" height="5" fill={bandColor} opacity="0.4" />
      {/* Emission ports */}
      {type === 'smoke' &&
        Array.from({ length: 4 }, (_, i) => (
          <circle key={i} cx={-15 + i * 10} cy="-46" r="3" fill="#05070a" />
        ))}
      {/* Fuse */}
      <rect x="-11" y="-70" width="22" height="18" rx="4" fill={`url(#${id('steel')})`} />
      <path d="M-11 -64 L-38 -70 L-40 -55 L-11 -55 Z" fill={`url(#${id('steel')})`} />
      <circle cx="-42" cy="-62" r="8" fill="none" stroke={`url(#${id('steel')})`} strokeWidth="4" />
    </g>
  );
}

function Melee({ id, length, guard }: PartProps & { length: number; guard: boolean }) {
  const isBar = guard; // crowbar
  if (isBar) {
    return (
      <g>
        <path
          d="M92 96 Q80 96 74 86 Q66 72 80 62 Q92 54 104 62 L112 70 L104 80 L96 74 Q88 70 86 78 Q86 86 96 86 Z"
          fill={`url(#${id('steel')})`}
          stroke="#04060a"
        />
        <rect x={100} y={BORE - 8} width={200 * length} height="16" rx="8" fill={`url(#${id('steel')})`} />
        <rect x={100} y={BORE - 8} width={200 * length} height="5" rx="2" fill="#fff" opacity="0.14" />
        {/* Grip tape */}
        <rect x={150} y={BORE - 10} width="70" height="20" rx="9" fill="#141719" />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${154 + i * 8} ${BORE - 10} L${160 + i * 8} ${BORE + 10}`} stroke="#2e3439" strokeWidth="2" />
        ))}
        {/* Chisel end */}
        <path
          d={`M${100 + 200 * length} ${BORE - 8} L${118 + 200 * length} ${BORE - 12} L${124 + 200 * length} ${BORE} L${118 + 200 * length} ${BORE + 12} L${100 + 200 * length} ${BORE + 8} Z`}
          fill={`url(#${id('steel')})`}
        />
      </g>
    );
  }

  const tip = 190 + 130 * length;
  const curved = length < 1.4; // kukri vs machete

  return (
    <g>
      {/* Handle */}
      <path
        d="M78 60 Q66 62 64 74 Q62 88 76 92 L134 92 L134 58 Z"
        fill="#2a1a10"
        stroke="#04060a"
      />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M${82 + i * 11} 58 L${86 + i * 11} 92`} stroke="#4a2f1c" strokeWidth="3" />
      ))}
      {/* Bolster */}
      <rect x="132" y="52" width="16" height="46" rx="4" fill={`url(#${id('brass')})`} />

      {/* Blade */}
      {curved ? (
        <path
          d={`M148 56 L${tip - 40} 44 Q${tip} 62 ${tip - 12} 96 Q${tip - 70} 112 148 94 Z`}
          fill={`url(#${id('steel')})`}
          stroke="#04060a"
        />
      ) : (
        <path
          d={`M148 54 L${tip - 26} 50 Q${tip} 60 ${tip - 22} 84 L148 94 Z`}
          fill={`url(#${id('steel')})`}
          stroke="#04060a"
        />
      )}
      {/* Edge bevel — a bright hairline along the cutting edge */}
      <path
        d={
          curved
            ? `M152 92 Q${tip - 70} 108 ${tip - 14} 92`
            : `M152 92 L${tip - 24} 82`
        }
        stroke="#e8f0f5"
        strokeWidth="3"
        fill="none"
        opacity="0.75"
      />
      {/* Fuller / blood groove */}
      <path
        d={curved ? `M164 64 Q${tip - 90} 60 ${tip - 34} 66` : `M164 60 L${tip - 40} 58`}
        stroke="#0b0e11"
        strokeWidth="4"
        fill="none"
        opacity="0.55"
      />
    </g>
  );
}

export const WeaponArt = memo(WeaponArtBase);
