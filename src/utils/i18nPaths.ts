/**
 * i18nPaths.ts — Helfer für Sprach-Pendant-URLs (Header-Sprachumschalter).
 *
 * Rein statisch, kein JS zur Laufzeit: liefert zu einem gegebenen Pfad das
 * Pendant in der Zielsprache. Deckt reine /en-Präfix-Routen (`/` ↔ `/en/`) UND
 * Routen mit übersetztem Slug (`/ueber-uns` ↔ `/en/about`) ab; DE-only-Seiten
 * ohne Pendant (Rechtsseiten) führen auf die Sprach-Root der Zielsprache.
 *
 * Die eigentliche Zuordnung lebt zentral in `src/i18n` (dieselbe Logik speist
 * auch die hreflang-Alternates in SEO.astro) — hier nur der bequeme Re-Export
 * für Komponenten.
 */
export { switchLangHref, pathPendant, translatedRoutes, standaloneRoutes } from '../i18n';
