"use client";

import dynamic from "next/dynamic";

import { ExperienceProvider } from "@/components/providers/ExperienceProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Navbar } from "@/components/layout/Navbar";
import { Crosshair } from "@/components/ui/Crosshair";
import { FilmGrain } from "@/components/ui/FilmGrain";
import { Marquee } from "@/components/ui/Marquee";
import { Loader } from "@/components/sections/Loader";
import { Hero } from "@/components/sections/Hero";

/* ---------------------------------------------------------------------------
 * Below-the-fold sections are code-split.
 *
 * Statically importing all ten put every section — plus GSAP Flip, the SVG art
 * for thirty weapons, six map dioramas, eight gallery scenes and the whole
 * timeline — into the single chunk the browser must download, parse and
 * execute before the page becomes interactive. None of it is needed to render
 * the hero.
 *
 * `ssr` is deliberately left ON (the default). That keeps every section in the
 * server-rendered HTML, so the content is still crawlable, there is no layout
 * shift, and scroll height is correct from the first paint — Lenis and
 * ScrollTrigger both depend on that. What changes is purely *when the client
 * JavaScript is parsed*: each section becomes its own chunk that loads
 * alongside hydration instead of blocking it.
 *
 * The 3D battlefield is the one exception and is imported with `ssr: false`
 * inside Hero, because WebGL cannot render on the server at all.
 * ------------------------------------------------------------------------- */

const WeaponVault = dynamic(() =>
  import("@/components/sections/WeaponVault").then((m) => m.WeaponVault),
);
const Maps = dynamic(() =>
  import("@/components/sections/Maps").then((m) => m.Maps),
);
const Vehicles = dynamic(() =>
  import("@/components/sections/Vehicles").then((m) => m.Vehicles),
);
const SupplyDrop = dynamic(() =>
  import("@/components/sections/SupplyDrop").then((m) => m.SupplyDrop),
);
const Operators = dynamic(() =>
  import("@/components/sections/Operators").then((m) => m.Operators),
);
const Statistics = dynamic(() =>
  import("@/components/sections/Statistics").then((m) => m.Statistics),
);
const Gallery = dynamic(() =>
  import("@/components/sections/Gallery").then((m) => m.Gallery),
);
const BattleTimeline = dynamic(() =>
  import("@/components/sections/BattleTimeline").then((m) => m.BattleTimeline),
);
const Footer = dynamic(() =>
  import("@/components/layout/Footer").then((m) => m.Footer),
);

const TICKER = [
  "SEASON 05 — BLACKOUT PROTOCOL",
  "100 OPERATORS · 1 SURVIVOR",
  "THIRTY WEAPONS · TEN CLASSES",
  "SIX THEATRES OF OPERATION",
  "DROP · LOOT · SURVIVE",
];

/**
 * The whole experience.
 *
 * Order matters: providers wrap everything so the loader can gate scrolling,
 * the crosshair and grain sit above all content, and sections are composed in
 * narrative order — cold open, battlefield, armoury, world, roster, intel,
 * and the anatomy of a match.
 */
export function Experience() {
  return (
    <ExperienceProvider>
      <SmoothScroll>
        <Crosshair />
        <FilmGrain />
        <Loader />
        <Navbar />

        <main id="main">
          <Hero />

          <div className="relative border-y border-white/[0.07] bg-abyss">
            <Marquee
              items={TICKER}
              className="font-mono text-[11px] uppercase tracking-[0.34em] text-smoke"
              duration={34}
            />
          </div>

          <WeaponVault />
          <Maps />
          <Vehicles />
          <SupplyDrop />
          <Operators />
          <Statistics />
          <Gallery />
          <BattleTimeline />
        </main>

        <Footer />
      </SmoothScroll>
    </ExperienceProvider>
  );
}
