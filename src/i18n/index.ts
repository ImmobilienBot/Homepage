/**
 * i18n-Helfer. DE (Standard) auf /, EN auf /en/.
 * Nutzung in .astro:
 *   const lang = getLangFromUrl(Astro.url);
 *   const t = useTranslations(lang);
 *   t.hero.headline
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
    href: origin + localizePath(path, lang),
  }));
  // x-default zeigt auf die Standard-Sprache (DE)
  alternates.push({ lang: 'x-default', href: origin + localizePath(path, 'de') });
  return alternates;
}
