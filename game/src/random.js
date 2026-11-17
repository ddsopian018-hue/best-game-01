// A tiny seeded random number generator (mulberry32).
// One seed makes one world, so screenshot scenes and replays are repeatable.

export function makeRandom(seed) {
  let state = (seed >>> 0) || 1;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function range(next, min, max) {
  return min + next() * (max - min);
}

export function pick(next, items) {
  return items[Math.floor(next() * items.length) % items.length];
}
