/**
 * audit-seo.ts — statisches SEO/GEO-Audit des gebauten dist/-Ordners.
 *
 * Kein Netzwerkzugriff. EINZIGE Faktenquelle ist src/data/site.ts (importiert) —
 * Preise, Portale, Bewertungen, Store-Links werden gegen das gerenderte HTML
 * geprüft, damit Fakten nie auseinanderlaufen.
 *
 * Auditiert alle indexierbaren .html-Seiten in dist/ (Ausnahmen: dist/bot/** =
 * Juris Bereich; noindex-Seiten = bewusst aus dem Index genommene Rechts-/Redirect-
 * Seiten). Findet ≥1 Error → Exit 1 (wie ein Build-Fehler). Warnings brechen nicht.
 *
 * Aufruf: `tsx scripts/audit-seo.ts` (bzw. `npm run audit:seo`).
 */
import * as cheerio from 'cheerio';
import { load as loadYaml } from 'js-yaml';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import {
  site,
  contact,
  storeLinks,
  aggregateRating,
  pricing,
  portals,
  portalCount,
  ratings,
  totalReviewCount,
  problemStat,
} from '../src/data/site.ts';

type Severity = 'error' | 'warn';
interface Finding {
  id: string;
  severity: Severity;
  page: string;
  message: string;
}

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const findings: Finding[] = [];
const add = (id: string, severity: Severity, page: string, message: string) =>
  findings.push({ id, severity, page, message });

// ---- kleine Helfer ---------------------------------------------------------

/** Rekursiv alle .html unter dist/ sammeln — außer dist/bot/**. */
function collectHtml(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) {
      // Juris Bereich niemals auditieren.
      if (abs === join(DIST, 'bot')) continue;
      collectHtml(abs, acc);
    } else if (entry.endsWith('.html')) {
      acc.push(abs);
    }
  }
  return acc;
}

/** dist-Dateipfad → URL-Pfad („/", „/en/", „/impressum/"). */
function toUrlPath(file: string): string {
  let rel = file.slice(DIST.length).split(sep).join('/');
  rel = rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (!rel.startsWith('/')) rel = '/' + rel;
  if (rel === '') rel = '/';
  return rel;
}

/** URL-Pfad → dist-Datei (Ordner → index.html). Gibt null, wenn nicht vorhanden. */
function urlPathToFile(urlPath: string): string | null {
  let p = urlPath.split('/').filter(Boolean).join(sep);
  const candidates = p
    ? [join(DIST, p, 'index.html'), join(DIST, p + '.html'), join(DIST, p)]
    : [join(DIST, 'index.html')];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

const localeOf = (page: string): 'de' | 'en' => (page === '/en/' || page.startsWith('/en/') ? 'en' : 'de');
const isHome = (page: string) => page === '/' || page === '/en/';

/** Sichtbarer Text (ohne <script>/<style>/<template>). */
function visibleText($: cheerio.CheerioAPI): string {
  const body = $('body').clone();
  body.find('script, style, template, noscript').remove();
  return body.text().replace(/\s+/g, ' ');
}

/** Preiswert im Seiten-Locale formatieren: 2.99 → „2,99" (de) / „2.99" (en). */
const fmtPrice = (value: number, loc: 'de' | 'en') => value.toFixed(2).replace('.', loc === 'de' ? ',' : '.');

/** Rating-Score im Seiten-Locale, feste 1 Nachkommastelle: 4.6 → „4,6"/„4.6" (wie Bewertungen.astro). */
const fmtScore = (value: number, loc: 'de' | 'en') =>
  new Intl.NumberFormat(loc === 'de' ? 'de-DE' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

/** Alle @type-Strings aus allen JSON-LD-Blöcken einer Seite (inkl. @graph). */
function collectJsonLd($: cheerio.CheerioAPI, page: string): unknown[] {
  const nodes: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    try {
      const data = JSON.parse(raw);
      const graph = Array.isArray(data) ? data : (data['@graph'] ?? [data]);
      for (const n of Array.isArray(graph) ? graph : [graph]) nodes.push(n);
    } catch {
      add('S10', 'error', page, 'JSON-LD-Block ist kein valides JSON.');
    }
  });
  return nodes;
}

const typeOf = (node: unknown): string[] => {
  const t = (node as Record<string, unknown>)?.['@type'];
  return Array.isArray(t) ? (t as string[]) : t ? [t as string] : [];
};

// ---- Doc-Cache (für seitenübergreifende Anker-Prüfung) ---------------------
const docCache = new Map<string, cheerio.CheerioAPI>();
function loadDoc(file: string): cheerio.CheerioAPI {
  let $ = docCache.get(file);
  if (!$) {
    $ = cheerio.load(readFileSync(file, 'utf8'));
    docCache.set(file, $);
  }
  return $;
}

// ============================================================================
// PRO-SEITE-CHECKS
// ============================================================================
function auditPage(file: string) {
  const page = toUrlPath(file);
  const html = readFileSync(file, 'utf8');
  const $ = cheerio.load(html);
  const loc = localeOf(page);

  // noindex-Seiten (Rechtstexte, /go/app-Weiche) sind bewusst aus dem Index →
  // keine SEO-Pflichten. Komplett überspringen (kein Finding).
  const robots = ($('meta[name="robots"]').attr('content') || '').toLowerCase();
  if (robots.includes('noindex')) return { page, skipped: true };

  // --- S1: genau ein h1 ---
  const h1s = $('h1');
  if (h1s.length !== 1) add('S1', 'error', page, `Es muss genau ein <h1> geben (gefunden: ${h1s.length}).`);

  // --- S2: Heading-Hierarchie ohne Sprünge ---
  let prev = 0;
  $('h1,h2,h3,h4,h5,h6').each((_, el) => {
    const level = Number(el.tagName[1]);
    if (prev && level > prev + 1)
      add('S2', 'error', page, `Heading-Sprung: <h${level}> folgt auf <h${prev}> (übersprungene Ebene).`);
    prev = level;
  });

  // --- S3: title ---
  const title = ($('title').first().text() || '').trim();
  if (!title) add('S3', 'error', page, '<title> fehlt oder ist leer.');
  else if (title.length > 70) add('S3', 'warn', page, `<title> ist ${title.length} Zeichen lang (> 70).`);

  // --- S4: meta description ---
  const desc = ($('meta[name="description"]').attr('content') || '').trim();
  if (!desc) add('S4', 'error', page, 'meta[name=description] fehlt.');
  else if (desc.length < 70 || desc.length > 160)
    add('S4', 'warn', page, `meta description ist ${desc.length} Zeichen (Zielbereich 70–160).`);

  // --- S5: canonical ---
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  if (!canonical) add('S5', 'error', page, 'link[rel=canonical] fehlt.');
  else if (!/^https:\/\//.test(canonical)) add('S5', 'error', page, `canonical ist keine absolute https-URL: ${canonical}`);

  // --- S6: hreflang (de, en, x-default, reziprok, self-ref) ---
  // Ausnahme: DE-only-Seiten (Rechtsseiten) rendern BEWUSST keine Alternates
  // (standalone). Eine Seite deklariert also entweder das vollständige reziproke
  // hreflang-Set ODER gar keins — 0 Alternates ⇒ standalone, Check schläft.
  const alts = new Map<string, string>();
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    alts.set(($(el).attr('hreflang') || '').toLowerCase(), $(el).attr('href') || '');
  });
  const isStandalone = alts.size === 0;
  const deKey = [...alts.keys()].find((k) => k === 'de' || k.startsWith('de-'));
  const enKey = [...alts.keys()].find((k) => k === 'en' || k.startsWith('en-'));
  if (!isStandalone) {
    if (!deKey) add('S6', 'error', page, 'hreflang-Alternate für „de" fehlt.');
    if (!enKey) add('S6', 'error', page, 'hreflang-Alternate für „en" fehlt.');
    if (!alts.has('x-default')) add('S6', 'error', page, 'hreflang „x-default" fehlt.');
    if (deKey && alts.has('x-default') && alts.get('x-default') !== alts.get(deKey))
      add('S6', 'error', page, 'x-default zeigt nicht auf die DE-URL.');
    if (canonical && ![...alts.values()].includes(canonical))
      add('S6', 'error', page, 'Self-Referencing hreflang fehlt (canonical nicht unter den Alternates).');
  }

  // --- S7: html[lang] ---
  const htmlLang = ($('html').attr('lang') || '').toLowerCase();
  if (htmlLang !== loc) add('S7', 'error', page, `html[lang]="${htmlLang}" passt nicht zur Seite (erwartet „${loc}").`);

  // --- S8: OpenGraph + Twitter ---
  for (const p of ['og:title', 'og:description', 'og:url', 'og:type']) {
    if (!$(`meta[property="${p}"]`).attr('content')) add('S8', 'error', page, `${p} fehlt.`);
  }
  for (const n of ['twitter:card', 'twitter:title', 'twitter:description']) {
    if (!$(`meta[name="${n}"]`).attr('content')) add('S8', 'error', page, `${n} fehlt.`);
  }
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (!ogImage) {
    add('S8', 'warn', page, 'og:image fehlt (Asset ist bekanntes TODO).');
  } else {
    try {
      const p = new URL(ogImage, site.url).pathname;
      if (!existsSync(join(DIST, p.split('/').filter(Boolean).join(sep))))
        add('S8', 'warn', page, `og:image-Datei existiert nicht in dist: ${p} (bekanntes TODO).`);
    } catch {
      add('S8', 'warn', page, `og:image-URL unlesbar: ${ogImage}`);
    }
  }

  // --- S9: img alt ---
  $('img').each((_, el) => {
    const $img = $(el);
    const alt = $img.attr('alt');
    const src = $img.attr('src') || '(inline)';
    if (alt === undefined) {
      add('S9', 'error', page, `<img> ohne alt-Attribut: ${src}`);
    } else if (alt.trim() === '') {
      const decorative =
        $img.attr('aria-hidden') === 'true' ||
        $img.attr('role') === 'presentation' ||
        $img.closest('[aria-hidden="true"]').length > 0;
      if (!decorative) add('S9', 'warn', page, `<img alt=""> ohne aria-hidden/role=presentation: ${src}`);
    }
  });

  // --- S10: JSON-LD valid + Pflichttypen auf Home ---
  const ld = collectJsonLd($, page);
  if (isHome(page)) {
    const types = new Set(ld.flatMap(typeOf));
    const hasApp = types.has('MobileApplication') || types.has('SoftwareApplication');
    if (!hasApp) add('S10', 'error', page, 'JSON-LD: MobileApplication/SoftwareApplication fehlt.');
    if (!types.has('Organization')) add('S10', 'error', page, 'JSON-LD: Organization fehlt.');
    if (!types.has('WebSite')) add('S10', 'error', page, 'JSON-LD: WebSite fehlt.');
  }

  // --- S11: Fakten-Sync JSON-LD (nur Home) ---
  if (isHome(page)) {
    const appNode = ld.find((n) => typeOf(n).some((t) => t === 'MobileApplication' || t === 'SoftwareApplication')) as
      | Record<string, any>
      | undefined;
    if (appNode) {
      const offers = Array.isArray(appNode.offers) ? appNode.offers : appNode.offers ? [appNode.offers] : [];
      const ldPrices = offers.map((o: any) => String(o.price)).sort();
      const expected = pricing.map((p) => p.priceValue.toFixed(2)).sort();
      if (JSON.stringify(ldPrices) !== JSON.stringify(expected))
        add('S11', 'error', page, `JSON-LD offers-Preise ${JSON.stringify(ldPrices)} ≠ site.ts ${JSON.stringify(expected)}.`);
      const ar = appNode.aggregateRating;
      if (!ar) add('S11', 'error', page, 'JSON-LD aggregateRating fehlt.');
      else {
        if (Number(ar.ratingValue) !== aggregateRating.ratingValue)
          add('S11', 'error', page, `aggregateRating.ratingValue ${ar.ratingValue} ≠ site.ts ${aggregateRating.ratingValue}.`);
        if (Number(ar.ratingCount) !== aggregateRating.ratingCount)
          add('S11', 'error', page, `aggregateRating.ratingCount ${ar.ratingCount} ≠ site.ts ${aggregateRating.ratingCount}.`);
      }
    }
    // Portalanzahl, falls im JSON-LD genannt (z. B. „Überwacht 20 Immobilienportale").
    const ldStr = JSON.stringify(ld);
    const m = ldStr.match(/(\d+)\s*Immobilienportale/);
    if (m && Number(m[1]) !== portalCount)
      add('S11', 'error', page, `Portalanzahl im JSON-LD (${m[1]}) ≠ site.ts (${portalCount}).`);
  }

  // --- S12: Fakten-Sync HTML (nur Home) ---
  if (isHome(page)) {
    const vt = visibleText($);
    for (const plan of pricing.filter((p) => p.priceValue > 0)) {
      const s = fmtPrice(plan.priceValue, loc);
      if (!vt.includes(s)) add('S12', 'error', page, `Preis „${s}" (aus site.ts) fehlt im sichtbaren HTML.`);
    }
    for (const portal of portals) {
      if (!vt.includes(portal.name)) add('S12', 'error', page, `Portal-Name „${portal.name}" (aus site.ts) fehlt im HTML.`);
    }
    // Bewertungen: sichtbare Scores, Counts und totalReviewCount gegen site.ts.
    for (const r of Object.values(ratings)) {
      const s = fmtScore(r.stars, loc);
      if (!vt.includes(s))
        add('S12', 'error', page, `Rating-Score „${s}" (${r.label}, aus site.ts) fehlt im sichtbaren HTML.`);
      if (!vt.includes(String(r.count)))
        add('S12', 'error', page, `Rating-Count „${r.count}" (${r.label}, aus site.ts) fehlt im sichtbaren HTML.`);
    }
    if (!vt.includes(String(totalReviewCount)))
      add('S12', 'error', page, `totalReviewCount „${totalReviewCount}" (aus site.ts) fehlt im sichtbaren HTML.`);
    // Problem-Statistik (Berliner Zeitung) — die drei Zahlen aus site.ts problemStat
    // (Desktop-Satz/Zahl + Mobile-Scoreboard rendern daraus).
    const applicantsStr = new Intl.NumberFormat(loc === 'de' ? 'de-DE' : 'en-US').format(
      problemStat.applicants,
    );
    for (const s of [applicantsStr, String(problemStat.minutes), String(problemStat.flats)]) {
      if (!vt.includes(s))
        add('S12', 'error', page, `Problem-Statistik „${s}" (aus site.ts) fehlt im sichtbaren HTML.`);
    }
  }

  // --- S16: Kontakt-Fakten-Sync (nur Home) — sichtbare mailto-Adresse + JSON-LD ---
  if (isHome(page)) {
    // Sichtbarer mailto-Link auf die öffentliche Kontaktadresse (Kontakt-Sektion).
    const hasMailto = $(`a[href="mailto:${contact.email}"]`).length > 0;
    if (!hasMailto)
      add('S16', 'error', page, `mailto:${contact.email} (site.ts contact.email) fehlt als Link im HTML.`);
    // JSON-LD: Organization/ContactPoint-E-Mail muss der Kontaktadresse entsprechen.
    const org = ld.find((n) => typeOf(n).includes('Organization')) as Record<string, any> | undefined;
    const cp = org?.contactPoint;
    const cpEmail = Array.isArray(cp) ? cp[0]?.email : cp?.email;
    if (!cpEmail) add('S16', 'error', page, 'JSON-LD Organization.contactPoint.email fehlt.');
    else if (cpEmail !== contact.email)
      add('S16', 'error', page, `JSON-LD contactPoint.email „${cpEmail}" ≠ site.ts „${contact.email}".`);
  }

  // --- S13: interne Links ---
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    if (!href || /^(https?:)?\/\//.test(href) || /^(mailto:|tel:)/.test(href)) return; // extern/leer
    // Query + Hash abtrennen (nur der Pfad zählt für die Datei-Auflösung).
    let rest = href;
    let hash = '';
    const hi = rest.indexOf('#');
    if (hi >= 0) {
      hash = rest.slice(hi + 1);
      rest = rest.slice(0, hi);
    }
    const qi = rest.indexOf('?');
    if (qi >= 0) rest = rest.slice(0, qi);
    const pathPart = rest;

    let targetFile: string = file;
    if (pathPart.startsWith('/')) {
      const tf = urlPathToFile(pathPart);
      if (!tf) {
        add('S13', 'error', page, `Interner Link zeigt auf nicht existierende Datei: ${href}`);
        return;
      }
      targetFile = tf;
    } else if (pathPart !== '') {
      return; // relative Pfade (kommen hier nicht vor) — nicht prüfen
    }
    if (hash) {
      const $t = targetFile === file ? $ : loadDoc(targetFile);
      if ($t(`#${CSS_escape(hash)}`).length === 0)
        add('S13', 'error', page, `Anker „#${hash}" existiert nicht auf der Zielseite (${href}).`);
    }
  });

  // --- S14: GEO-Lesbarkeit ohne JS (nur Home) ---
  if (isHome(page)) {
    if (!($('h1').first().text() || '').trim())
      add('S14', 'error', page, 'H1-Text ist im Roh-HTML leer (nur per JS injiziert?).');
    const featHeads = $('#features')
      .find('h2,h3,h4')
      .filter((_, el) => !!$(el).text().trim());
    if (featHeads.length < 2)
      add('S14', 'error', page, 'Feature-Säulen-Überschriften fehlen im Roh-HTML.');
    const vt = visibleText($);
    const anyPrice = pricing.some((p) => p.priceValue > 0 && vt.includes(fmtPrice(p.priceValue, loc)));
    if (!anyPrice) add('S14', 'error', page, 'Preise sind im Roh-HTML nicht als Klartext vorhanden.');
  }

  // --- S15: FAQ ↔ FAQPage-JSON-LD (Deckungsgleichheit) ---
  const faq = $('#faq');
  if (faq.length) {
    const faqHtml = faq.html() || '';
    const placeholder = /\[(?:antwort folgt|answer follows|answer|todo)[^\]]*\]/i.test(faqHtml);
    if (!placeholder) {
      const faqPage = ld.find((n) => typeOf(n).includes('FAQPage')) as Record<string, any> | undefined;
      if (!faqPage) {
        add('S15', 'error', page, 'FAQ-Sektion mit echten Antworten, aber kein FAQPage-JSON-LD.');
      } else {
        // Anzahl + Wortlaut der FAQPage-Questions müssen exakt den gerenderten
        // <summary>-Texten entsprechen (Whitespace normalisiert) — sonst laufen
        // strukturierte Daten und sichtbarer Text auseinander.
        const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
        const summaries = faq
          .find('summary')
          .map((_, el) => norm($(el).text()))
          .get();
        const mainEntity = Array.isArray(faqPage.mainEntity) ? faqPage.mainEntity : [];
        const questions = mainEntity.map((q: any) => norm(String(q?.name ?? '')));
        if (questions.length !== summaries.length) {
          add(
            'S15',
            'error',
            page,
            `FAQPage-Fragen (${questions.length}) ≠ gerenderte <summary> (${summaries.length}).`,
          );
        } else {
          for (let i = 0; i < questions.length; i++) {
            if (questions[i] !== summaries[i])
              add(
                'S15',
                'error',
                page,
                `FAQPage-Frage #${i + 1} „${questions[i]}" ≠ <summary> „${summaries[i]}".`,
              );
          }
        }
      }
    }
    // Platzhalter-Antworten → FAQ noch nicht live → Regel schläft (kein Finding).
  }

  return { page, skipped: false };
}

/** Minimaler CSS.escape-Ersatz für ID-Selektoren (Node ohne DOM). */
function CSS_escape(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
}

// ============================================================================
// GLOBALE CHECKS
// ============================================================================
function auditGlobal() {
  const G = '(global)';

  // --- G1: llms.txt ---
  const llmsPath = join(DIST, 'llms.txt');
  if (!existsSync(llmsPath)) {
    add('G1', 'error', G, 'dist/llms.txt fehlt.');
  } else {
    const llms = readFileSync(llmsPath, 'utf8');
    if (!llms.trim()) add('G1', 'error', G, 'llms.txt ist leer.');
    if (!llms.includes(storeLinks.ios)) add('G1', 'error', G, 'llms.txt enthält den iOS-Store-Link nicht.');
    if (!llms.includes(storeLinks.android)) add('G1', 'error', G, 'llms.txt enthält den Android-Store-Link nicht.');
    for (const plan of pricing.filter((p) => p.priceValue > 0)) {
      const s = fmtPrice(plan.priceValue, 'de');
      if (!llms.includes(s)) add('G1', 'error', G, `llms.txt nennt den Preis „${s}" nicht.`);
    }
    if (!llms.includes(String(portalCount)))
      add('G1', 'error', G, `llms.txt nennt die Portalanzahl ${portalCount} nicht.`);
    // Kontakt-Fakten (E-Mail + Telegram-Support) aus site.ts.
    if (!llms.includes(contact.email))
      add('G1', 'error', G, `llms.txt nennt die Kontaktadresse „${contact.email}" nicht.`);
    if (!llms.includes(contact.telegramSupport))
      add('G1', 'error', G, `llms.txt nennt den Telegram-Support-Link nicht.`);
  }

  // --- G2: robots.txt ---
  const robotsPath = join(DIST, 'robots.txt');
  if (!existsSync(robotsPath)) {
    add('G2', 'error', G, 'dist/robots.txt fehlt.');
  } else {
    const robots = readFileSync(robotsPath, 'utf8');
    if (/^\s*Disallow:\s*\/\s*$/im.test(robots)) add('G2', 'error', G, 'robots.txt enthält ein pauschales „Disallow: /".');
    if (!/^\s*Sitemap:\s*https?:\/\//im.test(robots)) add('G2', 'error', G, 'robots.txt referenziert keine (absolute) Sitemap.');
    const bots = ['GPTBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'CCBot'];
    for (const bot of bots) {
      // Block „User-agent: BOT ... Disallow: /" → wäre eine Sperre.
      const re = new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Disallow:\\s*/\\s*$`, 'im');
      if (re.test(robots)) add('G2', 'error', G, `robots.txt blockiert den AI-Crawler ${bot}.`);
    }
  }

  // --- G3: Sitemap ---
  const smIndex = join(DIST, 'sitemap-index.xml');
  if (!existsSync(smIndex)) {
    add('G3', 'error', G, 'dist/sitemap-index.xml fehlt.');
  } else {
    const idx = readFileSync(smIndex, 'utf8');
    const smFiles = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const locs: string[] = [];
    for (const smUrl of smFiles) {
      const smFile = urlPathToFile(new URL(smUrl).pathname);
      if (smFile) locs.push(...[...readFileSync(smFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    }
    const paths = locs.map((u) => new URL(u).pathname);
    if (!paths.includes('/')) add('G3', 'error', G, 'Sitemap enthält die Startseite „/" nicht.');
    if (!paths.includes('/en/')) add('G3', 'error', G, 'Sitemap enthält „/en/" nicht.');
    for (const p of paths) {
      if (!urlPathToFile(p)) add('G3', 'error', G, `Sitemap-URL ohne Datei in dist: ${p}`);
    }
    // /admin (CMS) darf NICHT in der Sitemap stehen.
    for (const p of paths) {
      if (p.startsWith('/admin')) add('G3', 'error', G, `Sitemap enthält die CMS-Route „${p}" (darf nicht indexiert werden).`);
    }
  }

  // --- G4: i18n-Key-Parität DE↔EN (bidirektional, rekursiv inkl. Array-Längen) ---
  const i18nDe = join(ROOT, 'src', 'i18n', 'strings.de.json');
  const i18nEn = join(ROOT, 'src', 'i18n', 'strings.en.json');
  if (!existsSync(i18nDe) || !existsSync(i18nEn)) {
    add('G4', 'error', G, 'strings.de.json und/oder strings.en.json fehlt.');
  } else {
    const kDe = i18nLeafPaths(JSON.parse(readFileSync(i18nDe, 'utf8')));
    const kEn = i18nLeafPaths(JSON.parse(readFileSync(i18nEn, 'utf8')));
    for (const k of kDe) if (!kEn.has(k)) add('G4', 'error', G, `i18n-Key nur in DE, fehlt in EN: „${k}".`);
    for (const k of kEn) if (!kDe.has(k)) add('G4', 'error', G, `i18n-Key nur in EN, überzählig ggü. DE: „${k}".`);
  }

  // --- G5: Sveltia-config.yml deckt 100 % der i18n-Keys ab (sonst Datenverlust beim CMS-Speichern) ---
  const cfgPath = join(ROOT, 'public', 'admin', 'config.yml');
  if (!existsSync(cfgPath)) {
    add('G5', 'error', G, 'public/admin/config.yml fehlt (Sveltia-CMS-Konfiguration).');
  } else if (!existsSync(i18nDe)) {
    add('G5', 'error', G, 'strings.de.json fehlt — Coverage-Abgleich nicht möglich.');
  } else {
    try {
      const cfg = loadYaml(readFileSync(cfgPath, 'utf8')) as any;
      const coll = (cfg?.collections ?? []).find((c: any) => c?.name === 'website-texte');
      const fields = coll?.files?.[0]?.fields;
      if (!Array.isArray(fields)) {
        add('G5', 'error', G, 'config.yml: Collection „website-texte" (files[0].fields) nicht gefunden.');
      } else {
        const cCfg = cmsSchemaPaths(fields);
        const cJson = i18nSchemaPaths(JSON.parse(readFileSync(i18nDe, 'utf8')));
        for (const k of cJson) if (!cCfg.has(k)) add('G5', 'error', G, `i18n-Key „${k}" ist NICHT in config.yml abgebildet (beim CMS-Speichern ginge er verloren → gen-cms-config.mjs neu ausführen).`);
        for (const k of cCfg) if (!cJson.has(k)) add('G5', 'error', G, `config.yml enthält veraltetes Feld „${k}" (kein i18n-Key mehr → gen-cms-config.mjs neu ausführen).`);
      }
    } catch (e) {
      add('G5', 'error', G, `config.yml konnte nicht geparst werden: ${(e as Error).message}`);
    }
  }

  // --- G6: kein i18n-String-Wert mit Randleerzeichen (Sveltia trimmt sie beim Speichern) ---
  // Wortabstände gehören ins Markup, nie an die String-Ränder. Verhindert dauerhaft, dass ein
  // CMS-Save (oder Handedit) Inline-Verkettungen zerlegt — egal ob DE, EN, CMS oder CC.
  for (const [loc, file] of [['DE', i18nDe], ['EN', i18nEn]] as const) {
    if (!existsSync(file)) continue;
    for (const { path, value } of i18nStringLeaves(JSON.parse(readFileSync(file, 'utf8')))) {
      if (value !== value.trim())
        add('G6', 'error', G, `${loc}: i18n-Wert „${path}" hat führendes/nachgestelltes Leerzeichen (${JSON.stringify(value.slice(0, 40))}) — Wortabstand gehört ins Markup, nicht an den String-Rand.`);
    }
  }
}

/** Alle String-Blätter eines i18n-Objekts mit Pfad (rekursiv, inkl. Arrays). */
function i18nStringLeaves(o: unknown, prefix = ''): { path: string; value: string }[] {
  const out: { path: string; value: string }[] = [];
  if (Array.isArray(o)) {
    o.forEach((v, i) => out.push(...i18nStringLeaves(v, `${prefix}[${i}]`)));
  } else if (o && typeof o === 'object') {
    for (const k of Object.keys(o as Record<string, unknown>))
      out.push(...i18nStringLeaves((o as Record<string, unknown>)[k], prefix ? `${prefix}.${k}` : k));
  } else if (typeof o === 'string') {
    out.push({ path: prefix, value: o });
  }
  return out;
}

/** Kanonische Schema-Pfade eines i18n-Objekts (Arrays auf Struktur reduziert, Keys über Items vereint). */
function i18nSchemaPaths(o: unknown, prefix = ''): Set<string> {
  const s = new Set<string>();
  if (Array.isArray(o)) {
    const objs = o.filter((x) => x && typeof x === 'object' && !Array.isArray(x)) as Record<string, unknown>[];
    if (objs.length) {
      const keys = new Set<string>();
      for (const it of objs) for (const k of Object.keys(it)) keys.add(k);
      for (const k of keys) {
        const rep = objs.find((it) => k in it)![k];
        i18nSchemaPaths(rep, prefix ? `${prefix}.${k}` : k).forEach((x) => s.add(x));
      }
    } else {
      s.add(prefix); // Array von Skalaren = ein Listen-Leaf
    }
  } else if (o && typeof o === 'object') {
    for (const k of Object.keys(o as Record<string, unknown>))
      i18nSchemaPaths((o as Record<string, unknown>)[k], prefix ? `${prefix}.${k}` : k).forEach((x) => s.add(x));
  } else {
    s.add(prefix);
  }
  return s;
}

/** Kanonische Schema-Pfade der Sveltia-Feldliste (object→rekursiv, list+fields→rekursiv, sonst Leaf). */
function cmsSchemaPaths(fields: any[], prefix = ''): Set<string> {
  const s = new Set<string>();
  for (const f of fields) {
    const p = prefix ? `${prefix}.${f.name}` : f.name;
    if (f.widget === 'object') cmsSchemaPaths(f.fields ?? [], p).forEach((x) => s.add(x));
    else if (f.widget === 'list') {
      if (Array.isArray(f.fields)) cmsSchemaPaths(f.fields, p).forEach((x) => s.add(x));
      else s.add(p); // Liste von Skalaren
    } else s.add(p);
  }
  return s;
}

/** Alle Leaf-Pfade eines i18n-Objekts (inkl. Array-Indizes) — für Paritäts-/Coverage-Checks. */
function i18nLeafPaths(o: unknown, prefix = ''): Set<string> {
  const s = new Set<string>();
  if (Array.isArray(o)) {
    o.forEach((v, i) => i18nLeafPaths(v, `${prefix}[${i}]`).forEach((k) => s.add(k)));
  } else if (o && typeof o === 'object') {
    for (const k of Object.keys(o as Record<string, unknown>))
      i18nLeafPaths((o as Record<string, unknown>)[k], prefix ? `${prefix}.${k}` : k).forEach((x) => s.add(x));
  } else {
    s.add(prefix);
  }
  return s;
}

// ============================================================================
// RUN + REPORT
// ============================================================================
function main() {
  if (!existsSync(DIST)) {
    console.error('dist/ nicht gefunden — bitte zuerst `npm run build` ausführen.');
    process.exit(1);
  }

  const files = collectHtml(DIST).sort();
  const audited: string[] = [];
  const skipped: string[] = [];
  for (const f of files) {
    const r = auditPage(f);
    (r.skipped ? skipped : audited).push(r.page);
  }
  auditGlobal();

  // ---- Report (pro Seite gruppiert) ----
  const RED = '\x1b[31m';
  const YEL = '\x1b[33m';
  const GRN = '\x1b[32m';
  const DIM = '\x1b[2m';
  const RST = '\x1b[0m';

  const byPage = new Map<string, Finding[]>();
  for (const f of findings) {
    if (!byPage.has(f.page)) byPage.set(f.page, []);
    byPage.get(f.page)!.push(f);
  }

  console.log(`\n${DIM}SEO/GEO-Audit — ${audited.length} indexierbare Seiten, ${skipped.length} übersprungen (noindex/bot)${RST}`);
  if (skipped.length) console.log(`${DIM}  übersprungen: ${skipped.join(', ')}${RST}`);

  const pagesInOrder = [...audited, '(global)'].filter((p) => byPage.has(p));
  // auch Seiten mit Findings, die nicht in audited stehen (z. B. JSON-Fehler auf noindex? — vorsichtshalber)
  for (const p of byPage.keys()) if (!pagesInOrder.includes(p)) pagesInOrder.push(p);

  let errors = 0;
  let warns = 0;
  for (const p of pagesInOrder) {
    const list = byPage.get(p)!;
    console.log(`\n${p}`);
    for (const f of list) {
      const isErr = f.severity === 'error';
      if (isErr) errors++;
      else warns++;
      const tag = isErr ? `${RED}ERROR${RST}` : `${YEL}WARN ${RST}`;
      console.log(`  ${tag} [${f.id}] ${f.message}`);
    }
  }

  console.log(
    `\n${errors ? RED : GRN}Summary: ${errors} Error(s), ${warns} Warning(s)${RST} über ${audited.length} Seiten + globale Checks.\n`,
  );
  process.exit(errors > 0 ? 1 : 0);
}

main();
