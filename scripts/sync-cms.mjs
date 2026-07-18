/**
 * sync-cms.mjs — kopiert das gepinnte @sveltia/cms-Bundle aus node_modules nach
 * public/admin/ (KEIN Runtime-CDN). Läuft als `postinstall` (nach jedem `npm install`)
 * und als `prebuild` (Sicherheitsnetz vor dem Astro-Copy von public/ → dist/).
 *
 * Version wird über die devDependency @sveltia/cms in package.json gepinnt (kein ^);
 * ein Update ist ein BEWUSSTER Version-Bump (siehe CLAUDE.md). Das Bundle ist
 * gitignored (~2 MB) und wird bei jedem Install/Build frisch synchronisiert.
 *
 * Fehlertolerant: fehlt das Bundle (z. B. Install mit --ignore-scripts), nur Warnung +
 * Exit 0 — der öffentliche Build bleibt lauffähig; nur /admin fehlt dann das Skript.
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'node_modules', '@sveltia', 'cms', 'dist', 'sveltia-cms.js');
const DEST_DIR = join(root, 'public', 'admin');
const DEST = join(DEST_DIR, 'sveltia-cms.js');

try {
  if (!existsSync(SRC)) {
    console.warn('[sync-cms] @sveltia/cms-Bundle nicht gefunden — übersprungen (kein Fehler).');
    process.exit(0);
  }
  await mkdir(DEST_DIR, { recursive: true });
  await copyFile(SRC, DEST);
  console.log('[sync-cms] sveltia-cms.js → public/admin/ (aus gepinnter devDependency).');
} catch (e) {
  console.warn('[sync-cms] Konnte Bundle nicht kopieren (nicht fatal):', e?.message ?? e);
  process.exit(0);
}
