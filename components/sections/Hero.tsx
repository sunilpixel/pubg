"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGsapContext } from "@/hooks/useGsapContext";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { detectDeviceTier, type DeviceTier } from "@/lib/deviceTier";
import { useExperience } from "@/components/providers/ExperienceProvider";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ParticleField } from "@/components/ui/ParticleField";
import { ScrambleText } from "@/components/ui/ScrambleText";

/**
 * WebGL is the single heaviest thing on the page, so it is code-split and only
 * requested on the client. The section is fully legible without it — the 3D is
 * an enhancement layered over a designed CSS backdrop, not a dependency.
 */
const Battlefield = dynamic(() => import("@/components/three/Battlefield"), {
  ssr: false,
  loading: () => null,
});

/** Module-level constant so the particle effect never re-runs on re-render. */
const HERO_PARTICLES = [
  { mode: "ash" as const, count: 44 },
  { mode: "ember" as const, count: 20 },
  { mode: "shell" as const, count: 8 },
];

const HUD_READOUT = [
  { label: "Sector", value: "ERANGEL-07" },
  { label: "Operators", value: "100" },
  { label: "Zone", value: "CLOSING" },
  { label: "Drop", value: "T-00:38" },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const progressRef = useRef(0);

  const { ready, preparing } = useExperience();
  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  // Gates the WebGL render loop. Without this the battlefield keeps drawing at
  // 60fps behind every section below it for the whole page.
  const [inView, setInView] = useState(true);

  // Probed after mount so the server render is never branched on it.
  const [tier, setTier] = useState<DeviceTier>("high");
  useEffect(() => setTier(detectDeviceTier()), []);

  // Mounts on `preparing` — during the loader's detonation, behind the curtain
  // — rather than waiting for `ready`. By the time the iris opens the context
  // exists and the shaders are compiled, so the reveal frame has no work to do.
  const show3D = (ready || preparing) && !reduced && tier !== "off";
  const quality: "high" | "low" = isMobile || tier === "low" ? "low" : "high";

  // NOTE: there is deliberately no pointer-parallax on the stage. It used to
  // write a transform to this element on every mouse move — but the stage
  // contains the WebGL canvas, the particle canvas and every overlay, so each
  // move forced the compositor to re-transform that entire subtree. The 3D
  // camera rig already applies mouse parallax inside the scene, which is both
  // free (it is just a camera offset) and more convincing, since near and far
  // geometry separate properly instead of sliding as one flat plane.

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  /* ------------- Warm the WebGL chunk while the loader plays -------------
   * <Battlefield> is `ssr: false` and only mounts once `ready` flips, so
   * three.js — around 130 kB — did not begin downloading until the cold open
   * had already finished. The result was the hero showing its CSS backdrop and
   * then popping into 3D a moment later.
   *
   * The loader runs for several seconds with the network completely idle, so
   * the import is kicked off there instead. `requestIdleCallback` is the point:
   * it only fires when the main thread has spare time inside a frame, so
   * parsing three.js slots into a gap rather than stuttering the assembly
   * animation. The long timeout keeps it from forcing itself through during the
   * explosion, which is the busiest stretch of the timeline.
   *
   * Skipped entirely when the scene will not be shown — a machine that fails
   * the tier check should never pay for the download at all.
   */
  useEffect(() => {
    if (ready || reduced || tier === "off") return;

    let cancelled = false;
    const warm = () => {
      if (!cancelled) void import("@/components/three/Battlefield");
    };

    const win = window as Window & {
      requestIdleCallback?: typeof requestIdleCallback;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (win.requestIdleCallback) {
      const handle = win.requestIdleCallback(warm, { timeout: 4000 });
      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(handle as unknown as number);
      };
    }

    const timer = window.setTimeout(warm, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ready, reduced, tier]);

  /* ---------------- Entrance ----------------------------------------------
   * Built on mount and held paused; played when the loader hands off.
   *
   * This used to be created only once `ready` flipped, which produced a visible
   * flash: the loader's iris wipe reveals the hero *while it is still playing*,
   * but `markReady()` only fires on that timeline's `onComplete`. So for the
   * whole length of the wipe the hero sat underneath fully composed, and only
   * afterwards did `gsap.from()` snap everything back to its start values and
   * animate — the content appeared, jumped backwards, then animated in.
   *
   * The hidden state is applied with explicit `gsap.set()` calls rather than
   * relying on `from()`. Inside a paused timeline, and with position offsets
   * like "-=0.85", `from()` does not reliably render its start values on
   * creation — which is why an earlier attempt at this fix still flashed.
   * `set()` applies immediately and unconditionally, so the hero is guaranteed
   * to be in its hidden state before the first paint.
   *
   * A layout effect is required here: a plain `useEffect` runs after paint,
   * which is precisely the frame the flash was escaping through.
   */
  const entranceRef = useRef<gsap.core.Timeline | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (reduced) return;

    const ctx = gsap.context(() => {
      // Hidden state — applied now, before anything is painted.
      gsap.set(".hero-line", {
        yPercent: 118,
        rotateX: 48,
        opacity: 0,
        transformOrigin: "50% 100% -80px",
      });
      gsap.set(".hero-rule", { scaleX: 0, transformOrigin: "left center" });
      gsap.set(".hero-copy", { y: 42, opacity: 0 });
      gsap.set(".hero-cta", { y: 34, opacity: 0 });
      gsap.set(".hero-hud-item", { y: 24, opacity: 0 });
      gsap.set(".hero-scroll", { opacity: 0, y: -18 });

      const tl = gsap.timeline({ paused: true, defaults: { ease: "cinema" } });
      entranceRef.current = tl;

      tl.to(".hero-line", {
        yPercent: 0,
        rotateX: 0,
        opacity: 1,
        duration: 1.35,
        stagger: 0.11,
      })
        // opacity restored explicitly: the pre-hydration CSS hides this by
        // opacity, but the animation itself only scales it.
        .to(".hero-rule", { scaleX: 1, opacity: 1, duration: 1.1 }, "-=0.85")
        .to(".hero-copy", { y: 0, opacity: 1, duration: 1 }, "-=0.9")
        .to(
          ".hero-cta",
          { y: 0, opacity: 1, duration: 0.85, stagger: 0.1 },
          "-=0.75",
        )
        .to(
          ".hero-hud-item",
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.07 },
          "-=0.7",
        )
        .to(".hero-scroll", { opacity: 1, y: 0, duration: 0.8 }, "-=0.5");
    }, sectionRef);

    return () => {
      ctx.revert();
      entranceRef.current = null;
    };
  }, [reduced]);

  // Release it the moment the loader is done.
  useEffect(() => {
    if (ready && !reduced) entranceRef.current?.play();
  }, [ready, reduced]);

  /* ---------------- Pinned cinematic scroll ------------------------------- */
  useGsapContext(
    () => {
      if (reduced) return;

      // Pin the hero and hand scroll progress to the 3D camera rig.
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=260%",
        pin: stageRef.current,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        // Pinning inserts spacer height, which moves every trigger below it.
        // Without an explicit order GSAP may measure those triggers before this
        // pin has added its spacing, so their start/end land in the wrong place
        // and reveal animations never fire — leaving cards stuck at opacity 0
        // until a later refresh corrects them. Highest priority = refreshed
        // first, and this is the first pin on the page.
        refreshPriority: 3,
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      });

      // The title and HUD recede as the camera flies in.
      // No `filter: blur()` here: animating a blur means re-rasterising the
      // whole content layer on every scrubbed frame, which is one of the most
      // reliable ways to drop frames during a scroll. A slight scale-down plus
      // the opacity fade reads as the same "pulling away" move and stays on the
      // compositor.
      gsap.to(".hero-content", {
        yPercent: -22,
        scale: 0.96,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=120%",
          scrub: 1,
        },
      });

      // Letterbox bars close in, turning the hero into a widescreen frame.
      gsap.fromTo(
        ".letterbox",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=80%",
            scrub: 1,
          },
        },
      );

      // Final beat: the whole scene dims into the section below.
      gsap.to(".hero-dim", {
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top+=180% top",
          end: "+=80%",
          scrub: true,
        },
      });
    },
    sectionRef,
    [reduced],
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      // Height comes from the pin's spacer alone. Declaring `h-[360vh]` here as
      // well meant two independent sources had to agree — and had to be
      // re-derived by hand every time the pin length changed.
      className="relative w-full"
      aria-label="Blackout Protocol — battlefield reveal"
    >
      <div
        ref={stageRef}
        className="relative min-h-screen w-full overflow-hidden"
      >
        {/* ------------------------- Backdrop layers ------------------------ */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 80%, #14100c 0%, #080a0c 45%, #030405 100%)",
          }}
        />

        {/* 3D battlefield — mounted only after the loader clears so the intro
            never competes with shader compilation for the main thread. */}
        {show3D ? (
          <div className="absolute inset-0">
            <Battlefield
              progress={progressRef}
              quality={quality}
              active={inView}
            />
          </div>
        ) : (
          /* Fallback horizon for machines where WebGL would not hold a frame
             rate (software rasteriser, very low core/memory count) and for
             reduced-motion. Pure CSS: three clip-path ridges over the existing
             gradient, no per-frame cost at all. */
          <div aria-hidden className="absolute inset-0">
            <div
              className="absolute inset-x-0 bottom-0 h-[52%]"
              style={{
                background: "linear-gradient(180deg, #101820 0%, #080b0f 100%)",
                clipPath:
                  "polygon(0 34%, 12% 22%, 24% 31%, 38% 17%, 52% 28%, 66% 14%, 78% 26%, 90% 19%, 100% 29%, 100% 100%, 0 100%)",
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-[38%]"
              style={{
                background: "linear-gradient(180deg, #0b1014 0%, #05070a 100%)",
                clipPath:
                  "polygon(0 42%, 15% 26%, 30% 38%, 46% 22%, 60% 35%, 74% 20%, 88% 33%, 100% 25%, 100% 100%, 0 100%)",
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-[24%]"
              style={{
                background: "linear-gradient(180deg, #05070a, #020304)",
              }}
            />
          </div>
        )}

        {/* Volumetric haze.
            The 3D scene already renders real smoke columns and exponential fog,
            so the CSS plumes here were duplicating that look while forcing the
            compositor to blur three large layers on top of the WebGL surface
            every frame. A single static gradient wash keeps the warm haze in
            front of the horizon for no per-frame cost. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background:
              "radial-gradient(70% 45% at 30% 62%, rgb(255 140 60 / .12), transparent 70%), radial-gradient(55% 40% at 78% 48%, rgb(190 120 80 / .09), transparent 72%)",
          }}
        />

        {/* Atmospheric particles.
            Only drawn when the 3D scene is NOT running. With WebGL active the
            scene already renders drifting dust and embers via Sparkles — on the
            GPU, inside the same pass — so a second full-viewport 2D canvas was
            clearing and compositing an extra layer over the WebGL surface every
            frame to draw the same thing twice.
            When the 3D is skipped this becomes the hero's only motion, so it
            stays, and gains the casings the scene would have provided. */}
        {show3D ? null : (
          <div className="pointer-events-none absolute inset-0 z-[3]">
            <ParticleField
              layers={HERO_PARTICLES}
              parallax={34}
              opacity={0.75}
            />
          </div>
        )}

        {/* Horizon glow */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-1/2"
          style={{
            background:
              "linear-gradient(0deg, rgb(3 4 5 / .96) 0%, rgb(3 4 5 / .5) 40%, transparent 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-[3] h-40 -translate-y-1/2 opacity-45 blur-3xl"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgb(255 106 26 / .5) 30%, rgb(224 23 48 / .35) 62%, transparent)",
          }}
        />

        {/* Letterbox */}
        <div className="letterbox pointer-events-none absolute inset-x-0 top-0 z-[40] h-[9vh] origin-top bg-void" />
        <div className="letterbox pointer-events-none absolute inset-x-0 bottom-0 z-[40] h-[9vh] origin-bottom bg-void" />

        {/* ---------------------------- Content ---------------------------- */}
        <div className="hero-content relative z-30 flex h-full flex-col justify-between px-6 pb-10 pt-28 sm:px-10 lg:px-16">
          {/* Top HUD strip */}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="hero-hud-item glass metal-edge rounded-full px-5 py-2.5">
              <span className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-smoke">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blood opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blood" />
                </span>
                Live Operation
              </span>
            </div>

            <dl className="hidden gap-8 md:flex mt-3">
              {HUD_READOUT.map((item) => (
                <div key={item.label} className="hero-hud-item text-right">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.34em] text-ash">
                    {item.label}
                  </dt>
                  <dd className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-bone">
                    <ScrambleText
                      text={item.value}
                      onScroll={false}
                      speed={0.05}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Masthead */}
          <div className="max-w-5xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="hero-rule block h-px w-16 bg-linear-to-r from-ember to-transparent" />
              <ScrambleText
                text="SEASON 05 · GLOBAL REVEAL"
                onScroll={false}
                delay={0.6}
                className="font-mono text-[10px] uppercase tracking-[0.44em] text-ember"
              />
            </div>

            <h1
              ref={titleRef}
              className="font-display text-[clamp(3.6rem,9.5vw,13rem)] leading-[0.82]"
              style={{ perspective: "900px" }}
            >
              <span className="block overflow-hidden">
                <span className="hero-line text-etched block">BLACKOUT</span>
              </span>
              <span className="block overflow-hidden">
                <span
                  className="hero-line text-outline block"
                  data-cursor="view"
                >
                  PROTOCOL
                </span>
              </span>
            </h1>

            <p className="hero-copy mt-6 max-w-xl text-pretty text-base leading-relaxed text-smoke sm:text-lg">
              One hundred operators. Eight square kilometres of contested
              ground. A shrinking circle that does not negotiate. Drop in, kit
              up, and be the last thing standing when the dust settles.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div className="hero-cta">
                <MagneticButton href="#vault" variant="primary">
                  Enter the Armoury
                </MagneticButton>
              </div>
              <div className="hero-cta">
                <MagneticButton
                  href="#timeline"
                  variant="outline"
                  strength={0.28}
                >
                  Watch the Drop
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="hero-scroll flex items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-ash">
                Scroll to deploy
              </span>
              <span className="relative block h-12 w-px overflow-hidden bg-white/12">
                <span
                  className="absolute inset-x-0 top-0 h-4 bg-ember"
                  style={{
                    animation: "scan 2.4s cubic-bezier(.7,0,.2,1) infinite",
                  }}
                />
              </span>
            </div>

            <div className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-ash sm:block">
              <span className="text-ember">4K</span> · 120 FPS · HDR
            </div>
          </div>
        </div>

        {/* Dim-out into the next scene */}
        <div className="hero-dim pointer-events-none absolute inset-0 z-[45] bg-void opacity-0" />
      </div>
    </section>
  );
}
