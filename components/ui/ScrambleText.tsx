'use client';

import { createElement, useEffect, useRef, type ElementType } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

const GLYPHS = '▚▞█▓▒░#@%&$*+=-<>[]{}/\\|01AXKZQR';

type Props = {
  text: string;
  className?: string;
  as?: ElementType;
  /** Seconds per character before it locks to its final glyph. */
  speed?: number;
  /** Re-scramble on hover of the nearest [data-scramble-host]. */
  hover?: boolean;
  /** Fire when scrolled into view rather than on mount. */
  onScroll?: boolean;
  delay?: number;
};

/**
 * Decoding-text effect. Characters cycle through junk glyphs and lock left to
 * right, like a terminal resolving a callsign.
 *
 * Runs on a single GSAP tween driving one string mutation per frame — no
 * per-character timers, and the final text is always exact.
 */
export function ScrambleText({
  text,
  className,
  as: Tag = 'span',
  speed = 0.032,
  hover = false,
  onScroll = true,
  delay = 0,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      el.textContent = text;
      return;
    }

    const chars = text.split('');
    const state = { progress: 0 };
    let tween: gsap.core.Tween | null = null;

    const render = () => {
      const locked = state.progress * chars.length;
      el.textContent = chars
        .map((char, i) => {
          if (char === ' ') return ' ';
          if (i < locked) return char;
          // Characters just past the lock point flicker fastest.
          if (i < locked + 6) {
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
          return '';
        })
        .join('');
    };

    const play = () => {
      tween?.kill();
      state.progress = 0;
      tween = gsap.to(state, {
        progress: 1,
        duration: Math.max(0.4, chars.length * speed),
        ease: 'power1.inOut',
        delay,
        onUpdate: render,
        onComplete: () => {
          el.textContent = text;
        },
      });
    };

    let trigger: ScrollTrigger | null = null;

    if (onScroll) {
      el.textContent = '';
      trigger = ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: play });
    } else {
      play();
    }

    let host: HTMLElement | null = null;
    if (hover) {
      host = el.closest<HTMLElement>('[data-scramble-host]') ?? el;
      host.addEventListener('pointerenter', play);
    }

    return () => {
      tween?.kill();
      trigger?.kill();
      host?.removeEventListener('pointerenter', play);
    };
  }, [text, speed, hover, onScroll, delay, reduced]);

  // createElement rather than <Tag> — a polymorphic `as` prop can't be typed
  // through JSX without collapsing every intrinsic element's props to `never`.
  return createElement(
    Tag,
    {
      ref,
      className: cn('inline-block', className),
      // Reserve the final width so locking glyphs never reflow the line.
      style: { minWidth: `${text.length}ch` },
      'aria-label': text,
    },
    text,
  );
}
