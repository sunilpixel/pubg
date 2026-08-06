'use client';

import { useRef, type RefObject } from 'react';
import { gsap, SplitText, ScrollTrigger } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { usePrefersReducedMotion } from './useMediaQuery';

type RevealType = 'chars' | 'words' | 'lines';

type SplitRevealOptions = {
  /** Granularity of the split. Lines read best for body copy. */
  type?: RevealType;
  /** Stagger between pieces, in seconds. */
  stagger?: number;
  /** Per-piece duration. */
  duration?: number;
  delay?: number;
  /** Vertical travel of each piece, in px. */
  y?: number;
  rotateX?: number;
  /** Play on scroll instead of immediately. */
  scroll?: boolean;
  /** ScrollTrigger start position. */
  start?: string;
  ease?: string;
  /** Skip the animation entirely (e.g. until the loader has finished). */
  enabled?: boolean;
};

/**
 * SplitText reveal with the two details that make it feel expensive:
 * a masked overflow so glyphs rise out of nothing, and a 3D rotateX so the
 * line pivots rather than merely sliding.
 *
 * Splits are reverted on cleanup, which restores the original DOM — important
 * for screen readers and for re-splitting after a resize.
 */
export function useSplitReveal<T extends HTMLElement>(
  ref: RefObject<T | null>,
  {
    type = 'lines',
    stagger = 0.045,
    duration = 1.1,
    delay = 0,
    y = 110,
    rotateX = 42,
    scroll = true,
    start = 'top 82%',
    ease = 'cinema',
    enabled = true,
  }: SplitRevealOptions = {},
) {
  const splitRef = useRef<SplitText | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    // Read the media query imperatively so the hook has a single code path.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el, { opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const split = new SplitText(el, {
        type: `${type},lines`,
        linesClass: 'split-line',
        // Masking wrapper: pieces animate from below a hard clip edge.
        mask: 'lines',
        autoSplit: true,
      });
      splitRef.current = split;

      const targets = split[type] as Element[];
      gsap.set(el, { opacity: 1, perspective: 900 });

      const tween = gsap.from(targets, {
        yPercent: y,
        rotateX,
        opacity: 0,
        duration,
        delay,
        ease,
        stagger,
        transformOrigin: '50% 100% -60px',
        force3D: true,
        ...(scroll
          ? {
              scrollTrigger: {
                trigger: el,
                start,
                once: true,
              },
            }
          : {}),
      });

      return () => {
        tween.kill();
        split.revert();
      };
    }, el);

    // Splits change line boxes; make sure pinned sections re-measure.
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [ref, type, stagger, duration, delay, y, rotateX, scroll, start, ease, enabled]);

  return splitRef;
}

/** Standalone reveal for non-text blocks — cards, images, panels. */
export function useFadeUp<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { selector, stagger = 0.08, y = 60, start = 'top 84%' } = {} as {
    selector?: string;
    stagger?: number;
    y?: number;
    start?: string;
  },
) {
  const reduced = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      const targets = selector ? gsap.utils.toArray<HTMLElement>(selector) : [el];
      if (!targets.length) return;

      gsap.from(targets, {
        y,
        opacity: 0,
        duration: 1.05,
        ease: 'cinema',
        stagger,
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [ref, selector, stagger, y, start, reduced]);
}
