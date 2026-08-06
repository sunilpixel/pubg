'use client';

import { useRef, type DependencyList, type RefObject } from 'react';
import { gsap } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { usePrefersReducedMotion } from './useMediaQuery';

type RevealOptions = {
  y?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
  /** Extra margin around the viewport before the reveal fires. */
  rootMargin?: string;
};

/**
 * Fade-and-rise reveal driven by IntersectionObserver instead of ScrollTrigger.
 *
 * WHY NOT SCROLLTRIGGER
 * ---------------------
 * A `gsap.from({ opacity: 0 })` applies its hidden state the instant it is
 * created and then waits for a scroll position to be crossed. If that position
 * is computed wrongly the tween simply never plays, and the content stays
 * invisible — the worst possible failure mode.
 *
 * This page makes wrong positions easy: three pinned sections inject spacer
 * height, and every section is code-split so they hydrate at staggered times.
 * A trigger created before the pins above it have applied their spacing
 * measures against a document that is about to grow, and lands in the wrong
 * place. Refreshes mostly fix it, which is why the cards appeared only after
 * scrolling away and back.
 *
 * IntersectionObserver has no such dependency: the browser reports visibility
 * from real layout, continuously, with no measurement of ours involved. It
 * cannot desynchronise from pin spacing because it never knew about it.
 *
 * The failure mode is also inverted — if anything goes wrong the observer
 * simply fires and the content is visible, rather than staying hidden.
 */
export function useRevealOnce<T extends HTMLElement>(
  scope: RefObject<T | null>,
  selector: string,
  {
    y = 48,
    duration = 0.7,
    stagger = 0.05,
    ease = 'cinema',
    rootMargin = '0px 0px -6% 0px',
  }: RevealOptions = {},
  deps: DependencyList = [],
) {
  const done = useRef(false);
  const reduced = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const root = scope.current;
    if (!root || reduced || done.current) return;

    const targets = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(selector));
    if (!targets.length) return;

    gsap.set(targets, { opacity: 0, y });

    const play = () => {
      if (done.current) return;
      done.current = true;
      gsap.to(targets, { opacity: 1, y: 0, duration, ease, stagger, overwrite: 'auto' });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play();
          observer.disconnect();
          return;
        }
        // Not intersecting *and* already above the viewport means the user has
        // scrolled past it — reveal immediately rather than leaving a blank
        // block behind them.
        if (entry.boundingClientRect.bottom < 0) {
          play();
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );

    observer.observe(root);

    // Last-resort backstop. If the observer somehow never reports (an ancestor
    // with `content-visibility`, a detached subtree, a browser quirk), the
    // content becomes visible anyway. Content must never be permanently hidden
    // by a decorative animation.
    const backstop = window.setTimeout(() => {
      if (!done.current) {
        done.current = true;
        gsap.set(targets, { opacity: 1, y: 0 });
      }
      observer.disconnect();
    }, 4000);

    return () => {
      observer.disconnect();
      clearTimeout(backstop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, selector, ...deps]);
}
