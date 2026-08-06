'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { useExperience } from './ExperienceProvider';

/**
 * Lenis ↔ GSAP integration.
 *
 * The two must share a clock. If Lenis runs on its own rAF while ScrollTrigger
 * runs on GSAP's ticker, scrub animations lag the scroll position by a frame
 * and pinned sections visibly shudder. So: drive Lenis from `gsap.ticker`,
 * disable GSAP's lag smoothing, and tell ScrollTrigger to re-measure on every
 * Lenis frame.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const reduced = usePrefersReducedMotion();
  const { ready, overlayOpen } = useExperience();

  useEffect(() => {
    if (reduced) return; // Native scrolling is the accessible fallback.

    const lenis = new Lenis({
      duration: 1.15,
      // Exponential ease-out: quick to respond, long to settle.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      // Touch devices already have excellent native inertia; hijacking it feels
      // worse than leaving it alone.
      syncTouch: false,
      autoRaf: false,
    });

    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000); // ticker is seconds
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links route through Lenis so they inherit the same easing.
    const onAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!anchor) return;
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -20, duration: 1.6 });
    };

    document.addEventListener('click', onAnchorClick);

    return () => {
      document.removeEventListener('click', onAnchorClick);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  // Freeze the page under the loader and under fullscreen overlays.
  useEffect(() => {
    const lenis = lenisRef.current;
    const locked = !ready || overlayOpen;

    if (lenis) {
      if (locked) lenis.stop();
      else lenis.start();
    }

    document.documentElement.style.overflow = locked && reduced ? 'hidden' : '';
    document.body.style.overflow = locked && reduced ? 'hidden' : '';

    if (!locked) {
      // Sections that mounted while hidden have zero-height triggers.
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [ready, overlayOpen, reduced]);

  return <>{children}</>;
}
