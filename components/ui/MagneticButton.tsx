'use client';

import {
  forwardRef,
  useCallback,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { gsap } from '@/lib/gsap';
import { useMagnetic } from '@/hooks/useMagnetic';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  /** Magnetic pull, 0 disables. */
  strength?: number;
  icon?: ReactNode;
  /** Renders as an anchor when provided. */
  href?: string;
};

const VARIANTS: Record<Variant, string> = {
  primary:
    'text-void bg-linear-to-b from-ember-300 via-ember to-ember-700 shadow-[0_10px_40px_-10px_rgb(255_106_26/0.85)]',
  danger:
    'text-chalk bg-linear-to-b from-blood via-blood to-blood-700 shadow-[0_10px_40px_-10px_rgb(224_23_48/0.8)]',
  outline: 'text-bone bg-white/[0.03] border border-white/15 hover:border-ember/60',
  ghost: 'text-smoke hover:text-chalk bg-transparent',
};

/**
 * The site's primary action: magnetic pull, a ripple that originates at the
 * exact click point, and a specular sweep on hover.
 */
export const MagneticButton = forwardRef<HTMLButtonElement, Props>(function MagneticButton(
  { children, variant = 'primary', strength = 0.35, icon, href, className, onClick, ...rest },
  _forwardedRef,
) {
  const rootRef = useRef<HTMLButtonElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  useMagnetic(rootRef, { strength, inner: innerRef });

  const spawnRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const el = rootRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    // Cover the furthest corner from the click point.
    const size = Math.hypot(rect.width, rect.height) * 2;

    ripple.className = 'pointer-events-none absolute rounded-full';
    ripple.style.cssText = `
      left:${event.clientX - rect.left}px;
      top:${event.clientY - rect.top}px;
      width:${size}px;height:${size}px;margin-left:${-size / 2}px;margin-top:${-size / 2}px;
      background:radial-gradient(circle, rgb(255 255 255 / .55), rgb(255 255 255 / 0) 62%);
      will-change:transform,opacity;
    `;
    el.appendChild(ripple);

    gsap.fromTo(
      ripple,
      { scale: 0, opacity: 0.85 },
      {
        scale: 1,
        opacity: 0,
        duration: 0.78,
        ease: 'power2.out',
        onComplete: () => ripple.remove(),
      },
    );
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    spawnRipple(event);
    onClick?.(event);
  };

  const classes = cn(
    'group relative isolate inline-flex items-center justify-center gap-3 overflow-hidden',
    'rounded-full px-8 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.28em]',
    'transition-[color,border-color,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)]',
    'gpu will-change-transform',
    VARIANTS[variant],
    className,
  );

  const content = (
    <>
      {/* Specular sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-24deg] bg-linear-to-r from-transparent via-white/35 to-transparent transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-full"
      />
      {/* Ember bloom behind the label */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            variant === 'danger'
              ? 'radial-gradient(closest-side, rgb(224 23 48 / .7), transparent)'
              : 'radial-gradient(closest-side, rgb(255 106 26 / .65), transparent)',
        }}
      />
      <span ref={innerRef} className="relative z-10 inline-flex items-center gap-3">
        {icon}
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        data-cursor="target"
        onClick={spawnRipple}
        ref={rootRef as unknown as React.Ref<HTMLAnchorElement>}
      >
        {content}
      </a>
    );
  }

  return (
    <button ref={rootRef} className={classes} data-cursor="target" onClick={handleClick} {...rest}>
      {content}
    </button>
  );
});
