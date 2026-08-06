'use client';

import { useEffect, useState } from 'react';

/** Subscribe to a CSS media query. SSR-safe: returns `false` until mounted. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * Honour the OS "reduce motion" setting. Every scroll-linked timeline, particle
 * field and infinite loop checks this and degrades to a static composition.
 */
export const usePrefersReducedMotion = () =>
  useMediaQuery('(prefers-reduced-motion: reduce)');

/** Coarse pointer / small viewport — used to shed 3D and particle work. */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

export const useIsTablet = () => useMediaQuery('(max-width: 1023px)');

/** True only for real mice — gates the crosshair cursor and hover parallax. */
export const useHasFinePointer = () =>
  useMediaQuery('(hover: hover) and (pointer: fine)');
