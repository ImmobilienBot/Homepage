/**
 * scripts/export-email-logo.mjs — Einmaliger Export (KEIN Build-Step).
 *
 * Rastert die CD-Primär-Wortbildmarke (dunkel, transparenter Hintergrund) auf
 * ein festes, ungehashtes PNG unter public/, damit die E-Mail-Templates es über
 * eine stabile URL (`{origin}/email-assets/logo@2x.png`) referenzieren können —
 * astro:assets vergibt Hashes und ist für Mail-Referenzen ungeeignet.
 *
 * Anzeige 200px, Export 400px (2× Retina), Höhe proportional, transparent.
 * Aufruf: `node scripts/export-email-logo.mjs`
 */
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = resolve(root, 'src/assets/images/immobilien-bot-logo.svg');
const outDir = resolve(root, 'public/email-assets');
const out = resolve(outDir, 'logo@2x.png');

await mkdir(outDir, { recursive: true });

const info = await sharp(src, { density: 300 })
  .resize({ width: 400 }) // Höhe proportional (transparenter Hintergrund bleibt)
  .png({ compressionLevel: 9, palette: true })
  .toFile(out);

const { size } = await stat(out);
console.log(`✓ ${out}`);
console.log(`  ${info.width}×${info.height}px · ${(size / 1024).toFixed(1)} KB`);
