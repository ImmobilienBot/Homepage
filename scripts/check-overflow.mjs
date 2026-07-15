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

        const result = await page.evaluate(() => {
          const se = document.scrollingElement || document.documentElement;
          const iw = window.innerWidth;
          const ok = se.scrollWidth <= iw + 1;
          const culprits = [];
          if (!ok) {
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
            for (const el of document.querySelectorAll('body *')) {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) continue;
              if (r.right > iw + 1 || r.left < -1) {
                culprits.push({
                  sel: cssPath(el),
                  right: Math.round(r.right),
                  left: Math.round(r.left),
                });
              }
            }
          }
          return { ok, scrollWidth: se.scrollWidth, innerWidth: iw, culprits: culprits.slice(0, 12) };
        });

        const tag = `${path.padEnd(6)} @ ${width}px`;
        if (result.ok) {
          console.log(`${C.grn}✓${C.rst} ${tag}  ${C.dim}(scrollWidth ${result.scrollWidth} ≤ ${result.innerWidth})${C.rst}`);
        } else {
          console.log(
            `${C.red}✗${C.rst} ${tag}  scrollWidth ${result.scrollWidth} > innerWidth ${result.innerWidth}`,
          );
          for (const c of result.culprits) {
            console.log(`    ${C.yel}${c.sel}${C.rst}  ${C.dim}(right ${c.right}, left ${c.left})${C.rst}`);
          }
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
    console.error(`${C.red}Overflow gefunden: ${violations.length} Breite(n)/Seite(n).${C.rst}`);
    process.exit(1);
  }
  console.log(`${C.grn}Kein horizontaler Overflow — ${PAGES.length}×${WIDTHS.length} Kombinationen sauber.${C.rst}`);
}

main().catch((e) => {
  console.error(`${C.red}check:overflow-Fehler:${C.rst}`, e);
  process.exit(2);
});
