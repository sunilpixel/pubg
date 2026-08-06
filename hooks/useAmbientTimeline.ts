'use client';

import { useEffect, useRef, type DependencyList, type RefObject } from 'react';
import { gsap } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { usePrefersReducedMotion } from './useMediaQuery';

/**
 * Infinite decorative animation that only runs while its element is on screen.
 *
 * The site has a lot of these — 30 floating weapon cards, 6 map dioramas with
 * ~26 swaying trees each, drifting clouds and fog. Left unmanaged they are all
 * live simultaneously, so GSAP writes several hundred transforms every frame
 * for elements the user cannot see, and the compositor repaints their layers.
 *
 * Build the loop into the timeline this hook hands you; it starts paused and is
 * played/paused by an IntersectionObserver.
 *
 * @example
 * useAmbientTimeline(cardRef, (tl) => {
 *   tl.to('.leaf', { rotate: 2, duration: 2, repeat: -1, yoyo: true });
 * });
 */
export function useAmbientTimeline<T extends HTMLElement>(
  scope: RefObject<T | null>,
  build: (timeline: gsap.core.Timeline, context: gsap.Context) => void,
  deps: DependencyList = [],
  { rootMargin = '150px' } = {},
) {
  const saved = useRef(build);
  saved.current = build;

  const reduced = usePrefersReducedMotion();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useIsomorphicLayoutEffect(() => {
    const element = scope.current;
    if (!element || reduced) return;

    const ctx = gsap.context((self) => {
      const timeline = gsap.timeline({ paused: true });
      timelineRef.current = timeline;
      saved.current(timeline, self);
    }, element);

    return () => {
      ctx.revert();
      timelineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps]);

  useEffect(() => {
    const element = scope.current;
    if (!element || reduced) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const timeline = timelineRef.current;
        if (!timeline) return;
        if (entry.isIntersecting) timeline.play();
        else timeline.pause();
      },
      { rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, rootMargin, ...deps]);
}
