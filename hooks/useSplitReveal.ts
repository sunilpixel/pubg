'use client';

import { useRef, type RefObject } from 'react';
import { gsap, SplitText } from '@/lib/gsap';
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

      /**
       * Playback is driven by IntersectionObserver, not ScrollTrigger.
       *
       * A ScrollTrigger here has to compute a scroll position, and this page
       * makes that unreliable: three pinned sections inject spacer height and
       * every section is code-split, so a trigger created before the pins above
       * it have applied their spacing lands in the wrong place and never fires.
       * The heading then stays at opacity 0 permanently — which reads as a tall
       * blank gap where a section masthead should be.
       *
       * The observer reports real visibility from layout, so pin spacing simply
       * cannot desynchronise it. The card reveals moved for the same reason;
       * this was the last one still measuring scroll positions.
       */
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
        paused: scroll,
      });

      let observer: IntersectionObserver | null = null;

      if (scroll) {
        observer = new IntersectionObserver(
          ([entry]) => {
            // Visible, or already scrolled past — either way, show it.
            if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
              tween.play();
              observer?.disconnect();
            }
          },
          { rootMargin: '0px 0px -12% 0px', threshold: 0 },
        );
        observer.observe(el);
      }

      // Last-resort backstop: a decorative reveal must never be able to leave
      // content permanently hidden.
      const backstop = window.setTimeout(() => {
        if (!tween.progress()) tween.progress(1);
        observer?.disconnect();
      }, 4000);

      return () => {
        clearTimeout(backstop);
        observer?.disconnect();
        tween.kill();
        split.revert();
      };
    }, el);

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
