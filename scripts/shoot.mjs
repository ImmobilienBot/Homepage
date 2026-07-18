/**
 * shoot.mjs — Sektionsweiser Screenshot-Loop für die visuelle Selbstkontrolle.
 *
 * Lädt das gebaute dist/ über denselben eingebetteten Static-Server wie
 * check-overflow.mjs (kein astro preview → kein Orphan-Prozess) und schießt
 * Element-Screenshots einzelner Sektionen (+ Zustands-Shots) nach .shots/.
 * Namensschema: {seite}-{breite}-{sektion}[-{zustand}].png.
 *
 * Vor dem Schießen wird EINMAL komplett durchgescrollt (Play-once-Reveals),
 * dann je Ziel in den Viewport gescrollt + 600ms Settle. Fixe Chrome-Elemente
 * (Header-Pille, Smart-Bar, Custom-Cursor, Scroll-Cue) werden für Sektions-Shots
 * ausgeblendet, damit die Aufnahme sauber ist (Zustands-Shots zeigen sie bewusst).
 *
 * Nutzt puppeteer-core + den LOKAL installierten Chrome (chrome-launcher) — KEIN
 * Chromium-Download. CLI: `npm run shoot -- --only portale` schießt nur die
 * Portale-relevanten Shots.
 */
import { createServer } from 'node:http';
import { readFile, stat, mkdir, rm } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const DIST = join(ROOT, 'dist');
const SHOTS = join(ROOT, '.shots');
const PORT = 4332;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.ico': 'image/x-icon',
};
const C = { red: '\x1b[31m', grn: '\x1b[32m', dim: '\x1b[2m', rst: '\x1b[0m' };

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

// --- Shot-Matrix (Sektions-Shots) ---
const ALL = ['hero', 'problem', 'portale', 'features', 'ablauf', 'bewertungen', 'preise', 'faq', 'kontakt', 'footer'];
const MATRIX = [
  { page: '/', lang: 'de', width: 390, sections: ALL },
  { page: '/', lang: 'de', width: 320, sections: ['portale', 'features', 'ablauf', 'kontakt', 'footer', 'problem'] },
  { page: '/en/', lang: 'en', width: 390, sections: ['problem', 'portale', 'preise'] },
];

const SEL = (id) => (id === 'footer' ? 'footer' : id === 'header' ? 'header.site-header' : `#${id}`);

// Fixe Chrome-Elemente aus-/einblenden (für saubere Sektions-Shots).
async function setChromeHidden(page, hidden) {
  await page.evaluate((h) => {
    const sels = ['header.site-header', '[data-smart-bar]', '.cursor', '[data-hero-cue]'];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el) el.style.visibility = h ? 'hidden' : '';
    }
  }, hidden);
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const h = document.scrollingElement || document.documentElement;
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y <= h.scrollHeight; y += step) { window.scrollTo(0, y); await sleep(90); }
    window.scrollTo(0, h.scrollHeight); await sleep(150); window.scrollTo(0, 0); await sleep(150);
  });
}

// Element-Shot mit ~16px Rand (Dokumentkoordinaten, captureBeyondViewport).
async function shootSection(page, id, name) {
  const box = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    el.scrollIntoView({ block: 'start' });
    const r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
  }, SEL(id));
  if (!box) { console.log(`${C.dim}  (übersprungen: ${id} nicht gefunden)${C.rst}`); return; }
  await new Promise((r) => setTimeout(r, 600));
  const m = 16;
  const clip = {
    x: Math.max(0, box.x - m), y: Math.max(0, box.y - m),
    width: Math.min(box.w + 2 * m, 2000), height: Math.min(box.h + 2 * m, 6000),
  };
  await page.screenshot({ path: join(SHOTS, `${name}.png`), clip, captureBeyondViewport: true });
  console.log(`${C.grn}✓${C.rst} ${name}.png ${C.dim}(${Math.round(clip.width)}×${Math.round(clip.height)})${C.rst}`);
}

async function main() {
  try { await stat(join(DIST, 'index.html')); }
  catch { console.error(`${C.red}dist/index.html fehlt — bitte zuerst \`npm run build\`.${C.rst}`); process.exit(2); }

  const onlyIdx = process.argv.indexOf('--only');
  const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;

  let puppeteer, executablePath;
  try { puppeteer = (await import('puppeteer-core')).default; executablePath = await findChrome(); }
  catch (e) { console.error(`${C.red}shoot übersprungen — puppeteer-core/Chrome nicht startbar:${C.rst}\n  ${e.message}`); process.exit(0); }

  await rm(SHOTS, { recursive: true, force: true }).catch(() => {});
  await mkdir(SHOTS, { recursive: true });

  const server = await startServer();
  const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    for (const { page: path, lang, width, sections } of MATRIX) {
      const sel = only ? sections.filter((s) => s === only) : sections;
      if (!sel.length) continue;
      const page = await browser.newPage();
      await page.setViewport({ width, height: 780, deviceScaleFactor: 2, isMobile: false, hasTouch: true });
      await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await autoScroll(page);
      await setChromeHidden(page, true);
      console.log(`\n${C.dim}— ${lang} @${width} (${path}) —${C.rst}`);
      for (const id of sel) await shootSection(page, id, `${lang}-${width}-${id}`);
      await page.close();
    }

    // --- Zustands-Shots (nur DE @390, es sei denn --only schließt sie aus) ---
    const wantState = (s) => !only || only === s || (only === 'portale' && s === 'portale') || (only === 'faq' && s === 'faq');
    const statePage = async (fn) => {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 780, deviceScaleFactor: 2, isMobile: false, hasTouch: true });
      await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0', timeout: 30000 });
      await autoScroll(page);
      await fn(page);
      await page.close();
    };
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    if (!only || only === 'menu') await statePage(async (page) => {
      await page.evaluate(() => window.scrollTo(0, 800)); await wait(300);
      await page.click('[data-burger]'); await wait(700);
      await page.screenshot({ path: join(SHOTS, 'de-390-menu-open-scrolled.png') });
      console.log(`${C.grn}✓${C.rst} de-390-menu-open-scrolled.png`);
    });

    if (!only || only === 'smartbar') {
      // Android-Geräteprofil (Pixel-Metrics, mobile UA, isMobile:true, dpr ~2.6) — NUR
      // hier; check-overflow bleibt isMobile:false (sonst maskierter Overflow, Runde 1).
      const AND_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36';
      const shootBar = async (w, h, name) => {
        const page = await browser.newPage();
        await page.setUserAgent(AND_UA);
        await page.setViewport({ width: w, height: h, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
        await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0', timeout: 30000 });
        await wait(1400); // Lenis muss initialisiert sein, bevor stop()+scroll greift
        // Lenis pausieren (sonst springt der Scroll zurück), an #features scrollen und
        // die Bar sicher einblenden (Positions-Shot → freies Schweben/Schatten prüfen).
        await page.evaluate(() => {
          window.__lenis?.stop();
          const el = document.querySelector('#features');
          const y = el ? el.getBoundingClientRect().top + window.scrollY - 80 : 1600;
          window.scrollTo(0, y);
          const bar = document.querySelector('[data-smart-bar]');
          if (bar) { bar.classList.add('is-visible'); bar.setAttribute('aria-hidden', 'false'); }
        });
        await wait(700);
        // Voller VIEWPORT (captureBeyondViewport:false) → das fixierte Bar-Element wird
        // an seiner Bildschirmposition unten mitaufgenommen (ein clip liefe in Dokument-
        // koordinaten und träfe das fixierte Element nicht).
        await page.screenshot({ path: join(SHOTS, `${name}.png`), captureBeyondViewport: false });
        console.log(`${C.grn}✓${C.rst} ${name}.png ${C.dim}(Android-Profil)${C.rst}`);
        await page.close();
      };
      await shootBar(412, 915, 'android-412-smartbar-visible');
      await shootBar(320, 720, 'android-320-smartbar-visible');
    }

    if (wantState('problem')) await statePage(async (page) => {
      await setChromeHidden(page, true);
      await page.evaluate(() => document.querySelector('#problem')?.scrollIntoView({ block: 'start' })); await wait(2500);
      await shootSection(page, 'problem', 'de-390-problem-settled');
    });

    if (wantState('portale')) await statePage(async (page) => {
      await setChromeHidden(page, true);
      await page.evaluate(() => { const d = document.querySelector('.pf-regional'); if (d) d.open = true; }); await wait(700);
      await shootSection(page, 'portale', 'de-390-portale-open');
    });

    // Sektionsübergang Portale → Folgesektion: die Portale-Unterkante wird im Viewport
    // zentriert (oberes Halbbild = Portale-Ende, unteres = Anfang der Folgesektion).
    if (wantState('portale')) {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 780, deviceScaleFactor: 2, isMobile: false, hasTouch: true });
      await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0', timeout: 30000 });
      await wait(1400); // Lenis initialisiert
      await setChromeHidden(page, true);
      await page.evaluate(() => {
        const el = document.querySelector('#portale');
        const bottom = el.getBoundingClientRect().bottom + window.scrollY;
        window.__lenis?.stop();
        window.scrollTo(0, Math.max(0, bottom - window.innerHeight * 0.5));
      });
      await wait(500);
      await page.screenshot({ path: join(SHOTS, 'de-390-portale-seam.png'), captureBeyondViewport: false });
      console.log(`${C.grn}✓${C.rst} de-390-portale-seam.png`);
      await page.close();
    }

    if (wantState('faq')) await statePage(async (page) => {
      await setChromeHidden(page, true);
      await page.evaluate(() => { const d = document.querySelector('#faq details, #faq .faq-item details'); if (d) d.open = true; }); await wait(500);
      await shootSection(page, 'faq', 'de-390-faq-open');
    });
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`\n${C.grn}Shots in .shots/${C.rst}`);
}

main().catch((e) => { console.error(`${C.red}shoot-Fehler:${C.rst}`, e); process.exit(2); });
