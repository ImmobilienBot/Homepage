/**
 * audit-lh.ts — Windows-fester lokaler Lighthouse-Lauf (Ersatz für `lhci autorun`
 * NUR lokal). Hintergrund: chrome-launcher wirft auf diesem Windows-Setup EPERM
 * beim Löschen seines Temp-Ordners; `lhci autorun` bricht dadurch ab und blockiert
 * in der Kette sogar `audit:seo`. Lighthouse selbst läuft aber durch — `saveResults`
 * schreibt das JSON, BEVOR der fehlschlagende Chrome-Kill kommt. Dieses Skript nutzt
 * genau das aus: es tolliert einen Exit ≠ 0 nur, wenn das JSON vollständig geschrieben
 * wurde, und liest die Scores daraus.
 *
 * CI bleibt unberührt: dort läuft weiter `lhci autorun` (Median aus 3, alle 4
 * Schwellen hart) — das ist die maßgebliche Performance-Messung.
 *
 * Lokale Gates: Accessibility / Best-Practices / SEO = 100 (hart → Exit 1).
 * Performance: KEIN Gate, nur eine WARN-Zeile bei < 95 (Einzellauf, maschinen-
 * abhängig; der CI-Median ist maßgeblich).
 *
 * Aufruf: `tsx scripts/audit-lh.ts` (bzw. `npm run audit:lh`).
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TMP = join(ROOT, '.tmp-lh');
const LH_CLI = join(ROOT, 'node_modules', 'lighthouse', 'cli', 'index.js');
const PORT = 4321;
const READY = `localhost:${PORT}`;
const PAGES: { label: string; path: string }[] = [
  { label: 'de', path: '/' },
  { label: 'en', path: '/en/' },
  { label: 'about-de', path: '/ueber-uns/' },
  { label: 'about-en', path: '/en/about/' },
];
const CATS = ['performance', 'accessibility', 'best-practices', 'seo'] as const;
type Cat = (typeof CATS)[number];
// Deterministische Gates (müssen = 100 sein). Performance bewusst NICHT dabei.
const HARD_GATES: Cat[] = ['accessibility', 'best-practices', 'seo'];

const C = { red: '\x1b[31m', yel: '\x1b[33m', grn: '\x1b[32m', dim: '\x1b[2m', rst: '\x1b[0m' };

/** Preview-Server starten und auf das Ready-Pattern warten. */
function startPreview(): Promise<ReturnType<typeof spawn>> {
  return new Promise((resolve, reject) => {
    // shell:true → npm(.cmd) wird plattformübergreifend gefunden. Kommando als
    // EIN String (kein Args-Array) → keine DEP0190-Shell-Warnung.
    const child = spawn('npm run preview', { shell: true, cwd: ROOT });
    let settled = false;
    let buffer = ''; // akkumulieren — das Ready-Pattern kann über mehrere Chunks kommen
    const onData = (buf: Buffer) => {
      if (settled) return;
      buffer += buf.toString();
      if (buffer.includes(READY)) {
        settled = true;
        resolve(child);
      }
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.on('error', reject);
    child.on('exit', (code) => {
      if (!settled) reject(new Error(`Preview-Server beendet (Code ${code}), bevor er bereit war.`));
    });
    setTimeout(() => {
      if (!settled) reject(new Error(`Preview-Server nicht binnen 60s auf ${READY} bereit.`));
    }, 60_000);
  });
}

/** Preview (inkl. Kindprozessen) sauber beenden — plattformabhängig. */
function stopPreview(child: ReturnType<typeof spawn>) {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    // /T killt den Prozessbaum (astro preview läuft unter der Shell).
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      child.kill('SIGTERM');
    } catch {
      /* egal */
    }
  }
}

/** Einen Lighthouse-Lauf ausführen und die 4 Kategorien-Scores (0–100) zurückgeben. */
function runLighthouse(label: string, urlPath: string): Record<Cat, number> {
  const out = join(TMP, `lh-${label}.json`);
  if (existsSync(out)) rmSync(out);
  const env = { ...process.env, TEMP: TMP, TMP: TMP };
  const res = spawnSync(
    process.execPath,
    [
      LH_CLI,
      `http://localhost:${PORT}${urlPath}`,
      '--quiet',
      '--output=json',
      `--output-path=${out}`,
      // Mobile-Defaults (kein Preset umstellen). All-Categories = Default.
      '--chrome-flags=--headless=new --no-sandbox',
    ],
    { env, encoding: 'utf8', cwd: ROOT },
  );

  // EPERM beim Chrome-Cleanup ⇒ Exit ≠ 0, ABER saveResults hat das JSON schon
  // geschrieben. Nur tolerieren, wenn die Datei vollständig ist.
  if (!existsSync(out)) {
    throw new Error(
      `Lighthouse hat kein Ergebnis für ${urlPath} geschrieben (Exit ${res.status}).\n${res.stderr || ''}`,
    );
  }
  let lhr: any;
  try {
    lhr = JSON.parse(readFileSync(out, 'utf8'));
  } catch {
    throw new Error(`Lighthouse-JSON für ${urlPath} ist unlesbar/kaputt.`);
  }
  const scores = {} as Record<Cat, number>;
  for (const c of CATS) {
    const s = lhr.categories?.[c]?.score;
    if (typeof s !== 'number') {
      throw new Error(`Kategorie „${c}" fehlt im Ergebnis für ${urlPath} (unvollständiger Lauf).`);
    }
    scores[c] = Math.round(s * 100);
  }
  if (res.status !== 0) {
    console.log(`${C.dim}  (${label}: Lighthouse-Exit ${res.status} toleriert — JSON vollständig, bekannter Chrome-Cleanup-EPERM)${C.rst}`);
  }
  return scores;
}

async function main() {
  mkdirSync(TMP, { recursive: true });
  console.log(`${C.dim}Lokaler Lighthouse-Lauf (Einzellauf je Seite, Mobile-Default). CI misst Median aus 3.${C.rst}`);

  let preview: ReturnType<typeof spawn> | null = null;
  const results: Record<string, Record<Cat, number>> = {};
  try {
    preview = await startPreview();
    for (const p of PAGES) {
      console.log(`${C.dim}  … messe ${p.path}${C.rst}`);
      results[p.label] = runLighthouse(p.label, p.path);
    }
  } finally {
    if (preview) stopPreview(preview);
  }

  // ---- Score-Tabelle (4 Kategorien × 2 Seiten) ----
  const col = (s: string, w: number) => s.padEnd(w);
  const pageLabels = PAGES.map((p) => p.path);
  console.log(`\n${col('Kategorie', 18)}${pageLabels.map((l) => col(l, 10)).join('')}`);
  console.log('─'.repeat(18 + 10 * PAGES.length));
  const scoreCell = (v: number, hard: boolean) => {
    const ok = hard ? v === 100 : v >= 95;
    const color = ok ? C.grn : hard ? C.red : C.yel;
    return `${color}${col(String(v), 10)}${C.rst}`;
  };
  for (const c of CATS) {
    const hard = HARD_GATES.includes(c);
    const cells = PAGES.map((p) => scoreCell(results[p.label][c], hard)).join('');
    console.log(`${col(c + (hard ? ' *' : ''), 18)}${cells}`);
  }
  console.log(`${C.dim}* deterministisches Gate (= 100 Pflicht). Performance ohne Gate.${C.rst}`);

  // ---- Gates ----
  let failed = false;
  for (const p of PAGES) {
    for (const c of HARD_GATES) {
      const v = results[p.label][c];
      if (v !== 100) {
        console.log(`${C.red}GATE-FAIL${C.rst} ${p.path}: ${c} = ${v} (erwartet 100).`);
        failed = true;
      }
    }
    const perf = results[p.label].performance;
    if (perf < 95) {
      console.log(
        `${C.yel}WARN${C.rst} ${p.path}: Performance = ${perf} (< 95). Einzellauf — der CI-Median (lhci) ist maßgeblich.`,
      );
    }
  }

  if (failed) {
    console.log(`\n${C.red}Lighthouse-Gates nicht bestanden (A11y/Best-Practices/SEO müssen 100 sein).${C.rst}\n`);
    process.exit(1);
  }
  console.log(`\n${C.grn}Lighthouse-Gates bestanden (A11y/Best-Practices/SEO = 100 auf allen Seiten).${C.rst}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`${C.red}audit:lh fehlgeschlagen:${C.rst} ${err.message}`);
  process.exit(1);
});
