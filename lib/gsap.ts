'use client';

/**
 * Single registration point for GSAP and every plugin the experience uses.
 * Import `gsap` (and the plugins) from here — never from 'gsap' directly — so
 * registration is guaranteed to have run exactly once before any tween.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { SplitText } from 'gsap/SplitText';
import { Observer } from 'gsap/Observer';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

let registered = false;

if (typeof window !== 'undefined' && !registered) {
  registered = true;

  gsap.registerPlugin(
    ScrollTrigger,
    Flip,
    MotionPathPlugin,
    SplitText,
    Observer,
    CustomEase,
    ScrollToPlugin,
  );

  /* ------------------------------------------------------------------ *
   * Signature eases — the motion "voice" of the whole site.
   * ------------------------------------------------------------------ */

  // Long luxurious settle. Apple-keynote deceleration.
  CustomEase.create('cinema', 'M0,0 C0.12,0 0.14,0.3 0.2,0.55 0.28,0.86 0.44,1 1,1');
  // Heavy mechanical slam — magazine seating, bolt closing.
  CustomEase.create('slam', 'M0,0 C0.3,0 0.36,0.06 0.5,0.42 0.62,0.74 0.7,1 1,1');
  // Sharp overshoot with a metallic settle. Recoil, card pop-in.
  CustomEase.create('recoil', 'M0,0 C0.1,0 0.16,1.14 0.38,1.06 0.56,0.99 0.7,1 1,1');
  // Two-stage: fast out, hold, fast in. Used for shutter/blink transitions.
  CustomEase.create('shutter', 'M0,0 C0.06,0.72 0.16,0.94 0.3,0.96 0.62,1 0.7,0.99 1,1');
  // Gravity-ish fall for the supply crate.
  CustomEase.create('drop', 'M0,0 C0.55,0 0.78,0.16 0.88,0.5 0.94,0.72 0.96,1 1,1');

  /* ------------------------------------------------------------------ *
   * Global defaults + performance posture.
   * ------------------------------------------------------------------ */

  gsap.defaults({ ease: 'cinema', duration: 1 });

  // force3D keeps transforms on the compositor; nullTargetWarn off keeps the
  // console clean when sections unmount mid-flight.
  gsap.config({ force3D: true, nullTargetWarn: false, autoSleep: 60 });

  // Recalculating on every mobile URL-bar nudge causes visible jitter; only
  // react to real width changes.
  ScrollTrigger.config({ ignoreMobileResize: true });
  ScrollTrigger.normalizeScroll(false);
}

export {
  gsap,
  ScrollTrigger,
  Flip,
  MotionPathPlugin,
  SplitText,
  Observer,
  CustomEase,
  ScrollToPlugin,
};

/** Clamp helper used across parallax + pointer math. */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Linear interpolation. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Map a value from one range onto another. */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
