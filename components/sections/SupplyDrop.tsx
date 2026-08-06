'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ScrambleText } from '@/components/ui/ScrambleText';
import { VolumetricSmoke } from '@/components/ui/VolumetricSmoke';
import { WeaponArt } from '@/components/art/WeaponArt';
import { WEAPONS, TIER_META } from '@/lib/data/weapons';

const PRIZE = WEAPONS.find((w) => w.id === 'sr-longbow')!;

const BEATS = [
  { at: 0.04, label: 'FLARE CALLED', detail: 'Signal acquired · C-130 inbound on heading 214' },
  { at: 0.2, label: 'CARGO RELEASED', detail: 'Crate away · 640 m AGL · drift 14 kt' },
  { at: 0.44, label: 'CANOPY DEPLOYED', detail: 'Descent stabilised at 6.2 m/s' },
  { at: 0.68, label: 'GROUND IMPACT', detail: 'Touchdown confirmed · marker burning' },
  { at: 0.86, label: 'CRATE BREACHED', detail: 'Contents classified — mythic tier recovered' },
];

/**
 * The airdrop.
 *
 * One scrubbed master timeline pinned for three viewport heights: the plane
 * crosses, the crate is released and falls under canopy with wind-driven sway,
 * it impacts and throws dust, red signal smoke rolls out, the lid opens and a
 * mythic weapon rises into a shaft of golden light.
 *
 * Because it is scrubbed, the user controls the pacing — scroll back and the
 * crate closes again.
 */
export function SupplyDrop() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const detailRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useGsapContext(
    () => {
      if (reduced) return;

      const q = gsap.utils.selector(stageRef);

      gsap.set(q('.crate-group'), { yPercent: -180, opacity: 0 });
      gsap.set(q('.chute'), { scaleY: 0, opacity: 0, transformOrigin: '50% 100%' });
      gsap.set(q('.impact-ring'), { scale: 0, opacity: 0 });
      gsap.set(q('.impact-dust'), { opacity: 0, scale: 0.2 });
      gsap.set(q('.red-smoke'), { opacity: 0 });
      gsap.set(q('.lid'), { rotateX: 0, transformOrigin: '50% 100%' });
      gsap.set(q('.prize'), { opacity: 0, y: 60, scale: 0.7 });
      gsap.set(q('.god-ray'), { opacity: 0, scaleY: 0.4 });
      gsap.set(q('.prize-label'), { opacity: 0, y: 26 });

      let currentBeat = -1;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=320%',
          pin: stageRef.current,
          scrub: 0.9,
          anticipatePin: 1,
          onUpdate: (self) => {
            // Drive the status readout from scroll position, not from time.
            const beat = BEATS.reduce((acc, b, i) => (self.progress >= b.at ? i : acc), 0);
            if (beat !== currentBeat) {
              currentBeat = beat;
              const { label, detail } = BEATS[beat];
              gsap.fromTo(
                [statusRef.current, detailRef.current],
                { opacity: 0, x: -12 },
                {
                  opacity: 1,
                  x: 0,
                  duration: 0.35,
                  stagger: 0.05,
                  overwrite: true,
                  onStart: () => {
                    if (statusRef.current) statusRef.current.textContent = label;
                    if (detailRef.current) detailRef.current.textContent = detail;
                  },
                },
              );
            }
          },
        },
        defaults: { ease: 'none' },
      });

      /* ---- 1. The plane crosses the frame ---- */
      tl.fromTo(
        q('.plane'),
        { xPercent: -140, yPercent: 0 },
        { xPercent: 150, yPercent: -14, duration: 2.2, ease: 'none' },
        0,
      )
        .fromTo(q('.contrail'), { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 0.5, duration: 0.6 }, 0.3)
        .to(q('.contrail'), { opacity: 0, duration: 0.8 }, 1.6);

      /* ---- 2. Crate released, canopy deploys ---- */
      tl.to(q('.crate-group'), { opacity: 1, duration: 0.1 }, 0.85)
        // A beat of freefall before the canopy catches.
        .to(q('.crate-group'), { yPercent: -120, duration: 0.35, ease: 'power2.in' }, 0.85)
        .to(q('.chute'), { scaleY: 1, opacity: 1, duration: 0.3, ease: 'recoil' }, 1.18)
        // The catch: the crate is jerked upward as the canopy fills.
        .to(q('.crate-group'), { yPercent: -128, duration: 0.18, ease: 'power2.out' }, 1.2);

      /* ---- 3. Descent under canopy, swaying in the wind ---- */
      tl.to(q('.crate-group'), { yPercent: 0, duration: 2.1, ease: 'power1.inOut' }, 1.4)
        // Pendulum sway — decays as it nears the ground.
        .to(
          q('.crate-group'),
          {
            keyframes: { x: [0, 48, -38, 30, -20, 12, 0] },
            duration: 2.1,
            ease: 'sine.inOut',
          },
          1.4,
        )
        .to(
          q('.chute'),
          { keyframes: { rotate: [0, -7, 6, -4, 3, 0], skewX: [0, 5, -4, 3, 0] }, duration: 2.1 },
          1.4,
        )
        // Wind streaks blowing past
        .fromTo(
          q('.wind-streak'),
          { opacity: 0, x: 120 },
          { opacity: 0.4, x: -420, duration: 1.4, stagger: 0.09, ease: 'power1.in' },
          1.5,
        )
        .to(q('.wind-streak'), { opacity: 0, duration: 0.4 }, 3.1);

      /* ---- 4. Impact ---- */
      const impact = 3.5;
      tl.to(q('.chute'), { opacity: 0, y: 90, scaleY: 0.4, duration: 0.5, ease: 'power2.in' }, impact)
        // Crate compresses, then rebounds
        .to(q('.crate'), { scaleY: 0.82, scaleX: 1.12, duration: 0.09, ease: 'power3.out' }, impact)
        .to(q('.crate'), { scaleY: 1, scaleX: 1, duration: 0.4, ease: 'recoil' }, impact + 0.09)
        // Ground shock rings
        .to(q('.impact-ring'), { opacity: 0.7, scale: 1, duration: 0.12, stagger: 0.05 }, impact)
        .to(q('.impact-ring'), { opacity: 0, scale: 3, duration: 0.9, stagger: 0.05, ease: 'power2.out' }, impact + 0.1)
        // Dust explosion
        .to(q('.impact-dust'), { opacity: 0.75, scale: 1, duration: 0.28, stagger: 0.03, ease: 'power2.out' }, impact + 0.02)
        .to(
          q('.impact-dust'),
          {
            opacity: 0,
            scale: 3.4,
            x: () => gsap.utils.random(-190, 190),
            y: () => gsap.utils.random(-70, 12),
            duration: 1.6,
            ease: 'power2.out',
            stagger: 0.03,
          },
          impact + 0.24,
        )
        // Camera shake
        .to(
          stageRef.current,
          {
            keyframes: {
              x: [0, -17, 13, -8, 5, 0],
              y: [0, 11, -8, 5, -2, 0],
              duration: 0.55,
            },
          },
          impact,
        );

      /* ---- 5. Red signal smoke ---- */
      tl.to(q('.red-smoke'), { opacity: 1, duration: 0.9, ease: 'power1.out' }, impact + 0.3);

      /* ---- 6. The crate opens ---- */
      const open = impact + 1.2;
      tl.to(q('.lid'), { rotateX: -128, duration: 1, ease: 'power2.inOut' }, open)
        .to(q('.god-ray'), { opacity: 1, scaleY: 1, duration: 1.1, ease: 'power2.out' }, open + 0.2)
        .to(q('.crate-glow'), { opacity: 1, duration: 0.8 }, open + 0.2)
        // The prize rises out
        .to(q('.prize'), { opacity: 1, y: -130, scale: 1, duration: 1.3, ease: 'power2.out' }, open + 0.35)
        .to(q('.prize'), { rotate: 3, duration: 1.6, ease: 'sine.inOut' }, open + 0.9)
        .to(q('.prize-label'), { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, open + 0.9)
        // Golden motes rising through the light shaft
        .fromTo(
          q('.mote'),
          { opacity: 0, y: 40 },
          { opacity: 0.85, y: -160, duration: 2, stagger: 0.06, ease: 'power1.out' },
          open + 0.5,
        );
    },
    sectionRef,
    [reduced],
  );

  const tier = TIER_META[PRIZE.tier];

  return (
    <section
      ref={sectionRef}
      id="airdrop"
      className="relative h-[420vh] bg-abyss"
      aria-label="Supply drop"
    >
      <div ref={stageRef} className="relative h-screen w-full overflow-hidden">
        {/* --------------------------- Environment --------------------------- */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #071018 0%, #0c1219 34%, #140f0b 72%, #06070a 100%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-2/3 opacity-60"
          style={{
            background: 'radial-gradient(60% 70% at 50% 8%, rgb(90 130 168 / .22), transparent 70%)',
          }}
        />
        <VolumetricSmoke plumes={4} tone="cold" intensity={0.5} seed={19} />

        {/* Ground plane */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[26%]"
          style={{
            background: 'linear-gradient(180deg, #100d09 0%, #07070a 100%)',
            boxShadow: 'inset 0 12px 40px rgb(0 0 0 / .9)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-[26%] h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgb(255 106 26 / .35), transparent)' }}
        />

        {/* Wind streaks */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className="wind-streak absolute h-px opacity-0"
              style={{
                top: `${12 + i * 6.4}%`,
                right: '-10%',
                width: `${90 + (i % 4) * 70}px`,
                background:
                  'linear-gradient(90deg, transparent, rgb(200 214 224 / .55), transparent)',
              }}
            />
          ))}
        </div>

        {/* ------------------------------ Plane ------------------------------ */}
        <div className="plane pointer-events-none absolute left-0 top-[13%] w-[240px] sm:w-[340px]">
          <div
            aria-hidden
            className="contrail absolute right-full top-1/2 h-[3px] w-[420px] origin-right opacity-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgb(210 222 232 / .6))',
              filter: 'blur(2px)',
            }}
          />
          <svg viewBox="0 0 340 100" className="w-full" aria-hidden>
            <defs>
              <linearGradient id="plane-body" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a545c" />
                <stop offset="45%" stopColor="#242b31" />
                <stop offset="100%" stopColor="#0b0e11" />
              </linearGradient>
            </defs>
            <path
              d="M22 54 Q40 40 96 38 L246 38 Q286 38 306 50 Q286 62 246 62 L96 62 Q40 60 22 54 Z"
              fill="url(#plane-body)"
            />
            {/* Wing */}
            <path d="M150 40 L206 12 L236 12 L206 40 Z" fill="#1a1f24" />
            <path d="M150 60 L206 84 L236 84 L206 60 Z" fill="#151a1e" />
            {/* Tail */}
            <path d="M30 50 L14 20 L34 20 L54 44 Z" fill="#1a1f24" />
            <path d="M30 54 L14 80 L34 80 L54 58 Z" fill="#151a1e" />
            {/* Engines */}
            {[168, 200].map((x) => (
              <rect key={x} x={x} y="24" width="26" height="10" rx="5" fill="#12161a" />
            ))}
            {/* Open cargo ramp */}
            <path d="M22 54 L46 68 L70 62 L46 50 Z" fill="#0a0d10" />
            {/* Beacon */}
            <circle cx="286" cy="50" r="3" fill="#ff2b44" className="animate-[ember-pulse_1.2s_ease-in-out_infinite]" />
          </svg>
        </div>

        {/* ------------------------------ Crate ------------------------------ */}
        <div className="absolute inset-0 flex items-end justify-center pb-[24%]">
          <div className="crate-group relative gpu" style={{ perspective: '1200px' }}>
            {/* Parachute */}
            <div className="chute absolute bottom-full left-1/2 mb-2 w-[300px] -translate-x-1/2 sm:w-[400px]">
              <svg viewBox="0 0 400 220" className="w-full" aria-hidden>
                <defs>
                  <linearGradient id="chute-a" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8ddc8" />
                    <stop offset="60%" stopColor="#a8967a" />
                    <stop offset="100%" stopColor="#5e5340" />
                  </linearGradient>
                  <linearGradient id="chute-b" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c9503a" />
                    <stop offset="100%" stopColor="#6b2418" />
                  </linearGradient>
                </defs>
                {/* Canopy gores, alternating colours */}
                {Array.from({ length: 7 }, (_, i) => {
                  const x0 = (i / 7) * 400;
                  const x1 = ((i + 1) / 7) * 400;
                  const mid = (x0 + x1) / 2;
                  return (
                    <path
                      key={i}
                      d={`M${x0} 132 Q${mid} ${i % 2 ? -18 : -8} ${x1} 132 Q${mid} 152 ${x0} 132 Z`}
                      fill={i % 2 ? 'url(#chute-b)' : 'url(#chute-a)'}
                      opacity="0.95"
                    />
                  );
                })}
                {/* Vent */}
                <ellipse cx="200" cy="24" rx="26" ry="8" fill="#3d3628" opacity="0.8" />
                {/* Rigging lines */}
                {Array.from({ length: 8 }, (_, i) => (
                  <path
                    key={i}
                    d={`M${28 + i * 49} 134 L200 214`}
                    stroke="#c8bfa8"
                    strokeWidth="1.2"
                    opacity="0.55"
                    fill="none"
                  />
                ))}
              </svg>
            </div>

            {/* Golden light shaft */}
            <div
              aria-hidden
              className="god-ray pointer-events-none absolute bottom-1/2 left-1/2 h-[130vh] w-[62vw] -translate-x-1/2 origin-bottom opacity-0"
              style={{
                background:
                  'conic-gradient(from 180deg at 50% 100%, transparent 0deg, rgb(255 209 102 / .1) 8deg, rgb(255 209 102 / .3) 22deg, rgb(255 209 102 / .1) 36deg, transparent 44deg)',
                filter: 'blur(18px)',
                mixBlendMode: 'screen',
              }}
            />

            {/* Rising motes inside the shaft */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px]">
              {Array.from({ length: 16 }, (_, i) => (
                <span
                  key={i}
                  className="mote absolute rounded-full opacity-0"
                  style={{
                    left: `${8 + ((i * 37) % 84)}%`,
                    bottom: `${(i % 5) * 14}px`,
                    width: `${2 + (i % 3)}px`,
                    height: `${2 + (i % 3)}px`,
                    background: '#ffd166',
                    boxShadow: '0 0 10px #ffd166',
                  }}
                />
              ))}
            </div>

            {/* The prize */}
            <div className="prize pointer-events-none absolute bottom-8 left-1/2 w-[440px] max-w-[86vw] -translate-x-1/2 sm:w-[560px]">
              <WeaponArt
                spec={PRIZE.silhouette}
                accent={tier.color}
                className="h-auto w-full drop-shadow-[0_0_50px_rgb(255_209_102/.6)]"
              />
              <div className="prize-label mt-2 text-center">
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.36em]"
                  style={{ color: tier.color }}
                >
                  {tier.label}
                </span>
                <p className="mt-1 font-display text-4xl leading-none text-chalk sm:text-6xl">
                  {PRIZE.name}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-ash">
                  {PRIZE.ammo} · {PRIZE.velocity} m/s
                </p>
              </div>
            </div>

            {/* Crate body */}
            <div className="crate relative gpu" style={{ transformStyle: 'preserve-3d' }}>
              {/* Interior glow spilling out */}
              <div
                aria-hidden
                className="crate-glow pointer-events-none absolute inset-x-6 top-2 h-16 rounded-full opacity-0 blur-2xl"
                style={{ background: 'radial-gradient(closest-side, #ffd166, transparent)' }}
              />

              {/* Lid */}
              <div
                className="lid relative z-10 h-9 w-[220px] rounded-t-md sm:h-11 sm:w-[280px]"
                style={{
                  background: 'linear-gradient(180deg, #6b5a3a, #3d3221 60%, #241d13)',
                  borderTop: '2px solid rgb(255 255 255 / .12)',
                  boxShadow: '0 -4px 14px rgb(0 0 0 / .6)',
                  transformStyle: 'preserve-3d',
                }}
              >
                <span className="absolute inset-x-4 top-1/2 h-px bg-black/50" />
                <span className="absolute left-1/2 top-1/2 h-4 w-10 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-ember/70" />
              </div>

              {/* Box */}
              <div
                className="relative w-[220px] overflow-hidden rounded-b-md sm:w-[280px]"
                style={{
                  height: 'clamp(96px, 12vw, 128px)',
                  background: 'linear-gradient(180deg, #4a3c26 0%, #2e2618 55%, #1a150d 100%)',
                  boxShadow: 'inset 0 3px 0 rgb(0 0 0 / .6), 0 22px 40px -12px rgb(0 0 0 / .95)',
                }}
              >
                {/* Planking */}
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="absolute inset-x-0 h-px bg-black/45"
                    style={{ top: `${26 + i * 24}%` }}
                  />
                ))}
                {/* Steel banding */}
                <span className="absolute inset-y-0 left-5 w-2 bg-linear-to-b from-steel to-graphite opacity-70" />
                <span className="absolute inset-y-0 right-5 w-2 bg-linear-to-b from-steel to-graphite opacity-70" />
                {/* Stencil */}
                <span className="absolute inset-x-0 top-[30%] text-center font-display text-2xl tracking-[0.2em] text-ember/85 sm:text-3xl">
                  SUPPLY
                </span>
                <span className="absolute inset-x-0 bottom-3 text-center font-mono text-[8px] uppercase tracking-[0.3em] text-tracer/70">
                  Mythic · Do not open in the open
                </span>
              </div>

              {/* Ground contact shadow */}
              <span
                aria-hidden
                className="absolute -bottom-3 left-1/2 h-5 w-[260px] -translate-x-1/2 rounded-[50%] bg-black/75 blur-md sm:w-[330px]"
              />
            </div>

            {/* Impact rings */}
            <div aria-hidden className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="impact-ring absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-0"
                  style={{
                    width: `${240 + i * 90}px`,
                    height: `${44 + i * 16}px`,
                    border: `2px solid rgb(220 200 160 / ${0.5 - i * 0.12})`,
                  }}
                />
              ))}
            </div>

            {/* Impact dust */}
            <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2">
              {Array.from({ length: 14 }, (_, i) => (
                <span
                  key={i}
                  className="impact-dust absolute rounded-full opacity-0"
                  style={{
                    left: `${(i % 7) * 44 - 150}px`,
                    bottom: `${(i % 3) * 12}px`,
                    width: `${44 + (i % 5) * 26}px`,
                    height: `${44 + (i % 5) * 26}px`,
                    background:
                      'radial-gradient(circle, rgb(206 190 160 / .7), rgb(120 108 88 / .22) 52%, transparent 74%)',
                    filter: 'blur(7px)',
                  }}
                />
              ))}
            </div>

            {/* Red signal smoke */}
            <div aria-hidden className="red-smoke pointer-events-none absolute -bottom-10 left-1/2 h-[70vh] w-[70vw] -translate-x-1/2 opacity-0">
              <VolumetricSmoke plumes={5} tone="signal" intensity={0.95} seed={41} />
            </div>
          </div>
        </div>

        {/* ------------------------------- HUD ------------------------------- */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-5 pt-24 sm:px-10">
          <SectionHeading
            index="04"
            eyebrow="Priority Airdrop"
            title="SUPPLY"
            accent="DROP"
            className="max-w-lg"
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-5 pb-10 sm:px-10">
          <div className="glass metal-edge inline-flex max-w-full flex-col rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blood opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blood" />
              </span>
              <span
                ref={statusRef}
                className="font-display text-xl leading-none tracking-wide text-chalk sm:text-2xl"
              >
                FLARE CALLED
              </span>
            </div>
            <span
              ref={detailRef}
              className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ash"
            >
              Signal acquired · C-130 inbound on heading 214
            </span>
          </div>

          <p className="mt-4 max-w-md text-[13px] leading-relaxed text-smoke">
            Scroll to run the drop. Every crate is a decision — the contents are always worth
            taking, and everyone within a kilometre watched the smoke go up.
          </p>
        </div>

        {/* Static fallback caption for reduced-motion users */}
        {reduced ? (
          <p className="absolute inset-x-0 bottom-4 z-40 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-ash">
            <ScrambleText text="Airdrop sequence — animation reduced" onScroll={false} />
          </p>
        ) : null}
      </div>
    </section>
  );
}
