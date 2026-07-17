/**
 * reviews.ts — echte Store-/Maps-Rezensionen (verbatim).
 *
 * DÜNNER WRAPPER: Die Rezensionen liegen ab jetzt in `testimonials.json`
 * (CMS-editierbar via Sveltia unter /admin). Diese Datei importiert das JSON und
 * exportiert die bisherige API (`reviews`, `Review`, `ReviewPlatform`,
 * `reviewPlatformLabel`) UNVERÄNDERT — kein Komponenten-Import ändert sich.
 *
 * BEWUSSTE AUSNAHME von der i18n-Regel (siehe CLAUDE.md): Die Review-TEXTE bleiben
 * beidsprachig (`text.de` / `text.en`) am Datensatz, damit Zitat, Autor, Plattform und
 * Sterne nie auseinanderlaufen (eine untrennbare Einheit). Locale-Verhalten exakt wie
 * bisher (Bewertungen rendert `text[lang]`). Kürzungen `[…]` bleiben so.
 *
 * FAKTEN bleiben in site.ts: die Aggregat-Zahlen (4,6★ / Anzahl) sowie der Google-Maps-
 * Rezensionslink (`googleMapsReviewsUrl`) und die Store-Links (`storeLinks`).
 */
import { ratings } from './site';
import testimonials from './testimonials.json';

export type ReviewPlatform = 'appstore' | 'googleplay' | 'googlemaps';

export interface Review {
  /** Stabile, sprachneutrale ID. */
  id: string;
  author: string;
  platform: ReviewPlatform;
  rating: 4 | 5;
  text: { de: string; en: string };
  /** Optionaler Ort (CMS-Feld); aktuell für keine Rezension gesetzt. */
  city?: string;
}

/** JSON-Rohform (CMS-Feldnamen: name statt author). */
interface Testimonial {
  id: string;
  name: string;
  platform: ReviewPlatform;
  rating: 4 | 5;
  text: { de: string; en: string };
  city?: string;
}

/** Plattform-Anzeigename (identisch zu den Rating-Kachel-Pills, aus site.ts). */
export const reviewPlatformLabel: Record<ReviewPlatform, string> = {
  appstore: ratings.appStore.label,
  googleplay: ratings.playStore.label,
  googlemaps: ratings.googleMaps.label,
};

/** CMS-Datensatz (name) → bisherige Review-Form (author) — Bewertungen bleibt unverändert. */
export const reviews: Review[] = (testimonials as Testimonial[]).map((t) => ({
  id: t.id,
  author: t.name,
  platform: t.platform,
  rating: t.rating,
  text: t.text,
  ...(t.city ? { city: t.city } : {}),
}));
