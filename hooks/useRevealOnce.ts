'use client';

import { useRef, type DependencyList, type RefObject } from 'react';
import { gsap } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

type RevealOptions = {
  /** How far below its resting place each element starts, in px. */
  y?: number;
  duration?: number;
  /** Delay between elements that cross into view together, in seconds. */
  stagger?: number;
  ease?: string;
  /** Extra margin around the viewport before the reveal fires. */
  rootMargin?: string;
};

/**
 * Fade-and-rise reveal, one element at a time, driven by IntersectionObserver.
 *
 * EACH ELEMENT IS OBSERVED INDIVIDUALLY
 * -------------------------------------
 * An earlier version observed the *container* instead. That looked fine for a
 * six-card grid, but the weapon vault's grid is thirty cards and several
 * thousand pixels tall: the moment its top edge appeared, every card in it
 * animated at once — nearly all of them far below the fold. By the time the
 * user scrolled down, the cards were long since revealed and nothing appeared
 * to animate at all.
 *
 * Observing the cards themselves means each one rises as it actually reaches
 * the viewport, which is what a scroll reveal is supposed to do. Elements that
 * cross the threshold in the same callback (a grid row, typically) are given a
 * small incremental delay so a row still sweeps rather than snapping in
 * together.
 *
 * WHY NOT SCROLLTRIGGER
 * ---------------------
 * A `gsap.from({ opacity: 0 })` applies its hidden state immediately and then
 * waits for a computed scroll position. This page makes those computations
 * unreliable — three pinned sections inject spacer height and every section is
 * code-split, so a trigger created before the pins above it have applied their
 * spacing lands in the wrong place and never fires, leaving content invisible.
 * IntersectionObserver reads real layout continuously and cannot desynchronise
 * from pin spacing, because it never knew about it.
 */
export function useRevealOnce<T extends HTMLElement>(
  scope: RefObject<T | null>,
  selector: string,
  {
    y = 60,
    duration = 0.8,
    stagger = 0.06,
    ease = 'cinema',
    rootMargin = '0px 0px -8% 0px',
  }: RevealOptions = {},
  deps: DependencyList = [],
) {
  // Survives re-runs, so cards that have already played are never re-hidden
  // when the set changes — the vault swaps its cards on filter and when the
  // rest of the grid mounts.
  const played = useRef<WeakSet<Element>>(new WeakSet());

  useIsomorphicLayoutEffect(() => {
    const root = scope.current;
    if (!root || reducedMotion()) return;

    const targets = gsap.utils
      .toArray<HTMLElement>(root.querySelectorAll(selector))
      .filter((el) => !played.current.has(el));

    if (!targets.length) return;

    gsap.set(targets, { opacity: 0, y });

    const reveal = (el: Element, delay: number) => {
      if (played.current.has(el)) return;
      played.current.add(el);
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration,
        ease,
        delay,
        overwrite: 'auto',
        // Drop the inline transform once it lands so the element is not left
        // holding a compositor layer for the rest of the session.
        clearProps: 'transform',
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        // Anything now visible, or already scrolled past — never leave a blank
        // block behind the user.
        const arrived = entries.filter(
          (entry) => entry.isIntersecting || entry.boundingClientRect.bottom < 0,
        );

        arrived.forEach((entry, index) => {
          reveal(entry.target, index * stagger);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin, threshold: 0 },
    );

    targets.forEach((el) => observer.observe(el));

    /**
     * Backstop. If the observer somehow never reports — a detached subtree, a
     * browser quirk — anything already on screen is shown anyway. Elements
     * still below the fold are deliberately left alone so the scroll reveal is
     * not spoiled for content the user has not reached.
     */
    const backstop = window.setTimeout(() => {
      targets.forEach((el) => {
        if (played.current.has(el)) return;
        if (el.getBoundingClientRect().top < window.innerHeight) {
          gsap.set(el, { opacity: 1, y: 0, clearProps: 'transform' });
          played.current.add(el);
          observer.unobserve(el);
        }
      });
    }, 4000);

    return () => {
      observer.disconnect();
      clearTimeout(backstop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, y, duration, stagger, ease, rootMargin, ...deps]);
}

/** Read imperatively so the hook has a single code path and no extra render. */
function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
