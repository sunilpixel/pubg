'use client';

import { useRef, type ReactNode } from 'react';
import { useSplitReveal } from '@/hooks/useSplitReveal';
import { ScrambleText } from './ScrambleText';
import { cn } from '@/lib/utils';

type Props = {
  /** Small monospace kicker above the title. */
  eyebrow?: string;
  /** Section index, e.g. "03". Rendered as an oversized ghost numeral. */
  index?: string;
  title: string;
  /** Second line, rendered in outline type. */
  accent?: string;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
};

/**
 * The shared section masthead. Kicker scrambles in, the title reveals through
 * a masked SplitText, and an oversized index numeral sits behind everything as
 * a compositional anchor.
 */
export function SectionHeading({
  eyebrow,
  index,
  title,
  accent,
  description,
  align = 'left',
  className,
}: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  useSplitReveal(titleRef, { type: 'chars', stagger: 0.022, y: 118, duration: 1.05 });
  useSplitReveal(descRef, { type: 'lines', stagger: 0.07, y: 100, duration: 0.95, delay: 0.18 });

  const centered = align === 'center';

  return (
    <header
      className={cn(
        'relative',
        centered ? 'mx-auto max-w-3xl text-center' : 'max-w-4xl',
        className,
      )}
    >
      {index ? (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute -top-16 select-none font-display text-[clamp(7rem,18vw,15rem)] leading-none text-white/[0.028]',
            centered ? 'left-1/2 -translate-x-1/2' : '-left-4',
          )}
        >
          {index}
        </span>
      ) : null}

      {eyebrow ? (
        <div
          className={cn(
            'relative mb-6 flex items-center gap-4',
            centered && 'justify-center',
          )}
        >
          <span className="h-px w-10 bg-linear-to-r from-transparent to-ember" />
          <ScrambleText
            text={eyebrow}
            className="font-mono text-[10px] uppercase tracking-[0.42em] text-ember"
          />
          <span className="h-px w-10 bg-linear-to-l from-transparent to-ember" />
        </div>
      ) : null}

      <h2
        ref={titleRef}
        data-anim-hidden
        className="relative font-display text-[clamp(2.75rem,8vw,7rem)]"
      >
        <span className="text-etched block">{title}</span>
        {accent ? (
          <span className="text-outline mt-1 block" data-cursor="view">
            {accent}
          </span>
        ) : null}
      </h2>

      {description ? (
        <p
          ref={descRef}
          data-anim-hidden
          className={cn(
            'mt-8 text-pretty text-base leading-relaxed text-smoke sm:text-lg',
            centered ? 'mx-auto max-w-2xl' : 'max-w-2xl',
          )}
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}
