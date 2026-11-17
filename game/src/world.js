// Nebula Harvest: the whole game simulation, with no DOM in it.
// A harvest drone collects star-seeds to fill each level's quota while
// void mites hunt it. Seeds chain into combos, a dash strikes through
// mites, and a mouse-aimed pulse bursts mites away. Fill level 5's
// quota to win; lose all hull and the run ends.

import { BLOOM, COMBO, FIELD, LEVELS, MITE, ORB, PLAYER, PRISM } from './config.js';
import { makeRandom, range } from './random.js';

export const EVENT_COLLECT = 1;
export const EVENT_PRISM = 2;
export const EVENT_HEAL = 4;
export const EVENT_HIT = 8;
export const EVENT_DASH = 16;
export const EVENT_PULSE = 32;
export const EVENT_STRIKE = 64;
export const EVENT_LEVEL = 128;
export const EVENT_WIN = 256;
export const EVENT_OVER = 512;

export const KIND_SEED = 'seed';
export const KIND_PRISM = 'prism';
export const KIND_BLOOM = 'bloom';

const PULSE_RANGE = 320;
const PULSE_RADIUS = 125;
const PULSE_KILL_RADIUS = 58;

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function createWorld(seed = 1) {
  const next = makeRandom(seed);
  const state = {
    phase: 'playing',
    time: 0,
    score: 0,
    best: 0,
    level: 0,
    collected: 0,
    combo: 0,
    comboTimer: 0,
    multiplier: 1,
    player: null,
    orbs: [],
    mites: [],
    particles: [],
    texts: [],
    rings: [],
    banner: null,
    shake: 0,
    orbTimer: 0,
    prismTimer: 0,
    bloomTimer: 0,
    miteTimer: 0,
  };

  function levelConfig() {
    return LEVELS[Math.min(state.level, LEVELS.length - 1)];
  }

  function reset() {
    state.phase = 'playing';
    state.time = 0;
    state.score = 0;
    state.level = 0;
    state.collected = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.multiplier = 1;
    state.player = {
      x: FIELD.width / 2,
      y: FIELD.height / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      hull: PLAYER.hullMax,
      invuln: 0,
      dashT: 0,
      dashCd: 0,
      pulseCd: 0,
    };
    state.orbs = [];
    state.mites = [];
    state.particles = [];
    state.texts = [];
    state.rings = [];
    state.banner = { title: 'LEVEL 1', sub: `Collect ${levelConfig().quota} star-seeds`, t: 2.2 };
    state.shake = 0;
    state.orbTimer = 0.2;
    state.prismTimer = PRISM.everySeconds * 0.6;
    state.bloomTimer = BLOOM.everySeconds;
    state.miteTimer = 1.6;
    for (let i = 0; i < 5; i += 1) spawnOrb(KIND_SEED);
  }

  function spawnPoint(minPlayerDist) {
    for (let tries = 0; tries < 12; tries += 1) {
      const point = { x: range(next, 46, FIELD.width - 46), y: range(next, 86, FIELD.height - 46) };
      if (!state.player || distance(point, state.player) >= minPlayerDist) return point;
    }
    return { x: range(next, 46, FIELD.width - 46), y: range(next, 86, FIELD.height - 46) };
  }

  function spawnOrb(kind) {
    const point = spawnPoint(90);
    const base = kind === KIND_PRISM ? PRISM : kind === KIND_BLOOM ? BLOOM : ORB;
    state.orbs.push({
      kind,
      x: point.x,
      y: point.y,
      radius: base.radius,
      age: 0,
      phase: range(next, 0, Math.PI * 2),
    });
  }

  function spawnMite() {
    // Arrive from a field edge, never on top of the player.
    const edge = Math.floor(next() * 4);
    const point = { x: 0, y: 0 };
    if (edge === 0) { point.x = range(next, 0, FIELD.width); point.y = -30; }
    if (edge === 1) { point.x = range(next, 0, FIELD.width); point.y = FIELD.height + 30; }
    if (edge === 2) { point.x = -30; point.y = range(next, 0, FIELD.height); }
    if (edge === 3) { point.x = FIELD.width + 30; point.y = range(next, 0, FIELD.height); }
    const radius = range(next, MITE.radiusMin, MITE.radiusMax);
    state.mites.push({
      x: point.x,
      y: point.y,
      vx: 0,
      vy: 0,
      radius,
      hp: radius > 18.5 ? 2 : 1,
      wobble: range(next, 0, Math.PI * 2),
      speedFactor: range(next, 0.85, 1.18),
      spin: range(next, -1.4, 1.4),
      angle: 0,
    });
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const a = range(next, 0, Math.PI * 2);
      const s = range(next, speed * 0.25, speed);
      state.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: range(next, 0.3, 0.8),
        maxLife: 0.8,
        size: range(next, 1.6, 3.8),
        color,
      });
    }
  }

  function addText(x, y, text, color, size = 17) {
    state.texts.push({ x, y, text, color, size, life: 0.95 });
  }

  function collectOrb(orb) {
    const player = state.player;
    if (orb.kind === KIND_SEED) {
      state.combo = state.comboTimer > 0 ? state.combo + 1 : 1;
      state.comboTimer = COMBO.windowSeconds;
      state.multiplier = Math.min(COMBO.maxMultiplier, 1 + Math.floor(state.combo / 4));
      const gained = ORB.score * state.multiplier;
      state.score += gained;
      state.collected += 1;
      addText(orb.x, orb.y - 14, `+${gained}`, '#ffe066', state.multiplier > 1 ? 20 : 16);
      burst(orb.x, orb.y, '#ffe066', 10, 170);
      return EVENT_COLLECT;
    }
    if (orb.kind === KIND_PRISM) {
      state.score += PRISM.score;
      player.hull = Math.min(PLAYER.hullMax, player.hull + PRISM.hull);
      addText(orb.x, orb.y - 14, `+${PRISM.score} PRISM`, '#f0abfc', 19);
      burst(orb.x, orb.y, '#f0abfc', 16, 220);
      return EVENT_PRISM;
    }
    player.hull = Math.min(PLAYER.hullMax, player.hull + BLOOM.hull);
    addText(orb.x, orb.y - 14, `+${BLOOM.hull} HULL`, '#fb7185', 19);
    burst(orb.x, orb.y, '#fb7185', 14, 190);
    return EVENT_HEAL;
  }

  function levelCleared() {
    const player = state.player;
    burst(player.x, player.y, '#4ade80', 34, 320);
    if (state.level >= LEVELS.length - 1) {
      state.score += Math.round(player.hull) * 5;
      state.phase = 'won';
      state.best = Math.max(state.best, state.score);
      return EVENT_WIN;
    }
    state.level += 1;
    state.collected = 0;
    player.hull = Math.min(PLAYER.hullMax, player.hull + 20);
    for (const mite of state.mites) burst(mite.x, mite.y, '#a78bfa', 7, 200);
    state.mites = [];
    state.miteTimer = 2.4;
    state.banner = {
      title: `LEVEL ${state.level + 1}`,
      sub: `Collect ${levelConfig().quota} star-seeds`,
      t: 2.2,
    };
    return EVENT_LEVEL;
  }

  function hurtPlayer(mite) {
    const player = state.player;
    player.hull -= PLAYER.hitDamage;
    player.invuln = PLAYER.invulnSeconds;
    state.shake = 11;
    state.combo = 0;
    state.multiplier = 1;
    const away = Math.atan2(player.y - mite.y, player.x - mite.x);
    player.vx += Math.cos(away) * 430;
    player.vy += Math.sin(away) * 430;
    burst(player.x, player.y, '#fb7185', 18, 260);
    addText(player.x, player.y - 30, `-${PLAYER.hitDamage} HULL`, '#fb7185', 18);
    if (player.hull <= 0) {
      player.hull = 0;
      state.phase = 'over';
      state.best = Math.max(state.best, state.score);
      burst(player.x, player.y, '#5eead4', 46, 380);
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  function firePulse(point) {
    const player = state.player;
    if (player.pulseCd > 0) return 0;
    const target = distance(point, player) <= PULSE_RANGE
      ? point
      : {
          x: player.x + ((point.x - player.x) / (distance(point, player) || 1)) * PULSE_RANGE,
          y: player.y + ((point.y - player.y) / (distance(point, player) || 1)) * PULSE_RANGE,
        };
    player.pulseCd = PLAYER.pulseCooldown;
    state.rings.push({ x: target.x, y: target.y, r: 12, maxR: PULSE_RADIUS, life: 0.32, color: '#5eead4' });
    let events = EVENT_PULSE;
    for (const mite of state.mites) {
      const d = Math.hypot(mite.x - target.x, mite.y - target.y);
      if (d < PULSE_KILL_RADIUS + mite.radius) {
        mite.hp -= 1;
        events |= EVENT_STRIKE;
        burst(mite.x, mite.y, '#a78bfa', 8, 220);
      } else if (d < PULSE_RADIUS + mite.radius) {
        const away = Math.atan2(mite.y - target.y, mite.x - target.x);
        mite.vx += Math.cos(away) * PLAYER.pulsePush;
        mite.vy += Math.sin(away) * PLAYER.pulsePush;
      }
    }
    state.mites = state.mites.filter((mite) => {
      if (mite.hp > 0) return true;
      state.score += MITE.dashStrikeScore;
      addText(mite.x, mite.y, `+${MITE.dashStrikeScore}`, '#a78bfa', 15);
      return false;
    });
    return events;
  }

  function step(dt, controls) {
    let events = 0;
    state.time += dt;
    updateEffects(dt);
    if (state.phase !== 'playing') return events;

    const player = state.player;
    const cfg = levelConfig();

    // Timers.
    player.invuln = Math.max(0, player.invuln - dt);
    player.dashCd = Math.max(0, player.dashCd - dt);
    player.pulseCd = Math.max(0, player.pulseCd - dt);
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer === 0) { state.combo = 0; state.multiplier = 1; }
    if (state.banner) {
      state.banner.t -= dt;
      if (state.banner.t <= 0) state.banner = null;
    }
    state.shake = Math.max(0, state.shake - dt * 30);

    // Movement: accelerate toward the held direction, friction always.
    const length = Math.hypot(controls.axisX, controls.axisY);
    const nx = length > 0 ? controls.axisX / length : 0;
    const ny = length > 0 ? controls.axisY / length : 0;
    if (controls.dash && player.dashCd <= 0 && (length > 0 || player.vx || player.vy)) {
      player.dashT = PLAYER.dashSeconds;
      player.dashCd = PLAYER.dashCooldown;
      const dirX = length > 0 ? nx : Math.cos(player.angle);
      const dirY = length > 0 ? ny : Math.sin(player.angle);
      player.vx = dirX * PLAYER.maxSpeed * PLAYER.dashMultiplier;
      player.vy = dirY * PLAYER.maxSpeed * PLAYER.dashMultiplier;
      events |= EVENT_DASH;
    }
    player.dashT = Math.max(0, player.dashT - dt);
    player.vx += nx * PLAYER.accel * dt;
    player.vy += ny * PLAYER.accel * dt;
    const damp = Math.exp(-PLAYER.friction * dt);
    if (length === 0) { player.vx *= damp; player.vy *= damp; }
    const speed = Math.hypot(player.vx, player.vy);
    const cap = player.dashT > 0 ? PLAYER.maxSpeed * PLAYER.dashMultiplier : PLAYER.maxSpeed;
    if (speed > cap) {
      player.vx = (player.vx / speed) * cap;
      player.vy = (player.vy / speed) * cap;
    }
    player.x = Math.min(FIELD.width - PLAYER.radius, Math.max(PLAYER.radius, player.x + player.vx * dt));
    player.y = Math.min(FIELD.height - PLAYER.radius, Math.max(PLAYER.radius + 56, player.y + player.vy * dt));
    if (speed > 24) player.angle = Math.atan2(player.vy, player.vx);
    else if (controls.aimX !== undefined) player.angle = Math.atan2(controls.aimY - player.y, controls.aimX - player.x);
    if (player.dashT > 0 && next() < 0.75) {
      state.particles.push({
        x: player.x, y: player.y, vx: -player.vx * 0.08, vy: -player.vy * 0.08,
        life: 0.32, maxLife: 0.32, size: 5, color: '#5eead4',
      });
    }

    if (controls.pulse) events |= firePulse(controls.pulse);

    // Spawning.
    state.orbTimer -= dt;
    const seedCount = state.orbs.filter((orb) => orb.kind === KIND_SEED).length;
    if (state.orbTimer <= 0) {
      state.orbTimer = ORB.spawnSeconds;
      if (seedCount < 9) spawnOrb(KIND_SEED);
    }
    state.prismTimer -= dt;
    if (state.prismTimer <= 0) {
      state.prismTimer = PRISM.everySeconds;
      if (!state.orbs.some((orb) => orb.kind === KIND_PRISM)) spawnOrb(KIND_PRISM);
    }
    state.bloomTimer -= dt;
    if (state.bloomTimer <= 0) {
      state.bloomTimer = BLOOM.everySeconds;
      if (player.hull < 78 && !state.orbs.some((orb) => orb.kind === KIND_BLOOM)) spawnOrb(KIND_BLOOM);
    }
    state.miteTimer -= dt;
    if (state.miteTimer <= 0) {
      state.miteTimer = cfg.spawnSeconds * range(next, 0.85, 1.2);
      if (state.mites.length < cfg.miteCap) spawnMite();
    }

    // Orbs age and are collected.
    for (const orb of state.orbs) orb.age += dt;
    state.orbs = state.orbs.filter((orb) => orb.age < ORB.lifetimeSeconds || orb.kind !== KIND_SEED);
    for (let i = state.orbs.length - 1; i >= 0; i -= 1) {
      const orb = state.orbs[i];
      if (Math.hypot(orb.x - player.x, orb.y - player.y) < orb.radius + PLAYER.radius + 4) {
        state.orbs.splice(i, 1);
        events |= collectOrb(orb);
        if (state.collected >= cfg.quota && state.phase === 'playing') {
          events |= levelCleared();
          break;
        }
      }
    }
    if (state.phase !== 'playing') return events;

    // Mites hunt.
    for (const mite of state.mites) {
      mite.wobble += dt * 2.2;
      const toward = Math.atan2(player.y - mite.y, player.x - mite.x);
      const steer = toward + Math.sin(mite.wobble) * 0.35;
      const miteSpeed = cfg.miteSpeed * mite.speedFactor;
      mite.vx += (Math.cos(steer) * miteSpeed - mite.vx) * Math.min(1, dt * 2.4);
      mite.vy += (Math.sin(steer) * miteSpeed - mite.vy) * Math.min(1, dt * 2.4);
      mite.x += mite.vx * dt;
      mite.y += mite.vy * dt;
      mite.angle += mite.spin * dt;
    }

    // Contact.
    for (let i = state.mites.length - 1; i >= 0; i -= 1) {
      const mite = state.mites[i];
      if (Math.hypot(mite.x - player.x, mite.y - player.y) >= mite.radius + PLAYER.radius + MITE.contactPad) continue;
      if (player.dashT > 0) {
        state.mites.splice(i, 1);
        state.score += MITE.dashStrikeScore;
        addText(mite.x, mite.y, `+${MITE.dashStrikeScore} DASH STRIKE`, '#5eead4', 15);
        burst(mite.x, mite.y, '#a78bfa', 12, 240);
        events |= EVENT_STRIKE;
      } else if (player.invuln <= 0) {
        state.mites.splice(i, 1);
        events |= hurtPlayer(mite);
        if (state.phase !== 'playing') break;
      }
    }
    return events;
  }

  function updateEffects(dt) {
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-2.2 * dt);
      p.vy *= Math.exp(-2.2 * dt);
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    for (const t of state.texts) { t.life -= dt; t.y -= 44 * dt; }
    state.texts = state.texts.filter((t) => t.life > 0);
    for (const r of state.rings) {
      r.life -= dt;
      r.r = r.maxR * (1 - Math.max(0, r.life) / 0.32);
    }
    state.rings = state.rings.filter((r) => r.life > 0);
  }

  reset();
  return { state, reset, step };
}
