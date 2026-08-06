import type { BattleMap, Operator, StatItem, TimelinePhase, Vehicle } from '@/lib/types';

/* ============================================================================
   MAPS
   ========================================================================== */

export const MAPS: BattleMap[] = [
  {
    id: 'erangel',
    name: 'ASHFALL',
    region: 'North Atlantic — Abandoned Sector 7',
    size: '8 × 8 km',
    players: 100,
    biome: 'Temperate ruin',
    climate: 'Overcast · 11°C · crosswind 14kt',
    hotDrops: ['School', 'Pochinki', 'Military Base', 'Georgopol Cranes'],
    description:
      'A decommissioned Soviet military island reclaimed by grass and rust. Long sightlines between compounds make ASHFALL the purest test of positioning in the rotation.',
    palette: ['#3d4a3a', '#8a6a3c'],
    terrain: 'coastal',
  },
  {
    id: 'miramar',
    name: 'SCORCHLINE',
    region: 'Northern Mexico — Deadzone',
    size: '8 × 8 km',
    players: 100,
    biome: 'High desert',
    climate: 'Clear · 41°C · heat shimmer',
    hotDrops: ['Hacienda del Patrón', 'Pecado', 'Los Leones', 'El Pozo'],
    description:
      'Open desert broken by mesas and concrete townships. Cover is scarce, elevation is everything, and the sniper duels here last for entire circles.',
    palette: ['#a5652a', '#e0a558'],
    terrain: 'desert',
  },
  {
    id: 'vikendi',
    name: 'WHITEOUT',
    region: 'Adriatic Sea — Glacial Shelf',
    size: '6 × 6 km',
    players: 64,
    biome: 'Sub-arctic',
    climate: 'Blizzard · −18°C · visibility 60m',
    hotDrops: ['Castle', 'Cosmodrome', 'Dino Park', 'Volnova'],
    description:
      'Snow records every footprint you leave. WHITEOUT turns tracking into a mechanic — and turns every open field into a confession.',
    palette: ['#5a7f96', '#cfe3ef'],
    terrain: 'arctic',
  },
  {
    id: 'sanhok',
    name: 'GREENBELT',
    region: 'Southeast Asia — Jungle Basin',
    size: '4 × 4 km',
    players: 64,
    biome: 'Dense rainforest',
    climate: 'Monsoon · 33°C · humidity 94%',
    hotDrops: ['Bootcamp', 'Paradise Resort', 'Ruins', 'Quarry'],
    description:
      'A compressed map with a compressed timeline. Contact is constant, the canopy hides everything, and no circle is ever more than ninety seconds away.',
    palette: ['#2f5b2f', '#7ec24a'],
    terrain: 'jungle',
  },
  {
    id: 'karakin',
    name: 'BLACKSITE',
    region: 'North Africa — Restricted Airspace',
    size: '2 × 2 km',
    players: 32,
    biome: 'Arid rock',
    climate: 'Dust storm · 38°C · gusting',
    hotDrops: ['Bahr Sahir', 'Al Habar', 'The Tunnels', 'Cargo Ship'],
    description:
      'Two kilometres square, breachable walls, and a bombardment zone that rewrites the terrain mid-match. BLACKSITE is the shortest and most violent rotation in service.',
    palette: ['#6b5540', '#d8bd8c'],
    terrain: 'urban',
  },
  {
    id: 'caldera',
    name: 'EMBERFALL',
    region: 'South Pacific — Active Caldera',
    size: '5 × 5 km',
    players: 80,
    biome: 'Volcanic',
    climate: 'Ashfall · 47°C · sulphur haze',
    hotDrops: ['Crater Rim', 'Obsidian Flats', 'The Vents', 'Ashport'],
    description:
      'Live lava flows redraw the safe routes every match. Fighting on EMBERFALL means negotiating with the island as much as with the other ninety-nine operators.',
    palette: ['#5c2318', '#ff6a1a'],
    terrain: 'volcanic',
  },
];

/* ============================================================================
   VEHICLES
   ========================================================================== */

export const VEHICLES: Vehicle[] = [
  {
    id: 'warthog',
    name: 'WARTHOG UAZ',
    klass: 'Armoured Utility 4×4',
    seats: 4,
    topSpeed: 132,
    armour: 78,
    offroad: 92,
    fuel: 100,
    description:
      'The squad workhorse. Enough sheet metal to survive a rotation under fire and enough clearance to ignore whatever the terrain had planned.',
    chassis: 'suv',
    accent: '#ff6a1a',
  },
  {
    id: 'scorpion',
    name: 'SCORPION BUGGY',
    klass: 'Open-Frame Assault',
    seats: 2,
    topSpeed: 148,
    armour: 24,
    offroad: 96,
    fuel: 70,
    description:
      'A roll cage, an engine, and nothing else worth mentioning. The SCORPION climbs gradients that stop everything else and offers precisely zero protection in exchange.',
    chassis: 'buggy',
    accent: '#ffd166',
  },
  {
    id: 'wraith',
    name: 'WRAITH SCRAMBLER',
    klass: 'Single-Track Recon',
    seats: 2,
    topSpeed: 176,
    armour: 8,
    offroad: 88,
    fuel: 55,
    description:
      'The fastest thing on the island. Ramp jumps, wheelies and a fuel tank that holds just long enough to make the last circle a genuine question.',
    chassis: 'bike',
    accent: '#e01730',
  },
  {
    id: 'leviathan',
    name: 'LEVIATHAN BRDM',
    klass: 'Amphibious APC',
    seats: 3,
    topSpeed: 104,
    armour: 100,
    offroad: 84,
    fuel: 120,
    description:
      'Bulletproof glass, amphibious drive and a flare-called delivery. The LEVIATHAN does not avoid contact — it drives directly into it and waits.',
    chassis: 'apc',
    accent: '#4dabff',
  },
  {
    id: 'tidebreaker',
    name: 'TIDEBREAKER PG-117',
    klass: 'Assault Watercraft',
    seats: 5,
    topSpeed: 118,
    armour: 32,
    offroad: 40,
    fuel: 90,
    description:
      'Coastal insertion at speed. Five seats, a shallow draft, and the only sensible way to approach an island compound from the blind side.',
    chassis: 'boat',
    accent: '#9dff4d',
  },
  {
    id: 'coupe',
    name: 'REVENANT COUPE',
    klass: 'Rear-Drive Muscle',
    seats: 2,
    topSpeed: 164,
    armour: 30,
    offroad: 34,
    fuel: 80,
    description:
      'Tarmac only, and gloriously so. On the coastal ring road nothing catches the REVENANT, which is exactly as useful as it sounds until the circle moves inland.',
    chassis: 'muscle',
    accent: '#b06bff',
  },
];

/* ============================================================================
   OPERATORS
   ========================================================================== */

export const OPERATORS: Operator[] = [
  {
    id: 'wraith',
    name: 'ELENA VOSS',
    callsign: 'WRAITH',
    role: 'Recon Sniper',
    origin: 'Murmansk, RU',
    rarity: 'mythic',
    perk: { name: 'Cold Sight', detail: 'Scoped breath hold extended by 45%. Glint suppressed below 8×.' },
    passive: 'Enemy footsteps register 20m further out while prone.',
    traits: [
      { label: 'Precision', value: 97 },
      { label: 'Stealth', value: 88 },
      { label: 'Endurance', value: 64 },
      { label: 'Aggression', value: 41 },
    ],
    hue: 202,
  },
  {
    id: 'forge',
    name: 'MARCUS OKONKWO',
    callsign: 'FORGE',
    role: 'Breacher',
    origin: 'Lagos, NG',
    rarity: 'legendary',
    perk: { name: 'Overpressure', detail: 'Breaching charges clear structural walls. Explosive resistance +30%.' },
    passive: 'Shotgun reload speed increased by 25%.',
    traits: [
      { label: 'Precision', value: 62 },
      { label: 'Stealth', value: 34 },
      { label: 'Endurance', value: 94 },
      { label: 'Aggression', value: 99 },
    ],
    hue: 18,
  },
  {
    id: 'cipher',
    name: 'YUNA PARK',
    callsign: 'CIPHER',
    role: 'Electronic Warfare',
    origin: 'Busan, KR',
    rarity: 'legendary',
    perk: { name: 'Blackout Pulse', detail: 'Disables enemy optics and minimap within 60m for 6 seconds.' },
    passive: 'Reveals supply-drop contents before the crate lands.',
    traits: [
      { label: 'Precision', value: 71 },
      { label: 'Stealth', value: 92 },
      { label: 'Endurance', value: 58 },
      { label: 'Aggression', value: 55 },
    ],
    hue: 276,
  },
  {
    id: 'atlas',
    name: 'DIEGO SALVATIERRA',
    callsign: 'ATLAS',
    role: 'Heavy Support',
    origin: 'Valparaíso, CL',
    rarity: 'epic',
    perk: { name: 'Bulwark', detail: 'Deployable ballistic shield. Suppression resistance while prone.' },
    passive: 'LMG deploy and bipod transition 40% faster.',
    traits: [
      { label: 'Precision', value: 58 },
      { label: 'Stealth', value: 22 },
      { label: 'Endurance', value: 100 },
      { label: 'Aggression', value: 76 },
    ],
    hue: 42,
  },
  {
    id: 'mirage',
    name: 'AMARA HADID',
    callsign: 'MIRAGE',
    role: 'Infiltrator',
    origin: 'Amman, JO',
    rarity: 'epic',
    perk: { name: 'Ghostwalk', detail: 'Movement produces no audio for 8 seconds. Leaves no snow tracks.' },
    passive: 'Suppressed weapons deal 8% additional damage.',
    traits: [
      { label: 'Precision', value: 83 },
      { label: 'Stealth', value: 100 },
      { label: 'Endurance', value: 61 },
      { label: 'Aggression', value: 68 },
    ],
    hue: 158,
  },
  {
    id: 'medic',
    name: 'SOREN KJÆR',
    callsign: 'LIFELINE',
    role: 'Combat Medic',
    origin: 'Aarhus, DK',
    rarity: 'rare',
    perk: { name: 'Triage Field', detail: 'Revives teammates at range. Squad healing rate doubled inside the field.' },
    passive: 'Self-heals continue while sprinting.',
    traits: [
      { label: 'Precision', value: 66 },
      { label: 'Stealth', value: 57 },
      { label: 'Endurance', value: 89 },
      { label: 'Aggression', value: 38 },
    ],
    hue: 348,
  },
];

/* ============================================================================
   BATTLE TIMELINE
   ========================================================================== */

export const TIMELINE: TimelinePhase[] = [
  {
    id: 'takeoff',
    index: '01',
    title: 'TAKEOFF',
    subtitle: 'Wheels up, ninety-nine strangers',
    altitude: '0 → 1,000 m',
    detail:
      'The C-130 lifts off the mainland strip with a hundred operators and no assigned seats. For the next ninety seconds nobody can hurt anybody, and everybody is planning how they will.',
    metrics: [
      { label: 'Airspeed', value: '412 km/h' },
      { label: 'Heading', value: '073°' },
      { label: 'Aboard', value: '100' },
    ],
  },
  {
    id: 'jump',
    index: '02',
    title: 'THE JUMP',
    subtitle: 'Commit or drift',
    altitude: '1,000 m',
    detail:
      'The ramp opens. Every second you hold the door is a hundred metres of ground surrendered — and every second you leave early is a hundred metres of company you did not want.',
    metrics: [
      { label: 'Exit speed', value: '234 km/h' },
      { label: 'Freefall', value: '38 s' },
      { label: 'Contested', value: '61%' },
    ],
  },
  {
    id: 'parachute',
    index: '03',
    title: 'CANOPY',
    subtitle: 'The last quiet moment',
    altitude: '500 → 0 m',
    detail:
      'Auto-deploy at 500 metres. From here you can see every other canopy in the sector, count them, and decide whether the roof you picked is still the right roof.',
    metrics: [
      { label: 'Descent', value: '18 m/s' },
      { label: 'Glide ratio', value: '2.4 : 1' },
      { label: 'Drift', value: '14 kt' },
    ],
  },
  {
    id: 'landing',
    index: '04',
    title: 'TOUCHDOWN',
    subtitle: 'Fists and floorboards',
    altitude: 'Ground',
    detail:
      'The first eight seconds decide the next twenty-five minutes. Whoever finds a weapon first sets the terms, and the loser of that race rarely gets to argue.',
    metrics: [
      { label: 'First contact', value: '0:08' },
      { label: 'Survivors', value: '82' },
      { label: 'Loot density', value: 'High' },
    ],
  },
  {
    id: 'loot',
    index: '05',
    title: 'KIT UP',
    subtitle: 'Armour, ammunition, angles',
    altitude: 'Ground',
    detail:
      'A level-three helmet, a bandage stack and a scope you actually know how to use. Efficiency here buys you the luxury of choosing your fights later.',
    metrics: [
      { label: 'Avg. loot time', value: '2:40' },
      { label: 'Survivors', value: '47' },
      { label: 'Circle 1', value: 'Closing' },
    ],
  },
  {
    id: 'combat',
    index: '06',
    title: 'CONTACT',
    subtitle: 'The circle does the recruiting',
    altitude: 'Ground',
    detail:
      'The playable area contracts and neutrality stops being an option. Every rotation is now a choice between the blue and whoever already holds the high ground.',
    metrics: [
      { label: 'Engagements', value: '14' },
      { label: 'Survivors', value: '11' },
      { label: 'Zone', value: '380 m' },
    ],
  },
  {
    id: 'victory',
    index: '07',
    title: 'WINNER WINNER',
    subtitle: 'One left standing',
    altitude: 'Ground',
    detail:
      'A forty-metre circle, two operators, and whichever one of them remembered to reload. The scoreboard resets in ninety seconds and none of this will matter — but right now it does.',
    metrics: [
      { label: 'Duration', value: '28:14' },
      { label: 'Survivors', value: '1' },
      { label: 'Placement', value: '#1' },
    ],
  },
];

/* ============================================================================
   STATISTICS
   ========================================================================== */

export const GLOBAL_STATS: StatItem[] = [
  { label: 'Matches Played', value: 4.82, suffix: 'B', decimals: 2, detail: 'Since the platform launched' },
  { label: 'Registered Operators', value: 312, suffix: 'M', detail: 'Across all regions' },
  { label: 'Chicken Dinners', value: 48.6, suffix: 'M', decimals: 1, detail: 'First-place finishes' },
  { label: 'Rounds Fired', value: 1.94, suffix: 'T', decimals: 2, detail: 'Cumulative, all weapons' },
];

export const SESSION_STATS: StatItem[] = [
  { label: 'Peak Concurrent', value: 3.24, suffix: 'M', decimals: 2, detail: 'Simultaneous operators' },
  { label: 'Avg. Match Length', value: 27, suffix: ' min', detail: 'Squads, full lobby' },
  { label: 'Longest Confirmed Kill', value: 1743, suffix: ' m', detail: 'LONGBOW AWM · SCORCHLINE' },
  { label: 'Supply Drops Recovered', value: 92.7, suffix: 'M', decimals: 1, detail: 'Airdrop crates opened' },
];

export const ACHIEVEMENTS = [
  { code: 'ACH-001', name: 'Lone Survivor', detail: 'Win a solo match without a single teammate revive.', rate: '4.2%' },
  { code: 'ACH-014', name: 'Marksman', detail: 'Confirm a kill beyond 800 metres.', rate: '1.7%' },
  { code: 'ACH-027', name: 'Untouchable', detail: 'Finish first having taken zero damage.', rate: '0.3%' },
  { code: 'ACH-039', name: 'Quartermaster', detail: 'Recover three airdrops in a single match.', rate: '2.9%' },
  { code: 'ACH-052', name: 'Full House', detail: 'Every squad member survives to the final circle.', rate: '6.8%' },
  { code: 'ACH-066', name: 'Blackout', detail: 'Win a match using only suppressed weapons.', rate: '0.9%' },
];

/* ============================================================================
   GALLERY — procedurally-composed field captures
   ========================================================================== */

export type GalleryShot = {
  id: string;
  title: string;
  location: string;
  span: 'tall' | 'wide' | 'square' | 'hero';
  hue: number;
  scene: 'ridge' | 'city' | 'drop' | 'convoy' | 'storm' | 'night' | 'bridge' | 'crater';
};

export const GALLERY: GalleryShot[] = [
  { id: 'g1', title: 'LAST LIGHT', location: 'ASHFALL · Ridge 04', span: 'hero', hue: 22, scene: 'ridge' },
  { id: 'g2', title: 'GEORGOPOL', location: 'ASHFALL · Container Yard', span: 'tall', hue: 200, scene: 'city' },
  { id: 'g3', title: 'FLARE CALLED', location: 'SCORCHLINE · El Pozo', span: 'square', hue: 34, scene: 'drop' },
  { id: 'g4', title: 'ROLLING DEEP', location: 'GREENBELT · Highway 2', span: 'wide', hue: 108, scene: 'convoy' },
  { id: 'g5', title: 'BLUE WALL', location: 'WHITEOUT · Cosmodrome', span: 'square', hue: 224, scene: 'storm' },
  { id: 'g6', title: 'NIGHTFALL', location: 'BLACKSITE · The Tunnels', span: 'tall', hue: 270, scene: 'night' },
  { id: 'g7', title: 'CHOKEPOINT', location: 'ASHFALL · Sosnovka Bridge', span: 'wide', hue: 14, scene: 'bridge' },
  { id: 'g8', title: 'CALDERA RIM', location: 'EMBERFALL · Crater Rim', span: 'square', hue: 8, scene: 'crater' },
];
