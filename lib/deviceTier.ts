'use client';

export type DeviceTier = 'high' | 'low' | 'off';

/**
 * Decide how much 3D this machine should be asked to render.
 *
 * The hero's WebGL scene is by far the most demanding thing on the page, and
 * on a software rasteriser (or a very weak integrated GPU) it will not reach a
 * usable frame rate no matter how much the scene is trimmed. On those machines
 * the right answer is not "render it badly" — it is "don't render it", and let
 * the designed CSS backdrop stand in.
 *
 * Probed once and cached: creating a WebGL context is not free, and the answer
 * cannot change during a session.
 */
let cached: DeviceTier | null = null;

export function detectDeviceTier(): DeviceTier {
  if (cached) return cached;
  if (typeof window === 'undefined') return 'high';

  // Cheap signals first — no context creation needed.
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;

  if (cores <= 2 || memory <= 2) {
    cached = 'off';
    return cached;
  }

  let canvas: HTMLCanvasElement | null = null;
  try {
    canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ??
      canvas.getContext('webgl')) as WebGLRenderingContext | null;

    if (!gl) {
      cached = 'off';
      return cached;
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? '')
      : '';
    const name = renderer.toLowerCase();

    // Software rasterisers. These report as WebGL-capable but render on the
    // CPU, so a full-screen fragment-heavy scene is hopeless.
    const isSoftware =
      name.includes('swiftshader') ||
      name.includes('llvmpipe') ||
      name.includes('softpipe') ||
      name.includes('basic render') ||
      name.includes('microsoft basic');

    if (isSoftware) {
      cached = 'off';
      return cached;
    }

    // Older low-power integrated parts: run the scene, but at the reduced
    // budget rather than the full one.
    const isWeakIntegrated =
      /intel.*(hd|uhd) graphics (5|6)\d{2}/.test(name) ||
      name.includes('intel(r) hd graphics') ||
      name.includes('mali-4') ||
      name.includes('adreno (tm) 3') ||
      cores <= 4 ||
      memory <= 4;

    cached = isWeakIntegrated ? 'low' : 'high';
    return cached;
  } catch {
    // A throwing probe means WebGL is unavailable or blocked.
    cached = 'off';
    return cached;
  } finally {
    // Release the probe context promptly rather than waiting for GC.
    canvas?.remove();
  }
}
