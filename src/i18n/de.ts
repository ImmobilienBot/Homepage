/**
 * Deutsche Texte (Standard-Sprache).
 * ALLE sichtbaren Texte gehören hierher — nie hart in Komponenten (CLAUDE.md).
 * Muss strukturgleich zu en.ts bleiben.
 */
export const de = {
  meta: {
    title: 'Immobilien Bot – Finde deine Traumwohnung, bevor es andere tun',
    description:
      'Immobilien Bot scannt 24/7 alle großen Immobilienportale und benachrichtigt dich per Echtzeit-Push, sobald eine passende Wohnung online geht. 7 Tage kostenlos testen.',
  },

  nav: {
    bot: 'Der Bot',
    features: 'Features',
    pricing: 'Preise',
    faq: 'FAQ',
    cta: 'App laden',
    skipToContent: 'Zum Inhalt springen',
  },

  hero: {
    // Zeilenweise für Mask-Reveal (kinetische Typografie, siehe CLAUDE.md).
    headlineLines: ['Finde deine Traumwohnung,', 'bevor es andere tun.'],
    markKeyword: 'Traumwohnung',
    subline:
      '24/7-Scan aller großen Portale + Echtzeit-Benachrichtigung, sobald ein passendes Angebot online geht.',
    trustMicroline: '4,6★ App Store · 5.000+ Downloads',
    mockupAlt: 'Screenshot der Immobilien-Bot-App: Angebotsliste mit passenden Wohnungen',
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
    problem: { title: 'Das Problem' },
    solution: { title: 'Die Lösung' },
    features: { title: 'Features' },
    portals: { title: 'Alle Portale in einer App' },
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
