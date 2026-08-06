'use client';

import { useEffect, useRef } from 'react';
import { subscribePointer } from '@/lib/pointer';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

type Mode = 'dust' | 'ash' | 'ember' | 'shell' | 'snow';

/** A layer of particles: one visual type and how many of them. */
export type ParticleLayer = { mode: Mode; count: number };

type Props = {
  /**
   * A single type, or several sharing one canvas. Prefer the array form —
   * every extra <ParticleField> is another canvas, another rAF loop and
   * another full-viewport clear per frame.
   */
  mode?: Mode;
  layers?: ParticleLayer[];
  /** Particle count at 1920×1080; scaled by area on other viewports. */
  count?: number;
  className?: string;
  /** Particles drift against the mouse for depth. */
  parallax?: number;
  opacity?: number;
};

type Particle = {
  mode: Mode;
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
 * Pre-render a soft radial glow into an offscreen canvas, once.
 *
 * Building a `createRadialGradient` per particle per frame was the dominant
 * cost in this component — with 34 embers at 60fps that is ~2000 gradient
 * objects allocated per second, all of which the GC then has to collect.
 * Drawing a cached sprite with `drawImage` instead is roughly an order of
 * magnitude cheaper and looks the same.
 */
function makeGlowSprite(hue: number): HTMLCanvasElement {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, `hsl(${hue} 100% 72% / 1)`);
    grd.addColorStop(0.35, `hsl(${hue} 100% 52% / 0.5)`);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
  }
  return canvas;
}

/**
 * Canvas particle field — floating dust, drifting ash, rising embers, falling
 * bullet casings, or snow. Several types can share one canvas.
 *
 * Performance posture:
 *  - one canvas, one rAF, no per-particle DOM
 *  - glow sprites cached, never rebuilt per frame
 *  - DPR capped at 1.5 (these particles are soft and low-contrast; a full
 *    retina buffer more than doubles fill rate for no perceptible gain)
 *  - IntersectionObserver parks the loop when the section is off-screen
 *  - the loop also stops on `visibilitychange` so background tabs cost nothing
 */
export function ParticleField({
  mode = 'dust',
  layers,
  count = 90,
  className,
  parallax = 26,
  opacity = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  // Stringified so the effect doesn't re-run on every render from a fresh
  // array literal at the call site.
  const layerKey = JSON.stringify(layers ?? [{ mode, count }]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const spec: ParticleLayer[] = JSON.parse(layerKey);

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let raf = 0;
    let running = false;
    let pointerX = 0;
    let pointerY = 0;

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    // One sprite per glowing mode present, built once.
    const sprites = new Map<Mode, HTMLCanvasElement[]>();
    for (const layer of spec) {
      const palette = PALETTES[layer.mode];
      if (palette.glow && !sprites.has(layer.mode)) {
        sprites.set(layer.mode, [
          makeGlowSprite(palette.hue[0]),
          makeGlowSprite(palette.hue[1]),
        ]);
      }
    }

    const spawn = (mode: Mode, initial: boolean): Particle => {
      const palette = PALETTES[mode];
      const z = Math.random();
      const base: Particle = {
        mode,
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

      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Scale density with area so a phone doesn't run a 4K particle budget.
      const scale = Math.min(1, (width * height) / (1920 * 1080) + 0.25);
      particles = spec.flatMap((layer) =>
        Array.from({ length: Math.round(layer.count * scale) }, () =>
          spawn(layer.mode, true),
        ),
      );
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw non-glowing particles first in source-over, then switch once to
      // additive for the glowing ones. Two composite-mode switches per frame
      // instead of one per particle.
      let additive = false;
      ctx.globalCompositeOperation = 'source-over';

      for (const p of particles) {
        p.life += 1 / 60;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;

        // Gentle sinusoidal sway — the difference between "particles" and "dust".
        if (p.mode === 'dust' || p.mode === 'snow' || p.mode === 'ash') {
          p.x += Math.sin(p.life * 1.4 + p.z * 8) * 0.16 * (0.4 + p.z);
        }
        if (p.mode === 'ember') {
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
          const glowSprites = sprites.get(p.mode);
          const wantsAdditive = Boolean(glowSprites) && p.mode !== 'shell';

          if (wantsAdditive !== additive) {
            additive = wantsAdditive;
            ctx.globalCompositeOperation = additive ? 'lighter' : 'source-over';
          }

          if (p.mode === 'shell') {
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
          } else if (glowSprites) {
            // Cached sprite blit — no per-frame gradient allocation.
            const sprite = glowSprites[p.z > 0.5 ? 1 : 0];
            const d = p.size * 10;
            ctx.globalAlpha = alpha;
            ctx.drawImage(sprite, sx - d / 2, sy - d / 2, d, d);
            ctx.globalAlpha = 1;
          } else {
            ctx.globalAlpha = alpha;
            ctx.fillStyle =
              p.mode === 'snow'
                ? `hsl(${p.hue} 30% 92%)`
                : p.mode === 'ash'
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
        if (gone) Object.assign(p, spawn(p.mode, false));
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
      { rootMargin: '80px' },
    );
    observer.observe(canvas);

    // Debounced: a resize storm would otherwise re-seed every particle on
    // every intermediate width.
    let resizeTimer = 0;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 180);
    });
    resizeObserver.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      clearTimeout(resizeTimer);
      observer.disconnect();
      resizeObserver.disconnect();
      unsubscribePointer();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [layerKey, parallax, opacity, reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  );
}
