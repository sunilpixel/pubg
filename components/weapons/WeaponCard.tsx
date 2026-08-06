'use client';

import { memo, useRef } from 'react';
import { useAmbientTimeline } from '@/hooks/useAmbientTimeline';
import { useCardTilt } from '@/hooks/usePointerParallax';
import { WeaponArt } from '@/components/art/WeaponArt';
import { TIER_META } from '@/lib/data/weapons';
import type { Weapon } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = {
  weapon: Weapon;
  index: number;
  onSelect: (weapon: Weapon, element: HTMLElement) => void;
};

/**
 * A weapon in the vault grid.
 *
 * Layered depth: the card tilts to the cursor, the weapon inside floats on a
 * slow independent loop and parallaxes *further* than the card, a specular
 * glare tracks the pointer, and a mirrored reflection sits below on glass.
 */
function WeaponCardBase({ weapon, index, onSelect }: Props) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const tier = TIER_META[weapon.tier];

  useCardTilt(cardRef, { max: 10, scale: 1.02 });

  // Idle float — each card on its own phase so the grid never pulses in sync.
  // Paused while off screen: thirty infinite tweens writing transforms every
  // frame is meaningful work for cards below the fold.
  useAmbientTimeline(
    cardRef,
    (tl) => {
      tl.to(
        artRef.current,
        {
          y: -12,
          rotate: 0.9,
          duration: 3.4 + (index % 5) * 0.42,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        },
        (index % 7) * 0.28,
      );
    },
    [index],
  );

  return (
    <button
      ref={cardRef}
      type="button"
      data-flip-id={`weapon-${weapon.id}`}
      data-cursor="view"
      data-cursor-label="Inspect"
      data-scramble-host
      onClick={() => cardRef.current && onSelect(weapon, cardRef.current)}
      aria-label={`Inspect ${weapon.name}, ${tier.label}`}
      className={cn(
        'weapon-card group relative isolate block w-full overflow-hidden rounded-3xl text-left',
        // No `metal-edge` here. That utility paints a conic gradient and then
        // knocks its middle out with `mask-composite: xor` — two extra
        // compositing passes per element. Fine for the handful of hero panels
        // that use it, expensive across a 30-card grid. A hairline border plus
        // an inset highlight gives the same brushed-edge read for one paint.
        // No `defer-paint`: see Operators. Its reserved intrinsic height is a
        // guess, and a wrong guess renders as blank space in the grid.
        'carbon gpu border border-white/[0.07]',
        'shadow-[inset_0_1px_0_rgb(255_255_255/0.07)]',
        'transition-shadow duration-500 ease-[cubic-bezier(.16,1,.3,1)]',
        'hover:shadow-[0_40px_90px_-30px_rgb(0_0_0/.95)]',
      )}
      style={
        {
          '--tier': tier.color,
          '--tier-glow': tier.glow,
          transformStyle: 'preserve-3d',
        } as React.CSSProperties
      }
    >
      {/* Tier wash — a soft coloured bloom from the top-left corner */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-90"
        style={{
          background: `radial-gradient(90% 70% at 18% 0%, ${tier.glow}, transparent 68%)`,
        }}
      />

      {/* Pointer-tracked specular glare */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(340px circle at var(--glare-x, 50%) var(--glare-y, 50%), rgb(255 255 255 / .13), transparent 62%)',
        }}
      />

      {/* The scanline overlay lived here as a fourth full-card layer. The
          `carbon` background underneath already supplies a woven texture, so
          it was one more thing to paint for very little. Removed. */}

      {/* ------------------------------ Header ------------------------------ */}
      <div className="relative z-10 flex items-start justify-between gap-3 p-6 pb-0">
        <div className="min-w-0">
          <span
            className="font-mono text-[9px] uppercase tracking-[0.32em]"
            style={{ color: tier.color }}
          >
            {tier.label}
          </span>
          <h3 className="mt-2 truncate font-display text-3xl leading-none text-chalk">
            {weapon.name}
          </h3>
          <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.24em] text-ash">
            “{weapon.codename}”
          </span>
        </div>

        <span className="shrink-0 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-smoke">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* ------------------------------ Artwork ----------------------------- */}
      <div className="relative z-10 px-3 pt-2">
        <div
          ref={artRef}
          className="gpu relative"
          style={{ transform: 'translateZ(48px)' }}
        >
          {/* Low detail + no sheen in the grid: shared gradients instead of
              per-card defs, no SVG filter, no machining pattern, and none of
              the sub-pixel decoration. The sheen would also add a
              mix-blend-mode layer per card — 30 extra stacking contexts. */}
          <WeaponArt
            spec={weapon.silhouette}
            accent={tier.color}
            sheen={false}
            lod="low"
            className="h-auto w-full drop-shadow-[0_22px_36px_rgb(0_0_0/.8)]"
          />
        </div>

        {/* Mirrored reflection on the "glass shelf".
            This used to render a second full <WeaponArt> — roughly 120 extra
            SVG nodes per card, 30 cards, all parsed and laid out on load for a
            barely-visible 25%-opacity smear. A gradient wash gives the same
            grounded reflection read for two DOM nodes. */}
        <div
          aria-hidden
          className="pointer-events-none -mt-8 h-16 opacity-40 transition-opacity duration-500 group-hover:opacity-70"
          style={{
            background: `radial-gradient(60% 100% at 50% 0%, ${tier.glow}, transparent 72%)`,
            maskImage: 'linear-gradient(to bottom, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />
      </div>

      {/* ------------------------------ Stats ------------------------------- */}
      <div className="relative z-10 border-t border-white/[0.07] p-6 pt-5">
        <p className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed text-smoke">
          {weapon.tagline}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-3">
          {(
            [
              ['DMG', weapon.stats.damage],
              ['RNG', weapon.stats.range],
              ['ROF', weapon.stats.fireRate],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="font-mono text-[9px] uppercase tracking-[0.24em] text-ash">{label}</dt>
              <dd className="mt-1.5">
                <span className="block font-mono text-xs text-bone tabular-nums">{value}</span>
                <span className="mt-1.5 block h-[3px] w-full overflow-hidden rounded-full bg-white/8">
                  <span
                    className="block h-full origin-left rounded-full transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
                    style={{
                      width: `${value}%`,
                      background: `linear-gradient(90deg, ${tier.color}, ${tier.color}00)`,
                      boxShadow: `0 0 10px ${tier.glow}`,
                    }}
                  />
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash">
            {weapon.ammo}
          </span>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-bone transition-colors group-hover:text-ember">
            Inspect
            <svg width="16" height="8" viewBox="0 0 16 8" fill="none" aria-hidden>
              <path
                d="M0 4h14M11 1l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.2"
                className="transition-transform duration-400 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1"
                style={{ transformBox: 'fill-box' }}
              />
            </svg>
          </span>
        </div>
      </div>

      {/* Hover rim light */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 1px ${tier.color}55, 0 0 60px -14px ${tier.color}` }}
      />
    </button>
  );
}

export const WeaponCard = memo(WeaponCardBase);
