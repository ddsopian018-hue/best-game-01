// Nebula Harvest: the glue. Owns the canvas, the screen state machine
// (title, play, pause, won, over), the fixed-step game loop and the
// mapping from world events to sound. The simulation lives in
// world.js, the drawing in render.js, the controls in input.js.
//
// Screenshot scenes: ?shot=start|play|win|end&seed=N stages one real
// frame of the game (see shots.js) and holds it, so a headless browser
// can photograph the title, a run in progress, the win and the loss.

import { FIELD, STEP } from './config.js';
import { createInput } from './input.js';
import { createSound } from './audio.js';
import {
  createWorld,
  EVENT_COLLECT, EVENT_DASH, EVENT_HEAL, EVENT_HIT, EVENT_LEVEL,
  EVENT_OVER, EVENT_PRISM, EVENT_PULSE, EVENT_STRIKE, EVENT_WIN,
} from './world.js';
import {
  createRenderer, pointInRect, primaryButtonRect,
  SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WON,
} from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const sound = createSound();

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;

let world = createWorld(seed);
let screen = SCREEN_TITLE;
let lastStatus = '';

if (shotName) {
  screen = stageShot(shotName, world);
  const drawTime = world.state.time;
  renderer.ctx.canvas.width = FIELD.width;
  renderer.ctx.canvas.height = FIELD.height;
  if (screen === SCREEN_TITLE) renderer.drawTitle(world.state, drawTime);
  else if (screen === SCREEN_WON || screen === SCREEN_OVER) renderer.drawEnd(world.state, drawTime, screen === SCREEN_WON);
  else renderer.drawGame(world.state, drawTime, null);
} else {
  startLoop();
}

function startLoop() {
  let last = performance.now();
  let accumulator = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    let elapsed = (now - last) / 1000;
    last = now;
    if (elapsed > 0.25) elapsed = 0.25;
    const time = now / 1000;

    handleScreenInput();
    if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const controls = {
          axisX: input.axisX,
          axisY: input.axisY,
          dash: input.dashPressed,
          pulse: input.clicked ? { x: input.clickX, y: input.clickY } : null,
          aimX: input.mouseX,
          aimY: input.mouseY,
        };
        input.dashPressed = false;
        const events = world.step(STEP, controls);
        playSounds(events);
        if (world.state.phase === 'won') { screen = SCREEN_WON; break; }
        if (world.state.phase === 'over') { screen = SCREEN_OVER; break; }
      }
    } else {
      // Menus stay alive: drift the world gently behind the title, and
      // let particles settle behind the end screens.
      world.step(0, { axisX: 0, axisY: 0, dash: false, pulse: null });
    }
    input.consume();

    if (screen === SCREEN_TITLE) renderer.drawTitle(world.state, time);
    else if (screen === SCREEN_PAUSE) renderer.drawPause(world.state, time);
    else if (screen === SCREEN_WON) renderer.drawEnd(world.state, time, true);
    else if (screen === SCREEN_OVER) renderer.drawEnd(world.state, time, false);
    else renderer.drawGame(world.state, time, input);

    announce();
  }

  requestAnimationFrame(frame);
}

function handleScreenInput() {
  if (input.mutePressed) {
    const muted = sound.toggleMute();
    setStatus(muted ? 'Sound off' : 'Sound on');
  }
  if (screen === SCREEN_TITLE) {
    if (input.confirmPressed || clickedButton(SCREEN_TITLE)) startRun();
  } else if (screen === SCREEN_PAUSE) {
    if (input.pausePressed || input.confirmPressed || clickedButton(SCREEN_PAUSE)) {
      screen = SCREEN_PLAY;
      sound.click();
      input.consume();
    }
  } else if (screen === SCREEN_PLAY) {
    if (input.pausePressed) screen = SCREEN_PAUSE;
    if (input.clicked) sound.unlock();
  } else if (screen === SCREEN_WON || screen === SCREEN_OVER) {
    if (input.confirmPressed || clickedButton(screen)) startRun();
  }
  if (input.clicked || input.confirmPressed) sound.unlock();
}

function clickedButton(forScreen) {
  if (!input.clicked) return false;
  return pointInRect(input.clickX, input.clickY, primaryButtonRect(forScreen));
}

function startRun() {
  const best = world.state.best;
  world = createWorld((Math.random() * 1e9) | 0);
  world.state.best = best;
  screen = SCREEN_PLAY;
  input.consume();
  sound.unlock();
  sound.click();
  setStatus('Harvest started. Collect star-seeds to fill the quota.');
}

function playSounds(events) {
  if (events & EVENT_COLLECT) sound.collect(world.state.combo);
  if (events & EVENT_PRISM) sound.prism();
  if (events & EVENT_HEAL) sound.heal();
  if (events & EVENT_DASH) sound.dash();
  if (events & EVENT_PULSE) sound.pulse();
  if (events & EVENT_STRIKE) sound.strike();
  if (events & EVENT_HIT) sound.hit();
  if (events & EVENT_LEVEL) sound.levelUp();
  if (events & EVENT_WIN) sound.win();
  if (events & EVENT_OVER) sound.lose();
}

function announce() {
  const state = world.state;
  let message;
  if (screen === SCREEN_TITLE) message = 'Nebula Harvest title screen. Press Enter or click Launch Harvest to start.';
  else if (screen === SCREEN_WON) message = `Harvest complete. Final score ${state.score}. Press Enter to play again.`;
  else if (screen === SCREEN_OVER) message = `Game over. Final score ${state.score}. Press Enter to try again.`;
  else if (screen === SCREEN_PAUSE) message = 'Paused.';
  else message = `Level ${state.level + 1}. Score ${state.score}. Hull ${Math.ceil(state.player.hull)}. Seeds ${state.collected}.`;
  if (message !== lastStatus) {
    lastStatus = message;
    setStatus(message);
  }
}

function setStatus(message) {
  if (status) status.textContent = message;
}
