// Nebula Harvest: every tunable number in one place.
// The field is a fixed 1280x720 world; the canvas scales it to the window
// so the game plays and reads the same at any desktop size.

export const FIELD = { width: 1280, height: 720 };

export const STEP = 1 / 120;

export const PLAYER = {
  radius: 16,
  accel: 2700,
  maxSpeed: 345,
  friction: 5.2,
  hullMax: 100,
  hitDamage: 18,
  invulnSeconds: 1.1,
  dashCooldown: 2.1,
  dashSeconds: 0.18,
  dashMultiplier: 2.7,
  pulseCooldown: 3.4,
  pulseRadius: 165,
  pulseKillRadius: 72,
  pulsePush: 560,
};

export const ORB = {
  radius: 11,
  score: 10,
  spawnSeconds: 1.05,
  lifetimeSeconds: 16,
};

export const PRISM = { radius: 12, score: 50, hull: 6, everySeconds: 14 };
export const BLOOM = { radius: 12, hull: 26, everySeconds: 17 };

export const MITE = {
  radiusMin: 13,
  radiusMax: 21,
  contactPad: 2,
  dashStrikeScore: 5,
};

// One row per level: seeds to collect, how many mites may hunt at once,
// how fast they are and how often a new one arrives.
export const LEVELS = [
  { quota: 8, miteCap: 3, miteSpeed: 92, spawnSeconds: 2.6 },
  { quota: 11, miteCap: 5, miteSpeed: 112, spawnSeconds: 2.2 },
  { quota: 14, miteCap: 7, miteSpeed: 132, spawnSeconds: 1.9 },
  { quota: 17, miteCap: 9, miteSpeed: 152, spawnSeconds: 1.65 },
  { quota: 20, miteCap: 11, miteSpeed: 174, spawnSeconds: 1.45 },
];

export const COMBO = { windowSeconds: 3.2, maxMultiplier: 5 };

export const COLORS = {
  spaceTop: '#070b1e',
  spaceBottom: '#101736',
  nebulaA: 'rgba(88, 60, 180, 0.35)',
  nebulaB: 'rgba(20, 130, 160, 0.28)',
  hull: '#ffd166',
  ink: '#eaf2ff',
  dim: '#93a5cc',
  ship: '#5eead4',
  shipWing: '#2dd4bf',
  orb: '#ffe066',
  prism: '#f0abfc',
  bloom: '#fb7185',
  mite: '#7c3aed',
  miteEye: '#fda4af',
  danger: '#fb7185',
  good: '#4ade80',
};
