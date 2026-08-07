'use client';

/**
 * Synthesised weapon SFX.
 *
 * Rather than shipping audio files, every sound is generated with the Web
 * Audio API: filtered noise bursts for gunfire, short transients for
 * mechanical clicks. Zero payload, and the timbre can be parameterised per
 * weapon class from the same data that drives the visuals.
 *
 * The context is created lazily on the first user gesture — browsers suspend
 * any AudioContext constructed before one.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.42;
    master.connect(ctx.destination);
  }

  if (ctx.state !== 'running') void ctx.resume();
  return ctx;
}

/**
 * Prime the audio pipeline from inside a user gesture.
 *
 * Call this from the click that turns sound on. A context first reached from
 * something that is *not* a gesture — a hover cue, a scroll-driven blip — is
 * created suspended and its resume() is rejected, so the next few sounds are
 * scheduled into a context that never runs and are silently lost. Building it
 * during the gesture, plus a zero-gain tick (the unlock iOS Safari insists on),
 * guarantees the very next shot is audible.
 */
export function unlockAudio() {
  const context = ensureContext();
  if (!context || !master) return;

  const tick = context.createBufferSource();
  tick.buffer = context.createBuffer(1, 1, context.sampleRate);
  tick.connect(master);
  tick.start(context.currentTime);
}

/** One second of white noise, reused by every shot. */
function getNoise(context: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const length = context.sampleRate;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

type ShotOptions = {
  /** Lower = heavier calibre. */
  pitch?: number;
  /** Seconds. */
  decay?: number;
  gain?: number;
};

/** A gunshot: a noise crack through a swept low-pass, plus a body thump. */
export function playShot({ pitch = 1, decay = 0.28, gain = 0.9 }: ShotOptions = {}) {
  const context = ensureContext();
  if (!context || !master) return;

  const now = context.currentTime;

  // Crack — broadband noise, filtered down fast.
  const noise = context.createBufferSource();
  noise.buffer = getNoise(context);

  const bandpass = context.createBiquadFilter();
  bandpass.type = 'lowpass';
  bandpass.frequency.setValueAtTime(9000 * pitch, now);
  bandpass.frequency.exponentialRampToValueAtTime(320 * pitch, now + decay);
  bandpass.Q.value = 1.4;

  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(gain, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

  noise.connect(bandpass).connect(noiseGain).connect(master);
  noise.start(now);
  noise.stop(now + decay + 0.05);

  // Body — a short sine drop that gives the shot weight.
  const osc = context.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180 * pitch, now);
  osc.frequency.exponentialRampToValueAtTime(38 * pitch, now + decay * 0.7);

  const oscGain = context.createGain();
  oscGain.gain.setValueAtTime(gain * 0.85, now);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay * 0.8);

  osc.connect(oscGain).connect(master);
  osc.start(now);
  osc.stop(now + decay);
}

/**
 * An explosion — grenades and launchers.
 *
 * Three layers, because a blast is not one sound: a bright crack for the
 * detonation front, a long filtered noise tail for the debris, and a sine that
 * falls into the sub range to give it body you feel more than hear.
 */
export function playBlast({ gain = 1 } = {}) {
  const context = ensureContext();
  if (!context || !master) return;

  const now = context.currentTime;

  // Detonation crack — very short, very bright.
  const crack = context.createBufferSource();
  crack.buffer = getNoise(context);
  const crackFilter = context.createBiquadFilter();
  crackFilter.type = 'highpass';
  crackFilter.frequency.value = 1800;
  const crackGain = context.createGain();
  crackGain.gain.setValueAtTime(gain * 0.7, now);
  crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  crack.connect(crackFilter).connect(crackGain).connect(master);
  crack.start(now);
  crack.stop(now + 0.15);

  // Body / debris tail.
  const tail = context.createBufferSource();
  tail.buffer = getNoise(context);
  const tailFilter = context.createBiquadFilter();
  tailFilter.type = 'lowpass';
  tailFilter.frequency.setValueAtTime(2400, now);
  tailFilter.frequency.exponentialRampToValueAtTime(120, now + 1.3);
  const tailGain = context.createGain();
  tailGain.gain.setValueAtTime(gain, now);
  tailGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
  tail.connect(tailFilter).connect(tailGain).connect(master);
  tail.start(now);
  tail.stop(now + 1.5);

  // Sub drop.
  const sub = context.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(140, now);
  sub.frequency.exponentialRampToValueAtTime(24, now + 0.9);
  const subGain = context.createGain();
  subGain.gain.setValueAtTime(gain, now);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1);
  sub.connect(subGain).connect(master);
  sub.start(now);
  sub.stop(now + 1.1);
}

/**
 * A blade swing — a swish that rises then falls as the edge passes.
 *
 * The character is entirely in the bandpass sweep; a flat noise burst reads as
 * static rather than movement.
 */
export function playSlash({ gain = 0.55 } = {}) {
  const context = ensureContext();
  if (!context || !master) return;

  const now = context.currentTime;
  const noise = context.createBufferSource();
  noise.buffer = getNoise(context);

  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 2.4;
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(5200, now + 0.09);
  filter.frequency.exponentialRampToValueAtTime(700, now + 0.26);

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(gain, now + 0.05);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

  noise.connect(filter).connect(envelope).connect(master);
  noise.start(now);
  noise.stop(now + 0.35);
}

/** Escaping gas — the hiss a smoke canister makes as it vents. */
export function playSmoke({ gain = 0.32, duration = 1.8 } = {}) {
  const context = ensureContext();
  if (!context || !master) return;

  const now = context.currentTime;
  const noise = context.createBufferSource();
  noise.buffer = getNoise(context);
  noise.loop = true;

  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1600, now);
  filter.frequency.exponentialRampToValueAtTime(700, now + duration);
  filter.Q.value = 0.8;

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(gain, now + 0.18);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter).connect(envelope).connect(master);
  noise.start(now);
  noise.stop(now + duration + 0.1);
}

/** A mechanical click — magazine release, bolt catch, selector switch. */
export function playClick({ pitch = 1, gain = 0.5 } = {}) {
  const context = ensureContext();
  if (!context || !master) return;

  const now = context.currentTime;
  const noise = context.createBufferSource();
  noise.buffer = getNoise(context);

  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2600 * pitch;
  filter.Q.value = 7;

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(gain, now);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

  noise.connect(filter).connect(envelope).connect(master);
  noise.start(now);
  noise.stop(now + 0.08);
}

/** The full reload: mag out, mag in, bolt release. */
export function playReload() {
  const context = ensureContext();
  if (!context) return;
  playClick({ pitch: 0.8, gain: 0.4 });
  window.setTimeout(() => playClick({ pitch: 1.15, gain: 0.55 }), 340);
  window.setTimeout(() => playClick({ pitch: 0.6, gain: 0.65 }), 720);
}

/** A soft UI blip for hovers and panel transitions. */
export function playUi({ pitch = 1, gain = 0.12 } = {}) {
  const context = ensureContext();
  if (!context || !master) return;

  const now = context.currentTime;
  const osc = context.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(880 * pitch, now);
  osc.frequency.exponentialRampToValueAtTime(1500 * pitch, now + 0.07);

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(gain, now + 0.01);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  osc.connect(envelope).connect(master);
  osc.start(now);
  osc.stop(now + 0.2);
}

/** Per-class shot character, derived from the weapon category. */
export const SHOT_PROFILES: Record<string, ShotOptions> = {
  'assault-rifle': { pitch: 1, decay: 0.26 },
  'sniper-rifle': { pitch: 0.62, decay: 0.72, gain: 1 },
  dmr: { pitch: 0.8, decay: 0.42 },
  smg: { pitch: 1.35, decay: 0.16, gain: 0.7 },
  shotgun: { pitch: 0.5, decay: 0.5, gain: 1 },
  pistol: { pitch: 1.2, decay: 0.2, gain: 0.7 },
  lmg: { pitch: 0.85, decay: 0.3 },
  launcher: { pitch: 0.35, decay: 1.1, gain: 1 },
  throwable: { pitch: 0.4, decay: 0.9, gain: 0.9 },
  melee: { pitch: 2.2, decay: 0.08, gain: 0.35 },
};
