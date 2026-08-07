"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useGsapContext } from "@/hooks/useGsapContext";
import { useAmbientTimeline } from "@/hooks/useAmbientTimeline";
import { useRevealOnce } from "@/hooks/useRevealOnce";
import {
  usePrefersReducedMotion,
  useHasFinePointer,
} from "@/hooks/useMediaQuery";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { MapScene } from "@/components/art/MapScene";
import { MAPS } from "@/lib/data/world";
import type { BattleMap } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The map gallery.
 *
 * Each card is a six-plane diorama. Planes carry a `data-depth` attribute and
 * the card's pointer handler translates each by `depth × offset`, which is what
 * produces real separation between clouds, ridges, fog and treeline rather
 * than a single flat image sliding around.
 */
export function Maps() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  // Card entrance runs on IntersectionObserver, not ScrollTrigger — see
  // useRevealOnce for why. The previous ScrollTrigger version could leave the
  // cards permanently at opacity 0 when its start position was mis-measured
  // because of the pinned sections above this one.
  useRevealOnce(sectionRef, ".map-card", {
    y: 60,
    duration: 0.8,
    stagger: 0.07,
  });

  useGsapContext(
    () => {
      if (reduced) return;

      // Drift the whole grid slightly against the scroll for depth.
      gsap.to(".map-grid", {
        yPercent: -5,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
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
      id="maps"
      className="relative overflow-hidden bg-abyss py-28 sm:py-36"
      aria-label="Battle maps"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px hairline"
      />

      <div className="relative mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          index="02"
          eyebrow="Theatres of Operation"
          title="THE"
          accent="ISLANDS"
          description="Six contested regions, each with its own weather system, loot economy and rotation logic. Hover any theatre to pull its intel — hot drops, climate, and the terrain that will decide your match."
        />

        <div className="map-grid mt-16 grid gap-5 lg:grid-cols-2">
          {MAPS.map((map, index) => (
            <MapCard
              key={map.id}
              map={map}
              index={index}
              featured={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MapCard({
  map,
  index,
  featured,
}: {
  map: BattleMap;
  index: number;
  featured?: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();

  /* ---- Ambient motion: clouds drift, fog rolls, trees sway ----
     All of it lives on one timeline that is paused while the card is off
     screen. Six cards × (26 swaying trees + clouds + fog) is several hundred
     transform writes per frame otherwise, for maps nobody is looking at. */
  useAmbientTimeline(
    cardRef,
    (tl) => {
      // Clouds — two speeds, so the layers separate as they drift.
      tl.to(
        '[data-cloud="slow"]',
        { x: 180, duration: 46, repeat: -1, yoyo: true, ease: "sine.inOut" },
        -index * 4,
      )
        .to(
          '[data-cloud="fast"]',
          { x: -240, duration: 32, repeat: -1, yoyo: true, ease: "sine.inOut" },
          -index * 3,
        )
        // Fog bands slide laterally and breathe.
        .to(
          "[data-fog]",
          {
            x: 130,
            opacity: 0.45,
            duration: 22,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          },
          0,
        )
        .to(
          '[data-fog="slow"]',
          { x: -90, duration: 30, repeat: -1, yoyo: true, ease: "sine.inOut" },
          0,
        )
        // Trees sway on staggered phases — a forest, not a metronome.
        .to(
          ".map-tree",
          {
            rotation: 1.6,
            duration: 2.6,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: { each: 0.09, from: "random" },
            transformOrigin: "50% 100%",
          },
          0,
        );
    },
    [index],
  );

  /* ---- Pointer parallax across the depth planes ---- */
  useEffect(() => {
    const card = cardRef.current;
    const scene = sceneRef.current;
    if (!card || !scene || reduced || !fine) return;

    const planes = Array.from(
      scene.querySelectorAll<SVGGElement>("[data-depth]"),
    );
    const setters = planes.map((plane) => ({
      depth: parseFloat(plane.dataset.depth ?? "0"),
      x: gsap.quickTo(plane, "x", { duration: 0.8, ease: "power3.out" }),
      y: gsap.quickTo(plane, "y", { duration: 0.8, ease: "power3.out" }),
    }));

    // Measured once on enter, not on every move. `getBoundingClientRect()`
    // inside a pointermove handler forces a synchronous layout on each event —
    // the classic layout-thrash pattern. The card cannot move or resize while
    // the pointer is inside it, so one measurement is all that is needed.
    let rect = card.getBoundingClientRect();

    const onEnter = () => {
      rect = card.getBoundingClientRect();
    };

    const onMove = (event: PointerEvent) => {
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;

      for (const setter of setters) {
        // Nearer planes travel further — that difference *is* the depth cue.
        setter.x(-nx * 62 * setter.depth);
        setter.y(-ny * 26 * setter.depth);
      }
    };

    const onLeave = () => {
      for (const setter of setters) {
        setter.x(0);
        setter.y(0);
      }
    };

    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
    return () => {
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, fine]);

  return (
    <article
      ref={cardRef}
      data-scramble-host
      data-cursor="view"
      data-cursor-label="Recon"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
      className={cn(
        // `metal-edge` dropped: it paints a conic gradient and knocks the
        // middle out with `mask-composite: xor`, two extra compositing passes
        // per card. A hairline border reads the same at this scale.
        // `defer-paint` deliberately removed. `content-visibility: auto` skips
        // rendering until the element nears the viewport, which means the
        // browser has to lay out and paint the whole diorama in one go the
        // moment it arrives — that hitch is exactly the "cards take a while to
        // load" symptom. It was worth it when each card was ~26 trees, seven
        // blurred ellipses and ten parallax planes; now that a card is 14
        // single-path trees and no filters, painting it up front is cheaper
        // than deferring it.
        "map-card group relative isolate overflow-hidden rounded-3xl gpu",
        "border border-white/[0.07] bg-carbon shadow-[0_30px_70px_-30px_rgb(0_0_0/.95)]",
        featured && "lg:col-span-2",
      )}
    >
      {/* Diorama */}
      {/* `gpu` promotes the diorama to its own layer so the hover zoom is a
          texture transform. Without it the browser re-rasterises the entire
          SVG — ridges, fog, fourteen trees — on every frame of a 900ms scale.
          The zoom is also gentler now (1.04 → 1.025), which keeps the upscaled
          raster sharp enough not to notice. */}
      <div
        ref={sceneRef}
        className={cn(
          "gpu relative overflow-hidden transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.025]",
          featured ? "aspect-[21/9]" : "aspect-[16/10]",
        )}
      >
        <MapScene map={map} className="absolute inset-0 h-full w-full" />

        {/* Grid overlay — reads as a tactical map plate */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25 transition-opacity duration-500 group-hover:opacity-45"
          style={{
            backgroundImage:
              "linear-gradient(rgb(255 106 26 / .18) 1px, transparent 1px), linear-gradient(90deg, rgb(255 106 26 / .18) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage:
              "radial-gradient(75% 65% at 50% 60%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(75% 65% at 50% 60%, black, transparent)",
          }}
        />

        {/* Bottom scrim so the type always has contrast */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, rgb(3 4 5 / .96) 4%, rgb(3 4 5 / .35) 40%, transparent 72%)",
          }}
        />
      </div>

      {/* ------------------------------ Content ------------------------------ */}
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember">
              {String(index + 1).padStart(2, "0")} · {map.size}
            </span>
            <h3 className="mt-2 font-display text-[clamp(2rem,4.5vw,3.75rem)] leading-none text-chalk">
              {map.name}
            </h3>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ash">
              {map.region}
            </p>
          </div>

          <div className="hidden shrink-0 text-right sm:block">
            <span className="font-display text-4xl leading-none text-chalk">
              {map.players}
            </span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.24em] text-ash">
              Operators
            </span>
          </div>
        </div>

        {/* Hover-revealed intel — grid-rows trick animates height without JS */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-600 ease-[cubic-bezier(.16,1,.3,1)]",
            open
              ? "mt-5 grid-rows-[1fr] opacity-100"
              : "mt-0 grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <p className="max-w-xl text-[13px] leading-relaxed text-smoke">
              {map.description}
            </p>

            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.26em] text-ash">
                  Climate
                </dt>
                <dd className="mt-1 font-mono text-[11px] text-bone">
                  <ScrambleText
                    text={map.climate}
                    onScroll={false}
                    hover
                    speed={0.02}
                  />
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.26em] text-ash">
                  Biome
                </dt>
                <dd className="mt-1 font-mono text-[11px] text-bone">
                  {map.biome}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-ash">
                Hot Drops
              </span>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {map.hotDrops.map((drop, i) => (
                  <li
                    key={drop}
                    className="rounded-full border border-ember/25 bg-ember/8 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ember-300"
                    style={{
                      transitionDelay: `${i * 70}ms`,
                      transform: open ? "translateY(0)" : "translateY(10px)",
                      opacity: open ? 1 : 0,
                      transition:
                        "transform .5s cubic-bezier(.16,1,.3,1), opacity .5s",
                    }}
                  >
                    {drop}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Corner brackets */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-4 top-4 h-6 w-6 border-l border-t border-ember/50 opacity-0 transition-all duration-500 group-hover:left-5 group-hover:top-5 group-hover:opacity-100"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 border-b border-r border-ember/50 opacity-0 transition-all duration-500 group-hover:bottom-5 group-hover:right-5 group-hover:opacity-100"
      />
    </article>
  );
}
