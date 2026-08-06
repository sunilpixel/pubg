'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap, Flip } from '@/lib/gsap';
import { useRevealOnce } from '@/hooks/useRevealOnce';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { usePrefersReducedMotion, useHasFinePointer } from '@/hooks/useMediaQuery';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ShotArt } from '@/components/art/ShotArt';
import { GALLERY, type GalleryShot } from '@/lib/data/world';
import { cn } from '@/lib/utils';

const SPAN: Record<GalleryShot['span'], string> = {
  hero: 'sm:col-span-2 lg:col-span-2 lg:row-span-2',
  tall: 'lg:row-span-2',
  wide: 'sm:col-span-2',
  square: '',
};

/**
 * Masonry field gallery.
 *
 * Hover pushes a capture through a small grade — zoom, blur falloff, noise
 * gain and an internal parallax offset. Clicking Flips the tile to fullscreen
 * and back, reusing the very same DOM node so the transition is continuous.
 */
export function Gallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const pending = useRef<Flip.FlipState | null>(null);

  const { setOverlayOpen } = useExperience();
  const reduced = usePrefersReducedMotion();

  // IntersectionObserver-driven so the tiles can never be left at opacity 0 by
  // a mis-measured ScrollTrigger. See useRevealOnce.
  useRevealOnce(sectionRef, '.shot-tile', { y: 60, duration: 0.75, stagger: 0.05 });

  /* -------- Flip the tile between its grid slot and fullscreen -------- */
  const toggle = useCallback(
    (id: string) => {
      const next = active === id ? null : id;

      if (!reduced) {
        const tile = document.querySelector<HTMLElement>(`[data-shot="${id}"]`);
        if (tile) pending.current = Flip.getState(tile, { props: 'borderRadius' });
      }

      setActive(next);
      setOverlayOpen(Boolean(next));
    },
    [active, reduced, setOverlayOpen],
  );

  useIsomorphicLayoutEffect(() => {
    const state = pending.current;
    if (!state) return;
    pending.current = null;

    Flip.from(state, {
      duration: 0.85,
      ease: 'cinema',
      absolute: true,
      scale: false,
      nested: true,
    });
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && toggle(active);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, toggle]);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative overflow-hidden bg-abyss py-28 sm:py-36"
      aria-label="Field gallery"
    >
      <div className="relative mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          index="07"
          eyebrow="Field Captures"
          title="THE"
          accent="GALLERY"
          description="Eight frames pulled from live matches across the rotation. Click any capture to take it fullscreen."
        />

        {/* Backdrop that fades in behind the expanded tile */}
        <div
          aria-hidden
          onClick={() => active && toggle(active)}
          className={cn(
            'fixed inset-0 z-[115] bg-void/92 backdrop-blur-2xl transition-opacity duration-700',
            active ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
          )}
        />

        <div className="shot-grid mt-16 grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GALLERY.map((shot) => (
            <ShotTile
              key={shot.id}
              shot={shot}
              expanded={active === shot.id}
              onToggle={() => toggle(shot.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShotTile({
  shot,
  expanded,
  onToggle,
}: {
  shot: GalleryShot;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tileRef = useRef<HTMLButtonElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();

  /* Internal parallax — the artwork drifts inside its frame on hover. */
  useEffect(() => {
    const tile = tileRef.current;
    const scene = sceneRef.current;
    if (!tile || !scene || reduced || !fine || expanded) return;

    const xTo = gsap.quickTo(scene, 'x', { duration: 0.9, ease: 'power3.out' });
    const yTo = gsap.quickTo(scene, 'y', { duration: 0.9, ease: 'power3.out' });

    const onMove = (event: PointerEvent) => {
      const rect = tile.getBoundingClientRect();
      xTo(((event.clientX - rect.left) / rect.width - 0.5) * -34);
      yTo(((event.clientY - rect.top) / rect.height - 0.5) * -24);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    tile.addEventListener('pointermove', onMove);
    tile.addEventListener('pointerleave', onLeave);
    return () => {
      tile.removeEventListener('pointermove', onMove);
      tile.removeEventListener('pointerleave', onLeave);
      gsap.set(scene, { x: 0, y: 0 });
    };
  }, [reduced, fine, expanded]);

  return (
    <button
      ref={tileRef}
      type="button"
      data-shot={shot.id}
      data-cursor="view"
      data-cursor-label={expanded ? 'Close' : 'Expand'}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={`${shot.title}, ${shot.location}`}
      className={cn(
        'shot-tile group relative isolate block overflow-hidden text-left gpu',
        expanded
          ? 'fixed inset-3 z-[118] rounded-2xl sm:inset-8 lg:inset-12'
          : cn('relative rounded-3xl', SPAN[shot.span]),
      )}
    >
      {/* Artwork — scaled slightly past the frame so parallax never reveals an edge */}
      <div
        ref={sceneRef}
        className={cn(
          'absolute -inset-6 transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)]',
          !expanded && 'group-hover:scale-[1.08]',
        )}
      >
        <ShotArt shot={shot} className="h-full w-full object-cover" />
      </div>

      {/* Edge falloff, lifted on hover.
          Was a per-tile `backdrop-blur` — eight of them, each forcing the
          compositor to re-blur whatever sits behind the tile. A darkening
          vignette gives the same "focus pulls to centre" read for free. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-600',
          expanded ? 'opacity-0' : 'opacity-100 group-hover:opacity-0',
        )}
        style={{
          background:
            'radial-gradient(120% 100% at 50% 50%, transparent 30%, rgb(3 4 5 / .55) 100%)',
        }}
      />

      {/* Noise gain on hover — tiled texture, not a live SVG filter. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Scrim */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(0deg, rgb(3 4 5 / .94) 0%, rgb(3 4 5 / .25) 42%, transparent 70%)',
        }}
      />

      {/* Caption */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 block p-5 sm:p-6">
        <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-ember">
          {shot.location}
        </span>
        <span
          className={cn(
            'mt-1.5 block font-display leading-none text-chalk transition-all duration-500',
            expanded ? 'text-[clamp(2.5rem,6vw,5rem)]' : 'text-3xl group-hover:translate-x-1',
          )}
        >
          {shot.title}
        </span>
      </span>

      {/* Expand affordance */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/40 backdrop-blur-md transition-all duration-400',
          expanded ? 'rotate-45 border-blood/60' : 'opacity-0 group-hover:opacity-100',
        )}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="1.3" className="text-chalk" />
        </svg>
      </span>

      {/* Hover rim */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-500',
          expanded ? 'rounded-2xl opacity-0' : 'rounded-3xl opacity-0 group-hover:opacity-100',
        )}
        style={{ boxShadow: 'inset 0 0 0 1px rgb(255 106 26 / .45), 0 0 60px -18px #ff6a1a' }}
      />
    </button>
  );
}
