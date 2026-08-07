'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { useMagnetic } from '@/hooks/useMagnetic';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '#vault', label: 'Armoury' },
  { href: '#maps', label: 'Maps' },
  { href: '#vehicles', label: 'Vehicles' },
  { href: '#airdrop', label: 'Airdrop' },
  { href: '#operators', label: 'Operators' },
  { href: '#intel', label: 'Intel' },
  { href: '#timeline', label: 'Timeline' },
];

/** A single nav link with its own magnetic pull and a wipe-in underline. */
function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useMagnetic(ref, { strength: 0.22, padding: 12 });

  return (
    <a
      ref={ref}
      href={href}
      data-cursor="target"
      className="group relative block px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] transition-colors duration-300"
      aria-current={active ? 'true' : undefined}
    >
      <span
        className={cn(
          'relative z-10 transition-colors duration-300',
          active ? 'text-ember' : 'text-smoke group-hover:text-chalk',
        )}
      >
        {label}
      </span>

      {/* Hover pill */}
      <span className="absolute inset-0 scale-90 rounded-full bg-white/[0.06] opacity-0 transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-100 group-hover:opacity-100" />

      {/* Active / hover underline wipes in from the left */}
      <span
        className={cn(
          'absolute inset-x-3 bottom-1 h-px origin-left bg-ember transition-transform duration-400 ease-[cubic-bezier(.16,1,.3,1)]',
          active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
        )}
        style={{ boxShadow: '0 0 10px rgb(255 106 26 / .9)' }}
      />
    </a>
  );
}

export function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);

  const [active, setActive] = useState('');
  const [open, setOpen] = useState(false);

  const { ready, audioEnabled, toggleAudio } = useExperience();
  const reduced = usePrefersReducedMotion();

  useMagnetic(ctaRef, { strength: 0.3 });

  /* Reveal once the loader hands off */
  useEffect(() => {
    if (!ready || !navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -90, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: 'cinema', delay: 0.35 },
    );
  }, [ready]);

  /* Auto-hide on scroll down, reveal on scroll up + scroll progress ring */
  useGsapContext(
    () => {
      if (reduced || !navRef.current) return;

      const nav = navRef.current;
      const shell = nav.querySelector('.nav-shell');
      let hidden = false;

      const show = () => {
        if (!hidden) return;
        hidden = false;
        gsap.to(nav, { y: 0, duration: 0.55, ease: 'cinema', overwrite: true });
      };
      const hide = () => {
        if (hidden) return;
        hidden = true;
        gsap.to(nav, { y: -130, duration: 0.45, ease: 'power2.in', overwrite: true });
      };

      const circumference = 2 * Math.PI * 15;

      const trigger = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          // Condense the bar once we're off the hero.
          if (shell) {
            gsap.to(shell, {
              paddingTop: self.scroll() > 80 ? 8 : 14,
              paddingBottom: self.scroll() > 80 ? 8 : 14,
              duration: 0.4,
              ease: 'cinema',
              overwrite: 'auto',
            });
          }

          if (progressRef.current) {
            progressRef.current.style.strokeDashoffset = String(
              circumference * (1 - self.progress),
            );
          }

          // Never hide at the very top, and never hide the menu while open.
          if (self.scroll() < 140) return show();
          if (self.direction === 1) hide();
          else show();
        },
      });

      return () => trigger.kill();
    },
    navRef,
    [reduced],
  );

  /* Track which section is in view */
  useEffect(() => {
    const sections = LINKS.map((l) => document.querySelector(l.href)).filter(
      (el): el is Element => Boolean(el),
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(`#${visible.target.id}`);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  /* Mobile drawer: lock body scroll and close on Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <a
        href="#vault"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[130] focus:rounded-full focus:bg-ember focus:px-5 focus:py-3 focus:font-mono focus:text-[11px] focus:uppercase focus:tracking-widest focus:text-void"
      >
        Skip to content
      </a>

      <header
        ref={navRef}
        className="fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-4 sm:px-6 sm:pt-6"
        style={{ opacity: 0 }}
      >
        <nav
          className="nav-shell glass metal-edge flex w-full max-w-6xl items-center justify-between gap-4 rounded-full px-4 py-3.5 sm:px-5"
          aria-label="Primary"
        >
          {/* Brand + scroll progress ring */}
          <a href="#hero" className="group flex shrink-0 items-center gap-3" data-cursor="target">
            <span className="relative grid h-9 w-9 place-items-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(255 255 255 / .1)" strokeWidth="1.5" />
                <circle
                  ref={progressRef}
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="var(--color-ember)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 15}
                  strokeDashoffset={2 * Math.PI * 15}
                  style={{ filter: 'drop-shadow(0 0 4px rgb(255 106 26 / .9))' }}
                />
              </svg>
              <span className="h-1.5 w-1.5 rounded-full bg-ember transition-transform duration-500 group-hover:scale-[2.2]" />
            </span>
            <span className="font-display text-lg leading-none tracking-wide text-chalk">
              BLACKOUT<span className="text-ember">/</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden items-center lg:flex">
            {LINKS.map((link) => (
              <NavLink key={link.href} {...link} active={active === link.href} />
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              ref={ctaRef}
              href="#airdrop"
              data-cursor="target"
              className="group relative hidden overflow-hidden rounded-full bg-linear-to-b from-ember-300 via-ember to-ember-700 px-6 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-void shadow-[0_8px_30px_-8px_rgb(255_106_26/.9)] sm:block"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-24deg] bg-white/45 transition-transform duration-[800ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-full" />
              <span className="relative">Pre-Register</span>
            </a>

            {/* Sound. Every weapon SFX is gated behind this, so it lives in the
                bar rather than only at the bottom of the page. */}
            <button
              type="button"
              onClick={toggleAudio}
              aria-pressed={audioEnabled}
              aria-label={audioEnabled ? 'Turn sound off' : 'Turn sound on'}
              title={audioEnabled ? 'Sound on' : 'Sound off'}
              data-cursor="target"
              className={cn(
                'grid h-10 w-10 place-items-center rounded-full border transition-colors duration-300',
                audioEnabled
                  ? 'border-ember/70 bg-ember/15'
                  : 'border-white/10 bg-white/[0.04] hover:border-ember/50',
              )}
            >
              <span className="flex h-3.5 items-end gap-[3px]" aria-hidden>
                {[0.45, 1, 0.6, 0.85].map((scale, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-0.5 transition-transform duration-300',
                      audioEnabled ? 'bg-ember' : 'bg-smoke',
                    )}
                    style={{
                      height: '100%',
                      transform: `scaleY(${audioEnabled ? scale : 0.14})`,
                      transformOrigin: 'bottom',
                      transitionDelay: `${i * 60}ms`,
                    }}
                  />
                ))}
              </span>
            </button>

            {/* Burger */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
              data-cursor="target"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] lg:hidden"
            >
              <span className="relative block h-3 w-4">
                <span
                  className={cn(
                    'absolute left-0 block h-px w-full bg-chalk transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]',
                    open ? 'top-1.5 rotate-45' : 'top-0',
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 top-1.5 block h-px bg-chalk transition-all duration-300',
                    open ? 'w-0 opacity-0' : 'w-full opacity-100',
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 block h-px w-full bg-chalk transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]',
                    open ? 'top-1.5 -rotate-45' : 'top-3',
                  )}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-[99] lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            'absolute inset-0 bg-void/85 backdrop-blur-xl transition-opacity duration-500',
            open ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            'absolute inset-x-4 top-24 origin-top rounded-3xl border border-white/10 bg-graphite/90 p-3 shadow-[0_40px_80px_-20px_rgb(0_0_0/.9)] transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]',
            open ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-6 scale-95 opacity-0',
          )}
        >
          {LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-white/5 px-4 py-4 font-display text-2xl text-bone transition-colors last:border-0 hover:text-ember"
              style={{
                transitionDelay: open ? `${i * 45}ms` : '0ms',
                transform: open ? 'translateY(0)' : 'translateY(12px)',
                opacity: open ? 1 : 0,
                transitionProperty: 'transform, opacity, color',
                transitionDuration: '500ms',
              }}
            >
              {link.label}
              <span className="font-mono text-[10px] tracking-[0.3em] text-ash">
                {String(i + 1).padStart(2, '0')}
              </span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
