'use client';

import { useEffect, useRef } from 'react';
import { subscribePointer } from '@/lib/pointer';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

type Mode = 'dust' | 'ash' | 'ember' | 'shell' | 'snow';

type Props = {
  mode?: Mode;
  /** Particle count at 1920×1080; scaled by area on other viewports. */
  count?: number;
  className?: string;
  /** Particles drift against the mouse for depth. */
  parallax?: number;
  opacity?: number;
};

type Particle = {
  x: number;
  y: number;
  z: number; // depth 0..1 — drives size, speed and blur
  vx: number;
  vy: number;
  size: number;
  spin: number;
  angle: number;
  life: number;
  maxLife: number;
  hue: number;
};

const PALETTES: Record<Mode, { hue: [number, number]; glow: boolean }> = {
  dust: { hue: [34, 42], glow: false },
  ash: { hue: [0, 30], glow: false },
  ember: { hue: [12, 42], glow: true },
  shell: { hue: [38, 48], glow: true },
  snow: { hue: [200, 215], glow: false },
};

/**
 * Canvas particle field — floating dust, drifting ash, rising embers, falling
 * bullet casings, or snow.
 *
 * Performance posture:
 *  - one canvas, one rAF, no per-particle DOM
 *  - DPR capped at 2 (a 3x retina canvas costs 2.25× the fill rate for no
 *    perceptible gain on particles this soft)
 *  - IntersectionObserver parks the loop when the section is off-screen
 *  - the loop also stops on `visibilitychange` so background tabs cost nothing
 */
export function ParticleField({
  mode = 'dust',
  count = 90,
  className,
  parallax = 26,
  opacity = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const palette = PALETTES[mode];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let raf = 0;
    let running = false;
    let pointerX = 0;
    let pointerY = 0;

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const spawn = (initial: boolean): Particle => {
      const z = Math.random();
      const base: Particle = {
        x: Math.random() * width,
        y: initial ? Math.random() * height : -30,
        z,
        vx: 0,
        vy: 0,
        size: 0,
        spin: rand(-0.05, 0.05),
        angle: Math.random() * Math.PI * 2,
        life: 0,
        maxLife: rand(6, 16),
        hue: rand(palette.hue[0], palette.hue[1]),
      };

      switch (mode) {
        case 'dust':
          base.vx = rand(-0.09, 0.09) * (0.4 + z);
          base.vy = rand(-0.16, -0.03) * (0.4 + z);
          base.size = rand(0.6, 2.1) * (0.5 + z);
          break;
        case 'ash':
          base.vx = rand(-0.3, 0.16);
          base.vy = rand(0.08, 0.34) * (0.5 + z);
          base.size = rand(1, 3.4) * (0.5 + z);
          base.y = initial ? Math.random() * height : -20;
          break;
        case 'ember':
          base.vx = rand(-0.22, 0.22);
          base.vy = rand(-0.9, -0.28) * (0.5 + z);
          base.size = rand(0.8, 2.3) * (0.5 + z);
          base.y = initial ? Math.random() * height : height + 20;
          break;
        case 'shell':
          base.vx = rand(-0.5, 0.5);
          base.vy = rand(0.9, 2.1) * (0.5 + z);
          base.size = rand(2.4, 5) * (0.5 + z);
          base.spin = rand(-0.22, 0.22);
          base.y = initial ? Math.random() * height : -30;
          break;
        case 'snow':
          base.vx = rand(-0.4, 0.28);
          base.vy = rand(0.3, 0.9) * (0.4 + z);
          base.size = rand(1, 3) * (0.5 + z);
          base.y = initial ? Math.random() * height : -20;
          break;
      }
      return base;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Scale density with area so a phone doesn't run a 4K particle budget.
      const density = Math.round(count * Math.min(1.15, (width * height) / (1920 * 1080) + 0.28));
      particles = Array.from({ length: density }, () => spawn(true));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = palette.glow ? 'lighter' : 'source-over';

      for (const p of particles) {
        p.life += 1 / 60;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;

        // Gentle sinusoidal sway — the difference between "particles" and "dust".
        if (mode === 'dust' || mode === 'snow' || mode === 'ash') {
          p.x += Math.sin(p.life * 1.4 + p.z * 8) * 0.16 * (0.4 + p.z);
        }
        if (mode === 'ember') {
          p.x += Math.sin(p.life * 3.1 + p.z * 12) * 0.3;
          p.vy *= 0.998; // embers decelerate as they cool
        }

        const drift = (1 - p.z) * parallax;
        const sx = p.x + pointerX * drift;
        const sy = p.y + pointerY * drift * 0.5;

        const fadeIn = Math.min(1, p.life * 2);
        const fadeOut = Math.min(1, (p.maxLife - p.life) / 2);
        const alpha =
          Math.max(0, Math.min(fadeIn, fadeOut)) * (0.25 + p.z * 0.75) * opacity;

        if (alpha > 0.004) {
          if (mode === 'shell') {
            // Brass casings: little tumbling capsules with a bright edge.
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(p.angle);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = `hsl(${p.hue} 72% 58%)`;
            ctx.fillRect(-p.size * 0.32, -p.size, p.size * 0.64, p.size * 2);
            ctx.fillStyle = `hsl(${p.hue} 90% 78%)`;
            ctx.fillRect(-p.size * 0.32, -p.size, p.size * 0.2, p.size * 2);
            ctx.restore();
          } else if (palette.glow) {
            const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size * 5);
            grd.addColorStop(0, `hsl(${p.hue} 100% 72% / ${alpha})`);
            grd.addColorStop(0.35, `hsl(${p.hue} 100% 52% / ${alpha * 0.5})`);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(sx, sy, p.size * 5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.globalAlpha = alpha;
            ctx.fillStyle =
              mode === 'snow'
                ? `hsl(${p.hue} 30% 92%)`
                : mode === 'ash'
                  ? `hsl(${p.hue} 8% 62%)`
                  : `hsl(${p.hue} 24% 74%)`;
            ctx.beginPath();
            ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        // Recycle rather than allocate — keeps the GC out of the frame budget.
        const gone =
          p.life > p.maxLife ||
          p.y < -60 ||
          p.y > height + 60 ||
          p.x < -80 ||
          p.x > width + 80;
        if (gone) Object.assign(p, spawn(false));
      }

      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();

    const unsubscribePointer = subscribePointer(({ sx, sy }) => {
      pointerX = sx;
      pointerY = sy;
    });

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '120px' },
    );
    observer.observe(canvas);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      unsubscribePointer();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [mode, count, parallax, opacity, reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  );
}
