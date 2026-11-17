// Keyboard and mouse state for Nebula Harvest.
// Movement comes from WASD or the arrow keys, dash from Shift or Space,
// pause from P or Escape; the mouse aims the harvest pulse and clicks
// the menus. Coordinates are converted from screen space to the fixed
// 1280x720 world, accounting for the letterboxed canvas.

import { FIELD } from './config.js';

const MOVE_KEYS = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export function createInput(canvas) {
  const held = new Set();
  const input = {
    axisX: 0,
    axisY: 0,
    dashPressed: false,
    confirmPressed: false,
    pausePressed: false,
    mutePressed: false,
    mouseX: FIELD.width / 2,
    mouseY: FIELD.height / 2,
    clickX: -1,
    clickY: -1,
    clicked: false,
  };

  function toWorld(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const shownW = FIELD.width * scale;
    const shownH = FIELD.height * scale;
    const offX = rect.left + (rect.width - shownW) / 2;
    const offY = rect.top + (rect.height - shownH) / 2;
    return {
      x: (event.clientX - offX) / scale,
      y: (event.clientY - offY) / scale,
    };
  }

  window.addEventListener('keydown', (event) => {
    const move = MOVE_KEYS[event.code];
    if (move) {
      held.add(move);
      event.preventDefault();
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight' || event.code === 'Space') {
      if (!event.repeat) input.dashPressed = true;
      event.preventDefault();
    }
    if (event.code === 'Enter') input.confirmPressed = true;
    if (event.code === 'KeyR') input.confirmPressed = true;
    if (event.code === 'KeyP' || event.code === 'Escape') input.pausePressed = true;
    if (event.code === 'KeyM') input.mutePressed = true;
    refreshAxes();
  });

  window.addEventListener('keyup', (event) => {
    const move = MOVE_KEYS[event.code];
    if (move) held.delete(move);
    refreshAxes();
  });

  window.addEventListener('blur', () => {
    held.clear();
    refreshAxes();
  });

  canvas.addEventListener('pointermove', (event) => {
    const point = toWorld(event);
    input.mouseX = point.x;
    input.mouseY = point.y;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toWorld(event);
    input.mouseX = point.x;
    input.mouseY = point.y;
    input.clickX = point.x;
    input.clickY = point.y;
    input.clicked = true;
  });

  function refreshAxes() {
    input.axisX = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
    input.axisY = (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0);
  }

  // Called once per frame after the world has read the one-shot flags.
  input.consume = function consume() {
    input.dashPressed = false;
    input.confirmPressed = false;
    input.pausePressed = false;
    input.mutePressed = false;
    input.clicked = false;
    input.clickX = -1;
    input.clickY = -1;
  };

  return input;
}
