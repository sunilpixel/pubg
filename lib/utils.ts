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

/**
 * A DOM-safe id token derived from the caller's own data.
 *
 * SVG `<defs>` need unique ids and `useId()` is the usual answer, but its value
 * encodes the component's position in the React tree — and every section below
 * the hero is a `next/dynamic` import. The server renders those inline while
 * the client resolves them through a lazy boundary, so the two trees number
 * their ids differently and every `url(#…)` reference mismatches on hydration.
 *
 * Hashing the data the definitions are drawn from sidesteps the tree entirely:
 * the same map, weapon or operator yields the same id on both sides. Two
 * instances of the same subject collide by design — their defs are byte-for-byte
 * identical, so resolving both to one set is correct.
 *
 * Prefix the seed with the artwork's own namespace. Entity ids are only unique
 * within their collection (VEHICLES and OPERATORS both contain a `wraith`) and
 * two components can name a definition the same thing — VehicleArt and
 * OperatorPortrait both define a `rim` — so an unprefixed seed would have the
 * wheel gradient and the helmet backlight fighting over one DOM id.
 */
export function stableId(seed: string): string {
  // FNV-1a: a few lines, no dependency, and well spread over the short keys
  // (ids, hex colours) that get passed in here.
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** Format a number the way an in-game HUD would. */
export function formatStat(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
