'use client';

import { useEffect, type RefObject } from 'react';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion, useHasFinePointer } from './useMediaQuery';

type MagneticOptions = {
  /** How far the element chases the cursor, as a fraction of the offset. */
  strength?: number;
  /** Extra px around the element that still counts as "near". */
  padding?: number;
  /** Optional inner element that travels further than its container. */
  inner?: RefObject<HTMLElement | null>;
};

/**
 * Magnetic hover: the element leans toward the cursor while it is within
 * range, then springs back with an elastic settle on exit.
 *
 * Uses gsap.quickTo, which caches the setter and skips the tween-creation cost
 * on every pointer event — critical when several magnetic buttons are on
 * screen at once.
 */
export function useMagnetic<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { strength = 0.35, padding = 28, inner }: MagneticOptions = {},
) {
  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !fine) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' });

    const innerEl = inner?.current;
    const ixTo = innerEl ? gsap.quickTo(innerEl, 'x', { duration: 0.8, ease: 'power3.out' }) : null;
    const iyTo = innerEl ? gsap.quickTo(innerEl, 'y', { duration: 0.8, ease: 'power3.out' }) : null;

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;

      const withinX = Math.abs(dx) < rect.width / 2 + padding;
      const withinY = Math.abs(dy) < rect.height / 2 + padding;

      if (withinX && withinY) {
        xTo(dx * strength);
        yTo(dy * strength);
        ixTo?.(dx * strength * 0.5);
        iyTo?.(dy * strength * 0.5);
        el.dataset.magnetized = 'true';
      } else if (el.dataset.magnetized === 'true') {
        delete el.dataset.magnetized;
        gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.32)' });
        if (innerEl) {
          gsap.to(innerEl, { x: 0, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.3)' });
        }
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.set(el, { x: 0, y: 0 });
      if (innerEl) gsap.set(innerEl, { x: 0, y: 0 });
    };
  }, [ref, strength, padding, inner, reduced, fine]);
}
