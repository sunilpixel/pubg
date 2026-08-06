'use client';

import { useRef, type DependencyList, type RefObject } from 'react';
import { gsap } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

type ContextFn = (context: gsap.Context) => void | (() => void);

/**
 * The workhorse animation hook.
 *
 * Runs `fn` inside a `gsap.context()` scoped to `scope`, so every tween,
 * ScrollTrigger and selector created inside is automatically reverted when the
 * component unmounts or deps change. This is what keeps pinned sections from
 * leaking spacers across route changes.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * useGsapContext(() => {
 *   gsap.to('.bar', { scrollTrigger: { trigger: ref.current, scrub: true }, x: 400 });
 * }, ref);
 */
export function useGsapContext<T extends HTMLElement>(
  fn: ContextFn,
  scope: RefObject<T | null>,
  deps: DependencyList = [],
) {
  const saved = useRef(fn);
  saved.current = fn;

  useIsomorphicLayoutEffect(() => {
    if (!scope.current) return;

    const ctx = gsap.context((self) => saved.current(self), scope.current);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Same idea but without a DOM scope — for timelines that target refs directly
 * or animate objects rather than elements.
 */
export function useGsapEffect(fn: ContextFn, deps: DependencyList = []) {
  const saved = useRef(fn);
  saved.current = fn;

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context((self) => saved.current(self));
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
