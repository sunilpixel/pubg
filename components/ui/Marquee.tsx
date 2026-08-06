'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

type Props = {
  items: string[];
  /** Seconds for one full cycle. */
  duration?: number;
  reverse?: boolean;
  className?: string;
  separator?: string;
};

/**
 * Infinite marquee whose speed and direction respond to scroll velocity —
 * scroll down and it accelerates, scroll up and it reverses. The seam is
 * hidden by rendering the strip twice and wrapping x with modifiers, so there
 * is no jump on loop.
 */
export function Marquee({
  items,
  duration = 26,
  reverse = false,
  className,
  separator = '✦',
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGsapContext(
    () => {
      if (reduced) return;

      const strips = gsap.utils.toArray<HTMLElement>('.marquee-strip');
      if (!strips.length) return;

      const direction = reverse ? 1 : -1;

      const tween = gsap.to(strips, {
        xPercent: direction * 100,
        repeat: -1,
        duration,
        ease: 'none',
        // Wrap keeps both copies inside the same 100% window forever.
        modifiers: {
          xPercent: gsap.utils.unitize((x: number) => gsap.utils.wrap(-100, 0, parseFloat(String(x)))),
        },
      });

      // Scroll velocity retimes the loop and skews the type slightly.
      //
      // The previous version created a brand-new gsap.to() inside onUpdate,
      // i.e. a tween allocation on every single scroll event — hundreds per
      // second during a fast scroll, each one immediately overwriting the last.
      // Now the skew is eased toward a target on GSAP's existing ticker with
      // no allocation at all.
      const skewSetter = gsap.quickSetter(strips, 'skewX', 'deg');
      let targetSkew = 0;
      let currentSkew = 0;

      const easeSkew = () => {
        // The target decays on its own, so when scrolling stops the skew
        // settles back to zero without needing a timer per scroll event.
        targetSkew *= 0.9;

        const next = currentSkew + (targetSkew - currentSkew) * 0.12;
        if (Math.abs(next - currentSkew) < 0.01) {
          if (currentSkew !== 0 && Math.abs(currentSkew) < 0.02) {
            currentSkew = 0;
            skewSetter(0);
          }
          return;
        }
        currentSkew = next;
        skewSetter(currentSkew);
      };
      gsap.ticker.add(easeSkew);

      const st = ScrollTrigger.create({
        onUpdate: (self) => {
          const scaled = gsap.utils.clamp(-4, 4, self.getVelocity() / 380);
          tween.timeScale(gsap.utils.clamp(0.35, 5, 1 + Math.abs(scaled)));
          targetSkew = gsap.utils.clamp(-7, 7, -scaled * 1.5);
        },
      });

      return () => {
        gsap.ticker.remove(easeSkew);
        tween.kill();
        st.kill();
      };
    },
    rootRef,
    [duration, reverse, reduced],
  );

  const strip = (key: string) => (
    <div
      key={key}
      aria-hidden={key !== 'a'}
      className="marquee-strip flex shrink-0 items-center gap-10 whitespace-nowrap pr-10 will-change-transform"
    >
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="inline-flex items-center gap-10">
          <span>{item}</span>
          <span className="text-ember/70">{separator}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={cn('relative flex overflow-hidden py-5 select-none', className)}
      role="marquee"
      aria-label={items.join(', ')}
    >
      {/* Feathered edges so items fade rather than clip at the viewport */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-linear-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-linear-to-l from-void to-transparent" />
      {strip('a')}
      {strip('b')}
    </div>
  );
}
