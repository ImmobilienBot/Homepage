/**
 * check-overflow.mjs — Mobile-Overflow-Wächter.
 *
 * Lädt das gebaute `dist/` über einen eingebetteten Static-Server (kein
 * `astro preview` → kein Orphan-Prozess auf Port 4321) und prüft `/` und `/en/`
 * bei 320 / 360 / 390 / 414 px auf horizontalen Overflow:
 *   document.scrollingElement.scrollWidth <= window.innerWidth + 1
 * Bei Verstoß werden die schuldigen Elemente (rect.right > innerWidth bzw.
 * rect.left < 0) mit kurzem CSS-Pfad ausgegeben. Exit-Code ≠ 0 bei Funden.
 *
 * Nutzt puppeteer-core + den LOKAL installierten Chrome (executablePath via
 * chrome-launcher) — KEIN Chromium-Download (gleicher Ansatz wie audit-lh.ts).
 * Läuft der portable Chrome/puppeteer-Stack nicht, endet das Skript mit einer
 * klaren Meldung (im Report vermerkt), ohne den Branch zu blockieren.
 *
 * NICHT in der GitHub Action (bewusste Entscheidung — siehe Task).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const DIST = join(ROOT, 'dist');
const PORT = 4331; // eigener Port (nicht 4321 → kollidiert nicht mit `astro preview`)
const WIDTHS = [320, 360, 390, 414];
const PAGES = ['/', '/en/'];

// Erwartete Sektionen der Startseite (echte IDs + Landmarks). Jede muss existieren,
// clientHeight > 100 haben und sichtbaren Text tragen — und darf weder als Ghost
// (opacity/visibility) noch von einem opaken aria-hidden-Layer verdeckt sein.
// [name, selector, minHeight] — der Header ist bewusst eine schlanke Leiste (~74px).
const EXPECTED_SECTIONS = [
  ['header', 'header.site-header', 40],
  ['hero', '#hero', 100],
  ['problem', '#problem', 100],
  ['portale', '#portale', 100],
  ['features', '#features', 100],
  ['ablauf', '#ablauf', 100],
  ['bewertungen', '#bewertungen', 100],
  ['preise', '#preise', 100],
  ['faq', '#faq', 100],
  ['kontakt', '#kontakt', 100],
  ['footer', 'footer', 40],
];

/** Seite in Schritten bis zum Ende scrollen (feuert alle ScrollTrigger-Reveals), dann zurück. */
async function autoScroll(page) {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const h = document.scrollingElement || document.documentElement;
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y <= h.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await sleep(90);
    }
    window.scrollTo(0, h.scrollHeight);
    await sleep(150);
    window.scrollTo(0, 0);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon',
};

const C = { red: '\x1b[31m', yel: '\x1b[33m', grn: '\x1b[32m', dim: '\x1b[2m', rst: '\x1b[0m' };

/** Minimaler Static-Server auf dist/ mit Directory→index.html-Auflösung. */
function startServer() {
  const server = createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = join(DIST, pathname);
      // Directory (endet auf / oder ohne Extension) → index.html
      if (pathname.endsWith('/')) {
        filePath = join(filePath, 'index.html');
      } else if (!extname(pathname)) {
        // /pfad → /pfad/index.html (Astro-Directory-Format)
        try {
          const s = await stat(filePath);
          if (s.isDirectory()) filePath = join(filePath, 'index.html');
        } catch {
          filePath = join(filePath, 'index.html');
        }
      }
      const body = await readFile(filePath);
      res.writeHead(200, { 'content-type': MIME[extname(filePath)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise((res) => server.listen(PORT, () => res(server)));
}

/** Chrome-Pfad über chrome-launcher (kein Chromium-Download). */
async function findChrome() {
  const mod = await import('chrome-launcher');
  const Launcher = mod.Launcher || mod.default?.Launcher;
  const path = Launcher?.getFirstInstallation?.();
  if (!path) throw new Error('Kein lokaler Chrome gefunden (chrome-launcher).');
  return path;
}

async function main() {
  // dist/ vorhanden?
  try {
    await stat(join(DIST, 'index.html'));
  } catch {
    console.error(`${C.red}dist/index.html fehlt — bitte zuerst \`npm run build\`.${C.rst}`);
    process.exit(2);
  }

  let puppeteer, executablePath;
  try {
    puppeteer = (await import('puppeteer-core')).default;
    executablePath = await findChrome();
  } catch (e) {
    console.error(
      `${C.yel}check:overflow übersprungen — puppeteer-core/Chrome nicht startbar in diesem Setup:${C.rst}\n  ${e.message}`,
    );
    // Nicht als Fehler werten (portables Setup) — Report vermerkt das.
    process.exit(0);
  }

  const server = await startServer();
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const violations = [];
  try {
    for (const path of PAGES) {
      for (const width of WIDTHS) {
        const page = await browser.newPage();
        // WICHTIG: isMobile:false. Mit isMobile:true weitet Chrome den Layout-
        // Viewport auf, um überstehenden Inhalt einzupassen (Overview-Modus) →
        // window.innerWidth wächst mit und scrollWidth === innerWidth MASKIERT
        // echten Overflow (falsche Grüns). isMobile:false hält innerWidth exakt auf
        // `width` fest, sodass scrollWidth realen horizontalen Overflow aufdeckt.
        // hasTouch bleibt an (Touch-Media-Queries), beeinflusst die Breite nicht.
        await page.setViewport({ width, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: true });
        await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle0', timeout: 30000 });
        // kurze Ruhephase für Reveals/Idle-Bündel
        await new Promise((r) => setTimeout(r, 400));

        // Vollständig durchscrollen, damit alle below-fold-Reveals (ScrollTrigger /
        // rIC-Bündel) tatsächlich feuern — sonst stünden legitime Reveal-Startzustände
        // (opacity:0) fälschlich als „Ghost" da. Danach zurück nach oben.
        await autoScroll(page);
        await new Promise((r) => setTimeout(r, 350));

        const result = await page.evaluate((expectedSections) => {
          const se = document.scrollingElement || document.documentElement;
          const iw = window.innerWidth;
          const cssPath = (el) => {
            const parts = [];
            let node = el;
            while (node && node.nodeType === 1 && parts.length < 4) {
              let sel = node.tagName.toLowerCase();
              if (node.id) {
                sel += `#${node.id}`;
                parts.unshift(sel);
                break;
              }
              if (node.className && typeof node.className === 'string') {
                const cls = node.className.trim().split(/\s+/).slice(0, 2).join('.');
                if (cls) sel += `.${cls}`;
              }
              parts.unshift(sel);
              node = node.parentElement;
            }
            return parts.join(' > ');
          };

          // ---- 1) Horizontaler Overflow ----
          const ok = se.scrollWidth <= iw + 1;
          const culprits = [];
          if (!ok) {
            for (const el of document.querySelectorAll('body *')) {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) continue;
              if (r.right > iw + 1 || r.left < -1) {
                culprits.push({ sel: cssPath(el), right: Math.round(r.right), left: Math.round(r.left) });
              }
            }
          }

          // Effektive (durchmultiplizierte) Deckkraft entlang der Vorfahrenkette;
          // 0, sobald ein Vorfahr display:none / visibility:hidden trägt.
          const effOpacity = (el) => {
            let o = 1;
            let n = el;
            while (n && n.nodeType === 1) {
              const cs = getComputedStyle(n);
              if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
              o *= parseFloat(cs.opacity || '1');
              n = n.parentElement;
            }
            return o;
          };
          const isOpaqueBg = (cs) => {
            const b = cs.backgroundColor || '';
            if (b === 'transparent' || b === 'rgba(0, 0, 0, 0)') return false;
            const m = b.match(/rgba?\(([^)]+)\)/);
            if (!m) return false;
            const parts = m[1].split(',').map((s) => parseFloat(s));
            return parts.length < 4 || parts[3] >= 0.9;
          };

          // ---- 2) Sektions-Inventar + 3) Ghost/Occlusion je erwarteter Sektion ----
          const missing = [];
          const ghosts = [];
          const covered = [];
          for (const [name, selector, minH] of expectedSections) {
            const sec = document.querySelector(selector);
            if (!sec) {
              missing.push({ name, reason: 'fehlt im DOM' });
              continue;
            }
            if (sec.clientHeight <= minH) {
              missing.push({ name, reason: `clientHeight ${sec.clientHeight} ≤ ${minH}` });
              continue;
            }
            if ((sec.innerText || '').trim().length === 0) {
              missing.push({ name, reason: 'kein sichtbarer Text' });
              continue;
            }

            // Repräsentatives Text-Element (Heading bevorzugt, sonst längster Text).
            let textEl = sec.querySelector('h1, h2, h3');
            if (!textEl || (textEl.innerText || '').trim().length < 4) {
              let best = null;
              let bestLen = 0;
              for (const el of sec.querySelectorAll('h1,h2,h3,h4,p,li,a,span,button')) {
                const own = Array.from(el.childNodes)
                  .filter((n) => n.nodeType === 3)
                  .map((n) => n.textContent)
                  .join('')
                  .trim();
                const r = el.getBoundingClientRect();
                if (own.length >= 10 && r.width >= 80 && r.height >= 16 && own.length > bestLen) {
                  best = el;
                  bestLen = own.length;
                }
              }
              textEl = best;
            }
            if (!textEl) continue;

            // Ghost: sichtbarer Text, aber effektiv (fast) unsichtbar → hängengebliebener
            // Reveal-/Startzustand (opacity/visibility), obwohl die Sektion below-fold
            // längst passiert wurde.
            if (effOpacity(textEl) < 0.1) {
              ghosts.push({ name, sel: cssPath(textEl), text: (textEl.innerText || '').trim().slice(0, 40) });
            }

            // Occlusion: opaker, aria-hidden Deko-Layer (z. B. eine nie weggeräumte
            // „section-wipe"), der die Sektion großflächig überdeckt und ÜBER dem Text
            // liegt. Genau das Muster des Problem-Sektion-Bugs (grauer Vorhang bleibt <lg).
            const secR = sec.getBoundingClientRect();
            const secArea = secR.width * secR.height;
            for (const d of sec.querySelectorAll('[aria-hidden="true"]')) {
              const cs = getComputedStyle(d);
              if (cs.display === 'none' || cs.visibility === 'hidden') continue;
              if (!isOpaqueBg(cs) || effOpacity(d) < 0.9) continue;
              const dr = d.getBoundingClientRect();
              const dArea = dr.width * dr.height;
              const z = parseInt(cs.zIndex, 10);
              if (secArea > 0 && dArea / secArea >= 0.6 && Number.isFinite(z) && z > 0) {
                covered.push({ name, sel: cssPath(d), z, cover: Math.round((dArea / secArea) * 100) });
                break;
              }
            }
          }

          return {
            ok,
            scrollWidth: se.scrollWidth,
            innerWidth: iw,
            culprits: culprits.slice(0, 12),
            missing,
            ghosts,
            covered,
          };
        }, EXPECTED_SECTIONS);

        const tag = `${path.padEnd(6)} @ ${width}px`;
        const contentIssues = result.missing.length + result.ghosts.length + result.covered.length;
        if (result.ok && contentIssues === 0) {
          console.log(`${C.grn}✓${C.rst} ${tag}  ${C.dim}(scrollWidth ${result.scrollWidth} ≤ ${result.innerWidth}; ${EXPECTED_SECTIONS.length} Sektionen sichtbar)${C.rst}`);
        } else {
          if (!result.ok) {
            console.log(`${C.red}✗${C.rst} ${tag}  scrollWidth ${result.scrollWidth} > innerWidth ${result.innerWidth}`);
            for (const c of result.culprits) {
              console.log(`    ${C.yel}${c.sel}${C.rst}  ${C.dim}(right ${c.right}, left ${c.left})${C.rst}`);
            }
          } else {
            console.log(`${C.red}✗${C.rst} ${tag}  Content-Problem (Overflow ok)`);
          }
          for (const m of result.missing) console.log(`    ${C.red}FEHLT${C.rst} ${m.name}  ${C.dim}(${m.reason})${C.rst}`);
          for (const g of result.ghosts) console.log(`    ${C.red}GHOST${C.rst} ${g.name}: ${C.yel}${g.sel}${C.rst} „${g.text}…"`);
          for (const cv of result.covered) console.log(`    ${C.red}VERDECKT${C.rst} ${cv.name}: opaker aria-hidden Layer ${C.yel}${cv.sel}${C.rst} ${C.dim}(z:${cv.z}, ${cv.cover}% Deckung)${C.rst}`);
          violations.push({ page: path, width, ...result });
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
    console.error(`${C.red}Probleme gefunden (Overflow und/oder fehlende/verdeckte Sektionen): ${violations.length} Breite(n)/Seite(n).${C.rst}`);
    process.exit(1);
  }
  console.log(`${C.grn}Sauber — ${PAGES.length}×${WIDTHS.length} Kombinationen: kein Overflow, alle ${EXPECTED_SECTIONS.length} Sektionen sichtbar & unverdeckt.${C.rst}`);
}

main().catch((e) => {
  console.error(`${C.red}check:overflow-Fehler:${C.rst}`, e);
  process.exit(2);
});
