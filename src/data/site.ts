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
 */
export function getStoreLinks(position = 'home_top'): StoreLinks {
  const ios = `https://apps.apple.com/de/app/apple-store/${IOS_APP_ID}?pt=${IOS_PT}&ct=${encodeURIComponent(
    position,
  )}&mt=8`;
  const androidReferrer = encodeURIComponent(
    `utm_source=website&utm_medium=button&utm_campaign=homepage&utm_content=${position}`,
  );
  const android = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&hl=de&referrer=${androidReferrer}`;
  return { ios, android };
}

/* ------------------------------------------------------------------ */
/* Bewertungen                                                        */
/* ------------------------------------------------------------------ */

export interface Rating {
  stars: number;
  count: number;
  label: string;
}

export const ratings: Record<'appStore' | 'playStore' | 'googleMaps', Rating> = {
  appStore: { stars: 4.6, count: 85, label: 'App Store' },
  playStore: { stars: 4.2, count: 48, label: 'Play Store' },
  googleMaps: { stars: 5.0, count: 33, label: 'Google Maps' },
};

/** Nicht als Live-Zähler behandeln — statischer, belegbarer Wert. */
export const downloads = '5.000+';

/** Für JSON-LD aggregateRating: gewichteter Schnitt über die Store-Bewertungen. */
export const aggregateRating = {
  ratingValue: 4.6,
  ratingCount: ratings.appStore.count + ratings.playStore.count + ratings.googleMaps.count,
  bestRating: 5,
  worstRating: 1,
};

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
  /** Anzeige-Name ohne Endung — nur dieser wird sichtbar gezeigt. */
  name: string;
  /** Volle Domain — nur für strukturierte Daten (JSON-LD), nicht als Logo/Link. */
  domain: string;
}

export const portals: Portal[] = [
  { name: 'ImmobilienScout24', domain: 'immobilienscout24.de' },
  { name: 'Immobilien.de', domain: 'immobilien.de' },
  { name: 'Immowelt', domain: 'immowelt.de' },
  { name: 'Kleinanzeigen', domain: 'kleinanzeigen.de' },
  { name: 'LEG Wohnen', domain: 'leg-wohnen.de' },
  { name: 'Ohne-Makler', domain: 'ohne-makler.net' },
  { name: 'Quoka', domain: 'quoka.de' },
  { name: 'Vonovia', domain: 'vonovia.de' },
  { name: 'WG-Gesucht', domain: 'wg-gesucht.de' },
  { name: 'Wohnungsbörse', domain: 'wohnungsboerse.net' },
];

/** Anzahl IMMER aus der Liste ableiten — nie hart codieren. */
export const portalCount = portals.length;

/**
 * Wachstumssichere, nach unten auf Zehner gerundete Basiszahl für sichtbare
 * Texte. In der UI stets als „über {n}" / „{n}+" formulieren (nicht als starre
 * exakte Zahl), damit die Aussage bei Wachstum korrekt bleibt. 10 Portale → 10.
 */
export const portalCountRounded = Math.floor(portalCount / 10) * 10;

/* ------------------------------------------------------------------ */
/* Tracking / GTM                                                     */
/* ------------------------------------------------------------------ */

/** GTM-Container-ID — TODO(CLAUDE.md): echte ID von Artem eintragen. */
export const GTM_ID = 'GTM-XXXXXXX';
