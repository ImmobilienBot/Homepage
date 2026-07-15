/**
 * site.ts — EINE Quelle der Wahrheit für alle Produkt-Fakten.
 *
 * Store-Links (inkl. UTM/Tracking), Preise, Bewertungen und Portale werden
 * ausschließlich hier gepflegt (siehe CLAUDE.md → Konventionen).
 * Komponenten/i18n dürfen KEINE dieser Fakten hart codieren.
 */

/* ------------------------------------------------------------------ */
/* Site-Meta                                                          */
/* ------------------------------------------------------------------ */

export const site = {
  name: 'Immobilien Bot',
  domain: 'immobilien-bot.de',
  url: 'https://immobilien-bot.de',
  /** Kurzclaim / CD-Signatur */
  claim: 'Das Original. Schneller als die anderen.',
  email: 'socialmedia@immobilien-bot.de',
  defaultLocale: 'de' as const,
  locales: ['de', 'en'] as const,
} as const;

export type Locale = (typeof site.locales)[number];

/* ------------------------------------------------------------------ */
/* Kontakt — ÖFFENTLICHE Kanäle (sichtbar, JSON-LD, llms.txt)          */
/* ------------------------------------------------------------------ */
/**
 * Öffentliche Kontaktadresse + Social-Kanäle. Der Formular-EMPFÄNGER ist bewusst
 * NICHT hier: er lebt (Testphase!) als Env-Variable `CONTACT_TO` bzw. Code-Fallback
 * ausschließlich in der Pages Function `functions/api/contact.ts`. Hier stehen nur
 * öffentliche Fakten. Facts-Sync prüft `email` gegen HTML/JSON-LD/llms.txt.
 */
export const contact = {
  email: 'support@immobilien-bot.de',
  telegramSupport: 'https://t.me/ImmobilienBot_support',
  instagram: 'https://www.instagram.com/immobilienbot/',
} as const;

/* ------------------------------------------------------------------ */
/* Store-Links  (UTM/Tracking zentral — pro CTA-Position anpassbar)   */
/* ------------------------------------------------------------------ */
/**
 * Platzierungs-Parameter (`ct` / `utm_content`) sind pro CTA-Position
 * anpassbar. `Homepage_Top` / `home_top` sind die Default-Werte aus der
 * CLAUDE.md; weitere Positionen können über getStoreLinks() erzeugt werden.
 */

const IOS_APP_ID = 'id6741714480';
const ANDROID_PACKAGE = 'immobilien.bot';
const IOS_PT = '127566053';

export interface StoreLinks {
  ios: string;
  android: string;
}

/** Default-Links (Position „Homepage_Top" / „home_top"). */
export const storeLinks: StoreLinks = {
  ios: `https://apps.apple.com/de/app/apple-store/${IOS_APP_ID}?pt=${IOS_PT}&ct=Homepage_Top&mt=8`,
  android: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&hl=de&referrer=utm_source%3Dwebsite%26utm_medium%3Dbutton%26utm_campaign%3Dhomepage%26utm_content%3Dhome_top`,
};

/**
 * Store-Links für eine bestimmte CTA-Position erzeugen (steuert `ct` bei iOS
 * und `utm_content` bei Android). So bleibt das Tracking an einer Stelle.
 * iOS und Android dürfen unterschiedliche Platzierungs-Keys tragen (Muster der
 * Defaults: iOS „Homepage_Top", Android „home_top"); `androidPosition` fällt
 * ansonsten auf `position` zurück.
 */
export function getStoreLinks(position = 'home_top', androidPosition = position): StoreLinks {
  const ios = `https://apps.apple.com/de/app/apple-store/${IOS_APP_ID}?pt=${IOS_PT}&ct=${encodeURIComponent(
    position,
  )}&mt=8`;
  const androidReferrer = encodeURIComponent(
    `utm_source=website&utm_medium=button&utm_campaign=homepage&utm_content=${androidPosition}`,
  );
  const android = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&hl=de&referrer=${androidReferrer}`;
  return { ios, android };
}

/**
 * Physisch erreichbare Deploy-Basis-URL — AUSSCHLIESSLICH für gescannte Links
 * (QR-Code), die auf die aktuell live erreichbare Seite zeigen müssen. Die
 * kanonische Domain für SEO/Canonical/JSON-LD/Sitemap/hreflang bleibt die
 * astro.config-`site` (immobilien-bot.de) — hier NICHTS anderes anhängen.
 * TODO(Launch): auf 'https://immobilien-bot.de' umstellen (Launch-Checkliste).
 */
export const deployBaseUrl = 'https://homepage-4f3.pages.dev';

/* ------------------------------------------------------------------ */
/* Bewertungen                                                        */
/* ------------------------------------------------------------------ */

export interface Rating {
  stars: number;
  count: number;
  label: string;
}

export const ratings: Record<'appStore' | 'playStore' | 'googleMaps', Rating> = {
  // Stand Store-Seiten Juli 2026. `stars` = sichtbarer Score, `label` = Anzeige-Pill.
  appStore: { stars: 4.6, count: 86, label: 'App Store' },
  playStore: { stars: 4.3, count: 48, label: 'Google Play' },
  googleMaps: { stars: 5.0, count: 33, label: 'Google Maps' },
};

/**
 * Stand der Store-Bewertungen (Anzeige „Stand: …"). EINE Quelle, je Sprache
 * formuliert — nie als Literal in Komponenten/i18n wiederholen. Beim Aktualisieren
 * der `ratings` mitpflegen.
 */
export const ratingsAsOf: Record<Locale, string> = {
  de: 'Juli 2026',
  en: 'July 2026',
};

/** Nicht als Live-Zähler behandeln — statischer, belegbarer Wert. */
export const downloads = '5.000+';

/**
 * Gesamtzahl der Bewertungen über alle Plattformen — IMMER abgeleitet (Summe der
 * counts), NIE als Literal. Wird sichtbar in der Bewertungen-Sektion genannt und
 * per facts-sync gegen das HTML geprüft.
 */
export const totalReviewCount =
  ratings.appStore.count + ratings.playStore.count + ratings.googleMaps.count;

/** Für JSON-LD aggregateRating: gewichteter Schnitt über die Store-Bewertungen. */
export const aggregateRating = {
  ratingValue: 4.6,
  ratingCount: totalReviewCount,
  bestRating: 5,
  worstRating: 1,
};

/* ------------------------------------------------------------------ */
/* Reviews  (Rezensions-Links = Fakten; die Zitate selbst in reviews.ts)  */
/* ------------------------------------------------------------------ */
/**
 * Google-Maps-Rezensionslink (cid) — Ziel des Google-Maps-Rating-Badges. Store-
 * Links siehe oben (`storeLinks`). Die einzelnen Review-TEXTE liegen (bewusst
 * beidsprachig) in `src/data/reviews.ts`.
 */
export const googleMapsReviewsUrl = 'https://www.google.com/maps?cid=14734044907807723907';

/* ------------------------------------------------------------------ */
/* Preise                                                             */
/* ------------------------------------------------------------------ */

export interface Plan {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  currency: 'EUR';
  highlight?: boolean;
  note?: string;
}

/**
 * Kostenlose Testphase in Tagen — Produktfakt, EINE Quelle. In sichtbare Texte
 * (Preise, FAQ) via {trialDays} interpoliert, nie als Literal wiederholen.
 */
export const trialDays = 7;

export const pricing: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    price: '0,00 €',
    priceValue: 0,
    currency: 'EUR',
    note: '7 Tage kostenlos testen – kein Risiko',
    highlight: true,
  },
  {
    id: 'week',
    name: '7 Tage',
    price: '2,99 €',
    priceValue: 2.99,
    currency: 'EUR',
  },
  {
    id: 'month',
    name: '1 Monat',
    price: '7,99 €',
    priceValue: 7.99,
    currency: 'EUR',
  },
];

/**
 * Anteil der Nutzer, die im ERSTEN Monat eine Wohnung finden — belegbarer,
 * statischer Wert aus eigenen Nutzerdaten (siehe In-App-Paywall-Statistik).
 * Sichtbar nur als „über {rate} %" formuliert (kein Live-Zähler). Von hier in
 * beide Sprachen interpoliert.
 */
export const firstMonthSuccessRate = 70;

/** Vorteile-Streifen unter den Preiskarten. */
export const pricingBenefits: string[] = [
  'Echtzeit-Push (auch via Telegram)',
  'Alle Portale in einer App',
  'Alle Features (Favoriten, Bewerbungsschreiben etc.)',
  'Kein Risiko: jederzeit kündbar',
];

/* ------------------------------------------------------------------ */
/* Portale  (nur Anzeige-Name sichtbar — keine Logos, rechtliche Gründe;
   volle Domain separat, ausschließlich für strukturierte Daten/JSON-LD) */
/* ------------------------------------------------------------------ */

export interface Portal {
  /** Anzeige-Name in Domain-Schreibweise — nur dieser wird sichtbar gezeigt. */
  name: string;
  /** Volle Domain — nur für strukturierte Daten (JSON-LD), nicht als Logo/Link. */
  domain: string;
  /** Reichweite: bundesweit (`national`) oder regional (`regional`). */
  scope: 'national' | 'regional';
  /** Bei regionalen Portalen: abgedeckte Region (z. B. „Berlin"). */
  region?: string;
}

export const portals: Portal[] = [
  // Bundesweite Portale
  { name: 'Immobilienscout24.de', domain: 'immobilienscout24.de', scope: 'national' },
  { name: 'Immobilien.de', domain: 'immobilien.de', scope: 'national' },
  { name: 'Immowelt.de', domain: 'immowelt.de', scope: 'national' },
  { name: 'Kleinanzeigen.de', domain: 'kleinanzeigen.de', scope: 'national' },
  { name: 'LEG-wohnen.de', domain: 'leg-wohnen.de', scope: 'national' },
  { name: 'Ohne-Makler.net', domain: 'ohne-makler.net', scope: 'national' },
  { name: 'Quoka.de', domain: 'quoka.de', scope: 'national' },
  { name: 'Vonovia.de', domain: 'vonovia.de', scope: 'national' },
  { name: 'WG-Gesucht.de', domain: 'wg-gesucht.de', scope: 'national' },
  { name: 'Wohnungsboerse.net', domain: 'wohnungsboerse.net', scope: 'national' },
  // Regionale Portale
  { name: 'Inberlinwohnen.de', domain: 'inberlinwohnen.de', scope: 'regional', region: 'Berlin' },
  { name: 'WBM.de', domain: 'wbm.de', scope: 'regional', region: 'Berlin' },
  { name: 'Gesobau.de', domain: 'gesobau.de', scope: 'regional', region: 'Berlin' },
  { name: 'Howoge.de', domain: 'howoge.de', scope: 'regional', region: 'Berlin' },
  { name: 'Gewobag.de', domain: 'gewobag.de', scope: 'regional', region: 'Berlin' },
  { name: 'Degewo.de', domain: 'degewo.de', scope: 'regional', region: 'Berlin' },
  { name: 'Berlinovo.de', domain: 'berlinovo.de', scope: 'regional', region: 'Berlin' },
  { name: 'GAG-koeln.de', domain: 'gag-koeln.de', scope: 'regional', region: 'Köln/NRW' },
  { name: 'ABG.de', domain: 'abg.de', scope: 'regional', region: 'Frankfurt/Hessen' },
  { name: 'NHW.de', domain: 'nhw.de', scope: 'regional', region: 'Hessen' },
];

/** Bundesweite Portale (abgeleitet — nicht hart codieren). */
export const nationalPortals = portals.filter((p) => p.scope === 'national');

/** Regionale Portale (abgeleitet — nicht hart codieren). */
export const regionalPortals = portals.filter((p) => p.scope === 'regional');

/**
 * Anzahl IMMER aus der Liste ableiten — nie hart codieren. Sichtbare Texte
 * nennen die exakte Zahl (kein „über 10"); {n} wird aus diesem Wert ersetzt.
 */
export const portalCount = portals.length;

/* ------------------------------------------------------------------ */
/* Tracking / GTM                                                     */
/* ------------------------------------------------------------------ */

/** GTM-Container-ID — TODO(CLAUDE.md): echte ID von Artem eintragen. */
export const GTM_ID = 'GTM-XXXXXXX';
