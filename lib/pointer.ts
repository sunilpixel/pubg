'use client';

/**
 * A single global pointer source.
 *
 * Dozens of components want mouse-parallax. Each one attaching its own
 * `pointermove` listener would mean dozens of handlers firing per event and
 * dozens of independent rAF loops. Instead there is exactly one listener and
 * one rAF loop here; components subscribe to the smoothed value.
 */

export type PointerState = {
  /** Raw viewport coordinates in px. */
  x: number;
  y: number;
  /** Normalised to -1..1 with the viewport centre at 0. */
  nx: number;
  ny: number;
  /** Damped versions of nx/ny — what parallax should actually read. */
  sx: number;
  sy: number;
  /** Pointer speed in px/frame, useful for trail and distortion intensity. */
  speed: number;
  down: boolean;
};

type Listener = (state: PointerState) => void;

const state: PointerState = { x: 0, y: 0, nx: 0, ny: 0, sx: 0, sy: 0, speed: 0, down: false };

const listeners = new Set<Listener>();
let running = false;
let rafId = 0;
let lastX = 0;
let lastY = 0;

/** Damping factor per frame — lower is heavier/more cinematic. */
const DAMPING = 0.085;

function tick() {
  state.sx += (state.nx - state.sx) * DAMPING;
  state.sy += (state.ny - state.sy) * DAMPING;

  const dx = state.x - lastX;
  const dy = state.y - lastY;
  state.speed += (Math.hypot(dx, dy) - state.speed) * 0.2;
  lastX = state.x;
  lastY = state.y;

  for (const listener of listeners) listener(state);

  rafId = requestAnimationFrame(tick);
}

function onMove(event: PointerEvent) {
  state.x = event.clientX;
  state.y = event.clientY;
  state.nx = (event.clientX / window.innerWidth) * 2 - 1;
  state.ny = (event.clientY / window.innerHeight) * 2 - 1;
}

const onDown = () => {
  state.down = true;
};
const onUp = () => {
  state.down = false;
};

function start() {
  if (running || typeof window === 'undefined') return;
  running = true;
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  rafId = requestAnimationFrame(tick);
}

function stop() {
  if (!running) return;
  running = false;
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerdown', onDown);
  window.removeEventListener('pointerup', onUp);
  cancelAnimationFrame(rafId);
}

/** Subscribe to the shared pointer loop. Returns an unsubscribe function. */
export function subscribePointer(listener: Listener): () => void {
  listeners.add(listener);
  start();

  return () => {
    listeners.delete(listener);
    // Last subscriber out turns off the lights.
    if (listeners.size === 0) stop();
  };
}

export const getPointer = (): Readonly<PointerState> => state;
