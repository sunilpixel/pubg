'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { formatStat, cn } from '@/lib/utils';

type Props = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
};

/**
 * Rolling odometer counter. Counts up once when scrolled into view, with a
 * long ease-out so the last few digits settle rather than snap.
 *
 * `tabular-nums` and a reserved min-width keep the surrounding layout from
 * shifting as digit counts change mid-count.
 */
export function Counter({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 2.4,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useGsapContext(
    () => {
      const el = ref.current;
      if (!el) return;

      const final = `${prefix}${formatStat(value, decimals)}${suffix}`;

      if (reduced) {
        el.textContent = final;
        return;
      }

      const state = { n: 0 };
      el.textContent = `${prefix}${formatStat(0, decimals)}${suffix}`;

      const trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(state, {
            n: value,
            duration,
            ease: 'power3.out',
            onUpdate: () => {
              el.textContent = `${prefix}${formatStat(state.n, decimals)}${suffix}`;
            },
            onComplete: () => {
              el.textContent = final;
            },
          });
        },
      });

      return () => trigger.kill();
    },
    ref,
    [value, decimals, prefix, suffix, duration, reduced],
  );

  return (
    <span
      ref={ref}
      className={cn('tabular-nums', className)}
      aria-label={`${prefix}${formatStat(value, decimals)}${suffix}`}
    >
      {`${prefix}${formatStat(value, decimals)}${suffix}`}
    </span>
  );
}
