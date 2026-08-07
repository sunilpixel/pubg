'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { VolumetricSmoke } from '@/components/ui/VolumetricSmoke';

/** The weapon surface, and the bore within it. Everything the shot throws is
 *  anchored to the bore rather than to the screen — that is what makes it read
 *  as a discharge instead of a detonation. */
const VIEW_W = 620;
const VIEW_H = 260;
const BORE_X = 586;
const BORE_Y = 125;

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
 * cycles, an ammo counter runs to 100, smoke rolls in, and the weapon fires —
 * the muzzle flash takes the exposure with it and the camera runs down the
 * bore into the hero.
 *
 * The finish is deliberately a *discharge*, not a detonation. A flash centred
 * on the screen, concentric rings and debris thrown in every direction are all
 * blast-wave cues; a shot is directional and brutally short — light at the
 * bore, mass driven backwards, everything else leaving downrange.
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
    // Run to the shot instead of cutting to black — a hard cut looks broken.
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
      // Everything the shot throws pivots on the bore, not on its own centre,
      // so the flash grows *out of* the muzzle rather than around it.
      gsap.set(q('.muzzle-core, .muzzle-star, .muzzle-gas, .muzzle-smoke'), {
        opacity: 0,
        scale: 0,
        svgOrigin: `${BORE_X} ${BORE_Y}`,
      });
      gsap.set(q('.spark'), { opacity: 0 });
      // xPercent/yPercent rather than Tailwind's -translate-x-1/2: GSAP owns
      // the transform on these two and would overwrite a class-based one.
      gsap.set(q('.shot-bloom, .shot-ring'), {
        opacity: 0,
        scale: 0,
        xPercent: -50,
        yPercent: -50,
      });
      gsap.set(q('.loader-smoke'), { opacity: 0 });

      const tl = gsap.timeline({ onComplete: finish, defaults: { ease: 'cinema' } });
      timelineRef.current = tl;

      /* ---------------- 1. HUD boots up ---------------- */
      tl.to(q('.hud'), { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0)
        .call(() => setStatus(0), undefined, 0.1)
        /* Bring the battlefield online behind the curtain, here, at the top.
         *
         * Mounting it creates a WebGL context, generates the terrain and the
         * smoke texture, and compiles twenty-odd shader programs — all of it
         * synchronous, all of it on the main thread. It is the only thing in
         * this sequence capable of stalling the page for hundreds of
         * milliseconds, so the only question that matters is where the stall
         * lands.
         *
         * It used to fire half a second before the finale, on the reasoning
         * that a detonation is violent enough to hide a stall inside it. That
         * held while the finale was a 1.5s explosion. It stopped holding the
         * moment the finale became a discharge: the shot is ~120ms, a stall on
         * top of it does not read as violence, it reads as the page hanging —
         * which is exactly how it was reported.
         *
         * Now it goes first. The chunk is already downloading (Hero kicks the
         * import off on mount), nothing has started moving yet, and a busy
         * first second is what a loader is *for*. By the time the receiver
         * flies in, the scene is compiled and idle, and there are four clear
         * seconds between it and the shot. */
        .call(markPreparing, undefined, 0.15);

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
        // Ends at 5.0 so the sight-picture beat below can take `scale` over
        // cleanly — two live tweens on one property fight each frame.
        .to(q('.weapon-stage'), { scale: 1.06, duration: 1.0, ease: 'power2.inOut' }, 4.0)
        .call(() => setStatus(7), undefined, 4.5);

      /* ---------------- 8. The shot ---------------- */
      const shot = 5.3;

      tl
        /* -- will-change, held open only for the window the stage is actually
              moving. This is the `gpu-active` pattern the stylesheet documents,
              applied from the timeline because the window is a slice of an
              animation rather than a component lifetime. It lets the compositor
              scale and fade an existing texture through the exit instead of
              re-rasterising the weapon surface on every frame. Cleared straight
              after — a layer left promoted costs memory for the whole page. */
        .set(
          q('.weapon-stage, .shot-bloom, .shot-ring'),
          { willChange: 'transform, opacity' },
          shot - 0.4,
        )

        /* -- Sight picture. The anticipation for a shot is stillness and a
              trigger break, not a charge-up: a frame that contracts while the
              light drains is how you telegraph a bomb. */
        .to(q('.reticle-dot'), { scale: 1.6, duration: 0.3, ease: 'power2.out' }, shot - 0.5)
        .to(q('.weapon-stage'), { scale: 1.03, duration: 0.3, ease: 'power2.in' }, shot - 0.3)
        .to(
          q('.trigger-blade'),
          { rotate: -13, svgOrigin: '246 157', duration: 0.1, ease: 'power3.in' },
          shot - 0.12,
        )

        /* -- The discharge. These durations are frames, not tenths. A muzzle
              flash is at full brightness in two frames and dark by eight; hold
              it any longer and it stops being a shot and becomes a fireball,
              which is exactly what the old finish was reading as. */
        .to(q('.muzzle-star'), { opacity: 1, scale: 1, duration: 0.03, ease: 'power4.out' }, shot)
        .to(q('.muzzle-core'), { opacity: 1, scale: 1, duration: 0.045, ease: 'power4.out' }, shot)
        .to(q('.muzzle-gas'), { opacity: 1, scale: 1, duration: 0.07, ease: 'power3.out' }, shot)
        .to(
          q('.muzzle-star'),
          { opacity: 0, scale: 0.45, duration: 0.07, ease: 'power2.in' },
          shot + 0.05,
        )
        .to(q('.muzzle-core'), { opacity: 0, duration: 0.12, ease: 'power2.in' }, shot + 0.06)
        .to(
          q('.muzzle-gas'),
          { opacity: 0, scale: 1.55, duration: 0.2, ease: 'power2.out' },
          shot + 0.07,
        )

        // Unburnt powder thrown down the bore. A narrow forward cone — debris
        // leaving in every direction is the single clearest blast tell.
        .to(
          q('.spark'),
          {
            opacity: 1,
            x: () => gsap.utils.random(90, 300),
            y: () => gsap.utils.random(-38, 38),
            scaleX: () => gsap.utils.random(1.4, 3.6),
            duration: 0.42,
            ease: 'power3.out',
            stagger: 0.004,
          },
          shot + 0.01,
        )
        .to(q('.spark'), { opacity: 0, duration: 0.22 }, shot + 0.22)

        // Smoke off the bore, drifting downrange rather than mushrooming.
        .to(
          q('.muzzle-smoke'),
          { opacity: 0.42, scale: 1, duration: 0.45, ease: 'power2.out' },
          shot + 0.05,
        )
        .to(
          q('.muzzle-smoke'),
          { opacity: 0, scale: 2.1, x: 74, y: -30, duration: 1.1, ease: 'power1.out' },
          shot + 0.22,
        )

        // The action cycles: bolt back, casing out, bolt home.
        .to(q('#p-bolt'), { x: -46, duration: 0.06, ease: 'power4.out' }, shot + 0.02)
        .to(q('#p-bolt'), { x: 0, duration: 0.14, ease: 'power3.in' }, shot + 0.1)
        .fromTo(
          q('.casing'),
          { opacity: 1, x: 0, y: 0, rotate: 0 },
          {
            motionPath: {
              path: [
                { x: 46, y: -80 },
                { x: 124, y: -34 },
                { x: 186, y: 170 },
              ],
              curviness: 1.4,
            },
            rotate: 760,
            opacity: 0,
            duration: 1.05,
            ease: 'power1.in',
          },
          shot + 0.06,
        )

        // Recoil. Mass goes backwards along the bore and the muzzle climbs,
        // then the shooter walks it back down onto the target. That two-beat
        // is the whole difference between a weapon firing and a charge going
        // off underneath it.
        //
        // Translate and rotate only — deliberately no `scale`. Scaling this
        // element re-rasterises everything under it (the ~120-node weapon
        // surface plus the flash surface) on every frame of the tween, and
        // that stall lands exactly on the shot. The punch is carried by the
        // camera kick below, which moves the whole root as one layer instead.
        .to(q('.weapon-stage'), { x: -92, rotate: -3, duration: 0.07, ease: 'power4.out' }, shot)
        .to(q('.weapon-stage'), { x: 0, rotate: 0, duration: 0.9, ease: 'recoil' }, shot + 0.08)

        // Frame blowout. The room is dark, so the flash takes the exposure
        // with it — then the iris stops back down.
        .to(q('.shot-bloom'), { opacity: 1, scale: 1, duration: 0.05, ease: 'power4.out' }, shot)
        .to(q('.shot-bloom'), { opacity: 0, duration: 0.45, ease: 'power3.in' }, shot + 0.07)
        // One pressure wave off the bore. Three concentric rings was the other
        // half of the bomb read.
        .to(q('.shot-ring'), { opacity: 0.8, scale: 0.12, duration: 0.02 }, shot)
        .to(q('.shot-ring'), { opacity: 0, scale: 3.6, duration: 0.55, ease: 'power2.out' }, shot + 0.03)
        .to(q('.vignette-charge'), { opacity: 1, duration: 0.55, ease: 'power2.out' }, shot + 0.1)

        // Camera kick — one sharp punch along the bore axis, settled inside a
        // third of a second. The long decaying omnidirectional shake it
        // replaces is what a body feels standing next to an explosion.
        .to(
          rootRef.current,
          {
            keyframes: {
              x: [0, 28, -15, 8, -3, 0],
              y: [0, -13, 7, -3, 1, 0],
              duration: 0.34,
            },
            ease: 'none',
          },
          shot,
        )

        // HUD clears and the camera runs down the bore into the hero. The
        // weapon survives the shot — it was never the thing that went off.
        .to(q('.hud'), { opacity: 0, y: -18, duration: 0.5 }, shot + 0.3)
        .to(
          q('.weapon-stage'),
          { scale: 1.55, opacity: 0, duration: 1.0, ease: 'power2.in' },
          shot + 0.5,
        )
        .to(
          q('.curtain'),
          { clipPath: 'circle(0% at 50% 50%)', duration: 1.15, ease: 'power3.inOut' },
          shot + 0.42,
        )
        .to(rootRef.current, { opacity: 0, duration: 0.35, ease: 'power2.in' }, shot + 1.35)
        .set(q('.weapon-stage, .shot-bloom, .shot-ring'), { willChange: 'auto' }, shot + 1.55);

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

        {/* The iris stopping down after the flash blows the exposure out */}
        <div
          className="vignette-charge absolute inset-0 opacity-0"
          style={{
            background: 'radial-gradient(60% 50% at 50% 50%, transparent, rgb(0 0 0 / 0.9) 90%)',
          }}
        />

        {/* ---------------------------- WEAPON STAGE ---------------------------- */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="weapon-stage relative w-full max-w-[min(1100px,92vw)] gpu">
            <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full" aria-hidden="true">
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

                {/* Muzzle flash: white at the bore, amber through the gas,
                    gone well before the edge. */}
                <radialGradient id="ld-flash" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="28%" stopColor="#ffe9b0" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#ff8a2e" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ff6a1a" stopOpacity="0" />
                </radialGradient>
                {/* Burning propellant leaving the bore — graded along the
                    cone's axis so it thins out downrange. */}
                <linearGradient id="ld-gas" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fff4d2" stopOpacity="0.95" />
                  <stop offset="36%" stopColor="#ffb347" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#ff6a1a" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="ld-smoke" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="#9aa4ac" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#6f7981" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#5c666e" stopOpacity="0" />
                </radialGradient>
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
                <path
                  className="trigger-blade"
                  d="M246 157 L250 172"
                  stroke="#9aa6af"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
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

            {/* ------------------------ MUZZLE FLASH ------------------------
                A second surface over the first, sharing its viewBox and its
                box exactly — so this draws in the weapon's own coordinate
                space, scales with it, and rides the recoil, while being free
                to spill past the frame. It has to be its own <svg>: the bore
                sits at x=586 of a 620-wide viewBox, so inside the weapon's
                surface the flash would be clipped 34 units out, and opening
                that surface up instead would expose the parts flying in from
                off-frame during the assembly.

                Shapes are authored at absolute viewBox coordinates rather than
                inside a translated <g>, so `svgOrigin: '586 125'` in the
                timeline is unambiguously the bore.

                Everything starts at opacity 0 in the markup — the browser
                paints this HTML before React hydrates, which is well before
                GSAP's opening set() calls can run. */}
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={{ overflow: 'visible' }}
              aria-hidden="true"
            >
              <ellipse
                className="muzzle-smoke"
                cx={BORE_X + 30}
                cy={BORE_Y - 4}
                rx="54"
                ry="32"
                fill="url(#ld-smoke)"
                opacity="0"
              />
              <ellipse
                className="muzzle-core"
                cx={BORE_X + 26}
                cy={BORE_Y}
                rx="64"
                ry="31"
                fill="url(#ld-flash)"
                opacity="0"
              />
              <path
                className="muzzle-gas"
                d="M586 114 L682 91 L764 125 L682 159 L586 136 Z"
                fill="url(#ld-gas)"
                opacity="0"
              />
              {/* The four-point bloom. The forward arm is the longest one —
                  the gas is going somewhere, which is the entire point. */}
              <path
                className="muzzle-star"
                d="M586 73 L597 113 L664 125 L597 137 L586 177 L575 137 L542 125 L575 113 Z"
                fill="#fff7e2"
                opacity="0"
              />
              {Array.from({ length: 16 }, (_, i) => (
                <rect
                  key={i}
                  className="spark"
                  x={BORE_X}
                  y={BORE_Y - 1 + ((i % 5) - 2) * 0.6}
                  width={2.5 + (i % 4)}
                  height="1.8"
                  rx="0.9"
                  fill={i % 3 === 0 ? '#fff1c2' : i % 3 === 1 ? '#ffb347' : '#ff6a1a'}
                  opacity="0"
                />
              ))}
            </svg>

          </div>
        </div>

        {/* --------------------- BLAST LIGHT ---------------------
            A copy of the weapon stage's box, holding the light the shot
            throws. It is a sibling of the stage rather than a child of it,
            and that placement is the whole point: the stage transforms
            through the recoil and the exit, and a light source over a
            thousand pixels across sitting inside a transforming subtree
            forces the browser to re-rasterise that entire subtree — the
            weapon surface, the flash surface and the light — on every frame
            of the shot. Which is precisely when it must not.

            Out here it is composited on its own. The cost of the split is
            that the light no longer tracks the 92px recoil, which at this
            size is not something you can see.

            `aspectRatio` reproduces the height the weapon surface gives the
            real stage, so the bore offset below lands on the same point. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6"
        >
          <div
            className="relative w-full max-w-[min(1100px,92vw)]"
            style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
          >
            <div
              className="absolute"
              style={{
                left: `${(BORE_X / VIEW_W) * 100}%`,
                top: `${(BORE_Y / VIEW_H) * 100}%`,
              }}
            >
              {/* No `filter: blur()` here. The gradient's own falloff is the
                  softness — a blur on top of it is a full offscreen pass over
                  ~1.2 million pixels for a difference nobody can point to.
                  Same reasoning the map dioramas use for their clouds. */}
              <div
                className="shot-bloom absolute left-0 top-0 h-[58vmax] w-[58vmax] rounded-full opacity-0"
                style={{
                  background:
                    'radial-gradient(circle, #fff 0%, #fff2cc 7%, #ffc46a 16%, #ff8a2e 28%, rgb(255 106 26 / .3) 44%, transparent 68%)',
                }}
              />
              {/* Border only. A 44px box-shadow on an element scaling 30× is
                  repainted at every intermediate size. */}
              <div
                className="shot-ring absolute left-0 top-0 h-[18vmax] w-[18vmax] rounded-full opacity-0"
                style={{ border: '2px solid rgb(255 200 120 / .75)' }}
              />
            </div>
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
