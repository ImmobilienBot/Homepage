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
        { label: '{n} Portale' },
        { label: 'Bewerbung per Klick' },
      ],
      // Zusatz zur Trust-Zeile (Rating/Downloads kommen aus hero.trust bzw. site.ts).
      trustCancel: '7 Tage kostenlos, jederzeit kündbar',
      // Dezenter Verweis zur nächsten Sektion (Anker leicht repointbar).
      moreLink: 'Wir zeigen dir wie',
    },
    features: {
      // sr/back-compat-Titel; sichtbar tragen Eyebrow + H2 die Aussage.
      title: 'Features',
      eyebrow: 'Features',
      // H2 mit gelbem Marker auf „der Erste".
      h2: 'Alles, um der Erste zu sein.',
      h2Mark: 'der Erste',
      subline: 'Drei Schritte von der Suche bis zur Bewerbung — alles in einer App.',
      // Tier 1 — die drei Schritte (Reihenfolge: Karte, Angebotsliste, Bewerbung).
      steps: [
        {
          num: '01',
          h3: 'Such genau dort, wo du wohnen willst.',
          body: 'Zeichne deinen Suchbereich direkt auf der Karte oder wähle einen Radius — auch mehrere Orte gleichzeitig.',
          checks: [
            'Suchbereich zeichnen oder Radius',
            'Mehrere Suchorte gleichzeitig',
            'Zimmer, Größe, Preis',
          ],
          alt: 'Karte von Berlin mit gelb umrandetem, selbst gezeichnetem Suchbereich über der Innenstadt; oben die Umschalter „Radius" und „Zeichnen".',
        },
        {
          num: '02',
          h3: 'Dein Feed statt zehn offener Tabs.',
          body: 'Alle passenden Angebote landen in einer aufgeräumten Liste — sortiert, gefiltert, im Griff.',
          checks: [
            'Favoriten & Status-Filter',
            'Ungesehen / Beworben auf einen Blick',
            'Teilen, löschen, Notizen',
          ],
          alt: 'Angebotsliste der App mit 18 Treffern: Wohnungskarten mit Foto, Preis, Zimmerzahl und Quadratmetern, dazu Filter für Favoriten und Bewerbungen.',
        },
        {
          num: '03',
          h3: 'Deine Bewerbung. Ein Tipp. Fertig.',
          body: 'Hinterlege dein Anschreiben einmal — beim Antippen eines Angebots liegt es automatisch in der Zwischenablage.',
          checks: [
            'Anschreiben hinterlegen',
            'Auto-Copy beim Antippen',
            'Direkt einfügen & absenden',
          ],
          alt: 'Ansicht „Bewerbungsschreiben" der App: hinterlegtes Anschreiben in einem Textfeld mit den Buttons „Zurück" und „Speichern".',
        },
      ],
      // Tier 2 — Bento „Und das steckt noch drin." (Marker auf „noch").
      bentoTitle: 'Und das steckt noch drin.',
      bentoMark: 'noch',
      filter: {
        h4: 'Filter, die andere nicht haben.',
        body: 'Erweiterte Kriterien für die Fälle, die auf den Portalen mühsam sind:',
        chips: [
          'möbliert',
          'WG-Zimmer',
          'WBS',
          'Tauschwohnung',
          'Zwischen- & Untermiete',
          'ohne IS24-Plus-Angebote',
        ],
      },
      darkmode: {
        h4: 'Light & Dark Mode',
        body: 'Auch nachts angenehm — genau dann, wenn Angebote reinkommen.',
        ariaChain: 'Dunkelmodus der Kachel umschalten',
      },
      telegram: {
        h4: 'Telegram-Anbindung',
        body: 'Benachrichtigungen auf Wunsch auch als Telegram-Nachricht.',
      },
      // h4Label + fixe Buchstaben S / M / L (universell, im Code gerendert).
      listviews: {
        h4Label: 'Listenansichten',
        body: 'Kompakt scannen oder groß durchblättern.',
      },
      language: {
        h4: 'Deutsch & Englisch',
        body: 'Die komplette App in beiden Sprachen.',
      },
    },
    portals: {
      title: 'Alle Portale in einer App',
      // {n} wird aus site.ts (portalCount) ersetzt — exakte Zahl.
      count: '{n} Immobilienportale – in einer App.',
      // --- „Portale"-Sektion (Lockscreen-Phone + Anzeigen-Flug) ---
      // H2 zweizeilig; „Ein Feed." trägt den gelben Marker.
      headline: 'Alle Portale.',
      headlineMark: 'Ein Feed.',
      // {count} = portalCount (site.ts), fett interpoliert.
      subline:
        '{count} Quellen, rund um die Uhr überwacht — jedes neue Angebot landet in Echtzeit in deiner App.',
      groupNational: 'Bundesweit',
      groupRegional: 'Regional',
      // Push-Benachrichtigung (Lockscreen). {flat}/{portal} zur Laufzeit ersetzt.
      pushTitle: 'Immobilien Bot',
      pushTemplate: 'Neues Angebot: {flat} – via {portal}',
      timeNow: 'jetzt',
      time3: 'vor 3 Sek.',
      time6: 'vor 6 Sek.',
      // Wohnungs-Pool je Region (für die Push-Texte). Nach Portal-Region gewählt.
      flats: {
        berlin: [
          '3-Zimmer, Prenzlauer Berg',
          '2-Zimmer Altbau, Kreuzberg',
          '4-Zimmer, Pankow',
          '2-Zimmer, Neukölln',
          '1-Zimmer, Friedrichshain',
        ],
        koeln: ['3-Zimmer, Ehrenfeld', '2-Zimmer, Nippes'],
        frankfurt: ['2-Zimmer, Bockenheim', '3-Zimmer, Sachsenhausen'],
        hessen: ['3-Zimmer in Wiesbaden', '2-Zimmer in Darmstadt'],
        national: [
          '3-Zimmer in Berlin',
          '2-Zimmer in Hamburg',
          '4-Zimmer in München',
          '2-Zimmer in Köln',
          '3-Zimmer in Leipzig',
          '2-Zimmer in Stuttgart',
        ],
      },
      // Statische SSR-Pushes (No-JS / reduced-motion): 2 Karten im Endzustand.
      fallbackPushes: [
        'Neues Angebot: 3-Zimmer in Berlin – via Immowelt.de',
        'Neues Angebot: 2-Zimmer Altbau, Kreuzberg – via Howoge.de',
      ],
    },
    pricing: {
      title: 'Preise',
      // Headline zweizeilig; „testen" trägt den invertierten Marker.
      headline: { line1: 'Erst testen.', line2: 'Dann entscheiden.', mark: 'testen' },
      subline:
        '7 Tage voller Zugriff auf alles — für 0 €. Danach entscheidest du dich: Woche oder Monat. Jederzeit kündbar.',
      trial: {
        label: 'Kostenlos testen',
        // Preis („0 €") + Plan-Preise kommen aus site.ts (Intl-formatiert).
        priceSuffix: '· 7 Tage',
        desc: 'Voller Funktionsumfang ab Sekunde eins: alle Portale, Echtzeit-Push, Favoriten, Bewerbungsschreiben.',
        timeline: [
          { lead: 'Heute', text: 'App laden, Woche oder Monat wählen, gratis starten' },
          { lead: 'Tag 1–7', text: 'alles testen, jederzeit kündbar' },
          { lead: 'Tag 8', text: 'nur wenn du bleibst, läuft dein gewähltes Abo weiter' },
        ],
        storeNote:
          'Der Gratis-Zeitraum startet als Abo über Apple bzw. Google — du wählst Woche oder Monat, die ersten 7 Tage kosten 0 €. Kündigst du in dieser Zeit in den Store-Einstellungen, zahlst du nichts.',
        qrCaption: 'Mit dem Handy scannen — landet automatisch im richtigen Store.',
      },
      plans: {
        label: 'Und danach?',
        // Namen + Suffixe sichtbar; Preise/Tagespreise aus site.ts abgeleitet.
        week: { name: 'Woche', suffix: '/ Woche', desc: 'kurz & intensiv für den Endspurt' },
        month: { name: 'Monat', suffix: '/ Monat', desc: 'der Standard für die ernsthafte Suche' },
        chip: 'Bester Tagespreis',
        // {price} wird durch den Intl-formatierten Tagespreis ersetzt.
        perDay: '≈ {price} am Tag',
        note: 'Kein Kleingedrucktes: Beide Abos enthalten immer alle Funktionen, verlängern sich automatisch und sind jederzeit im Store kündbar.',
      },
      benefits: {
        label: 'Alles drin — in jedem Plan',
        items: [
          'Echtzeit-Push, auch via Telegram',
          'Alle Portale in einer App',
          'Alle Features: Favoriten, Bewerbung & Co.',
          'Kein Risiko: jederzeit kündbar',
        ],
      },
    },
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
