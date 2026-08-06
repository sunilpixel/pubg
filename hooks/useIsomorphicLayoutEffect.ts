'use client';

import { useEffect, useLayoutEffect } from 'react';

/**
 * useLayoutEffect on the client, useEffect during SSR — silences React's
 * server warning while still letting GSAP set initial styles before paint.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
