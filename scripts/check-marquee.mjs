/**
 * check-marquee.mjs — Dauer-Wächter für die Bewertungen-Marquee (mit JS).
 *
 * Hintergrund: Die Marquee rendert jedes Testimonial serverseitig nur EINMAL; das
 * nahtlose Klon-Set (−50 %-Loop) hängt initReviewMarquee() (animations.ts) erst bei der
 * ERSTEN Nutzer-Interaktion clientseitig an (Perf/LCP: aus dem Idle-Bündel genommen) und
 * markiert die Reihe als `.is-marquee` (Loop-Gate). Der Guard löst darum eine echte
 * Eingabe (mousemove/wheel) aus — genau wie ein realer Nutzer, der zur Sektion scrollt.
 * Dieser Klon-Wrapper wird via document.createElement erzeugt und trägt daher NICHT
 * das Astro-`data-astro-cid` — eine an die Komponente *skopte* `.bw-clones`-Regel
 * (z. B. display:contents) griffe an ihm nicht. Genau das war der feb6ed7-Regressions-
 * bug: Wrapper blieb display:block → alle Klone stapelten vertikal in EINER Track-
 * Spalte, die Reihe blähte auf ~2200 px, der Loop war kaputt. Dieser Check macht die
 * Sicht-/Struktur­prüfung, die eine Editor-Absturz-Session damals verschluckt hat, zum
 * Dauerinventar — mit JS, auf `/` und `/en/`, bei 1440 + 390 px.
 *
 * Prüft je Marquee-Reihe:
 *   (a) `.is-marquee` erscheint ≤ 3 s (sonst greift das Loop-Gate nie → statisch).
 *   (b) Klon-Karten-Anzahl == Original-Karten-Anzahl.
 *   (c) computed styles der ersten Klon-Karte == erste Original-Karte
 *       (display, width, background, font) UND der Klon-Wrapper ist display:contents
 *       (die exakte Regressions-Signatur).
 * Schreibt zusätzlich eine Screenshot-Serie t=0/2/6 s je Seite/Breite nach
 * `.marquee-shots/` (Artefakt für den menschlichen Blick). Exit ≠ 0 bei jedem Verstoß.
 *
 * Wie audit-lh/check-overflow: puppeteer-core + LOKAL installierter Chrome
 * (chrome-launcher), KEIN Chromium-Download. Ist der Stack nicht startbar, wird lokal
 * (portables Windows-Setup) mit Hinweis übersprungen (Exit 0), in CI aber als Fehler
 * gewertet (Exit 1) — der Guard darf im CI-Gate nie stumm ausfallen.
 */
import { createServer } from 'node:http';
import { readFile, stat, mkdir, rm } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const DIST = join(ROOT, 'dist');
const SHOTS = join(ROOT, '.marquee-shots');
const PORT = 4333; // eigener Port (kollidiert nicht mit preview/overflow/shoot)
const PAGES = ['/', '/en/'];
const WIDTHS = [1440, 390];
const IS_MARQUEE_TIMEOUT = 3000; // (a) is-marquee muss ≤ 3 s stehen
const IS_CI = !!(process.env.CI || process.env.GITHUB_ACTIONS);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.ico': 'image/x-icon',
};
const C = { red: '\x1b[31m', yel: '\x1b[33m', grn: '\x1b[32m', dim: '\x1b[2m', rst: '\x1b[0m' };

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = join(DIST, pathname);
      if (pathname.endsWith('/')) filePath = join(filePath, 'index.html');
      else if (!extname(pathname)) {
        try { if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html'); }
        catch { filePath = join(filePath, 'index.html'); }
      }
      const body = await readFile(filePath);
      res.writeHead(200, { 'content-type': MIME[extname(filePath)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  return new Promise((res) => server.listen(PORT, () => res(server)));
}

async function findChrome() {
  const mod = await import('chrome-launcher');
  const Launcher = mod.Launcher || mod.default?.Launcher;
  const path = Launcher?.getFirstInstallation?.();
  if (!path) throw new Error('Kein lokaler Chrome gefunden (chrome-launcher).');
  return path;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Screenshot der Bewertungen-Sektion (Dokumentkoordinaten, captureBeyondViewport). */
async function shootBw(page, name) {
  const box = await page.evaluate(() => {
    const el = document.querySelector('#bewertungen');
    el.scrollIntoView({ block: 'start' });
    const r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
  });
  const clip = {
    x: Math.max(0, box.x), y: Math.max(0, box.y),
    width: Math.min(box.w, 2000), height: Math.min(box.h, 6000),
  };
  await page.screenshot({ path: join(SHOTS, `${name}.png`), clip, captureBeyondViewport: true });
}

async function main() {
  try { await stat(join(DIST, 'index.html')); }
  catch { console.error(`${C.red}dist/index.html fehlt — bitte zuerst \`npm run build\`.${C.rst}`); process.exit(2); }

  let puppeteer, executablePath;
  try {
    puppeteer = (await import('puppeteer-core')).default;
    executablePath = await findChrome();
  } catch (e) {
    const msg = `check:marquee — puppeteer-core/Chrome nicht startbar:\n  ${e.message}`;
    if (IS_CI) { console.error(`${C.red}${msg}\n  (CI: Guard darf nicht stumm ausfallen → Fehler.)${C.rst}`); process.exit(1); }
    console.error(`${C.yel}${msg}\n  (lokal übersprungen — portables Setup.)${C.rst}`); process.exit(0);
  }

  await rm(SHOTS, { recursive: true, force: true }).catch(() => {});
  await mkdir(SHOTS, { recursive: true });

  const server = await startServer();
  const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  const violations = [];
  try {
    for (const path of PAGES) {
      for (const width of WIDTHS) {
        const page = await browser.newPage();
        await page.setViewport({ width, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: true });
        await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle0', timeout: 30000 });
        // In die Bewertungen scrollen (Sichtbarkeit) UND eine echte Nutzer-Eingabe
        // auslösen: das Klon-Set entsteht bewusst erst bei erster Interaktion
        // (initReviewMarquee ist aus dem Idle-Bündel raus → Perf/LCP; animations.ts).
        // mousemove + wheel bringen die Reihen exakt so in den Loop wie ein realer
        // Nutzer. Bewusst KEIN reines 'scroll' als Trigger (stört sonst Lenis-Anker-
        // Scrolls) — deshalb hier eine echte Zeiger-/Wheel-Eingabe statt scrollIntoView.
        await page.evaluate(() => document.querySelector('#bewertungen')?.scrollIntoView({ block: 'start' }));
        await page.mouse.move(Math.round(width / 2), 450);
        await page.mouse.wheel({ deltaY: 10 });

        // (a) Warten (≤ 3 s), bis ALLE Marquee-Reihen `.is-marquee` tragen. Zeitmessung
        // per Poll (kein Date.now im Script-Sandbox-Kontext nötig — hier ist Node).
        const t0 = Date.now();
        let isMarqueeMs = null;
        while (Date.now() - t0 <= IS_MARQUEE_TIMEOUT) {
          const allSet = await page.evaluate(() => {
            const rows = [...document.querySelectorAll('#bewertungen [data-bw-marquee]')];
            return rows.length > 0 && rows.every((r) => r.classList.contains('is-marquee'));
          });
          if (allSet) { isMarqueeMs = Date.now() - t0; break; }
          await wait(100);
        }

        // Struktur-/Style-Diagnostik je Reihe.
        const rows = await page.evaluate(() => {
          const out = [];
          const rowEls = [...document.querySelectorAll('#bewertungen [data-bw-marquee]')];
          for (let i = 0; i < rowEls.length; i++) {
            const row = rowEls[i];
            const track = row.querySelector('.bw-track');
            const clonesEl = track?.querySelector('.bw-clones');
            const origCards = track ? [...track.children].filter((c) => c.classList.contains('bw-quote')) : [];
            const cloneCards = clonesEl ? [...clonesEl.children].filter((c) => c.classList.contains('bw-quote')) : [];
            const pick = (el) => {
              if (!el) return null;
              const cs = getComputedStyle(el);
              return { display: cs.display, width: cs.width, bg: cs.backgroundColor, fontSize: cs.fontSize, fontFamily: cs.fontFamily };
            };
            out.push({
              index: i + 1,
              isMarquee: row.classList.contains('is-marquee'),
              origCount: origCards.length,
              cloneCount: cloneCards.length,
              wrapperPresent: !!clonesEl,
              wrapperDisplay: clonesEl ? getComputedStyle(clonesEl).display : null,
              wrapperAriaHidden: clonesEl ? clonesEl.getAttribute('aria-hidden') : null,
              firstOrig: pick(origCards[0]),
              firstClone: pick(cloneCards[0]),
            });
          }
          return out;
        });

        // Screenshot-Serie t=0/2/6 s (Artefakt).
        const base = `${path === '/' ? 'de' : 'en'}-${width}`;
        await shootBw(page, `${base}-t0`);
        await wait(2000); await shootBw(page, `${base}-t2`);
        await wait(4000); await shootBw(page, `${base}-t6`);

        // ---- Assertions ----
        const tag = `${path.padEnd(6)} @ ${width}px`;
        const rowIssues = [];
        if (rows.length === 0) rowIssues.push('keine Marquee-Reihen gefunden (#bewertungen [data-bw-marquee])');
        if (isMarqueeMs === null) rowIssues.push(`(a) .is-marquee nicht auf allen Reihen ≤ ${IS_MARQUEE_TIMEOUT} ms`);
        for (const r of rows) {
          const L = `Reihe ${r.index}`;
          if (!r.isMarquee) rowIssues.push(`${L}: (a) .is-marquee fehlt`);
          if (!r.wrapperPresent) rowIssues.push(`${L}: Klon-Wrapper .bw-clones fehlt`);
          if (r.cloneCount !== r.origCount) rowIssues.push(`${L}: (b) Klonzahl ${r.cloneCount} ≠ Originalzahl ${r.origCount}`);
          if (r.wrapperPresent && r.wrapperDisplay !== 'contents')
            rowIssues.push(`${L}: (c) .bw-clones display:${r.wrapperDisplay} (erwartet: contents → sonst Vertikal-Stapel-Bug)`);
          if (r.wrapperAriaHidden !== 'true') rowIssues.push(`${L}: Klon-Wrapper nicht aria-hidden`);
          const a = r.firstOrig, b = r.firstClone;
          if (a && b) {
            for (const k of ['display', 'width', 'bg', 'fontSize', 'fontFamily']) {
              if (a[k] !== b[k]) rowIssues.push(`${L}: (c) ${k} Klon „${b[k]}" ≠ Original „${a[k]}"`);
            }
          } else if (r.origCount > 0) {
            rowIssues.push(`${L}: (c) erste Klon-/Original-Karte nicht vergleichbar`);
          }
        }

        if (rowIssues.length === 0) {
          console.log(`${C.grn}✓${C.rst} ${tag}  ${C.dim}(is-marquee ${isMarqueeMs}ms; Reihen ${rows.map((r) => `${r.cloneCount}=${r.origCount}`).join(', ')}; Wrapper contents)${C.rst}`);
        } else {
          console.log(`${C.red}✗${C.rst} ${tag}`);
          for (const m of rowIssues) console.log(`    ${C.yel}${m}${C.rst}`);
          violations.push({ page: path, width, rowIssues });
        }
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('');
  if (violations.length) {
    console.error(`${C.red}Marquee-Defekt: ${violations.length} Kombination(en) fehlerhaft. Screenshots in .marquee-shots/.${C.rst}`);
    process.exit(1);
  }
  console.log(`${C.grn}Marquee sauber — ${PAGES.length}×${WIDTHS.length} Kombinationen (is-marquee ≤ 3 s, Klonzahl = Originalzahl, Wrapper display:contents, Styles identisch). Shots in .marquee-shots/.${C.rst}`);
}

main().catch((e) => { console.error(`${C.red}check:marquee-Fehler:${C.rst}`, e); process.exit(2); });
