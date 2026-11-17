// Nebula Harvest: the program that hands the game in to make.fun.
// The game itself is the static files in game/ (no build step, no
// network); this program copies game/ and screenshots/ from beside
// itself into the output directory and writes dossier.json there with
// buildDossier from the kit's vendor library, exactly the summary the
// judge reads. Node 22, standard library only.
//
// In the grader the output directory is /output. Outside it, set
// MAKEFUN_OUTPUT_DIR to stand in for it:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play the game locally with: node serve.ts  (http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the gate's own (see RULES.txt): at most 4 screenshots of
// 256 KiB, at most 993 files and 48 MiB under game/, no game/ path over
// 1,000 bytes, and the dossier text capped at 160 KiB. buildDossier
// refuses anything the gate would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
