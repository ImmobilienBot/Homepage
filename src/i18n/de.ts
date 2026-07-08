/**
 * Deutsche Texte (Standard-Sprache).
 * ALLE sichtbaren Texte gehören hierher — nie hart in Komponenten (CLAUDE.md).
 * Muss strukturgleich zu en.ts bleiben.
 */
export const de = {
  meta: {
    // Title ~50–60 Zeichen, Keyword vorn (Pagespeed/SEO). Description ~150–160.
    title: 'Immobilien Bot – Wohnung finden, bevor es andere tun',
    description:
      'Immobilien Bot scannt 24/7 alle großen Immobilienportale und benachrichtigt dich in Echtzeit, sobald eine passende Wohnung online geht. 7 Tage kostenlos testen.',
  },

  nav: {
    bot: 'Der Bot',
    features: 'Features',
    pricing: 'Preise',
    faq: 'FAQ',
    cta: 'App laden',
    // Header-CTA: volle Variante (Desktop) + kurze Variante (Mobile <640px).
    ctaFree: '7 Tage kostenlos testen',
    ctaShort: '7 Tage gratis',
    skipToContent: 'Zum Inhalt springen',
  },

  hero: {
    // Zeilenweise für Mask-Reveal (kinetische Typografie, siehe CLAUDE.md).
    headlineLines: ['Finde deine Traumwohnung,', 'bevor es andere tun.'],
    markKeyword: 'Traumwohnung',
    subline:
      '24/7-Scan aller großen Portale + Echtzeit-Benachrichtigung, sobald ein passendes Angebot online geht.',
    trust: {
      rating: '4,6',
      ratingLabel: 'App Store',
      downloads: '5.000+ Downloads',
    },
    mockupAlt: 'Screenshot der Immobilien-Bot-App: Angebotsliste mit passenden Wohnungen',
    mapAlt: 'Screenshot der Immobilien-Bot-App: Suchbereich per Zeichnung auf der Karte festlegen',
    configAlt: 'Screenshot der Immobilien-Bot-App: Suche mit Zimmern, Größe und Preis konfigurieren',
    notification: {
      app: 'Immobilien Bot',
      time: 'jetzt',
      lead: 'Neue Wohnung in Berlin:',
      // Endlosschleife schwebender Push-Benachrichtigungen (variierende Berliner Meldungen).
      items: [
        '3 Zimmer, 890 € – Prenzlauer Berg',
        '2 Zimmer, 740 € – Neukölln',
        '1 Zimmer, 620 € – Wedding',
        '4 Zimmer, 1.340 € – Charlottenburg',
        '2 Zimmer, 980 € – Friedrichshain',
      ],
    },
  },

  sections: {
    // „3c" — EINE fokussierte, dunkle Problem-Sektion (Partikel-Zahl + Payoff).
    problem: {
      // sr-only-Titel (Struktur/SEO). Die sichtbare Aussage tragen Zahl + H2.
      title: 'Das Problem',
      // Große Partikel-Zahl (Display, KEIN Heading) — formt sich im Canvas aus
      // Partikeln. Sternchen → Quelle in der Footer-Fußnote.
      bigNumber: '43.000',
      // Statistik-Satz, ENG an die Zahl gekoppelt (kleiner, gedämpftes Weiß).
      stat: 'Bewerber auf 288 Wohnungen. Nach 30 Minuten war Schluss.',
      // Umkehr-Headline (H2). Gelber Marker NUR auf „du".
      headline: 'Einer davon ist zuerst da: du.',
      headlineMark: 'du',
      // Scanbare Vorteile (kein Fließsatz), je mit Icon. {n} = Portalanzahl (site.ts).
      benefits: [
        { label: 'Echtzeit-Push' },
        { label: 'Über {n} Portale' },
        { label: 'Bewerbung per Klick' },
      ],
      // Zusatz zur Trust-Zeile (Rating/Downloads kommen aus hero.trust bzw. site.ts).
      trustCancel: '7 Tage kostenlos, jederzeit kündbar',
      // Dezenter Verweis zur nächsten Sektion (Anker leicht repointbar).
      moreLink: 'Wir zeigen dir wie',
    },
    features: { title: 'Features' },
    portals: {
      title: 'Alle Portale in einer App',
      // {n} wird aus site.ts (portalCountRounded) ersetzt — wachstumssicher.
      count: 'Über {n} Immobilienportale – in einer App.',
    },
    pricing: { title: 'Preise' },
    socialProof: { title: 'Das sagen Nutzer' },
    faq: { title: 'Häufige Fragen' },
    contact: { title: 'Kontakt' },
    finalCta: { title: 'Deine nächste Wohnung wartet nicht.' },
  },

  cta: {
    appStore: 'Im App Store laden',
    playStore: 'Bei Google Play laden',
    tryFree: '7 Tage kostenlos testen',
  },

  footer: {
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    terms: 'AGB',
    contact: 'Kontakt',
    langSwitch: 'English',
    signature: 'Das Original. Schneller als die anderen.',
    // Fußnote zur Berlin-Statistik (Sternchen in der Problem-Story).
    // TODO: echten Quell-Link (Berliner Zeitung) ergänzen, sobald vorhanden.
    sourceNote: '* Statistik: Berliner Zeitung',
  },

  legal: {
    imprint: { title: 'Impressum' },
    privacy: { title: 'Datenschutzerklärung' },
    terms: { title: 'AGB' },
    placeholder: 'Inhalte folgen. [TODO: juristische Inhalte von Artem]',
  },
};

// Kein `as const`: primitive Typen werden geweitet (string statt Literal),
// damit en.ts strukturgleich mit eigenen Werten zuweisbar ist.
export type Dict = typeof de;
