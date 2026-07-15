/**
 * i18n-Helfer. DE (Standard) auf /, EN auf /en/.
 * Nutzung in .astro:
 *   const lang = getLangFromUrl(Astro.url);
 *   const t = useTranslations(lang);
 *   t.hero.headlineLines
 */
import { de, type Dict } from './de';
import { en } from './en';
import type { Locale } from '../data/site';

export const defaultLang: Locale = 'de';
export const languages: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
};

/** hreflang-Codes je Locale. */
export const hreflangCodes: Record<Locale, string> = {
  de: 'de-DE',
  en: 'en-US',
};

const dicts: Record<Locale, Dict> = { de, en };

/** Sprache aus dem URL-Pfad ableiten (/en/... → 'en', sonst 'de'). */
export function getLangFromUrl(url: URL): Locale {
  const [, seg] = url.pathname.split('/');
  if (seg === 'en') return 'en';
  return defaultLang;
}

/** Wörterbuch für eine Sprache holen. */
export function useTranslations(lang: Locale): Dict {
  return dicts[lang] ?? dicts[defaultLang];
}

/**
 * Pfad in die Zielsprache übersetzen (für Sprachumschalter / hreflang).
 * DE hat keinen Präfix, EN den Präfix /en.
 */
export function localizePath(path: string, lang: Locale): string {
  // vorhandenen Sprach-Präfix entfernen → „nackter" Pfad
  let bare = path.replace(/^\/(en)(?=\/|$)/, '');
  if (bare === '') bare = '/';
  if (lang === defaultLang) return bare;
  return bare === '/' ? '/en/' : `/en${bare}`;
}

/* ------------------------------------------------------------------ */
/* Sprach-Pendants                                                     */
/* ------------------------------------------------------------------ */
/**
 * Routen mit ÜBERSETZTEM Slug (nicht bloß /en-Präfix). Für alle anderen Seiten
 * genügt `localizePath` (reine Präfix-Logik). Hier NUR die Ausnahmen pflegen.
 */
export const translatedRoutes: { de: string; en: string }[] = [
  { de: '/ueber-uns/', en: '/en/about/' },
];

/**
 * DE-only-Seiten (Rechtsseiten) — es gibt KEIN Sprach-Pendant. Der Umschalter
 * führt für die jeweils andere Sprache auf die Sprach-Root. (Normalisiert ohne
 * Trailing-Slash.)
 */
export const standaloneRoutes = new Set(['/impressum', '/datenschutz', '/agb', '/contact']);

/**
 * DE-only-Ratgeber (`/YYYY/MM/DD/slug`) — ebenfalls kein Sprach-Pendant, aber
 * per Muster erkannt (nicht enumeriert), damit neue/entfernte Artikel NICHT in
 * i18n gepflegt werden müssen. Umschalter → Sprach-Root (wie standaloneRoutes).
 */
const isRatgeberPath = (p: string): boolean => /^\/\d{4}\/\d{2}\/\d{2}\//.test(p);

const stripTrailing = (p: string): string => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);
const hasTrailing = (p: string): boolean => p.length > 1 && p.endsWith('/');
/** `dest` an den Trailing-Slash-Stil von `like` angleichen (Self-Ref-Konsistenz). */
const applyTrailing = (dest: string, like: string): string => {
  const base = stripTrailing(dest);
  return hasTrailing(like) ? (base === '' ? '/' : `${base}/`) : base === '' ? '/' : base;
};

/**
 * Sprach-Pendant eines Pfads inkl. übersetzter Slugs. Für die aktuelle Sprache
 * identisch zum Eingabepfad (Self-Referencing hreflang bleibt exakt). Basis für
 * `getAlternates` (hreflang) UND den Header-Sprachumschalter.
 */
export function pathPendant(path: string, target: Locale): string {
  const norm = stripTrailing(path);
  for (const pair of translatedRoutes) {
    if (norm === stripTrailing(pair.de) || norm === stripTrailing(pair.en)) {
      return applyTrailing(target === defaultLang ? pair.de : pair.en, path);
    }
  }
  return localizePath(path, target);
}

/**
 * href für den Sprachumschalter. DE-only-Seiten ohne Pendant → Sprach-Root der
 * Zielsprache (aktuelle Sprache bleibt auf der Seite).
 */
export function switchLangHref(path: string, target: Locale): string {
  if (standaloneRoutes.has(stripTrailing(path)) || isRatgeberPath(path)) {
    return target === defaultLang ? path : '/en/';
  }
  return pathPendant(path, target);
}

/**
 * Reziproke hreflang-Alternates für die aktuelle URL erzeugen.
 * Gibt absolute URLs zurück (Basis = Astro.site).
 */
export function getAlternates(
  url: URL,
  siteUrl: string | URL | undefined,
): { lang: string; href: string }[] {
  const origin = siteUrl ? new URL(siteUrl).origin : url.origin;
  const path = url.pathname;
  const alternates = (['de', 'en'] as Locale[]).map((lang) => ({
    lang: hreflangCodes[lang],
    href: origin + pathPendant(path, lang),
  }));
  // x-default zeigt auf die Standard-Sprache (DE)
  alternates.push({ lang: 'x-default', href: origin + pathPendant(path, 'de') });
  return alternates;
}
