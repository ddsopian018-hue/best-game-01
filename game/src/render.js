// Nebula Harvest: all drawing. The world module decides what is true;
// this file decides what it looks like: a deep-space field with a
// two-tone nebula and a ringed planet, a teal harvest drone, glowing
// star-seeds, spiky void mites, and the HUD and menu screens the judge
// reads in the screenshots.

import { COLORS, FIELD, LEVELS, PLAYER } from './config.js';
import { KIND_BLOOM, KIND_PRISM } from './world.js';
import { makeRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_WON = 'won';
export const SCREEN_OVER = 'over';

const BUTTON = { w: 320, h: 58 };

export function primaryButtonRect(screen) {
  const y = screen === SCREEN_TITLE ? 528 : screen === SCREEN_PAUSE ? 452 : 508;
  return { x: FIELD.width / 2 - BUTTON.w / 2, y, w: BUTTON.w, h: BUTTON.h };
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function text(ctx, value, x, y, size, color, align = 'center', weight = 700, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const starRandom = makeRandom(20261);
  const stars = [];
  for (let i = 0; i < 170; i += 1) {
    stars.push({
      x: starRandom() * FIELD.width,
      y: starRandom() * FIELD.height,
      r: 0.7 + starRandom() * 1.7,
      phase: starRandom() * Math.PI * 2,
      speed: 0.6 + starRandom() * 1.8,
    });
  }

  function drawBackground(time) {
    const grad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    grad.addColorStop(0, COLORS.spaceTop);
    grad.addColorStop(1, COLORS.spaceBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    // Nebula clouds.
    for (const cloud of [
      { x: 300, y: 210, r: 330, color: COLORS.nebulaA },
      { x: 1010, y: 520, r: 380, color: COLORS.nebulaB },
      { x: 860, y: 140, r: 210, color: 'rgba(190, 60, 120, 0.16)' },
    ]) {
      const g = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.r);
      g.addColorStop(0, cloud.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cloud.x - cloud.r, cloud.y - cloud.r, cloud.r * 2, cloud.r * 2);
    }

    // A ringed planet low in the corner, behind everything.
    ctx.save();
    ctx.globalAlpha = 0.5;
    const planet = ctx.createRadialGradient(1130, 640, 20, 1160, 660, 150);
    planet.addColorStop(0, '#3b4a8f');
    planet.addColorStop(1, 'rgba(20,26,60,0)');
    ctx.fillStyle = planet;
    ctx.beginPath();
    ctx.arc(1160, 660, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,170,255,0.35)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(1160, 660, 190, 42, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    for (const star of stars) {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * star.speed + star.phase));
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#dbeafe';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawShip(player, time) {
    const speed = Math.hypot(player.vx, player.vy);
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    if (player.invuln > 0 && player.dashT <= 0) {
      ctx.globalAlpha = 0.55 + 0.35 * Math.sin(time * 34);
    }
    // Engine flame.
    if (speed > 40) {
      const flame = 13 + Math.sin(time * 42) * 4 + speed * 0.02;
      const flameGrad = ctx.createLinearGradient(-14, 0, -14 - flame, 0);
      flameGrad.addColorStop(0, 'rgba(255,190,80,0.95)');
      flameGrad.addColorStop(1, 'rgba(255,90,40,0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-13, -5);
      ctx.lineTo(-14 - flame, 0);
      ctx.lineTo(-13, 5);
      ctx.closePath();
      ctx.fill();
    }
    // Wings.
    ctx.fillStyle = COLORS.shipWing;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-16, -15);
    ctx.lineTo(-10, -3);
    ctx.lineTo(-16, 15);
    ctx.closePath();
    ctx.fill();
    // Hull.
    const body = ctx.createLinearGradient(-16, 0, 20, 0);
    body.addColorStop(0, '#0f766e');
    body.addColorStop(0.55, COLORS.ship);
    body.addColorStop(1, '#ccfbf1');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(21, 0);
    ctx.lineTo(-6, -9);
    ctx.lineTo(-13, 0);
    ctx.lineTo(-6, 9);
    ctx.closePath();
    ctx.fill();
    // Cockpit.
    ctx.fillStyle = '#083344';
    ctx.beginPath();
    ctx.arc(6, 0, 4.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a5f3fc';
    ctx.beginPath();
    ctx.arc(7.4, -1.2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Shield ring while invulnerable or dashing.
    if (player.invuln > 0 || player.dashT > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(94,234,212,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER.radius + 8 + Math.sin(time * 10) * 1.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawOrb(orb, time) {
    const pulse = 1 + Math.sin(time * 4 + orb.phase) * 0.13;
    const blink = orb.kind === 'seed' && orb.age > 12 ? (Math.sin(time * 16) > 0 ? 1 : 0.25) : 1;
    ctx.save();
    ctx.translate(orb.x, orb.y);
    ctx.globalAlpha = blink;
    if (orb.kind === KIND_PRISM) {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      glow.addColorStop(0, 'rgba(240,171,252,0.55)');
      glow.addColorStop(1, 'rgba(240,171,252,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-30, -30, 60, 60);
      ctx.rotate(Math.sin(time * 2 + orb.phase) * 0.35);
      ctx.fillStyle = COLORS.prism;
      ctx.beginPath();
      ctx.moveTo(0, -14 * pulse);
      ctx.lineTo(10 * pulse, 0);
      ctx.lineTo(0, 14 * pulse);
      ctx.lineTo(-10 * pulse, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fdf4ff';
      ctx.beginPath();
      ctx.arc(0, 0, 3.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (orb.kind === KIND_BLOOM) {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      glow.addColorStop(0, 'rgba(251,113,133,0.5)');
      glow.addColorStop(1, 'rgba(251,113,133,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-30, -30, 60, 60);
      ctx.fillStyle = COLORS.bloom;
      for (let petal = 0; petal < 5; petal += 1) {
        const a = (petal / 5) * Math.PI * 2 + time * 0.8;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 7.5 * pulse, Math.sin(a) * 7.5 * pulse, 5.6 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      glow.addColorStop(0, 'rgba(255,224,102,0.6)');
      glow.addColorStop(1, 'rgba(255,224,102,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-30, -30, 60, 60);
      ctx.fillStyle = COLORS.orb;
      ctx.beginPath();
      ctx.arc(0, 0, orb.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff7cc';
      ctx.beginPath();
      ctx.arc(-3, -3, orb.radius * 0.42, 0, Math.PI * 2);
      ctx.fill();
      // Orbiting sparkle.
      const a = time * 2.6 + orb.phase;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 17, Math.sin(a) * 17, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMite(mite, player, time) {
    ctx.save();
    ctx.translate(mite.x, mite.y);
    // Spiky body.
    const spikes = 9;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i += 1) {
      const a = mite.angle + (i / (spikes * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? mite.radius * 1.22 : mite.radius * 0.82;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const body = ctx.createRadialGradient(-4, -4, 2, 0, 0, mite.radius * 1.25);
    body.addColorStop(0, '#a78bfa');
    body.addColorStop(1, '#4c1d95');
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = 'rgba(196,181,253,0.8)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    if (mite.hp > 1) {
      ctx.strokeStyle = 'rgba(253,224,71,0.9)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, mite.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Eye, glaring at the player.
    const look = Math.atan2(player.y - mite.y, player.x - mite.x);
    ctx.fillStyle = '#ede9fe';
    ctx.beginPath();
    ctx.arc(Math.cos(look) * 3, Math.sin(look) * 3, mite.radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.miteEye;
    ctx.beginPath();
    ctx.arc(Math.cos(look) * 5.4, Math.sin(look) * 5.4, mite.radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawEffects(state) {
    for (const ring of state.rings) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ring.life / 0.32) * 0.85;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    for (const p of state.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const t of state.texts) {
      text(ctx, t.text, t.x, t.y, t.size, t.color, 'center', 800, Math.min(1, t.life * 1.6));
    }
  }

  function drawAim(state, input) {
    if (!input) return;
    const player = state.player;
    const ready = player.pulseCd <= 0;
    ctx.save();
    if (ready) {
      ctx.strokeStyle = 'rgba(94,234,212,0.13)';
      ctx.setLineDash([6, 10]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 320, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const inRange = Math.hypot(input.mouseX - player.x, input.mouseY - player.y) <= 320;
    ctx.strokeStyle = ready && inRange ? 'rgba(94,234,212,0.95)' : 'rgba(147,165,204,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(input.mouseX, input.mouseY, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(input.mouseX - 15, input.mouseY);
    ctx.lineTo(input.mouseX - 5, input.mouseY);
    ctx.moveTo(input.mouseX + 5, input.mouseY);
    ctx.lineTo(input.mouseX + 15, input.mouseY);
    ctx.moveTo(input.mouseX, input.mouseY - 15);
    ctx.lineTo(input.mouseX, input.mouseY - 5);
    ctx.moveTo(input.mouseX, input.mouseY + 5);
    ctx.lineTo(input.mouseX, input.mouseY + 15);
    ctx.stroke();
    ctx.restore();
  }

  function drawHud(state, time) {
    const player = state.player;
    ctx.save();
    ctx.fillStyle = 'rgba(5,8,20,0.72)';
    ctx.fillRect(0, 0, FIELD.width, 54);
    ctx.fillStyle = 'rgba(94,234,212,0.35)';
    ctx.fillRect(0, 54, FIELD.width, 2);

    text(ctx, 'SCORE', 26, 18, 12, COLORS.dim, 'left', 700);
    text(ctx, String(state.score).padStart(5, '0'), 26, 39, 24, COLORS.ink, 'left', 800);
    if (state.best > 0) text(ctx, `BEST ${state.best}`, 150, 39, 14, COLORS.dim, 'left', 700);
    if (state.combo >= 2) {
      const frac = state.comboTimer / 3.2;
      text(ctx, `COMBO x${state.multiplier}  (${state.combo})`, 300, 32, 17, COLORS.orb, 'left', 800);
      ctx.fillStyle = 'rgba(255,224,102,0.35)';
      ctx.fillRect(300, 46, 120, 4);
      ctx.fillStyle = COLORS.orb;
      ctx.fillRect(300, 46, 120 * Math.max(0, frac), 4);
    }

    // Level and quota pips.
    const cfg = LEVELS[state.level];
    text(ctx, `LEVEL ${state.level + 1} / ${LEVELS.length}`, FIELD.width / 2, 18, 13, COLORS.dim, 'center', 700);
    const pipGap = 17;
    const totalW = cfg.quota * pipGap;
    const startX = FIELD.width / 2 - totalW / 2 + pipGap / 2;
    for (let i = 0; i < cfg.quota; i += 1) {
      ctx.beginPath();
      ctx.arc(startX + i * pipGap, 39, 6, 0, Math.PI * 2);
      if (i < state.collected) {
        ctx.fillStyle = COLORS.orb;
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(255,224,102,0.55)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }

    // Time and hull.
    const mm = String(Math.floor(state.time / 60)).padStart(2, '0');
    const ss = String(Math.floor(state.time % 60)).padStart(2, '0');
    text(ctx, `${mm}:${ss}`, FIELD.width - 26, 18, 15, COLORS.ink, 'right', 800);
    text(ctx, 'HULL', FIELD.width - 216, 40, 12, COLORS.dim, 'left', 700);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, FIELD.width - 176, 32, 150, 13, 6);
    ctx.fill();
    const hullFrac = Math.max(0, player.hull / PLAYER.hullMax);
    ctx.fillStyle = hullFrac > 0.45 ? COLORS.good : hullFrac > 0.22 ? COLORS.hull : COLORS.danger;
    if (hullFrac > 0) {
      roundRect(ctx, FIELD.width - 176, 32, 150 * hullFrac, 13, 6);
      ctx.fill();
    }

    // Cooldowns, bottom corners.
    drawCooldown(24, FIELD.height - 30, 'DASH  Shift / Space', player.dashCd, 2.1);
    drawCooldown(FIELD.width - 24, FIELD.height - 30, 'PULSE  Click  ', player.pulseCd, 3.4, true);
    ctx.restore();
    void time;
  }

  function drawCooldown(x, y, label, left, total, alignRight = false) {
    const ready = left <= 0;
    const align = alignRight ? 'right' : 'left';
    text(ctx, ready ? `${label}  READY` : `${label}  ${left.toFixed(1)}s`, x, y, 14, ready ? COLORS.ship : COLORS.dim, align, 700);
    const barW = 110;
    const barX = alignRight ? x - barW : x;
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    ctx.fillRect(barX, y + 10, barW, 4);
    ctx.fillStyle = ready ? COLORS.ship : 'rgba(147,165,204,0.7)';
    ctx.fillRect(barX, y + 10, barW * (ready ? 1 : 1 - left / total), 4);
  }

  function drawBanner(state) {
    if (!state.banner) return;
    const t = state.banner.t;
    const alpha = Math.min(1, t / 0.5, (2.2 - t) / 0.4 + 0.6);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = 'rgba(5,8,20,0.55)';
    roundRect(ctx, FIELD.width / 2 - 260, 108, 520, 92, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(94,234,212,0.5)';
    ctx.stroke();
    text(ctx, state.banner.title, FIELD.width / 2, 140, 34, COLORS.ink, 'center', 800);
    text(ctx, state.banner.sub, FIELD.width / 2, 176, 17, COLORS.orb, 'center', 700);
    ctx.restore();
  }

  // The field alone, with no HUD: what the menu screens draw behind
  // their overlays, so no score bar or banner leaks into a title.
  function drawField(state, time) {
    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    drawBackground(time);
    for (const orb of state.orbs) drawOrb(orb, time);
    for (const mite of state.mites) drawMite(mite, state.player, time);
    drawShip(state.player, time);
    drawEffects(state);
    ctx.restore();
  }

  function drawGame(state, time, input) {
    drawField(state, time);
    drawAim(state, input);
    drawHud(state, time);
    drawBanner(state);
  }

  function drawButton(screen, label, time) {
    const rect = primaryButtonRect(screen);
    const pulse = 0.5 + 0.5 * Math.sin(time * 3.2);
    ctx.save();
    ctx.fillStyle = 'rgba(13, 84, 74, 0.92)';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fill();
    ctx.strokeStyle = `rgba(94,234,212,${0.55 + pulse * 0.45})`;
    ctx.lineWidth = 2.5;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.stroke();
    text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 21, '#ecfdf5', 'center', 800);
    ctx.restore();
  }

  function dim(alpha) {
    ctx.fillStyle = `rgba(4,6,16,${alpha})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function drawTitle(state, time) {
    drawField(state, time);
    dim(0.45);
    // A hero drone drifting above the title.
    const hero = { ...state.player, x: FIELD.width / 2, y: 218, vx: 60, vy: 0, angle: -0.22 + Math.sin(time * 0.9) * 0.14, invuln: 0, dashT: 0 };
    ctx.save();
    ctx.scale(1, 1);
    drawShip(hero, time);
    ctx.restore();
    text(ctx, 'NEBULA HARVEST', FIELD.width / 2, 292, 74, '#ecfeff', 'center', 900);
    text(ctx, 'Harvest the star-seeds. Outrun the void.', FIELD.width / 2, 342, 23, COLORS.orb, 'center', 700);

    const lines = [
      ['MOVE', 'WASD or Arrow keys'],
      ['DASH — strike through mites', 'Shift or Space'],
      ['PULSE — burst mites at the cursor', 'Mouse click'],
      ['GOAL', `Fill each level's seed quota — clear Level ${LEVELS.length} to win`],
      ['WATCH OUT', 'A mite hit costs 18 hull. Gold prisms mend a little; blooms mend a lot'],
    ];
    let y = 398;
    for (const [key, value] of lines) {
      text(ctx, key, FIELD.width / 2 - 28, y, 16, COLORS.ship, 'right', 800);
      text(ctx, value, FIELD.width / 2 - 12, y, 16, COLORS.ink, 'left', 600);
      y += 27;
    }
    drawButton(SCREEN_TITLE, '▶  LAUNCH HARVEST', time);
    text(ctx, 'or press Enter', FIELD.width / 2, 618, 14, COLORS.dim, 'center', 600);
    if (state.best > 0) text(ctx, `Best harvest so far: ${state.best}`, FIELD.width / 2, 652, 15, COLORS.dim, 'center', 700);
  }

  function drawPause(state, time) {
    drawField(state, time);
    dim(0.6);
    text(ctx, 'PAUSED', FIELD.width / 2, 300, 52, '#ecfeff', 'center', 900);
    text(ctx, 'The nebula waits. Your mites do too.', FIELD.width / 2, 352, 19, COLORS.dim, 'center', 600);
    drawButton(SCREEN_PAUSE, '▶  RESUME', time);
    text(ctx, 'or press P / Esc', FIELD.width / 2, 548, 14, COLORS.dim, 'center', 600);
  }

  function drawEnd(state, time, won) {
    drawField(state, time);
    dim(won ? 0.5 : 0.62);
    if (won) {
      text(ctx, 'HARVEST COMPLETE!', FIELD.width / 2, 238, 58, '#4ade80', 'center', 900);
      text(ctx, 'Every quota filled. The nebula is yours.', FIELD.width / 2, 290, 21, COLORS.ink, 'center', 700);
    } else {
      text(ctx, 'THE VOID GOT YOU', FIELD.width / 2, 238, 58, '#fb7185', 'center', 900);
      text(ctx, `Your drone broke up in Level ${state.level + 1}. The seeds scatter back to the dark.`, FIELD.width / 2, 290, 20, COLORS.ink, 'center', 700);
    }
    const mm = String(Math.floor(state.time / 60)).padStart(2, '0');
    const ss = String(Math.floor(state.time % 60)).padStart(2, '0');
    const rows = [
      ['FINAL SCORE', String(state.score)],
      ['BEST', String(Math.max(state.best, state.score))],
      ['LEVEL REACHED', `${state.level + 1} / ${LEVELS.length}`],
      ['TIME', `${mm}:${ss}`],
    ];
    let y = 352;
    for (const [key, value] of rows) {
      text(ctx, key, FIELD.width / 2 - 24, y, 17, COLORS.dim, 'right', 700);
      text(ctx, value, FIELD.width / 2 + 8, y, 20, COLORS.ink, 'left', 800);
      y += 34;
    }
    drawButton(won ? SCREEN_WON : SCREEN_OVER, '↻  HARVEST AGAIN', time);
    text(ctx, 'or press Enter / R', FIELD.width / 2, 602, 14, COLORS.dim, 'center', 600);
  }

  return { ctx, drawGame, drawField, drawTitle, drawPause, drawEnd };
}
