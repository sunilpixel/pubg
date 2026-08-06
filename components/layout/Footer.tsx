'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { ScrambleText } from '@/components/ui/ScrambleText';
import { ParticleField } from '@/components/ui/ParticleField';
import { VolumetricSmoke } from '@/components/ui/VolumetricSmoke';

const COLUMNS = [
  {
    title: 'Game',
    links: ['Armoury', 'Maps', 'Vehicles', 'Operators', 'Patch Notes', 'Ranked Seasons'],
  },
  {
    title: 'Community',
    links: ['Esports', 'Creators', 'Tournaments', 'Discord', 'Report a Player', 'Careers'],
  },
  {
    title: 'Support',
    links: ['Help Centre', 'Server Status', 'Account Recovery', 'Refunds', 'Accessibility', 'Contact'],
  },
];

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { audioEnabled, toggleAudio } = useExperience();

  useGsapContext(
    () => {
      if (reduced) return;

      // The wordmark rises out of the fold as the footer enters.
      gsap.from('.footer-mark', {
        yPercent: 42,
        opacity: 0,
        duration: 1.4,
        ease: 'cinema',
        scrollTrigger: { trigger: '.footer-mark', start: 'top 96%', once: true },
      });

      gsap.from('.footer-col', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'cinema',
        stagger: 0.08,
        scrollTrigger: { trigger: '.footer-cols', start: 'top 90%', once: true },
      });
    },
    footerRef,
    [reduced],
  );

  return (
    <footer
      ref={footerRef}
      className="relative isolate overflow-hidden bg-void pt-28"
      aria-label="Site footer"
    >
      <VolumetricSmoke plumes={4} tone="warm" intensity={0.35} seed={57} />
      <div className="pointer-events-none absolute inset-0">
        <ParticleField mode="ember" count={26} parallax={30} opacity={0.55} />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[50vh]"
        style={{
          background: 'radial-gradient(60% 80% at 50% 100%, rgb(255 106 26 / .16), transparent 70%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-12">
        {/* ------------------------------- CTA ------------------------------- */}
        <div className="glass-heavy metal-edge relative overflow-hidden rounded-[2rem] p-8 sm:p-14">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(closest-side, #ff6a1a, transparent)' }}
          />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end">
            <div>
              <ScrambleText
                text="DEPLOYMENT WINDOW OPEN"
                className="font-mono text-[10px] uppercase tracking-[0.42em] text-ember"
              />
              <h2 className="mt-6 font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.84]">
                <span className="text-etched block">READY TO</span>
                <span className="text-outline block">DROP IN?</span>
              </h2>
              <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-smoke">
                Pre-register now for founder&apos;s access, the Ashfall weapon finish, and a
                guaranteed slot in the first ranked season.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => event.preventDefault()}
              >
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  type="email"
                  required
                  placeholder="operator@callsign.net"
                  className="w-full rounded-full border border-white/12 bg-black/40 px-6 py-4 font-mono text-xs tracking-wider text-chalk outline-none transition-colors placeholder:text-ash focus:border-ember/70"
                />
                <MagneticButton type="submit" variant="primary" className="shrink-0">
                  Enlist
                </MagneticButton>
              </form>

              <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-ash">
                This is a design showcase — nothing is transmitted anywhere.
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------ Columns ---------------------------- */}
        <div className="footer-cols mt-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div className="footer-col">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-ember/40">
                <span className="h-1.5 w-1.5 rounded-full bg-ember" />
              </span>
              <span className="font-display text-2xl leading-none tracking-wide text-chalk">
                BLACKOUT<span className="text-ember">/</span>PROTOCOL
              </span>
            </div>
            <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-smoke">
              A fictional AAA battle-royale reveal, built as an interactive showcase. Every weapon,
              map, vehicle and operator here is invented — and every pixel is drawn in code.
            </p>

            <button
              type="button"
              onClick={toggleAudio}
              data-cursor="target"
              aria-pressed={audioEnabled}
              className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-smoke transition-colors hover:border-ember/60 hover:text-chalk"
            >
              <span className="flex h-3 items-end gap-0.5">
                {[0.4, 1, 0.6, 0.85].map((scale, i) => (
                  <span
                    key={i}
                    className="w-0.5 bg-ember transition-transform duration-300"
                    style={{
                      height: '100%',
                      transform: `scaleY(${audioEnabled ? scale : 0.15})`,
                      transformOrigin: 'bottom',
                      transitionDelay: `${i * 60}ms`,
                    }}
                  />
                ))}
              </span>
              Sound {audioEnabled ? 'On' : 'Off'}
            </button>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title} className="footer-col">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember">
                {column.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#hero"
                      data-cursor="target"
                      className="group inline-flex items-center gap-2 text-[13px] text-smoke transition-colors hover:text-chalk"
                    >
                      <span className="h-px w-0 bg-ember transition-all duration-400 ease-[cubic-bezier(.16,1,.3,1)] group-hover:w-4" />
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ------------------------------ Legal ------------------------------ */}
        <div className="mt-16 flex flex-col gap-4 border-t border-white/[0.07] py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash">
            © 2026 Blackout Protocol — a fictional property. Built with Next.js, GSAP and Three.js.
          </p>
          <div className="flex flex-wrap gap-6">
            {['Privacy', 'Terms', 'Cookies', 'Accessibility'].map((item) => (
              <a
                key={item}
                href="#hero"
                className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash transition-colors hover:text-ember"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Oversized wordmark bleeding off the bottom edge */}
      <div className="relative overflow-hidden" aria-hidden>
        <p className="footer-mark -mb-[0.18em] select-none whitespace-nowrap text-center font-display text-[clamp(4rem,17vw,17rem)] leading-[0.78] text-white/[0.045]">
          BLACKOUT PROTOCOL
        </p>
      </div>
    </footer>
  );
}
