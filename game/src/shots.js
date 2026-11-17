// The screenshot scenes behind ?shot=start|play|win|end.
// Each scene runs the real simulation forward from a fresh world: the
// play scene is flown by the autopilot below, the win scene finishes
// level 5's last seed through the normal collect rule, and the end
// scene lets a mite land the last hit on a nearly-spent drone. The
// same seed always stages the same frame.

import { FIELD, LEVELS, STEP } from './config.js';
import { KIND_SEED } from './world.js';

function nearestSeed(state) {
  let best = null;
  let bestDist = Infinity;
  for (const orb of state.orbs) {
    if (orb.kind !== KIND_SEED) continue;
    const d = Math.hypot(orb.x - state.player.x, orb.y - state.player.y);
    if (d < bestDist) { bestDist = d; best = orb; }
  }
  return best;
}

function nearestMite(state) {
  let best = null;
  let bestDist = Infinity;
  for (const mite of state.mites) {
    const d = Math.hypot(mite.x - state.player.x, mite.y - state.player.y);
    if (d < bestDist) { bestDist = d; best = mite; }
  }
  return best ? { mite: best, dist: bestDist } : null;
}

/** One frame of autopilot controls: chase seeds, flee close mites, pulse crowds, dash escapes. */
export function autopilotControls(state) {
  const player = state.player;
  const controls = { axisX: 0, axisY: 0, dash: false, pulse: null, aimX: player.x + 40, aimY: player.y };
  let moveX = 0;
  let moveY = 0;

  const seed = nearestSeed(state);
  if (seed) {
    moveX += (seed.x - player.x) / 130;
    moveY += (seed.y - player.y) / 130;
    controls.aimX = seed.x;
    controls.aimY = seed.y;
  } else {
    moveX += (FIELD.width / 2 - player.x) / 220;
    moveY += (FIELD.height / 2 - player.y) / 220;
  }

  let fleeing = false;
  for (const mite of state.mites) {
    const dx = player.x - mite.x;
    const dy = player.y - mite.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < 180) {
      const weight = ((180 - d) / 180) * 2.4;
      moveX += (dx / d) * weight;
      moveY += (dy / d) * weight;
      fleeing = true;
    }
  }

  // Keep off the walls.
  if (player.x < 110) moveX += 1.2;
  if (player.x > FIELD.width - 110) moveX -= 1.2;
  if (player.y < 150) moveY += 1.2;
  if (player.y > FIELD.height - 100) moveY -= 1.2;

  const length = Math.hypot(moveX, moveY) || 1;
  controls.axisX = moveX / length;
  controls.axisY = moveY / length;

  const near = nearestMite(state);
  if (near && near.dist < 105 && player.pulseCd <= 0) {
    controls.pulse = { x: near.mite.x, y: near.mite.y };
  } else if (near && near.dist < 58 && player.dashCd <= 0) {
    controls.dash = true;
  } else if (!fleeing && seed && Math.hypot(seed.x - player.x, seed.y - player.y) > 430 && player.dashCd <= 0) {
    controls.dash = true;
  }
  return controls;
}

function run(world, seconds, controlsFor) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (world.state.phase !== 'playing') break;
    world.step(STEP, controlsFor(world.state));
  }
}

const IDLE = () => ({ axisX: 0, axisY: 0, dash: false, pulse: null, aimX: FIELD.width / 2, aimY: 200 });

export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    run(world, 30, autopilotControls);
    if (world.state.phase !== 'playing') {
      // The pilot had a bad run: restage a shorter, cleaner one.
      world.reset();
      run(world, 16, autopilotControls);
    }
    return 'play';
  }
  if (name === 'win') {
    // The honest way: let the autopilot play the whole game. With the
    // screenshot seed it clears level 5 in a little over two minutes.
    run(world, 300, autopilotControls);
    if (world.state.phase !== 'won') {
      // Fallback if a future tuning change beats the pilot: stage the
      // last seed of level 5 and let the collect rule finish the game.
      world.reset();
      run(world, 12, autopilotControls);
      const state = world.state;
      state.level = LEVELS.length - 1;
      state.collected = LEVELS[LEVELS.length - 1].quota - 1;
      state.orbs = state.orbs.filter((orb) => orb.kind !== KIND_SEED);
      state.orbs.push({
        kind: KIND_SEED,
        x: Math.min(FIELD.width - 60, state.player.x + 90),
        y: state.player.y,
        radius: 11,
        age: 0,
        phase: 1.3,
      });
      run(world, 12, autopilotControls);
    }
    // Keep the results text readable: mites still hunting in the
    // middle band scatter when the harvest completes.
    world.state.mites = world.state.mites.filter(
      (mite) => mite.x < 300 || mite.x > 980 || mite.y < 170 || mite.y > 640,
    );
    return 'won';
  }
  if (name === 'end') {
    run(world, 14, autopilotControls);
    const state = world.state;
    if (state.phase === 'playing') {
      state.player.hull = 18;
      state.player.invuln = 0;
      state.mites.push({
        x: state.player.x + 130,
        y: state.player.y - 40,
        vx: 0, vy: 0, radius: 17, hp: 1,
        wobble: 0.5, speedFactor: 1.15, spin: 1, angle: 0,
      });
      run(world, 25, IDLE);
    }
    return 'over';
  }
  // start: a calm field behind the title.
  run(world, 3.5, IDLE);
  return 'title';
}
