'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, Flip } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { WeaponArt } from '@/components/art/WeaponArt';
import { STAT_LABELS, TIER_META } from '@/lib/data/weapons';
import { playClick, playReload, playShot, playUi, SHOT_PROFILES } from '@/lib/audio';
import type { Weapon } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = {
  weapon: Weapon;
  /** The card that was clicked — the Flip animation originates from its rect. */
  origin: HTMLElement | null;
  onClose: () => void;
};

type Mode = 'idle' | 'inspect' | 'attachments';

/**
 * Fullscreen weapon inspection.
 *
 * Opens with a GSAP Flip from the clicked card's exact position, blurs the
 * page behind it, and runs a live fire/reload rig on the weapon: muzzle flash,
 * heat shimmer, bullet trail, shell ejection, smoke and camera shake, with
 * synthesised audio when the user has enabled sound.
 */
export function WeaponDetail({ weapon, origin, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const rotatorRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  const [mode, setMode] = useState<Mode>('idle');
  const [ammo, setAmmo] = useState(weapon.stats.magazine || 1);
  const [busy, setBusy] = useState(false);

  const reduced = usePrefersReducedMotion();
  const { audioEnabled } = useExperience();
  const tier = TIER_META[weapon.tier];
  const capacity = weapon.stats.magazine || 1;

  /* ------------------------------ OPEN ---------------------------------- */
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const art = artRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'cinema' } });

      // Backdrop + blur of the page behind
      tl.fromTo(
        '.detail-scrim',
        { opacity: 0, backdropFilter: 'blur(0px)' },
        { opacity: 1, backdropFilter: 'blur(26px)', duration: 0.7 },
        0,
      );

      if (art && origin && !reduced) {
        // Snap the hero artwork onto the card's rect, record that, restore the
        // natural layout, then play the difference. One element, no duplicate
        // flip-ids, pixel-exact continuity from grid to fullscreen.
        Flip.fit(art, origin, { scale: true });
        const fromState = Flip.getState(art);
        gsap.set(art, { clearProps: 'transform' });

        tl.add(
          Flip.from(fromState, {
            duration: 1.05,
            ease: 'cinema',
            scale: true,
            absolute: true,
          }),
          0,
        );
      } else {
        tl.from(art, { scale: 0.86, opacity: 0, duration: 0.8 }, 0);
      }

      // Specs arrive from four directions, converging on the weapon.
      tl.from('.spec-left', { x: -70, opacity: 0, duration: 0.85, stagger: 0.07 }, 0.34)
        .from('.spec-right', { x: 70, opacity: 0, duration: 0.85, stagger: 0.07 }, 0.34)
        .from('.spec-top', { y: -46, opacity: 0, duration: 0.75, stagger: 0.06 }, 0.28)
        .from('.spec-bottom', { y: 54, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.42)
        .from('.detail-close', { scale: 0, rotate: -90, duration: 0.6, ease: 'recoil' }, 0.5)
        // Stat bars sweep out last.
        .from(
          '.stat-fill',
          { scaleX: 0, duration: 1, stagger: 0.05, transformOrigin: 'left center' },
          0.6,
        );
    }, root);

    return () => ctx.revert();
  }, [origin, reduced]);

  /* ------------------------------ CLOSE --------------------------------- */
  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const art = artRef.current;

    const tl = gsap.timeline({ onComplete: onClose, defaults: { ease: 'power2.inOut' } });

    tl.to('.spec-left', { x: -50, opacity: 0, duration: 0.3, stagger: 0.03 }, 0)
      .to('.spec-right', { x: 50, opacity: 0, duration: 0.3, stagger: 0.03 }, 0)
      .to('.spec-top', { y: -34, opacity: 0, duration: 0.28 }, 0)
      .to('.spec-bottom', { y: 40, opacity: 0, duration: 0.28 }, 0);

    if (art && origin && !reduced) {
      // Flip.fit with a duration returns a tween that animates the element
      // into the target's rect — exactly the reverse of the open, and far
      // simpler than replaying a recorded state backwards.
      tl.add(
        Flip.fit(art, origin, {
          scale: true,
          duration: 0.6,
          ease: 'power2.inOut',
        }) as gsap.core.Tween,
        0.05,
      );
      tl.to(art, { opacity: 0, duration: 0.3 }, 0.4);
    } else {
      tl.to(art, { scale: 0.9, opacity: 0, duration: 0.4 }, 0);
    }

    tl.to('.detail-scrim', { opacity: 0, duration: 0.45 }, 0.2);
  }, [onClose, origin, reduced]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  /* ------------------------------- FIRE --------------------------------- */
  const fire = useCallback(() => {
    if (busy) return;
    if (ammo <= 0) {
      playUi({ pitch: 0.5, gain: audioEnabled ? 0.2 : 0 });
      // Dry fire: a hard shake and a red flash on the counter.
      gsap.fromTo(
        '.ammo-readout',
        { color: '#e01730', x: -4 },
        { color: '', x: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' },
      );
      return;
    }

    setAmmo((n) => Math.max(0, n - 1));

    if (audioEnabled) playShot(SHOT_PROFILES[weapon.category] ?? {});

    const q = gsap.utils.selector(stageRef);
    const isHeavy = ['sniper-rifle', 'shotgun', 'launcher', 'lmg'].includes(weapon.category);
    const power = isHeavy ? 1.6 : 1;

    const tl = gsap.timeline();

    // Heat shimmer is an SVG filter, so it can't be tweened as a style —
    // tween a plain object and write the attribute each frame instead.
    const heat = { scale: 0 };
    const heatNode = document.getElementById('heat-displace');
    const writeHeat = () => heatNode?.setAttribute('scale', heat.scale.toFixed(2));

    // --- Muzzle flash: a bright core plus a four-point star, both very brief
    tl.fromTo(
      q('.muzzle-core'),
      { opacity: 0, scale: 0.2 },
      { opacity: 1, scale: 1.2 * power, duration: 0.045, ease: 'power4.out' },
      0,
    )
      .to(q('.muzzle-core'), { opacity: 0, scale: 0.6, duration: 0.11, ease: 'power2.in' }, 0.05)
      .fromTo(
        q('.muzzle-star'),
        { opacity: 0, scale: 0.3, rotate: -12 },
        { opacity: 0.95, scale: 1.5 * power, rotate: 8, duration: 0.06, ease: 'power4.out' },
        0,
      )
      .to(q('.muzzle-star'), { opacity: 0, scale: 2.1, duration: 0.14 }, 0.06)

      // --- Bullet trail: a tracer streak leaving frame
      .fromTo(
        q('.bullet-trail'),
        { opacity: 0, scaleX: 0, x: 0 },
        { opacity: 1, scaleX: 1, duration: 0.07, ease: 'power2.out' },
        0.015,
      )
      .to(q('.bullet-trail'), { x: 520, opacity: 0, duration: 0.28, ease: 'power2.in' }, 0.07)

      // --- Heat shimmer: spike the displacement, then let it cool off
      .to(heat, { scale: 22 * power, duration: 0.1, ease: 'power2.out', onUpdate: writeHeat }, 0)
      .to(heat, { scale: 0, duration: 0.62, ease: 'power2.in', onUpdate: writeHeat }, 0.1)

      // --- Recoil: the weapon kicks back and up, then settles elastically
      .to(
        rotatorRef.current,
        { x: -34 * power, rotate: -3.4 * power, duration: 0.06, ease: 'power3.out' },
        0.01,
      )
      .to(
        rotatorRef.current,
        { x: 0, rotate: 0, duration: 0.75, ease: 'elastic.out(1, 0.34)' },
        0.07,
      )

      // --- Camera shake on the whole stage, decaying
      .to(
        stageRef.current,
        {
          keyframes: {
            x: [0, -13 * power, 10 * power, -6 * power, 3 * power, 0],
            y: [0, 8 * power, -6 * power, 4 * power, -2 * power, 0],
            duration: 0.42,
          },
          ease: 'none',
        },
        0,
      )

      // --- Shell ejection along a motion path
      .fromTo(
        q('.shell-casing'),
        { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 },
        {
          motionPath: {
            path: [
              { x: 26, y: -78 },
              { x: 96, y: -46 },
              { x: 158, y: 150 },
            ],
            curviness: 1.5,
          },
          rotate: 810,
          opacity: 0,
          duration: 0.95,
          ease: 'power1.in',
        },
        0.04,
      )

      // --- Muzzle smoke: a puff that expands, rises and dissipates
      .fromTo(
        q('.muzzle-smoke'),
        { opacity: 0, scale: 0.25, x: 0, y: 0 },
        { opacity: 0.5, scale: 1, duration: 0.24, ease: 'power2.out' },
        0.04,
      )
      .to(
        q('.muzzle-smoke'),
        { opacity: 0, scale: 2.4, x: 78, y: -54, duration: 1.5, ease: 'power2.out' },
        0.26,
      )

      // --- Ember sparks
      .fromTo(
        q('.spark'),
        { opacity: 1, x: 0, y: 0, scale: 1 },
        {
          x: () => gsap.utils.random(60, 230),
          y: () => gsap.utils.random(-90, 90),
          scale: 0,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.008,
        },
        0.02,
      );
  }, [ammo, busy, weapon.category, audioEnabled]);

  /* ------------------------------ RELOAD -------------------------------- */
  const reload = useCallback(() => {
    if (busy || ammo === capacity) return;
    setBusy(true);
    if (audioEnabled) playReload();

    const q = gsap.utils.selector(stageRef);
    const counter = { n: ammo };

    gsap
      .timeline({
        onComplete: () => {
          setAmmo(capacity);
          setBusy(false);
        },
      })
      // Tilt the weapon toward the viewer, the way an operator would
      .to(rotatorRef.current, { rotateZ: 14, y: 26, duration: 0.3, ease: 'power2.out' }, 0)
      // Magazine drops out and falls away
      .to(q('.mag-shadow'), { opacity: 1, y: 40, duration: 0.28, ease: 'power2.in' }, 0.1)
      .to(q('.mag-shadow'), { opacity: 0, y: 320, rotate: 26, duration: 0.5, ease: 'power2.in' }, 0.38)
      // Fresh magazine slams home
      .fromTo(
        q('.mag-shadow'),
        { opacity: 0, y: 300, rotate: -14 },
        { opacity: 1, y: 30, rotate: 0, duration: 0.34, ease: 'power2.in' },
        0.8,
      )
      .to(q('.mag-shadow'), { y: 0, duration: 0.12, ease: 'slam' }, 1.14)
      .to(q('.mag-shadow'), { opacity: 0, duration: 0.2 }, 1.3)
      .to(stageRef.current, { y: 7, duration: 0.06, yoyo: true, repeat: 1 }, 1.14)
      // Bolt release + level out
      .to(rotatorRef.current, { rotateZ: 0, y: 0, duration: 0.5, ease: 'recoil' }, 1.3)
      .to(stageRef.current, { x: 6, duration: 0.05, yoyo: true, repeat: 1 }, 1.45)
      // Counter rolls back up
      .to(
        counter,
        {
          n: capacity,
          duration: 0.7,
          ease: 'power2.out',
          onUpdate: () => setAmmo(Math.round(counter.n)),
        },
        1.0,
      );
  }, [ammo, busy, capacity, audioEnabled]);

  /* ------------------------------ INSPECT ------------------------------- */
  const inspect = useCallback(() => {
    if (busy) return;
    setBusy(true);
    setMode('inspect');
    if (audioEnabled) playClick({ pitch: 1.4, gain: 0.3 });

    gsap
      .timeline({
        onComplete: () => {
          setBusy(false);
          setMode('idle');
        },
      })
      .to(rotatorRef.current, {
        rotateY: 360,
        rotateX: 12,
        scale: 1.1,
        duration: 1.6,
        ease: 'cinema',
      })
      .to(rotatorRef.current, { rotateX: 0, scale: 1, duration: 0.7, ease: 'cinema' }, '-=0.5')
      .set(rotatorRef.current, { rotateY: 0 });
  }, [busy, audioEnabled]);

  const toggleAttachments = useCallback(() => {
    if (audioEnabled) playUi();
    setMode((m) => (m === 'attachments' ? 'idle' : 'attachments'));
  }, [audioEnabled]);

  const ammoPct = (ammo / capacity) * 100;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[120]"
      role="dialog"
      aria-modal="true"
      aria-label={`${weapon.name} inspection`}
    >
      {/* Heat-shimmer displacement filter, driven imperatively during fire */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id="heat-shimmer" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.05" numOctaves="2" result="t" />
          <feDisplacementMap
            id="heat-displace"
            in="SourceGraphic"
            in2="t"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      {/* Scrim */}
      <button
        type="button"
        aria-label="Close inspection"
        onClick={close}
        className="detail-scrim absolute inset-0 h-full w-full cursor-default bg-void/88"
        style={{ backdropFilter: 'blur(26px)' }}
      />

      {/* Tier ambience */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(70% 50% at 50% 46%, ${tier.glow}, transparent 70%)`,
          opacity: 0.5,
        }}
      />

      <div className="relative flex h-full flex-col overflow-y-auto px-5 py-6 sm:px-8 lg:px-12">
        {/* ------------------------------ Top bar ------------------------- */}
        <div className="spec-top flex shrink-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.34em]"
              style={{ color: tier.color }}
            >
              {tier.label}
            </span>
            <h2 className="mt-2 truncate font-display text-[clamp(2.2rem,6.5vw,5.5rem)] leading-[0.85] text-chalk">
              {weapon.name}
            </h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.28em] text-ash">
              “{weapon.codename}” · {weapon.ammo}
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            data-cursor="target"
            aria-label="Close"
            className="detail-close group grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.05] backdrop-blur-md transition-colors hover:border-blood/70 hover:bg-blood/15"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.4"
                className="text-smoke transition-colors group-hover:text-chalk"
              />
            </svg>
          </button>
        </div>

        {/* ------------------------------ Body ---------------------------- */}
        <div className="grid flex-1 items-center gap-6 py-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,260px)]">
          {/* Left — core statistics */}
          <div className="order-2 space-y-3 lg:order-1">
            {(Object.keys(weapon.stats) as (keyof typeof weapon.stats)[]).map((key) => {
              const value = weapon.stats[key];
              const pct = key === 'magazine' ? Math.min(100, value) : value;
              return (
                <div key={key} className="spec-left glass rounded-xl px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-ash">
                      {STAT_LABELS[key]}
                    </span>
                    <span className="font-mono text-sm tabular-nums text-chalk">{value}</span>
                  </div>
                  <span className="mt-2 block h-[3px] w-full overflow-hidden rounded-full bg-white/10">
                    <span
                      className="stat-fill block h-full origin-left rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${tier.color}, ${tier.color}22)`,
                        boxShadow: `0 0 12px ${tier.glow}`,
                      }}
                    />
                  </span>
                </div>
              );
            })}
          </div>

          {/* Centre — the weapon */}
          <div className="order-1 lg:order-2">
            <div ref={stageRef} className="relative gpu" style={{ perspective: '1400px' }}>
              {/* Rotating platter glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[60%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-60 blur-3xl"
                style={{ background: `radial-gradient(closest-side, ${tier.glow}, transparent)` }}
              />

              <div
                ref={rotatorRef}
                className="relative gpu"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div ref={artRef} style={{ filter: 'url(#heat-shimmer)' }}>
                  <WeaponArt
                    spec={weapon.silhouette}
                    accent={tier.color}
                    className="h-auto w-full drop-shadow-[0_40px_60px_rgb(0_0_0/.85)]"
                  />
                </div>

                {/* Falling magazine used by the reload sequence */}
                <div
                  aria-hidden
                  className="mag-shadow pointer-events-none absolute left-[46%] top-[62%] h-[22%] w-[7%] rounded-md opacity-0"
                  style={{
                    background: 'linear-gradient(180deg, #2e3439, #0a0c0e)',
                    boxShadow: '0 10px 20px rgb(0 0 0 / .8)',
                  }}
                />

                {/* ---- Fire effects, anchored at the muzzle ---- */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{ left: '92%', top: '44%' }}
                >
                  {/* Core flash */}
                  <span
                    className="muzzle-core absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
                    style={{
                      background:
                        'radial-gradient(circle, #fff 0%, #ffe08a 24%, #ff7a1a 52%, transparent 74%)',
                      filter: 'blur(2px)',
                    }}
                  />
                  {/* Four-point star */}
                  <svg
                    className="muzzle-star absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2 opacity-0"
                    viewBox="0 0 100 100"
                  >
                    <path
                      d="M50 0 L57 43 L100 50 L57 57 L50 100 L43 57 L0 50 L43 43 Z"
                      fill="#ffcf6e"
                      opacity="0.9"
                    />
                    <path
                      d="M50 18 L55 45 L82 50 L55 55 L50 82 L45 55 L18 50 L45 45 Z"
                      fill="#fff"
                    />
                  </svg>
                  {/* Tracer */}
                  <span
                    className="bullet-trail absolute h-[3px] w-52 origin-left -translate-y-1/2 rounded-full opacity-0"
                    style={{
                      background:
                        'linear-gradient(90deg, #fff, #ffd166 22%, rgb(255 106 26 / .5) 62%, transparent)',
                      boxShadow: '0 0 14px rgb(255 209 102 / .95)',
                    }}
                  />
                  {/* Smoke */}
                  <span
                    className="muzzle-smoke absolute h-32 w-32 -translate-x-1/3 -translate-y-1/2 rounded-full opacity-0"
                    style={{
                      background:
                        'radial-gradient(circle, rgb(190 196 202 / .6), rgb(120 128 136 / .22) 48%, transparent 72%)',
                      filter: 'blur(9px)',
                    }}
                  />
                  {/* Sparks */}
                  {Array.from({ length: 12 }, (_, i) => (
                    <span
                      key={i}
                      className="spark absolute h-1 w-1 -translate-y-1/2 rounded-full opacity-0"
                      style={{
                        background: i % 2 ? '#ffd166' : '#ff6a1a',
                        boxShadow: '0 0 8px currentColor',
                      }}
                    />
                  ))}
                </div>

                {/* Ejected casing, anchored at the port */}
                <span
                  aria-hidden
                  className="shell-casing pointer-events-none absolute h-4 w-1.5 rounded-sm opacity-0"
                  style={{
                    left: '52%',
                    top: '40%',
                    background: 'linear-gradient(180deg, #ffe0a3, #c69334 45%, #6d4d12)',
                    boxShadow: '0 0 10px rgb(198 147 52 / .7)',
                  }}
                />
              </div>

              {/* Reflection plate */}
              <div
                aria-hidden
                className="pointer-events-none -mt-16 h-40 opacity-20"
                style={{
                  transform: 'scaleY(-1)',
                  maskImage: 'linear-gradient(to top, transparent 5%, black 90%)',
                  WebkitMaskImage: 'linear-gradient(to top, transparent 5%, black 90%)',
                  filter: 'blur(2px)',
                }}
              >
                <WeaponArt spec={weapon.silhouette} accent={tier.color} className="h-auto w-full" sheen={false} />
              </div>
            </div>
          </div>

          {/* Right — ballistics + description */}
          <div className="order-3 space-y-3">
            <div className="spec-right glass rounded-xl px-4 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-ash">
                Cyclic Rate
              </span>
              <p className="mt-1 font-display text-3xl leading-none text-chalk">
                {weapon.rpm}
                <span className="ml-1 font-mono text-[10px] tracking-widest text-ash">RPM</span>
              </p>
            </div>

            <div className="spec-right glass rounded-xl px-4 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-ash">
                Muzzle Velocity
              </span>
              <p className="mt-1 font-display text-3xl leading-none text-chalk">
                {weapon.velocity}
                <span className="ml-1 font-mono text-[10px] tracking-widest text-ash">M/S</span>
              </p>
            </div>

            <div className="spec-right glass rounded-xl px-4 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-ash">
                Fire Modes
              </span>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {weapon.fireModes.map((m) => (
                  <li
                    key={m}
                    className="rounded-full border border-white/12 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-bone"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            <p className="spec-right text-[13px] leading-relaxed text-smoke">
              {weapon.description}
            </p>
          </div>
        </div>

        {/* --------------------------- Attachments ------------------------ */}
        <div
          className={cn(
            'grid overflow-hidden transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.16,1,.3,1)]',
            mode === 'attachments' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0">
            <div className="glass-heavy mb-5 grid gap-3 rounded-2xl p-5 sm:grid-cols-2 lg:grid-cols-4">
              {weapon.attachments.map((item, i) => (
                <div
                  key={item}
                  className="metal-edge rounded-xl bg-black/40 p-4"
                  style={{
                    transitionDelay: `${i * 60}ms`,
                    transform: mode === 'attachments' ? 'translateY(0)' : 'translateY(20px)',
                    opacity: mode === 'attachments' ? 1 : 0,
                    transition: 'transform .55s cubic-bezier(.16,1,.3,1), opacity .55s',
                  }}
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-ember">
                    Slot {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="mt-2 text-sm text-bone">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --------------------------- Action bar ------------------------- */}
        <div className="spec-bottom sticky bottom-0 shrink-0">
          <div className="glass-heavy flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
            {/* Ammo readout */}
            <div className="flex items-center gap-4">
              <div className="ammo-readout">
                <span className="block font-mono text-[9px] uppercase tracking-[0.26em] text-ash">
                  Rounds
                </span>
                <span className="font-display text-4xl leading-none tabular-nums text-chalk">
                  {String(ammo).padStart(2, '0')}
                  <span className="ml-1 text-xl text-ash">/{capacity}</span>
                </span>
              </div>
              <span className="hidden h-10 w-px bg-white/10 sm:block" />
              <span className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-white/10 sm:block">
                <span
                  className="block h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${ammoPct}%`,
                    background:
                      ammoPct > 30
                        ? 'linear-gradient(90deg,#ff6a1a,#ffd166)'
                        : 'linear-gradient(90deg,#8f0d1e,#e01730)',
                  }}
                />
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ActionButton label="Inspect" onClick={inspect} disabled={busy} active={mode === 'inspect'} />
              <ActionButton
                label="Fire"
                onClick={fire}
                disabled={busy}
                tone="danger"
                cursor="fire"
              />
              <ActionButton label="Reload" onClick={reload} disabled={busy || ammo === capacity} />
              <ActionButton
                label="Attachments"
                onClick={toggleAttachments}
                active={mode === 'attachments'}
              />
            </div>
          </div>

          {!audioEnabled ? (
            <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.24em] text-ash">
              Sound is off — enable audio in the header for synthesised weapon SFX
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  active,
  tone = 'default',
  cursor = 'target',
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  tone?: 'default' | 'danger';
  cursor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-cursor={cursor}
      className={cn(
        'group relative overflow-hidden rounded-full px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] transition-all duration-300',
        'disabled:cursor-not-allowed disabled:opacity-35',
        tone === 'danger'
          ? 'bg-linear-to-b from-blood to-blood-700 text-chalk shadow-[0_8px_28px_-8px_rgb(224_23_48/.9)] hover:brightness-115'
          : active
            ? 'border border-ember/70 bg-ember/15 text-ember'
            : 'border border-white/12 bg-white/[0.04] text-bone hover:border-ember/60 hover:text-chalk',
      )}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-24deg] bg-white/25 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-full" />
      <span className="relative">{label}</span>
    </button>
  );
}
