/**
 * gen-favicons.mjs — Favicon-Set aus dem App-Icon generieren.
 *
 * Quelle: src/assets/images/immobilien-bot-app-icon.png (vom Nutzer abgelegt).
 * Das Icon ist ein vollflächiges, opakes Gelb-Quadrat (rgb 255,237,63). Zur
 * Sicherheit wird die Quelle auf voller Fläche auf genau diese Grundfarbe
 * geflattet → garantiert KEINE transparenten Ecken (iOS/Android maskieren
 * selbst; wir liefern das volle Quadrat).
 *
 * Einmal ausführen:  node scripts/gen-favicons.mjs
 * sharp kommt über Astro; png-to-ico ist devDependency (sharp kann kein .ico).
 *
 * Erzeugt in public/:
 *   apple-touch-icon.png (180), icon-192.png, icon-512.png,
 *   favicon-32.png, favicon-16.png, favicon.ico (16/32/48)
 * Quelle ist PNG → KEIN favicon.svg (bewusst nicht erzwungen).
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
// png-to-ico exportiert die Funktion unter .default (interop).
const pngToIco = require('png-to-ico').default ?? require('png-to-ico');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src/assets/images/immobilien-bot-app-icon.png');
const OUT = path.join(root, 'public');

// Grundfarbe des App-Icons (gesampelt) — nahtloses Flatten, keine Transparenz.
const BG = { r: 255, g: 237, b: 63 };

/** Quelle auf Größe rendern, flach auf BG (kein Alpha im Ergebnis). */
function render(size) {
  return sharp(SRC)
    .resize(size, size, { fit: 'cover' })
    .flatten({ background: BG })
    .png();
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const pngTargets = [
    ['apple-touch-icon.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['favicon-32.png', 32],
    ['favicon-16.png', 16],
  ];

  for (const [name, size] of pngTargets) {
    await render(size).toFile(path.join(OUT, name));
    console.log(`✓ ${name} (${size}×${size})`);
  }

  // favicon.ico mit 16/32/48 (png-to-ico bündelt mehrere PNG-Buffer).
  const icoSizes = [16, 32, 48];
  const icoBuffers = await Promise.all(
    icoSizes.map((s) => render(s).toBuffer()),
  );
  const ico = await pngToIco(icoBuffers);
  await fs.writeFile(path.join(OUT, 'favicon.ico'), ico);
  console.log(`✓ favicon.ico (${icoSizes.join('/')})`);

  console.log('Fertig.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
