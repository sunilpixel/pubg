'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { subscribePointer } from '@/lib/pointer';
import { useHasFinePointer, usePrefersReducedMotion } from '@/hooks/useMediaQuery';

type CursorMode = 'default' | 'target' | 'drag' | 'view' | 'fire';

/**
 * The custom crosshair.
 *
 * Two layers moving at different rates: the reticle tracks the pointer with
 * almost no lag, and a wider ring trails behind it. Elements opt into a mode by
 * setting `data-cursor="target|view|drag|fire"` anywhere in their ancestry.
 */
export function Crosshair() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const [mode, setMode] = useState<CursorMode>('default');
  const [label, setLabel] = useState('');
  const [visible, setVisible] = useState(false);

  const fine = useHasFinePointer();
  const reduced = usePrefersReducedMotion();
  const enabled = fine && !reduced;

  // Position — driven imperatively, never through React state.
  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    const ring = ringRef.current;
    if (!root || !ring) return;

    document.body.dataset.crosshair = 'on';

    const xTo = gsap.quickTo(root, 'x', { duration: 0.06, ease: 'none' });
    const yTo = gsap.quickTo(root, 'y', { duration: 0.06, ease: 'none' });
    const rxTo = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3.out' });
    const ryTo = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3.out' });

    const unsubscribe = subscribePointer(({ x, y, speed }) => {
      xTo(x);
      yTo(y);
      rxTo(x);
      ryTo(y);
      // Motion blur cue: the ring stretches slightly with pointer velocity.
      gsap.set(ring, { scale: 1 + Math.min(speed, 60) / 260 });
    });

    const onEnter = () => setVisible(true);
    const onLeave = () => setVisible(false);
    document.addEventListener('pointerenter', onEnter);
    document.addEventListener('pointerleave', onLeave);
    setVisible(true);

    return () => {
      unsubscribe();
      delete document.body.dataset.crosshair;
      document.removeEventListener('pointerenter', onEnter);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  // Mode — read from the hovered element's data attributes.
  useEffect(() => {
    if (!enabled) return;

    const onOver = (event: PointerEvent) => {
      const el = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-cursor]');
      if (el) {
        setMode((el.dataset.cursor as CursorMode) ?? 'default');
        setLabel(el.dataset.cursorLabel ?? '');
      } else {
        const interactive = (event.target as HTMLElement | null)?.closest(
          'a, button, [role="button"], input, summary',
        );
        setMode(interactive ? 'target' : 'default');
        setLabel('');
      }
    };

    const onDown = () => {
      gsap.to(dotRef.current, { scale: 0.4, duration: 0.12, ease: 'power2.out' });
      gsap.to(ringRef.current, { scale: 0.8, duration: 0.18, ease: 'power2.out' });
    };
    const onUp = () => {
      gsap.to(dotRef.current, { scale: 1, duration: 0.34, ease: 'recoil' });
      gsap.to(ringRef.current, { scale: 1, duration: 0.4, ease: 'recoil' });
    };

    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [enabled]);

  useEffect(() => {
    if (!labelRef.current) return;
    gsap.fromTo(
      labelRef.current,
      { opacity: 0, y: 6 },
      { opacity: label ? 1 : 0, y: label ? 0 : 6, duration: 0.3, ease: 'cinema' },
    );
  }, [label]);

  if (!enabled) return null;

  const expanded = mode === 'target' || mode === 'view' || mode === 'fire';
  const accent = mode === 'fire' ? 'var(--color-blood)' : 'var(--color-ember)';

  return (
    <>
      {/* Trailing ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[110] -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity .25s' }}
      >
        <div
          className="rounded-full border transition-[width,height,border-color,opacity] duration-300 ease-[cubic-bezier(.16,1,.3,1)]"
          style={{
            width: expanded ? 62 : 34,
            height: expanded ? 62 : 34,
            borderColor: expanded ? accent : 'rgb(214 218 222 / 0.4)',
            boxShadow: expanded ? `0 0 26px -4px ${accent}` : 'none',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Reticle */}
      <div
        ref={rootRef}
        className="pointer-events-none fixed left-0 top-0 z-[111] -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity .25s' }}
      >
        <div ref={dotRef} className="relative" style={{ transform: 'translate(-50%, -50%)' }}>
          <svg width="46" height="46" viewBox="0 0 46 46" className="block">
            {/* Four ticks — they retract when hovering something actionable,
                exactly like an in-game reticle tightening. */}
            <g
              stroke={expanded ? accent : 'rgb(242 244 245 / 0.9)'}
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ transition: 'stroke .3s' }}
            >
              <line x1="23" y1={expanded ? 2 : 6} x2="23" y2={expanded ? 10 : 16} />
              <line x1="23" y1={expanded ? 36 : 30} x2="23" y2={expanded ? 44 : 40} />
              <line x1={expanded ? 2 : 6} y1="23" x2={expanded ? 10 : 16} y2="23" />
              <line x1={expanded ? 36 : 30} y1="23" x2={expanded ? 44 : 40} y2="23" />
            </g>
            <circle cx="23" cy="23" r="1.6" fill={expanded ? accent : '#f2f4f5'} />
          </svg>

          {label ? (
            <span
              ref={labelRef}
              className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.22em]"
              style={{ color: accent }}
            >
              {label}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}
