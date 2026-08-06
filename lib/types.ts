export type WeaponCategoryId =
  | 'assault-rifle'
  | 'sniper-rifle'
  | 'dmr'
  | 'smg'
  | 'shotgun'
  | 'pistol'
  | 'lmg'
  | 'launcher'
  | 'throwable'
  | 'melee';

export type Tier = 'standard' | 'rare' | 'epic' | 'legendary' | 'mythic';

/** Drives the parametric SVG in <WeaponArt />. */
export type Silhouette = {
  kind: WeaponCategoryId;
  /** Barrel length multiplier, 0.7–1.6. */
  barrel?: number;
  /** Magazine depth multiplier, 0–1.8. 0 hides the magazine. */
  mag?: number;
  optic?: 'none' | 'reflex' | 'scope' | 'thermal';
  stock?: 'none' | 'folding' | 'fixed' | 'skeleton';
  grip?: boolean;
  suppressor?: boolean;
  drum?: boolean;
};

export type WeaponStats = {
  damage: number;
  range: number;
  fireRate: number;
  stability: number;
  mobility: number;
  magazine: number;
};

export type Weapon = {
  id: string;
  name: string;
  codename: string;
  category: WeaponCategoryId;
  tier: Tier;
  ammo: string;
  fireModes: string[];
  rpm: number;
  /** m/s */
  velocity: number;
  /** Marketing one-liner shown under the name in the detail view. */
  tagline: string;
  description: string;
  stats: WeaponStats;
  attachments: string[];
  silhouette: Silhouette;
};

export type WeaponCategory = {
  id: WeaponCategoryId;
  label: string;
  short: string;
  blurb: string;
};

export type BattleMap = {
  id: string;
  name: string;
  region: string;
  size: string;
  players: number;
  biome: string;
  climate: string;
  hotDrops: string[];
  description: string;
  /** Two hues that define the map's colour grade. */
  palette: [string, string];
  terrain: 'coastal' | 'desert' | 'arctic' | 'jungle' | 'urban' | 'volcanic';
};

export type Vehicle = {
  id: string;
  name: string;
  klass: string;
  seats: number;
  topSpeed: number;
  armour: number;
  offroad: number;
  fuel: number;
  description: string;
  chassis: 'suv' | 'buggy' | 'bike' | 'apc' | 'boat' | 'muscle';
  accent: string;
};

export type Operator = {
  id: string;
  name: string;
  callsign: string;
  role: string;
  origin: string;
  rarity: Tier;
  perk: { name: string; detail: string };
  passive: string;
  traits: { label: string; value: number }[];
  hue: number;
};

export type TimelinePhase = {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  altitude: string;
  detail: string;
  metrics: { label: string; value: string }[];
};

export type StatItem = {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  detail: string;
};
