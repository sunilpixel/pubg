'use client';

import { useCallback, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { VehicleArt } from '@/components/art/VehicleArt';
import { VEHICLES } from '@/lib/data/world';
import { playClick } from '@/lib/audio';
import type { Vehicle } from '@/lib/types';

/**
 * Vehicle showcase.
 *
 * Hovering a card runs a full ignition sequence: the engine turns over (an
 * irregular chassis shudder), headlights strike and throw a beam, the wheels
 * spin up, dust kicks out from the tyres, exhaust puffs, the camera shakes on
 * the initial catch, and a specular band sweeps the bodywork.
 */
export function Vehicles() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGsapContext(
    () => {
      if (reduced) return;

      gsap.from('.vehicle-card', {
        y: 80,
        opacity: 0,
        duration: 1,
        ease: 'cinema',
        stagger: 0.08,
        scrollTrigger: { trigger: '.vehicle-grid', start: 'top 84%', once: true },
      });
    },
    sectionRef,
    [reduced],
  );

  return (
    <section
      ref={sectionRef}
      id="vehicles"
      className="relative overflow-hidden bg-void py-28 sm:py-36"
      aria-label="Vehicles"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[60vh] opacity-60"
        style={{
          background: 'radial-gradient(55% 60% at 50% 100%, rgb(255 106 26 / .1), transparent 70%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          index="03"
          eyebrow="Motor Pool"
          title="ROLLING"
          accent="STOCK"
          description="Six platforms for six problems. Rotation speed, armour, water access, or the sheer ability to climb a gradient nothing else will. Hover to turn the key."
        />

        <div className="vehicle-grid mt-16 grid gap-5 lg:grid-cols-2">
          {VEHICLES.map((vehicle, index) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VehicleCard({ vehicle, index }: { vehicle: Vehicle; index: number }) {
  const cardRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const idleRef = useRef<gsap.core.Tween | null>(null);

  const reduced = usePrefersReducedMotion();
  const { audioEnabled } = useExperience();

  const start = useCallback(() => {
    if (reduced || !stageRef.current) return;
    if (audioEnabled) playClick({ pitch: 0.55, gain: 0.35 });

    const q = gsap.utils.selector(stageRef);
    timelineRef.current?.kill();

    const tl = gsap.timeline();
    timelineRef.current = tl;

    // --- Ignition: two failed catches then a settle into idle ---
    tl.to(q('.chassis'), {
      keyframes: {
        y: [0, -3, 1.5, -4.5, 2, -1.5, 0],
        rotate: [0, -0.5, 0.3, -0.7, 0.25, 0],
        duration: 0.55,
      },
      ease: 'none',
    })
      // Camera shake on the catch
      .to(
        stageRef.current,
        {
          keyframes: { x: [0, -5, 4, -2.5, 1, 0], y: [0, 3, -2, 1, 0], duration: 0.4 },
          ease: 'none',
        },
        0,
      )
      // Headlights strike — a quick flicker before they hold
      .to(q('.headlight-glow'), { opacity: 1, duration: 0.06 }, 0.34)
      .to(q('.headlight-glow'), { opacity: 0.35, duration: 0.05 }, 0.4)
      .to(q('.headlight-glow'), { opacity: 1, duration: 0.12 }, 0.45)
      .to(q('.beam'), { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.42)
      .to(q('.taillight'), { fill: '#ff2b44', duration: 0.2 }, 0.42)
      // Exhaust puff
      .fromTo(
        q('.exhaust'),
        { opacity: 0, x: 0, scale: 0.6 },
        { opacity: 1, duration: 0.18 },
        0.2,
      )
      .to(q('.exhaust'), { opacity: 0, x: -70, scale: 1.6, duration: 1.1, ease: 'power2.out' }, 0.38)
      // Reflection sweep across the bodywork
      .fromTo(
        q('.vehicle-reflect'),
        { x: -300 },
        { x: 820, duration: 1.5, ease: 'power2.inOut' },
        0.25,
      )
      // Dust kicked up from the tyres
      .fromTo(
        q('.dust'),
        { opacity: 0, x: 0, y: 0, scale: 0.4 },
        {
          opacity: 0.5,
          scale: 1,
          duration: 0.3,
          stagger: 0.04,
          ease: 'power2.out',
        },
        0.3,
      )
      .to(
        q('.dust'),
        {
          opacity: 0,
          x: () => gsap.utils.random(-160, -50),
          y: () => gsap.utils.random(-46, -8),
          scale: 2.4,
          duration: 1.5,
          ease: 'power2.out',
          stagger: 0.04,
        },
        0.55,
      )
      // Lift and settle — weight transfer as it takes up drive
      .to(q('.chassis'), { y: -5, duration: 0.5, ease: 'power2.out' }, 0.55);

    // --- Wheels spin up and hold ---
    idleRef.current?.kill();
    idleRef.current = gsap.to(q('.wheel'), {
      rotate: 360,
      duration: 0.85,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%',
    });
    gsap.fromTo(idleRef.current, { timeScale: 0 }, { timeScale: 1, duration: 0.9, ease: 'power2.out' });

    // --- Sustained engine idle vibration ---
    gsap.to(q('.chassis'), {
      y: '-=1.2',
      duration: 0.07,
      repeat: -1,
      yoyo: true,
      ease: 'none',
      delay: 0.6,
    });
  }, [reduced, audioEnabled]);

  const stop = useCallback(() => {
    if (reduced || !stageRef.current) return;

    const q = gsap.utils.selector(stageRef);
    timelineRef.current?.kill();
    gsap.killTweensOf(q('.chassis'));

    gsap.to(q('.chassis'), { y: 0, rotate: 0, duration: 0.55, ease: 'power2.out' });
    gsap.to(q('.headlight-glow'), { opacity: 0, duration: 0.3 });
    gsap.to(q('.beam'), { opacity: 0, duration: 0.3 });
    gsap.to(q('.taillight'), { fill: '#4a1d20', duration: 0.3 });
    gsap.to(q('.exhaust'), { opacity: 0, duration: 0.2 });
    gsap.to(q('.dust'), { opacity: 0, duration: 0.3 });
    gsap.to(stageRef.current, { x: 0, y: 0, duration: 0.3 });

    // Spin down rather than stopping dead.
    if (idleRef.current) {
      const tween = idleRef.current;
      gsap.to(tween, {
        timeScale: 0,
        duration: 1.1,
        ease: 'power2.out',
        onComplete: () => tween.kill(),
      });
      idleRef.current = null;
    }
  }, [reduced]);

  return (
    <article
      ref={cardRef}
      onPointerEnter={start}
      onPointerLeave={stop}
      onFocus={start}
      onBlur={stop}
      tabIndex={0}
      data-cursor="view"
      data-cursor-label="Ignite"
      className="vehicle-card group relative isolate overflow-hidden rounded-3xl carbon metal-edge gpu shadow-[0_30px_70px_-30px_rgb(0_0_0/.95)] transition-shadow duration-500 hover:shadow-[0_50px_100px_-30px_rgb(0_0_0/1)]"
      style={{ ['--accent' as string]: vehicle.accent }}
    >
      {/* Accent wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 transition-opacity duration-700 group-hover:opacity-70"
        style={{
          background: `radial-gradient(80% 60% at 78% 40%, ${vehicle.accent}33, transparent 70%)`,
        }}
      />

      {/* -------------------------- Vehicle stage -------------------------- */}
      <div ref={stageRef} className="relative gpu px-4 pt-6">
        {/* Ground haze */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 bottom-6 h-10 rounded-[50%] opacity-40 blur-xl"
          style={{ background: `linear-gradient(90deg, transparent, ${vehicle.accent}55, transparent)` }}
        />

        <VehicleArt vehicle={vehicle} className="relative z-10 h-auto w-full" />

        {/* Dust kicked out behind the wheels */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className="dust absolute rounded-full opacity-0"
              style={{
                left: `${16 + (i % 3) * 7}%`,
                bottom: `${13 + Math.floor(i / 3) * 4}%`,
                width: `${16 + (i % 4) * 9}px`,
                height: `${16 + (i % 4) * 9}px`,
                background:
                  'radial-gradient(circle, rgb(190 176 152 / .6), rgb(120 108 92 / .18) 55%, transparent 72%)',
                filter: 'blur(5px)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ------------------------------ Content ---------------------------- */}
      <div className="relative z-10 border-t border-white/[0.07] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.3em]"
              style={{ color: vehicle.accent }}
            >
              {String(index + 1).padStart(2, '0')} · {vehicle.klass}
            </span>
            <h3 className="mt-2 font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-none text-chalk">
              {vehicle.name}
            </h3>
          </div>

          <div className="text-right">
            <span className="font-display text-4xl leading-none text-chalk tabular-nums">
              {vehicle.topSpeed}
            </span>
            <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
              km/h
            </span>
          </div>
        </div>

        <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-smoke">
          {vehicle.description}
        </p>

        <dl className="mt-6 grid grid-cols-4 gap-4">
          {(
            [
              ['Seats', vehicle.seats, vehicle.seats * 20],
              ['Armour', vehicle.armour, vehicle.armour],
              ['Off-road', vehicle.offroad, vehicle.offroad],
              ['Fuel', vehicle.fuel, Math.min(100, vehicle.fuel)],
            ] as const
          ).map(([label, value, pct]) => (
            <div key={label}>
              <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-ash">{label}</dt>
              <dd className="mt-1.5 font-mono text-xs tabular-nums text-bone">{value}</dd>
              <span className="mt-2 block h-[3px] w-full overflow-hidden rounded-full bg-white/8">
                <span
                  className="block h-full origin-left rounded-full transition-[width] duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${vehicle.accent}, ${vehicle.accent}00)`,
                  }}
                />
              </span>
            </div>
          ))}
        </dl>
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 1px ${vehicle.accent}44, 0 0 70px -18px ${vehicle.accent}` }}
      />
    </article>
  );
}
