# best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/ddsopian018-hue/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/ddsopian018-hue/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Nebula Harvest is an original arcade game that plays offline in a desktop browser from the static files in `game/`: pilot a harvest drone through a nebula, collect glowing star-seeds to fill each level's quota across 5 levels, chain seeds into score combos, dash through the void mites that hunt you, and aim a mouse-click pulse to burst them away — a mite hit costs 18 hull, gold prisms and nova blooms mend it, and clearing Level 5 wins the harvest. It has a title screen, HUD with score, quota pips, hull and cooldowns, pause, win and game-over screens with restart, and fully synthesised WebAudio sound, with all art drawn in code on a canvas and no network requests. The source is split by job under `game/src/` (`world.js` is the simulation, `render.js` the drawing, `input.js`, `audio.js`, `shots.js` and `main.js` the rest), and `main.ts` hands the game in by copying `game/` and `screenshots/` to the output directory and writing `dossier.json` with the kit's vendor library.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 in a desktop browser
# (any static file server pointed at game/ works too)
#
# Hand the entry in the way the grader runs it:
# mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=0njr0f8w&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
