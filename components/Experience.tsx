'use client';

import { ExperienceProvider } from '@/components/providers/ExperienceProvider';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Crosshair } from '@/components/ui/Crosshair';
import { FilmGrain } from '@/components/ui/FilmGrain';
import { Marquee } from '@/components/ui/Marquee';
import { Loader } from '@/components/sections/Loader';
import { Hero } from '@/components/sections/Hero';
import { WeaponVault } from '@/components/sections/WeaponVault';
import { Maps } from '@/components/sections/Maps';
import { Vehicles } from '@/components/sections/Vehicles';
import { SupplyDrop } from '@/components/sections/SupplyDrop';
import { Operators } from '@/components/sections/Operators';
import { Statistics } from '@/components/sections/Statistics';
import { Gallery } from '@/components/sections/Gallery';
import { BattleTimeline } from '@/components/sections/BattleTimeline';

const TICKER = [
  'SEASON 05 — BLACKOUT PROTOCOL',
  '100 OPERATORS · 1 SURVIVOR',
  'THIRTY WEAPONS · TEN CLASSES',
  'SIX THEATRES OF OPERATION',
  'DROP · LOOT · SURVIVE',
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
