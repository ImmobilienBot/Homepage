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
    ctaFree: 'Kostenlos testen',
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
    ablauf: {
      // H2 mit gelbem Marker auf „Tag 8.".
      h2: 'Von heute bis Tag 8.',
      h2Mark: 'Tag 8.',
      subline: 'Vier Schritte — und du zahlst erst, wenn du weißt, dass es funktioniert.',
      // Vier Tickets (Reihenfolge = Bedeutung). {rate} kommt aus site.ts.
      tickets: [
        { label: 'Schritt 1', pill: 'Heute', title: 'App laden', desc: 'Kostenlos für iOS und Android.' },
        {
          label: 'Schritt 2',
          pill: '2 Min später',
          title: 'Gratis starten',
          desc: 'Suchbereich zeichnen, Woche oder Monat wählen.',
        },
        {
          label: 'Schritt 3',
          pill: 'ab Tag 1',
          title: 'Wohnung suchen',
          desc: 'Der Bot scannt rund um die Uhr — 7 Tage kostenlos, jederzeit kündbar.',
        },
        {
          label: 'Schritt 4',
          pill: 'Tag 8',
          title: 'Abo startet',
          // Wortlaut absichtlich identisch zur In-App-Paywall. {rate} aus site.ts.
          desc: 'Über {rate} % finden ihre Wohnung im ersten Monat.',
        },
      ],
    },
    pricing: {
      title: 'Preise',
      eyebrow: 'Preise',
      // H2 in drei Zeilen; „Alles drin." trägt den INVERTIERTEN Marker (Block #3b3b3a,
      // Text #fff03c) — der normale gelbe Marker wäre auf der gelben Fläche unsichtbar.
      h2: {
        line1: 'Ein Preis.',
        line2: 'Alles drin.',
        line3: 'Du wählst nur den Takt.',
        mark: 'Alles drin.',
      },
      copy: 'Kein Basic, kein Premium, kein Sternchen. Beide Abos können alles — du entscheidest nur, ob du in Wochen oder Monaten denkst. Und die ersten 7 Tage zahlst du sowieso nichts.',
      checks: [
        'Alle Portale in einer App',
        'Echtzeit-Push, auch via Telegram',
        'Favoriten, Bewerbungsschreiben & Co.',
        'Jederzeit im Store kündbar',
      ],
      // 70-%-Stat (aus site.ts, {rate}); Quelle ² wie in der Ablauf-Sektion.
      stat: 'Über {rate} % finden ihre Wohnung im ersten Monat.',
      qrCaption: 'Mit dem Handy scannen — landet automatisch im richtigen Store.',
      // Schalter Woche/Monat — beide Preise immer im DOM (No-JS + Facts-Sync).
      toggle: { week: 'Woche', month: 'Monat' },
      per: { week: '/ Woche', month: '/ Monat' },
      // {price} = Tagespreis (Buildzeit: Wochenpreis/7 bzw. Monatspreis/30).
      day: '≈ {price} am Tag',
      desc: {
        week: 'Kurz & intensiv — für den Endspurt.',
        month: 'Der Standard für die ernsthafte Suche.',
      },
      // {x} = Spar-Prozent (Buildzeit aus site.ts). CSS macht das Label uppercase.
      badge: 'Spart {x} %',
      cta: 'Kostenlos testen',
      micro: 'Heute 0 € · 7 Tage alles testen · bezahlt wird erst ab Tag 8',
      toggleAria: 'Abrechnungszeitraum',
    },
    // Bewertungen-Sektion: Proof-Header (H2 + Marker + abgeleitete Zahlen) über der
    // Zitat-Marquee. {total} = totalReviewCount, {downloads} = downloads, {count}/{n}
    // je Kachel — ALLE aus site.ts, nichts hart. footnote nur EN (Zitate übersetzt).
    bewertungen: {
      headline: 'Gefunden, bevor es andere taten.',
      headlineMark: 'Gefunden',
      subline: '{total} Bewertungen auf drei Plattformen · {downloads} Downloads',
      tileLabel: '{count} Bewertungen',
      starsSr: '{n} von 5 Sternen',
      footnote: '',
    },
    // FAQ-Sektion (#faq, zwischen Preise und Kontakt). Struktur: headline (+Marker),
    // sub, contactCard, categories[{id,label,items[{id,q,a}]}]. IDs sprachneutral &
    // in DE/EN identisch (Deep-Links). KEINE Fakten hart: {portalCount}/{downloads}/
    // {appStoreRating}/{trialDays}/{price7d}/{price1m} werden zur Buildzeit aus
    // site.ts interpoliert. Der Datenschutz-Link steckt als [[…]] in der Antwort.
    faq: {
      title: 'Häufige Fragen',
      headline: 'Häufige Fragen.',
      headlineMarker: 'Fragen',
      sub: 'Kurz und ehrlich beantwortet — von Portalen bis Preisen. Wenn etwas fehlt, schreib uns einfach.',
      contactCard: {
        title: 'Deine Frage fehlt?',
        text: 'Schreib uns — wir antworten schnell und persönlich.',
        cta: 'Zum Kontakt',
      },
      categories: [
        {
          id: 'faq-allgemein',
          label: 'Allgemein',
          items: [
            {
              id: 'faq-was-ist',
              q: 'Was ist der Immobilien Bot?',
              a: 'Der Immobilien Bot ist eine App für die Wohnungssuche in Deutschland (iOS & Android). Er scannt rund um die Uhr {portalCount} Immobilienportale und schickt dir eine Push-Benachrichtigung, sobald ein neues Angebot zu deiner Suche passt — oft Minuten, bevor andere es überhaupt sehen.',
            },
            {
              id: 'faq-wie-funktioniert',
              q: 'Wie funktioniert der Immobilien Bot?',
              a: 'Du legst einmal fest, wo und wie du wohnen willst: Suchbereich auf der Karte, Zimmer, Größe, Preis und weitere Kriterien. Danach übernimmt der Bot — er prüft die Portale ununterbrochen auf neue Inserate und meldet sich in Echtzeit, sobald ein Treffer online geht. Ein Tipp auf die Benachrichtigung bringt dich direkt zum Original-Angebot.',
            },
            {
              id: 'faq-serioes',
              q: 'Ist der Immobilien Bot seriös?',
              a: 'Ja. Der Immobilien Bot durchsucht ausschließlich öffentlich zugängliche Inserate und verlinkt dich direkt zum Original-Angebot auf dem jeweiligen Portal. Dort bewirbst du dich ganz normal selbst — der Bot verschafft dir den Zeitvorsprung, nicht mehr und nicht weniger. Über {downloads} Downloads und {appStoreRating} Sterne im App Store sprechen für sich.',
            },
            {
              id: 'faq-auto-bewerbung',
              q: 'Bewirbt sich der Bot automatisch für mich?',
              a: 'Nein — und das ist Absicht. Du entscheidest selbst, auf welche Angebote du dich bewirbst. Der Immobilien Bot sorgt dafür, dass du sie unter den Ersten siehst und mit deinem hinterlegten Bewerbungsschreiben in Sekunden reagieren kannst. Automatische Massenbewerbungen gibt es nicht.',
            },
            {
              id: 'faq-geschwindigkeit',
              q: 'Warum ist Geschwindigkeit bei der Wohnungssuche so entscheidend?',
              a: 'Auf ein einziges Wohnungsbauprojekt in Berlin kamen laut Berliner Zeitung in nur 30 Minuten rund 43.000 Bewerbungen — auf 288 Wohnungen. Wer ein Angebot erst am Abend sieht, ist oft schon zu spät. Genau dieses Zeitfenster öffnet dir der Immobilien Bot mit Benachrichtigungen in Echtzeit.',
            },
          ],
        },
        {
          id: 'faq-suche',
          label: 'Suche & Benachrichtigungen',
          items: [
            {
              id: 'faq-portale',
              q: 'Welche Immobilienportale werden durchsucht?',
              a: 'Aktuell {portalCount} Portale: die großen bundesweiten wie ImmobilienScout24, Immowelt, Kleinanzeigen und WG-Gesucht sowie regionale Anbieter und Wohnungsbaugesellschaften wie Howoge, Gewobag oder GAG Köln. In der App wählst du Portale einzeln an oder ab. Die vollständige Liste findest du oben in der Portale-Sektion.',
            },
            {
              id: 'faq-stadt',
              q: 'Funktioniert der Immobilien Bot auch in meiner Stadt?',
              a: 'Ja. Die bundesweiten Portale decken ganz Deutschland ab — von der Großstadt bis aufs Land. Dazu kommen regionale Quellen, aktuell mit Schwerpunkt Berlin, Köln und Hessen. Deinen Suchbereich legst du frei auf der Karte fest.',
            },
            {
              id: 'faq-wie-schnell',
              q: 'Wie schnell werde ich benachrichtigt — auch wenn die App geschlossen ist?',
              a: 'In Echtzeit: Sobald ein passendes Inserat online geht, bekommst du innerhalb von Sekunden eine Push-Nachricht. Die App muss dafür nicht geöffnet sein — der Bot arbeitet unabhängig von deinem Gerät weiter, auch nachts.',
            },
            {
              id: 'faq-suchbereiche',
              q: 'Kann ich mehrere Suchbereiche anlegen?',
              a: 'Ja, bis zu drei gleichzeitig. Jeden Bereich zeichnest du frei auf der Karte ein oder wählst einen Radius — zum Beispiel dein Wunschkiez, der Kiez daneben und das Umfeld deiner Arbeit. Kombiniert mit Zimmern, Größe und Preis entsteht so ein präzises Suchprofil.',
            },
            {
              id: 'faq-filter-kriterien',
              q: 'Kann ich nach möblierten Wohnungen, WG-Zimmern oder mit WBS suchen?',
              // TODO(Artem): IS24-Plus-Formulierung fachlich verifizieren
              a: 'Ja. Neben Zimmern, Größe und Preis filterst du nach erweiterten Kriterien wie möbliert, WG-Zimmer, WBS, Tauschwohnung oder Zwischen- und Untermiete. Angebote, die bei ImmobilienScout24 nur mit „Plus" sichtbar sind, kannst du auf Wunsch ausschließen.',
            },
            {
              id: 'faq-telegram',
              q: 'Wie funktioniert die Telegram-Anbindung?',
              // TODO(Artem): Ablauf der Verknüpfung ergänzen (1 Satz)
              a: 'Zusätzlich zur Push-Benachrichtigung kannst du den Immobilien Bot mit Telegram verbinden — neue Angebote landen dann auch direkt in deinem Chat.',
            },
            {
              id: 'faq-bewerbung',
              q: 'Wie hilft mir der Bot bei der Bewerbung?',
              a: 'Du hinterlegst dein Bewerbungsschreiben einmal in der App. In der Angebotsübersicht kopierst du es später mit einem Klick in die Zwischenablage — einfügen, absenden, fertig. So vergehen zwischen Push und Bewerbung oft nur Sekunden.',
            },
          ],
        },
        {
          id: 'faq-preise',
          label: 'Preise & Abo',
          items: [
            {
              id: 'faq-preis',
              q: 'Was kostet der Immobilien Bot?',
              a: 'Du startest mit {trialDays} Tagen kostenlos und unverbindlich. Danach kostet der Immobilien Bot {price7d} für 7 Tage oder {price1m} für einen Monat — je nachdem, wie intensiv du gerade suchst.',
            },
            {
              id: 'faq-testphase',
              q: 'Wie funktioniert die kostenlose Testphase?',
              // TODO(Artem): Übergang Testphase→Abo präzisieren, Wording an Billing-Timeline in Ablauf angleichen
              a: '{trialDays} Tage lang nutzt du den vollen Funktionsumfang: alle Portale, Echtzeit-Push, alle Features. Wenn der Bot nichts für dich ist, kündigst du einfach innerhalb der Testphase — dann zahlst du nichts.',
            },
            {
              id: 'faq-kuendigen',
              q: 'Kann ich jederzeit kündigen?',
              a: 'Ja. Das Abo läuft über deinen Apple App Store bzw. Google Play und lässt sich dort jederzeit mit wenigen Klicks beenden — ohne Kündigungsfrist, ohne Anruf, ohne Risiko.',
            },
            {
              id: 'faq-versteckte-kosten',
              q: 'Gibt es versteckte Kosten oder Premium-Stufen?',
              a: 'Nein. Jedes Paket enthält alle Features — Echtzeit-Push, Telegram-Anbindung, Favoriten, Bewerbungsschreiben und sämtliche Portale. Es gibt keine Zusatzkosten und keine abgespeckte Basis-Version.',
            },
          ],
        },
        {
          id: 'faq-technik',
          label: 'App & Technik',
          items: [
            {
              id: 'faq-geraete',
              q: 'Für welche Geräte gibt es die App?',
              a: 'Der Immobilien Bot ist für iOS im Apple App Store und für Android bei Google Play verfügbar — mit identischem Funktionsumfang auf beiden Plattformen.',
            },
            {
              id: 'faq-sprachen',
              q: 'Welche Sprachen unterstützt die App?',
              a: 'Deutsch und Englisch. Die Sprache wechselst du direkt in der App — praktisch für internationale Wohnungssuchende und Expats.',
            },
            {
              id: 'faq-dark-mode',
              q: 'Gibt es einen Dark Mode?',
              a: 'Ja. Du wechselst jederzeit zwischen Light- und Dark-Mode.',
            },
            {
              id: 'faq-daten',
              q: 'Was passiert mit meinen Daten?',
              // TODO(Artem): final mit Rechtstexten abstimmen. [[…]] = Link auf die Datenschutz-Route.
              a: 'Der Immobilien Bot braucht nur, was für deine Suche nötig ist: dein Suchprofil und eine Anmeldung per E-Mail, Apple oder Google. Alle Details regelt die [[Datenschutzerklärung]].',
            },
          ],
        },
      ],
    },
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
    // Fortlaufend nummerierte Quellenangaben (Footer, id="quellen"):
    // ¹ Berlin-Statistik der Problem-Story · ² 70-%-Zahl der Ablauf-Sektion.
    // TODO: „Berliner Zeitung" später mit dem echten Quell-Link versehen.
    sources: [
      'Statistik: Berliner Zeitung.',
      'Eigene Nutzerdaten Immobilien Bot. Zum Vergleich: 54 % der Wohnungssuchenden suchen länger als ein Jahr (ImmobilienScout24, 2024).',
    ],
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
