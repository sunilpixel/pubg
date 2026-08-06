/** Minimal className joiner — avoids pulling clsx in for a five-line helper. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Deterministic pseudo-random in [0,1) from an integer seed.
 *  Used for particle fields so SSR and the client agree on layout. */
export function seeded(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Format a number the way an in-game HUD would. */
export function formatStat(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
