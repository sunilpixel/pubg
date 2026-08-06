'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { seeded } from '@/lib/utils';

type Props = {
  /** Number of independently drifting smoke plumes. */
  plumes?: number;
  /** Tint of the smoke — warm for fire, cold for fog, red for signal smoke. */
  tone?: 'cold' | 'warm' | 'signal' | 'toxic';
  className?: string;
  intensity?: number;
  seed?: number;
};

const TONES = {
  cold: ['rgb(150 168 182 / 1)', 'rgb(70 86 100 / 1)'],
  warm: ['rgb(255 150 70 / 1)', 'rgb(120 48 16 / 1)'],
  signal: ['rgb(255 60 70 / 1)', 'rgb(120 12 26 / 1)'],
  toxic: ['rgb(157 255 77 / 1)', 'rgb(46 92 20 / 1)'],
} as const;

/**
 * Volumetric smoke built from large, heavily-blurred radial gradients that
 * drift, scale and rotate on independent loops.
 *
 * A real fluid sim would look better and cost 10ms a frame. Layered gradients
 * with different periods read as convincing volume for a fraction of that,
 * and they stay entirely on the compositor because only transform and opacity
 * are animated — the blur is baked into the static layer.
 */
export function VolumetricSmoke({
  plumes = 5,
  tone = 'cold',
  className,
  intensity = 1,
  seed = 7,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [bright, dark] = TONES[tone];

  // Client-only. These plumes are purely decorative, and their inline styles
  // carry long floats plus a `background` shorthand — React's hydration diff
  // flags both against the browser's normalised longhands. Rendering after
  // mount sidesteps the mismatch entirely and keeps ~20 heavily-blurred divs
  // out of the server payload.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useGsapContext(
    () => {
      if (reduced || !ref.current) return;

      // One timeline per instance rather than three tweens per plume: it can be
      // paused wholesale when the section scrolls out of view. Blurred layers
      // this large are expensive to repaint, so not animating them off-screen
      // is most of the win here.
      const timeline = gsap.timeline({ paused: true });

      gsap.utils.toArray<HTMLElement>('.smoke-plume').forEach((plume, i) => {
        const r = (n: number) => seeded(seed * 31 + i * 17 + n);

        timeline.to(
          plume,
          {
            xPercent: -30 + r(1) * 60,
            yPercent: -26 + r(2) * 34,
            scale: 1.15 + r(5) * 0.6,
            rotate: -22 + r(6) * 44,
            opacity: 0.18 + r(9) * 0.4,
            duration: 18 + r(3) * 16,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          },
          -r(4) * 20,
        );
      });

      const observer = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? timeline.play() : timeline.pause()),
        { rootMargin: '100px' },
      );
      observer.observe(ref.current);

      return () => {
        observer.disconnect();
        timeline.kill();
      };
    },
    ref,
    [reduced, plumes, seed, mounted],
  );

  if (!mounted) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ opacity: intensity }}
    >
      {Array.from({ length: plumes }, (_, i) => {
        const r = (n: number) => seeded(seed * 13 + i * 29 + n);
        // Blur is the cost driver and it scales with the blurred area, so both
        // the plume size and the radius are kept well below the originals.
        const size = 34 + r(1) * 34;
        return (
          <div
            key={i}
            className="smoke-plume absolute gpu"
            style={{
              left: `${r(2) * 100 - 20}%`,
              top: `${r(3) * 100 - 20}%`,
              width: `${size}vw`,
              height: `${size * (0.6 + r(4) * 0.6)}vw`,
              opacity: 0.2 + r(5) * 0.3,
              filter: `blur(${26 + r(6) * 20}px)`,
              background: `radial-gradient(closest-side, ${bright.replace(
                '/ 1)',
                `/ ${(0.13 + r(7) * 0.16).toFixed(3)})`,
              )}, ${dark.replace('/ 1)', `/ ${(0.1 + r(8) * 0.12).toFixed(3)})`)} 55%, transparent 78%)`,
              mixBlendMode: tone === 'cold' ? 'screen' : 'plus-lighter',
            }}
          />
        );
      })}
    </div>
  );
}
