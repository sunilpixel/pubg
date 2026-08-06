'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { subscribePointer } from '@/lib/pointer';
import { usePrefersReducedMotion, useHasFinePointer } from './useMediaQuery';

type ParallaxOptions = {
  /** Max travel in px along X. Negative values invert the axis. */
  x?: number;
  /** Max travel in px along Y. */
  y?: number;
  /** Max rotation in degrees around Y (horizontal mouse) and X (vertical). */
  rotate?: number;
  /** Depth translation in px — pairs with a perspective ancestor. */
  z?: number;
};

/**
 * Attaches viewport-wide mouse parallax to an element by writing directly to
 * its style each frame. No React state, no re-renders — the transform never
 * leaves the compositor.
 */
export function usePointerParallax<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { x = 0, y = 0, rotate = 0, z = 0 }: ParallaxOptions,
) {
  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !fine) return;

    return subscribePointer(({ sx, sy }) => {
      const tx = sx * x;
      const ty = sy * y;
      const rY = sx * rotate;
      const rX = -sy * rotate;
      const tz = Math.abs(sx) * z;

      el.style.transform =
        `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, ${tz.toFixed(2)}px)` +
        (rotate ? ` rotateX(${rX.toFixed(2)}deg) rotateY(${rY.toFixed(2)}deg)` : '');
    });
  }, [ref, x, y, rotate, z, reduced, fine]);
}

/**
 * Card tilt driven by the pointer's position *within the element* rather than
 * the viewport, plus a CSS-variable glare position for the specular sweep.
 */
export function useCardTilt<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { max = 12, scale = 1.03, lift = 18 } = {},
) {
  const raf = useRef(0);
  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !fine) return;

    const target = { rx: 0, ry: 0, s: 1, gx: 50, gy: 50 };
    const current = { ...target };
    let active = false;

    const render = () => {
      const k = 0.14;
      current.rx += (target.rx - current.rx) * k;
      current.ry += (target.ry - current.ry) * k;
      current.s += (target.s - current.s) * k;
      current.gx += (target.gx - current.gx) * k;
      current.gy += (target.gy - current.gy) * k;

      el.style.transform =
        `perspective(1100px) rotateX(${current.rx.toFixed(2)}deg) ` +
        `rotateY(${current.ry.toFixed(2)}deg) scale(${current.s.toFixed(3)}) ` +
        `translateZ(${((current.s - 1) * lift * 30).toFixed(2)}px)`;
      el.style.setProperty('--glare-x', `${current.gx.toFixed(1)}%`);
      el.style.setProperty('--glare-y', `${current.gy.toFixed(1)}%`);

      const settled =
        Math.abs(target.rx - current.rx) < 0.01 &&
        Math.abs(target.ry - current.ry) < 0.01 &&
        Math.abs(target.s - current.s) < 0.001;

      // Park the loop once everything has settled and the pointer has left.
      if (!active && settled) {
        raf.current = 0;
        return;
      }
      raf.current = requestAnimationFrame(render);
    };

    const kick = () => {
      if (!raf.current) raf.current = requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      target.ry = (px - 0.5) * 2 * max;
      target.rx = -(py - 0.5) * 2 * max;
      target.gx = px * 100;
      target.gy = py * 100;
      kick();
    };

    const onEnter = () => {
      active = true;
      target.s = scale;
      kick();
    };

    const onLeave = () => {
      active = false;
      target.rx = 0;
      target.ry = 0;
      target.s = 1;
      target.gx = 50;
      target.gy = 50;
      kick();
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [ref, max, scale, lift, reduced, fine]);
}
