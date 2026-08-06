'use client';

import { useCallback, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { useCardTilt } from '@/hooks/usePointerParallax';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ScrambleText } from '@/components/ui/ScrambleText';
import { VolumetricSmoke } from '@/components/ui/VolumetricSmoke';
import { OperatorPortrait } from '@/components/art/OperatorPortrait';
import { OPERATORS } from '@/lib/data/world';
import { TIER_META } from '@/lib/data/weapons';
import type { Operator } from '@/lib/types';

/**
 * Operator roster.
 *
 * Each card is a small stage: the portrait sits on its own Z plane above a
 * drifting smoke bed, the frame's border is a conic gradient that rotates on
 * hover, and the operator's eyes come up as you approach.
 */
export function Operators() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGsapContext(
    () => {
      if (reduced) return;

      gsap.from('.operator-card', {
        y: 100,
        opacity: 0,
        rotateY: 10,
        duration: 1.05,
        ease: 'cinema',
        stagger: 0.08,
        scrollTrigger: { trigger: '.operator-grid', start: 'top 84%', once: true },
      });
    },
    sectionRef,
    [reduced],
  );

  return (
    <section
      ref={sectionRef}
      id="operators"
      className="relative overflow-hidden bg-abyss py-28 sm:py-36"
      aria-label="Operators"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px hairline" />

      <div className="relative mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          index="05"
          eyebrow="Roster"
          title="THE"
          accent="OPERATORS"
          description="Six specialists, each with a tactical perk that changes how a squad plays a compound. Pick the one that covers what your team keeps losing to."
        />

        <div
          className="operator-grid mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          style={{ perspective: '1800px' }}
        >
          {OPERATORS.map((operator, index) => (
            <OperatorCard key={operator.id} operator={operator} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function OperatorCard({ operator, index }: { operator: Operator; index: number }) {
  const cardRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const tier = TIER_META[operator.rarity];
  const accent = `hsl(${operator.hue} 92% 60%)`;

  useCardTilt(cardRef, { max: 13, scale: 1.025 });

  /* Slow idle: the portrait breathes and the eyes pulse */
  useGsapContext(
    () => {
      if (reduced) return;

      gsap.to('.portrait-layer', {
        y: -8,
        duration: 3.8 + (index % 4) * 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: index * 0.3,
      });

      gsap.to('.eye-glow', {
        opacity: 0.9,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: index * 0.45,
      });
    },
    cardRef,
    [reduced, index],
  );

  const onEnter = useCallback(() => {
    if (reduced || !cardRef.current) return;
    const q = gsap.utils.selector(cardRef);
    gsap.to(q('.eye-glow'), { opacity: 1, scale: 1.14, duration: 0.5, ease: 'power2.out' });
    gsap.to(q('.card-smoke'), { opacity: 1, duration: 0.8 });
    gsap.to(q('.rotor-border'), { rotate: 360, duration: 7, ease: 'none', repeat: -1 });
  }, [reduced]);

  const onLeave = useCallback(() => {
    if (reduced || !cardRef.current) return;
    const q = gsap.utils.selector(cardRef);
    gsap.to(q('.eye-glow'), { scale: 1, duration: 0.6, ease: 'power2.out' });
    gsap.to(q('.card-smoke'), { opacity: 0.35, duration: 0.8 });
    gsap.killTweensOf(q('.rotor-border'));
  }, [reduced]);

  return (
    <article
      ref={cardRef}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      tabIndex={0}
      data-scramble-host
      data-cursor="view"
      data-cursor-label="Dossier"
      className="operator-card group relative isolate overflow-hidden rounded-3xl bg-carbon gpu shadow-[0_30px_70px_-30px_rgb(0_0_0/.95)]"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Rotating conic border */}
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <span
          className="rotor-border absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${accent} 12%, transparent 26%, transparent 62%, ${accent}88 74%, transparent 88%)`,
          }}
        />
        {/* Inner mask leaves only a 1px rim of the conic showing */}
        <span className="absolute inset-px rounded-[calc(1.5rem-1px)] bg-carbon" />
      </span>

      {/* Static border for the resting state */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl border border-white/8"
      />

      {/* Background smoke bed */}
      <div className="card-smoke pointer-events-none absolute inset-0 opacity-35 transition-opacity duration-700">
        <VolumetricSmoke plumes={3} tone="cold" intensity={0.6} seed={operator.hue} />
      </div>

      {/* Hue wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-80"
        style={{
          background: `radial-gradient(80% 55% at 50% 12%, hsl(${operator.hue} 88% 52% / .22), transparent 70%)`,
        }}
      />

      {/* Pointer glare */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(300px circle at var(--glare-x,50%) var(--glare-y,50%), rgb(255 255 255 / .12), transparent 62%)',
        }}
      />

      {/* ------------------------------ Portrait ---------------------------- */}
      <div className="relative">
        <div className="portrait-layer gpu" style={{ transform: 'translateZ(60px)' }}>
          <OperatorPortrait
            operator={operator}
            className="mx-auto h-auto w-full max-w-[300px] drop-shadow-[0_28px_44px_rgb(0_0_0/.9)]"
          />
        </div>

        {/* Callsign watermark behind the portrait */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-6 select-none text-center font-display text-[clamp(3rem,7vw,5rem)] leading-none text-white/[0.035]"
          style={{ transform: 'translateZ(10px)' }}
        >
          {operator.callsign}
        </span>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
          style={{
            background: 'linear-gradient(0deg, var(--color-carbon) 12%, transparent 100%)',
          }}
        />
      </div>

      {/* ------------------------------ Details ----------------------------- */}
      <div className="relative z-10 -mt-6 p-6 pt-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className="font-mono text-[9px] uppercase tracking-[0.32em]"
              style={{ color: tier.color }}
            >
              {tier.label}
            </span>
            <h3 className="mt-2 font-display text-4xl leading-none text-chalk">
              <ScrambleText text={operator.callsign} hover onScroll={false} speed={0.03} />
            </h3>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ash">
              {operator.name} · {operator.origin}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em]"
            style={{ borderColor: `${accent}55`, color: accent }}
          >
            {operator.role}
          </span>
        </div>

        {/* Perk */}
        <div className="mt-5 rounded-xl border border-white/8 bg-black/40 p-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.26em]" style={{ color: accent }}>
            Tactical · {operator.perk.name}
          </span>
          <p className="mt-2 text-[13px] leading-relaxed text-smoke">{operator.perk.detail}</p>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-ash">
          <span className="text-bone">Passive · </span>
          {operator.passive}
        </p>

        {/* Traits */}
        <dl className="mt-5 space-y-2.5">
          {operator.traits.map((trait) => (
            <div key={trait.label} className="flex items-center gap-3">
              <dt className="w-20 shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-ash">
                {trait.label}
              </dt>
              <dd className="flex flex-1 items-center gap-3">
                <span className="block h-[3px] flex-1 overflow-hidden rounded-full bg-white/8">
                  <span
                    className="block h-full origin-left rounded-full transition-[width] duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
                    style={{
                      width: `${trait.value}%`,
                      background: `linear-gradient(90deg, ${accent}, ${accent}00)`,
                      boxShadow: `0 0 10px ${accent}66`,
                    }}
                  />
                </span>
                <span className="w-6 text-right font-mono text-[10px] tabular-nums text-bone">
                  {trait.value}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
