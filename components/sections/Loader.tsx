'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { VolumetricSmoke } from '@/components/ui/VolumetricSmoke';

const BOOT_LINES = [
  'ESTABLISHING UPLINK · SECTOR 7',
  'ARMOURY MANIFEST · VERIFIED',
  'RECEIVER — TITANIUM FORGE · SEATED',
  'BARREL ASSEMBLY · TORQUED 62 Nm',
  'OPTIC — ZERO CONFIRMED AT 100 M',
  'MAGAZINE · SEATED',
  'BOLT CYCLED · CHAMBER HOT',
  'LOADOUT COMPLETE — GOOD HUNTING',
];

/**
 * The cold open.
 *
 * A rifle assembles from disassembled parts, the magazine seats, the bolt
 * cycles, an ammo counter runs to 100, smoke rolls in, and a shaped explosion
 * blows the whole thing off screen into the hero.
 *
 * The entire sequence is one GSAP timeline so it can be scrubbed, skipped, or
 * replaced wholesale under `prefers-reduced-motion`.
 */
export function Loader() {
  const { markReady, markPreparing } = useExperience();
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const [dismissed, setDismissed] = useState(false);

  const finish = useCallback(() => {
    markReady();
    // Unmount a beat after the wipe so the hero is already painted underneath.
    setTimeout(() => setDismissed(true), 260);
  }, [markReady]);

  const skip = useCallback(() => {
    const tl = timelineRef.current;
    if (!tl) return finish();
    // Jump to the explosion instead of cutting to black — a hard cut looks broken.
    tl.timeScale(6);
  }, [finish]);

  useEffect(() => {
    if (!reduced) return;
    // Reduced motion: hold the frame briefly so it doesn't flash, then hand off.
    const t = setTimeout(finish, 500);
    return () => clearTimeout(t);
  }, [reduced, finish]);

  useGsapContext(
    () => {
      if (reduced) return;

      const q = gsap.utils.selector(rootRef);
      const counter = counterRef.current;
      const status = statusRef.current;
      const ammo = { value: 0 };

      const setStatus = (index: number) => {
        if (!status) return;
        gsap.fromTo(
          status,
          { opacity: 0, x: -14, filter: 'blur(6px)' },
          {
            opacity: 1,
            x: 0,
            filter: 'blur(0px)',
            duration: 0.4,
            ease: 'power2.out',
            onStart: () => {
              status.textContent = BOOT_LINES[index] ?? '';
            },
          },
        );
      };

      // ---- Initial state: everything scattered, off-axis and invisible ----
      gsap.set(q('.part'), { opacity: 0 });
      gsap.set(q('#p-receiver'), { x: -260, rotate: -14, opacity: 0 });
      gsap.set(q('#p-stock'), { x: -340, y: 90, rotate: 22 });
      gsap.set(q('#p-handguard'), { x: 300, y: -70, rotate: 16 });
      gsap.set(q('#p-barrel'), { x: 420, rotate: 8 });
      gsap.set(q('#p-muzzle'), { x: 520, rotate: -30 });
      gsap.set(q('#p-rail'), { y: -160, rotate: -8 });
      gsap.set(q('#p-optic'), { y: -230, scale: 0.6, rotate: 12 });
      gsap.set(q('#p-grip'), { y: 190, rotate: -24 });
      gsap.set(q('#p-trigger'), { y: 140, x: -60 });
      gsap.set(q('#p-mag'), { y: 260, rotate: 10, opacity: 0 });
      gsap.set(q('#p-bolt'), { x: 40, opacity: 0 });
      gsap.set(q('.weapon-stage'), { scale: 0.94, rotate: -1.5 });
      gsap.set(q('.hud'), { opacity: 0, y: 20 });
      gsap.set(q('.flash'), { opacity: 0, scale: 0 });
      gsap.set(q('.shock'), { opacity: 0, scale: 0 });
      gsap.set(q('.shard'), { opacity: 0 });
      gsap.set(q('.loader-smoke'), { opacity: 0 });

      const tl = gsap.timeline({ onComplete: finish, defaults: { ease: 'cinema' } });
      timelineRef.current = tl;

      /* ---------------- 1. HUD boots up ---------------- */
      tl.to(q('.hud'), { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0)
        .call(() => setStatus(0), undefined, 0.1);

      /* ---------------- 2. Core parts fly in ---------------- */
      tl.to(
        q('#p-receiver'),
        { x: 0, rotate: 0, opacity: 1, duration: 0.95, ease: 'slam' },
        0.35,
      )
        .to(q('#p-stock'), { x: 0, y: 0, rotate: 0, opacity: 1, duration: 0.8, ease: 'slam' }, 0.7)
        .call(() => setStatus(1), undefined, 0.7)
        .to(
          q('#p-handguard'),
          { x: 0, y: 0, rotate: 0, opacity: 1, duration: 0.8, ease: 'slam' },
          0.9,
        )
        .to(q('#p-barrel'), { x: 0, rotate: 0, opacity: 1, duration: 0.75, ease: 'slam' }, 1.05)
        .call(() => setStatus(2), undefined, 1.1)
        // Each seat lands with a small kick — mass arriving, not a fade-in.
        .to(q('.weapon-stage'), { x: 6, duration: 0.06, yoyo: true, repeat: 1 }, 1.7)
        .to(q('#p-muzzle'), { x: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'slam' }, 1.3)
        .to(q('#p-grip'), { y: 0, rotate: 0, opacity: 1, duration: 0.65, ease: 'slam' }, 1.4)
        .to(q('#p-trigger'), { y: 0, x: 0, opacity: 1, duration: 0.55, ease: 'slam' }, 1.55)
        .call(() => setStatus(3), undefined, 1.6);

      /* ---------------- 3. Rail + optic drop from above ---------------- */
      tl.to(q('#p-rail'), { y: 0, rotate: 0, opacity: 1, duration: 0.7, ease: 'slam' }, 1.8)
        .to(
          q('#p-optic'),
          { y: 0, scale: 1, rotate: 0, opacity: 1, duration: 0.85, ease: 'recoil' },
          2.0,
        )
        .call(() => setStatus(4), undefined, 2.1)
        .to(q('.weapon-stage'), { y: -4, duration: 0.07, yoyo: true, repeat: 1 }, 2.7)
        // Reticle powers on
        .fromTo(
          q('.reticle-dot'),
          { opacity: 0, scale: 3 },
          { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' },
          2.75,
        );

      /* ---------------- 4. Magazine inserts and seats ---------------- */
      tl.to(q('#p-mag'), { opacity: 1, duration: 0.01 }, 2.9)
        .fromTo(
          q('#p-mag'),
          { y: 260, rotate: 10 },
          { y: 18, rotate: 0, duration: 0.55, ease: 'power2.in' },
          2.9,
        )
        .call(() => setStatus(5), undefined, 3.0)
        // The seat: overshoot down, then snap up with a hard stop.
        .to(q('#p-mag'), { y: 0, duration: 0.16, ease: 'slam' }, 3.45)
        .to(q('.weapon-stage'), { y: 8, duration: 0.07, yoyo: true, repeat: 1, ease: 'none' }, 3.45)
        .fromTo(
          q('.seat-flash'),
          { opacity: 0.9, scaleX: 0.4 },
          { opacity: 0, scaleX: 1.4, duration: 0.4, ease: 'power2.out' },
          3.46,
        );

      /* ---------------- 5. Bolt cycles ---------------- */
      tl.to(q('#p-bolt'), { opacity: 1, duration: 0.01 }, 3.7)
        .to(q('#p-bolt'), { x: -46, duration: 0.22, ease: 'power2.out' }, 3.7)
        .call(() => setStatus(6), undefined, 3.75)
        .to(q('#p-bolt'), { x: 0, duration: 0.13, ease: 'power4.in' }, 3.95)
        // Slam recoil through the whole weapon
        .to(q('.weapon-stage'), { x: 14, duration: 0.06, ease: 'none' }, 4.08)
        .to(q('.weapon-stage'), { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }, 4.14)
        // Ejected casing arcs away on a motion path
        .fromTo(
          q('.casing'),
          { opacity: 1, x: 0, y: 0, rotate: 0 },
          {
            motionPath: {
              path: [
                { x: 40, y: -70 },
                { x: 110, y: -30 },
                { x: 170, y: 160 },
              ],
              curviness: 1.4,
            },
            rotate: 720,
            opacity: 0,
            duration: 1.1,
            ease: 'power1.in',
          },
          4.1,
        );

      /* ---------------- 6. Ammo counter runs to 100 ---------------- */
      tl.to(
        ammo,
        {
          value: 100,
          duration: 2.6,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (counter) counter.textContent = String(Math.round(ammo.value)).padStart(3, '0');
          },
        },
        1.4,
      ).to(q('.progress-fill'), { scaleX: 1, duration: 2.6, ease: 'power2.inOut' }, 1.4);

      /* ---------------- 7. Smoke rolls in ---------------- */
      tl.to(q('.loader-smoke'), { opacity: 1, duration: 1.2, ease: 'power1.out' }, 4.0)
        .to(q('.weapon-stage'), { scale: 1.06, duration: 1.6, ease: 'power2.inOut' }, 4.0)
        .call(() => setStatus(7), undefined, 4.5);

      /* ---------------- 8. Cinematic detonation ---------------- */
      const boom = 5.3;

      tl
        // Bring the battlefield online behind the curtain, on the charge-up.
        // Creating the WebGL context and compiling its shaders blocks the main
        // thread; doing it here buries that cost under the loudest moment of
        // the sequence instead of dropping it on the frame the hero appears.
        .call(markPreparing, undefined, boom - 0.5)
        // Charge-up: the frame contracts and the light drains before the blast.
        .to(q('.weapon-stage'), { scale: 0.97, duration: 0.35, ease: 'power2.in' }, boom - 0.4)
        .to(q('.vignette-charge'), { opacity: 1, duration: 0.35 }, boom - 0.4)
        // Flash
        .to(q('.flash'), { opacity: 1, scale: 1, duration: 0.14, ease: 'power4.out' }, boom)
        .to(q('.flash'), { opacity: 0, duration: 0.7, ease: 'power2.in' }, boom + 0.16)
        // Shockwave rings
        .to(
          q('.shock'),
          {
            opacity: 0.85,
            scale: 1,
            duration: 0.1,
            stagger: 0.07,
          },
          boom,
        )
        .to(
          q('.shock'),
          { scale: 3.4, opacity: 0, duration: 1.5, ease: 'power3.out', stagger: 0.07 },
          boom + 0.08,
        )
        // Weapon is thrown apart by the blast
        .to(
          q('.part'),
          {
            x: () => gsap.utils.random(-900, 900),
            y: () => gsap.utils.random(-560, 560),
            rotate: () => gsap.utils.random(-220, 220),
            scale: () => gsap.utils.random(0.4, 1.5),
            opacity: 0,
            duration: 1.1,
            ease: 'power3.out',
            stagger: { amount: 0.14, from: 'center' },
          },
          boom + 0.04,
        )
        // Debris shards
        .to(
          q('.shard'),
          {
            opacity: 1,
            x: () => gsap.utils.random(-780, 780),
            y: () => gsap.utils.random(-620, 620),
            rotate: () => gsap.utils.random(-540, 540),
            duration: 1.3,
            ease: 'power3.out',
            stagger: 0.006,
          },
          boom + 0.04,
        )
        .to(q('.shard'), { opacity: 0, duration: 0.5 }, boom + 0.9)
        // HUD blows out
        .to(q('.hud'), { opacity: 0, y: -30, filter: 'blur(10px)', duration: 0.6 }, boom + 0.05)
        // Camera shake, decaying
        .to(
          rootRef.current,
          {
            keyframes: {
              x: [0, -22, 19, -13, 9, -5, 0],
              y: [0, 15, -12, 8, -5, 3, 0],
              duration: 0.75,
            },
            ease: 'none',
          },
          boom,
        )
        // Iris wipe out to the hero
        .to(
          q('.curtain'),
          { clipPath: 'circle(0% at 50% 50%)', duration: 1.15, ease: 'power3.inOut' },
          boom + 0.42,
        )
        .to(rootRef.current, { opacity: 0, duration: 0.35, ease: 'power2.in' }, boom + 1.35);

      return () => {
        tl.kill();
        timelineRef.current = null;
      };
    },
    rootRef,
    [reduced, finish, markPreparing],
  );

  // Escape skips ahead — a long cold open must always be escapable.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip]);

  if (dismissed) return null;

  return (
    <div
      ref={rootRef}
      // `loader-root` is what the CSS hook below hangs off. The weapon parts
      // and HUD must be hidden in the SERVER-RENDERED markup, because the
      // browser paints that HTML before React hydrates — and GSAP's opening
      // gsap.set() calls cannot run until hydration. Without a CSS initial
      // state the fully assembled weapon is painted first, and the assembly
      // animation then appears to start over. See app/globals.css.
      className="loader-root fixed inset-0 z-[200] overflow-hidden bg-void"
      role="status"
      aria-live="polite"
      aria-label="Loading combat experience"
    >
      {/* Iris curtain — the black plate that irises open onto the hero */}
      <div
        className="curtain absolute inset-0 bg-void"
        style={{ clipPath: 'circle(150% at 50% 50%)' }}
      >
        {/* Ambient carbon backdrop */}
        <div className="carbon absolute inset-0 opacity-40" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(75% 55% at 50% 48%, rgb(255 106 26 / 0.07), transparent 70%)',
          }}
        />

        <div className="loader-smoke absolute inset-0">
          <VolumetricSmoke plumes={5} tone="warm" intensity={0.85} seed={3} />
        </div>

        {/* Pre-blast light drain */}
        <div
          className="vignette-charge absolute inset-0 opacity-0"
          style={{
            background: 'radial-gradient(60% 50% at 50% 50%, transparent, rgb(0 0 0 / 0.9) 90%)',
          }}
        />

        {/* ---------------------------- WEAPON STAGE ---------------------------- */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="weapon-stage relative w-full max-w-[min(1100px,92vw)] gpu">
            <svg viewBox="0 0 620 260" className="w-full" aria-hidden="true">
              <defs>
                <linearGradient id="ld-body" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#69747c" />
                  <stop offset="16%" stopColor="#3b444c" />
                  <stop offset="58%" stopColor="#1d2226" />
                  <stop offset="100%" stopColor="#080a0c" />
                </linearGradient>
                <linearGradient id="ld-poly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#333a40" />
                  <stop offset="50%" stopColor="#1a1e22" />
                  <stop offset="100%" stopColor="#0a0c0e" />
                </linearGradient>
                <linearGradient id="ld-steel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9aa6af" />
                  <stop offset="30%" stopColor="#4f5860" />
                  <stop offset="100%" stopColor="#0e1113" />
                </linearGradient>
                <radialGradient id="ld-glass" cx="0.35" cy="0.3" r="0.8">
                  <stop offset="0%" stopColor="#c8f2ff" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#2f7fa8" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#04080c" />
                </radialGradient>
                <filter id="ld-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Ground shadow */}
              <ellipse cx="310" cy="216" rx="220" ry="10" fill="#000" opacity="0.6" />

              <g id="p-stock" className="part">
                <path
                  d="M36 108 L140 108 L140 152 L84 158 Q44 162 36 148 Z"
                  fill="url(#ld-poly)"
                  stroke="#04060a"
                />
                <rect x="28" y="108" width="10" height="44" rx="3" fill="#0a0c0e" />
                <rect x="52" y="116" width="30" height="14" rx="4" fill="#05070a" opacity="0.8" />
                <rect x="94" y="116" width="30" height="14" rx="4" fill="#05070a" opacity="0.8" />
              </g>

              <g id="p-receiver" className="part">
                <path d="M142 96 L318 96 L318 154 L142 154 Z" fill="url(#ld-body)" stroke="#04060a" />
                <rect x="142" y="96" width="176" height="6" fill="#fff" opacity="0.1" />
                <rect x="262" y="108" width="44" height="20" rx="4" fill="#04060a" />
                <circle cx="252" cy="146" r="5" fill="#12161a" />
              </g>

              <g id="p-bolt" className="part">
                <rect x="152" y="102" width="46" height="12" rx="5" fill="url(#ld-steel)" />
                <rect x="188" y="100" width="14" height="16" rx="4" fill="#39424a" />
              </g>

              <g id="p-handguard" className="part">
                <rect x="316" y="104" width="150" height="42" rx="7" fill="url(#ld-body)" />
                <rect x="316" y="104" width="150" height="6" rx="3" fill="#fff" opacity="0.09" />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <rect
                    key={i}
                    x={330 + i * 22}
                    y={130}
                    width="14"
                    height="6"
                    rx="3"
                    fill="#04060a"
                    opacity="0.85"
                  />
                ))}
                <rect x="392" y="146" width="22" height="42" rx="8" fill="url(#ld-poly)" />
              </g>

              <g id="p-barrel" className="part">
                <rect x="460" y="116" width="86" height="18" rx="9" fill="url(#ld-steel)" />
                <rect x="454" y="98" width="18" height="24" rx="4" fill="url(#ld-body)" />
              </g>

              <g id="p-muzzle" className="part">
                <rect x="544" y="112" width="40" height="26" rx="5" fill="url(#ld-steel)" />
                <rect x="552" y="112" width="4" height="9" fill="#04060a" />
                <rect x="562" y="112" width="4" height="9" fill="#04060a" />
                <rect x="572" y="112" width="4" height="9" fill="#04060a" />
                <circle cx="580" cy="125" r="7" fill="#000" />
              </g>

              <g id="p-rail" className="part">
                <rect x="150" y="86" width="164" height="10" rx="2" fill="url(#ld-steel)" />
                {Array.from({ length: 17 }, (_, i) => (
                  <rect key={i} x={156 + i * 9} y="88" width="3" height="6" fill="#05070a" />
                ))}
              </g>

              <g id="p-optic" className="part">
                <rect x="196" y="52" width="14" height="36" rx="3" fill="url(#ld-body)" />
                <rect x="264" y="52" width="14" height="36" rx="3" fill="url(#ld-body)" />
                <rect x="190" y="56" width="102" height="26" rx="13" fill="url(#ld-steel)" />
                <rect x="190" y="58" width="102" height="5" rx="2" fill="#fff" opacity="0.14" />
                <rect x="172" y="50" width="22" height="38" rx="8" fill="url(#ld-body)" />
                <rect x="288" y="46" width="28" height="46" rx="10" fill="url(#ld-body)" />
                <ellipse cx="314" cy="69" rx="6" ry="21" fill="url(#ld-glass)" />
                <rect x="228" y="42" width="22" height="16" rx="3" fill="url(#ld-body)" />
                <circle
                  className="reticle-dot"
                  cx="314"
                  cy="69"
                  r="3.4"
                  fill="#ff6a1a"
                  filter="url(#ld-glow)"
                />
              </g>

              <g id="p-grip" className="part">
                <path
                  d="M196 152 L228 152 L222 208 Q218 216 208 214 L194 210 Q188 208 190 198 Z"
                  fill="url(#ld-poly)"
                  stroke="#04060a"
                />
                {[0, 1, 2, 3].map((r) => (
                  <g key={r} opacity="0.45">
                    {[0, 1, 2].map((c) => (
                      <circle key={c} cx={200 + c * 7} cy={166 + r * 10} r="1.1" fill="#5b666e" />
                    ))}
                  </g>
                ))}
              </g>

              <g id="p-trigger" className="part">
                <path
                  d="M230 154 Q234 182 256 180 L272 178 Q280 176 280 162"
                  fill="none"
                  stroke="url(#ld-body)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path d="M246 157 L250 172" stroke="#9aa6af" strokeWidth="4" strokeLinecap="round" />
              </g>

              <g id="p-mag" className="part">
                <path
                  d="M256 152 L302 152 L310 222 Q312 232 300 232 L266 230 Q256 230 256 220 Z"
                  fill="url(#ld-poly)"
                  stroke="#04060a"
                />
                <rect x="266" y="168" width="12" height="4" rx="2" fill="#05070a" />
                <rect x="268" y="184" width="12" height="4" rx="2" fill="#05070a" />
                <rect x="270" y="200" width="12" height="4" rx="2" fill="#05070a" />
                <rect x="258" y="155" width="42" height="4" rx="2" fill="#fff" opacity="0.14" />
              </g>

              {/* Seating flash under the magwell */}
              <ellipse
                className="seat-flash"
                cx="282"
                cy="156"
                rx="60"
                ry="9"
                fill="#ff6a1a"
                opacity="0"
                filter="url(#ld-glow)"
              />

              {/* Ejected casing */}
              <rect
                className="casing"
                x="286"
                y="112"
                width="7"
                height="17"
                rx="3"
                fill="#c69334"
                opacity="0"
              />
            </svg>
          </div>
        </div>

        {/* ------------------------------ HUD ------------------------------ */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 sm:p-10">
          <div className="hud flex items-start justify-between gap-6">
            <div>
              <div className="font-display text-2xl leading-none tracking-wide text-chalk sm:text-3xl">
                BLACKOUT<span className="text-ember">/</span>PROTOCOL
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.4em] text-ash">
                Armoury Initialisation
              </div>
            </div>
            <div className="hidden text-right font-mono text-[10px] uppercase tracking-[0.3em] text-ash sm:block">
              <div>BUILD 5.0.1</div>
              <div className="text-ember">SECURE CHANNEL</div>
            </div>
          </div>

          <div className="hud">
            <div className="flex items-end justify-between gap-6">
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ash">
                  Status
                </div>
                <span
                  ref={statusRef}
                  className="mt-2 block truncate font-mono text-[11px] uppercase tracking-[0.22em] text-ember sm:text-xs"
                >
                  ESTABLISHING UPLINK · SECTOR 7
                </span>
              </div>

              <div className="shrink-0 text-right">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ash">
                  Ammunition
                </div>
                <div className="flex items-baseline justify-end gap-1">
                  <span
                    ref={counterRef}
                    className="font-display text-5xl leading-none tabular-nums text-chalk sm:text-7xl"
                  >
                    000
                  </span>
                  <span className="font-display text-2xl leading-none text-ash sm:text-3xl">
                    /100
                  </span>
                </div>
              </div>
            </div>

            {/* Progress rail */}
            <div className="mt-5 h-px w-full bg-white/10">
              <div
                className="progress-fill h-px origin-left scale-x-0 bg-linear-to-r from-ember-700 via-ember to-tracer"
                style={{ boxShadow: '0 0 14px rgb(255 106 26 / .9)' }}
              />
            </div>
          </div>
        </div>

        {/* --------------------------- DETONATION --------------------------- */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* Core flash */}
          <div
            className="flash absolute h-[70vmax] w-[70vmax] rounded-full opacity-0"
            style={{
              background:
                'radial-gradient(circle, #fff 0%, #ffd166 14%, #ff6a1a 30%, rgb(224 23 48 / .55) 46%, transparent 68%)',
              filter: 'blur(6px)',
            }}
          />
          {/* Shockwave rings */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="shock absolute rounded-full opacity-0"
              style={{
                width: `${26 + i * 8}vmax`,
                height: `${26 + i * 8}vmax`,
                border: `${3 - i}px solid rgb(255 ${150 - i * 40} ${60 - i * 20} / ${0.85 - i * 0.2})`,
                boxShadow: '0 0 60px rgb(255 106 26 / .55)',
              }}
            />
          ))}
          {/* Debris */}
          {Array.from({ length: 34 }, (_, i) => (
            <div
              key={i}
              className="shard absolute opacity-0"
              style={{
                width: `${3 + (i % 5) * 2}px`,
                height: `${1 + (i % 3)}px`,
                background: i % 3 === 0 ? '#ffd166' : i % 3 === 1 ? '#ff6a1a' : '#8b969e',
                boxShadow: '0 0 8px currentColor',
              }}
            />
          ))}
        </div>
      </div>

      {/* Skip — always reachable, never in the way */}
      <button
        type="button"
        onClick={skip}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-smoke backdrop-blur-md transition-colors hover:border-ember/60 hover:text-chalk"
      >
        Skip intro
        <span className="ml-2 text-ash">[ESC]</span>
      </button>
    </div>
  );
}
