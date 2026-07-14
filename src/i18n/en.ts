/**
 * English strings. Must stay structurally identical to de.ts.
 */
import type { Dict } from './de';

export const en: Dict = {
  meta: {
    // Title ~50–60 chars, keyword first (Pagespeed/SEO). Description ~150–160.
    title: 'Immobilien Bot – Find your flat before anyone else',
    description:
      'Immobilien Bot scans all major German property portals 24/7 and sends you a real-time push the moment a matching flat goes live. Try it free for 7 days.',
  },

  nav: {
    bot: 'The Bot',
    features: 'Features',
    pricing: 'Pricing',
    faq: 'FAQ',
    cta: 'Get the app',
    // Header CTA: full variant (desktop) + short variant (mobile <640px).
    ctaFree: 'Try for free',
    ctaShort: '7 days free',
    skipToContent: 'Skip to content',
  },

  hero: {
    headlineLines: ['Find your dream flat', 'before anyone else.'],
    markKeyword: 'dream flat',
    subline:
      '24/7 scanning of all major portals + a real-time alert the moment a matching listing goes online.',
    trust: {
      rating: '4.6',
      ratingLabel: 'App Store',
      downloads: '5,000+ downloads',
    },
    mockupAlt: 'Screenshot of the Immobilien Bot app: listings feed with matching flats',
    mapAlt: 'Screenshot of the Immobilien Bot app: drawing a search area on the map',
    configAlt: 'Screenshot of the Immobilien Bot app: configuring the search by rooms, size and price',
    notification: {
      app: 'Immobilien Bot',
      time: 'now',
      lead: 'New flat in Berlin:',
      items: [
        '3 rooms, €890 – Prenzlauer Berg',
        '2 rooms, €740 – Neukölln',
        '1 room, €620 – Wedding',
        '4 rooms, €1,340 – Charlottenburg',
        '2 rooms, €980 – Friedrichshain',
      ],
    },
  },

  sections: {
    // „3c" — ONE focused, dark problem section (particle number + payoff).
    problem: {
      // sr-only title (structure/SEO). The visible claim is carried by number + H2.
      title: 'The Problem',
      // Big particle number (display, NOT a heading) — forms from particles in the
      // canvas. Asterisk → source in the footer footnote.
      bigNumber: '43,000',
      // Stat sentence, TIGHTLY coupled to the number (smaller, muted white).
      stat: 'applicants for 288 flats. After 30 minutes, it was over.',
      // Reversal headline (H2). Yellow marker ONLY on „you".
      headline: 'One of them gets there first: you.',
      headlineMark: 'you',
      // Scannable benefits (no prose), each with an icon. {n} = portal count (site.ts).
      benefits: [
        { label: 'Real-time push' },
        { label: '{n} portals' },
        { label: 'Apply in one tap' },
      ],
      // Add-on to the trust line (rating/downloads come from hero.trust / site.ts).
      trustCancel: 'Try free for 7 days, cancel anytime',
      // Subtle pointer to the next section (anchor easily repointable).
      moreLink: "We'll show you how",
    },
    features: {
      // sr/back-compat title; eyebrow + H2 carry the visible claim.
      title: 'Features',
      eyebrow: 'Features',
      // H2 with a yellow marker on „first".
      h2: 'Everything you need to be first.',
      h2Mark: 'first',
      subline: 'Three steps from search to application — all in one app.',
      // Tier 1 — the three steps (order: map, listings, cover letter).
      steps: [
        {
          num: '01',
          h3: 'Search exactly where you want to live.',
          body: 'Draw your search area right on the map or set a radius — multiple locations at once.',
          checks: [
            'Draw your area or set a radius',
            'Multiple search locations',
            'Rooms, size, price',
          ],
          alt: 'Map of Berlin with a self-drawn, yellow-outlined search area over the city center; a „Radius" and „Draw" toggle at the top.',
        },
        {
          num: '02',
          h3: 'Your feed instead of ten open tabs.',
          body: 'Every matching listing lands in one tidy list — sorted, filtered, under control.',
          checks: [
            'Favorites & status filters',
            'Unseen / applied at a glance',
            'Share, delete, add notes',
          ],
          alt: 'App listings feed with 18 results: flat cards showing photo, price, number of rooms and square meters, plus filters for favorites and applications.',
        },
        {
          num: '03',
          h3: 'Your application. One tap. Done.',
          body: "Save your cover letter once — tap a listing and it's automatically in your clipboard.",
          checks: [
            'Save your cover letter',
            'Auto-copy on tap',
            'Paste, send, done',
          ],
          alt: 'The app’s „cover letter" view: a saved application text in a text field with „Back" and „Save" buttons.',
        },
      ],
      // Tier 2 — bento „And there's more inside." (marker on „more").
      bentoTitle: "And there's more inside.",
      bentoMark: 'more',
      filter: {
        h4: "Filters the others don't have.",
        body: 'Advanced criteria for the searches that are painful on the portals:',
        chips: [
          'furnished',
          'WG rooms',
          'WBS',
          'flat swap',
          'temporary & sublet',
          'no IS24 Plus listings',
        ],
      },
      darkmode: {
        h4: 'Light & dark mode',
        body: 'Easy on the eyes at night — right when new listings come in.',
        ariaChain: "Toggle this card's dark mode",
      },
      telegram: {
        h4: 'Telegram integration',
        body: 'Get your alerts as Telegram messages too.',
      },
      // h4Label + fixed letters S / M / L (universal, rendered in code).
      listviews: {
        h4Label: 'List views',
        body: 'Scan compact or browse large.',
      },
      language: {
        h4: 'German & English',
        body: 'The entire app in both languages.',
      },
    },
    portals: {
      title: 'All portals in one app',
      count: '{n} property portals – in a single app.',
      // --- „Portals" section (lockscreen phone + listing flight) ---
      headline: 'All portals.',
      headlineMark: 'One feed.',
      subline:
        '{count} sources, monitored around the clock — every new listing lands in your app in real time.',
      groupNational: 'Nationwide',
      groupRegional: 'Regional',
      pushTitle: 'Immobilien Bot',
      pushTemplate: 'New listing: {flat} – via {portal}',
      timeNow: 'now',
      time3: '3 sec ago',
      time6: '6 sec ago',
      flats: {
        berlin: [
          '3-room flat, Prenzlauer Berg',
          '2-room period flat, Kreuzberg',
          '4-room flat, Pankow',
          '2-room flat, Neukölln',
          '1-room flat, Friedrichshain',
        ],
        koeln: ['3-room flat, Ehrenfeld', '2-room flat, Nippes'],
        frankfurt: ['2-room flat, Bockenheim', '3-room flat, Sachsenhausen'],
        hessen: ['3-room flat in Wiesbaden', '2-room flat in Darmstadt'],
        national: [
          '3-room flat in Berlin',
          '2-room flat in Hamburg',
          '4-room flat in Munich',
          '2-room flat in Cologne',
          '3-room flat in Leipzig',
          '2-room flat in Stuttgart',
        ],
      },
      fallbackPushes: [
        'New listing: 3-room flat in Berlin – via Immowelt.de',
        'New listing: 2-room period flat, Kreuzberg – via Howoge.de',
      ],
    },
    ablauf: {
      // H2 with a yellow marker on „day 8.".
      h2: 'From today to day 8.',
      h2Mark: 'day 8.',
      subline: 'Four steps — and you only pay once you know it works.',
      // Four tickets (order is meaning). {rate} comes from site.ts.
      tickets: [
        { label: 'Step 1', pill: 'Today', title: 'Get the app', desc: 'Free for iOS and Android.' },
        {
          label: 'Step 2',
          pill: '2 min later',
          title: 'Start for free',
          desc: 'Draw your search area, pick week or month.',
        },
        {
          label: 'Step 3',
          pill: 'from day 1',
          title: 'Search for your home',
          desc: 'The bot scans around the clock — 7 days free, cancel anytime.',
        },
        {
          label: 'Step 4',
          pill: 'Day 8',
          title: 'Your plan starts',
          // Wording intentionally identical to the in-app paywall. {rate} from site.ts.
          desc: 'Over {rate}% find their home in the first month.',
        },
      ],
    },
    pricing: {
      title: 'Pricing',
      eyebrow: 'Pricing',
      h2: {
        line1: 'One price.',
        line2: 'Everything included.',
        line3: 'You just set the pace.',
        mark: 'Everything included.',
      },
      copy: 'No basic tier, no premium tier, no asterisks. Both plans do everything — you only decide whether you think in weeks or months. And the first 7 days are free either way.',
      checks: [
        'All portals in one app',
        'Real-time push, also via Telegram',
        'Favorites, application letter & more',
        'Cancel anytime in the store',
      ],
      stat: 'Over {rate}% find their home in the first month.',
      qrCaption: "Scan with your phone — you'll land in the right store automatically.",
      toggle: { week: 'Week', month: 'Month' },
      per: { week: '/ week', month: '/ month' },
      day: '≈ {price} a day',
      desc: {
        week: 'Short & focused — for the final sprint.',
        month: 'The standard for a serious search.',
      },
      badge: 'Save {x}%',
      cta: 'Try for free',
      micro: '€0 today · 7 days of full access · you only pay from day 8',
      toggleAria: 'Billing period',
    },
    bewertungen: {
      headline: 'Found — before the others did.',
      headlineMark: 'Found',
      subline: '{total} reviews across three platforms · {downloads} downloads',
      tileLabel: '{count} reviews',
      starsSr: '{n} out of 5 stars',
      footnote: 'Reviews translated from German.',
    },
    // FAQ section — structurally identical to de.ts. IDs are language-neutral and
    // identical across DE/EN (deep links). Same interpolations ({portalCount} etc.),
    // same [[…]] privacy link marker.
    faq: {
      title: 'Frequently asked questions',
      headline: 'Frequently asked questions.',
      headlineMarker: 'questions',
      sub: 'Answered briefly and honestly — from portals to pricing. If something is missing, just write to us.',
      contactCard: {
        title: 'Question not covered?',
        text: 'Write to us — we reply fast and in person.',
        cta: 'Go to contact',
      },
      categories: [
        {
          id: 'faq-allgemein',
          label: 'General',
          items: [
            {
              id: 'faq-was-ist',
              q: 'What is Immobilien Bot?',
              a: 'Immobilien Bot is an app for finding a flat in Germany (iOS & Android). It scans {portalCount} real-estate portals around the clock and sends you a push notification the moment a new listing matches your search — often minutes before anyone else even sees it.',
            },
            {
              id: 'faq-wie-funktioniert',
              q: 'How does Immobilien Bot work?',
              a: 'You set once where and how you want to live: search area on the map, rooms, size, price and further criteria. After that the bot takes over — it checks the portals non-stop for new listings and alerts you in real time the moment a match goes online. A tap on the notification takes you straight to the original listing.',
            },
            {
              id: 'faq-serioes',
              q: 'Is Immobilien Bot trustworthy?',
              a: 'Yes. Immobilien Bot only searches publicly available listings and links you directly to the original listing on the respective portal. There you apply yourself as usual — the bot gives you the head start, nothing more and nothing less. Over {downloads} downloads and {appStoreRating} stars on the App Store speak for themselves.',
            },
            {
              id: 'faq-auto-bewerbung',
              q: 'Does the bot apply automatically for me?',
              a: 'No — and that is on purpose. You decide yourself which listings to apply for. Immobilien Bot makes sure you see them among the first and can react in seconds with your saved application letter. There are no automated bulk applications.',
            },
            {
              id: 'faq-geschwindigkeit',
              q: 'Why does speed matter so much when searching for a flat?',
              a: 'According to Berliner Zeitung, a single housing project in Berlin drew around 43,000 applications in just 30 minutes — for 288 flats. Anyone who only sees a listing in the evening is often already too late. Immobilien Bot opens exactly that window for you with real-time notifications.',
            },
          ],
        },
        {
          id: 'faq-suche',
          label: 'Search & notifications',
          items: [
            {
              id: 'faq-portale',
              q: 'Which real-estate portals are searched?',
              a: 'Currently {portalCount} portals: the big nationwide ones like ImmobilienScout24, Immowelt, Kleinanzeigen and WG-Gesucht, plus regional providers and housing associations like Howoge, Gewobag or GAG Köln. In the app you switch portals on or off individually. You will find the full list in the portals section above.',
            },
            {
              id: 'faq-stadt',
              q: 'Does Immobilien Bot work in my city too?',
              a: 'Yes. The nationwide portals cover all of Germany — from big cities to the countryside. On top of that come regional sources, currently focused on Berlin, Cologne and Hesse. You define your search area freely on the map.',
            },
            {
              id: 'faq-wie-schnell',
              q: 'How quickly am I notified — even when the app is closed?',
              a: 'In real time: as soon as a matching listing goes online, you get a push notification within seconds. The app does not need to be open for that — the bot keeps working independently of your device, even at night.',
            },
            {
              id: 'faq-suchbereiche',
              q: 'Can I set up several search areas?',
              a: 'Yes, up to three at once. You draw each area freely on the map or pick a radius — for example your preferred neighbourhood, the one next to it and the area around your work. Combined with rooms, size and price this creates a precise search profile.',
            },
            {
              id: 'faq-filter-kriterien',
              q: 'Can I search for furnished flats, shared rooms or with a WBS?',
              // TODO(Artem): IS24-Plus-Formulierung fachlich verifizieren
              a: 'Yes. Besides rooms, size and price you filter by advanced criteria such as furnished, shared room (WG), WBS, flat swap or interim and sublet. Listings that are only visible with “Plus” on ImmobilienScout24 can be excluded on request.',
            },
            {
              id: 'faq-telegram',
              q: 'How does the Telegram connection work?',
              // TODO(Artem): Ablauf der Verknüpfung ergänzen (1 Satz)
              a: 'In addition to the push notification you can connect Immobilien Bot with Telegram — new listings then also land directly in your chat.',
            },
            {
              id: 'faq-bewerbung',
              q: 'How does the bot help me with the application?',
              a: 'You save your application letter once in the app. In the listing overview you later copy it to the clipboard with a single tap — paste, send, done. So often only seconds pass between the push and your application.',
            },
          ],
        },
        {
          id: 'faq-preise',
          label: 'Pricing & subscription',
          items: [
            {
              id: 'faq-preis',
              q: 'What does Immobilien Bot cost?',
              a: 'You start with {trialDays} days free and without obligation. After that Immobilien Bot costs {price7d} for 7 days or {price1m} for a month — depending on how intensively you are searching right now.',
            },
            {
              id: 'faq-testphase',
              q: 'How does the free trial work?',
              // TODO(Artem): Übergang Testphase→Abo präzisieren, Wording an Billing-Timeline in Ablauf angleichen
              a: 'For {trialDays} days you use the full range of features: all portals, real-time push, all features. If the bot is not for you, you simply cancel within the trial period — then you pay nothing.',
            },
            {
              id: 'faq-kuendigen',
              q: 'Can I cancel anytime?',
              a: 'Yes. The subscription runs via your Apple App Store or Google Play and can be ended there anytime with a few clicks — no notice period, no phone call, no risk.',
            },
            {
              id: 'faq-versteckte-kosten',
              q: 'Are there hidden costs or premium tiers?',
              a: 'No. Every plan includes all features — real-time push, Telegram connection, favorites, application letter and all portals. There are no extra costs and no stripped-down basic version.',
            },
          ],
        },
        {
          id: 'faq-technik',
          label: 'App & tech',
          items: [
            {
              id: 'faq-geraete',
              q: 'Which devices is the app available for?',
              a: 'Immobilien Bot is available for iOS on the Apple App Store and for Android on Google Play — with an identical range of features on both platforms.',
            },
            {
              id: 'faq-sprachen',
              q: 'Which languages does the app support?',
              a: 'German and English. You switch the language right inside the app — handy for international flat hunters and expats.',
            },
            {
              id: 'faq-dark-mode',
              q: 'Is there a dark mode?',
              a: 'Yes. You switch between light and dark mode anytime.',
            },
            {
              id: 'faq-daten',
              q: 'What happens to my data?',
              // TODO(Artem): final mit Rechtstexten abstimmen. [[…]] = Link auf die Datenschutz-Route.
              a: 'Immobilien Bot only needs what is necessary for your search: your search profile and a sign-in via email, Apple or Google. All details are governed by the [[privacy policy]].',
            },
          ],
        },
      ],
    },
    // Contact section — structurally identical to de.ts. Facts (email/telegram/
    // instagram) come from site.ts; {link} = privacy route, {email} = contact address.
    contact: {
      title: 'Contact',
      kicker: 'Contact',
      headline: 'Questions? Feedback? Missing a feature?',
      headlineMark: 'feature',
      copy: "Just reach out – we're here for you and read every message personally. You decide how to get in touch.",
      channels: {
        email: 'Email',
        telegram: 'Telegram',
        telegramSub: 'The app’s support channel',
        instagram: 'Instagram',
        instagramSub: '@immobilienbot',
      },
      card: {
        app: 'Immobilien Bot',
        sub: 'Your message to us',
        time: 'now',
        iconAlt: 'Immobilien Bot app icon',
      },
      form: {
        topicLegend: 'What’s it about?',
        topics: {
          app: 'Question about the app',
          feedback: 'Feedback',
          problem: 'Report a problem',
          presse: 'Press & partnerships',
          sonstiges: 'Other',
        },
        name: 'Name',
        namePlaceholder: 'Jane Doe',
        email: 'Email',
        emailPlaceholder: 'jane@mail.com',
        message: 'Message',
        messagePlaceholder: 'How can we help?',
        submit: 'Send message',
        sending: 'Sending…',
        privacy: 'We only use your details to answer your request. More on this in our {link}.',
        privacyLink: 'privacy policy',
      },
      success: {
        title: 'Message sent!',
        copy: "We'll get back to you as soon as possible.",
        again: 'Write another message',
      },
      error: "That didn't work. Email us directly at {email}.",
      thanks: {
        metaTitle: 'Message sent – Immobilien Bot',
        metaDescription: "Thanks for your message to Immobilien Bot. We'll get back to you as soon as possible.",
        back: 'Back to homepage',
      },
    },
    finalCta: { title: "Your next flat won't wait." },
  },

  cta: {
    appStore: 'Download on the App Store',
    playStore: 'Get it on Google Play',
    tryFree: 'Try free for 7 days',
  },

  footer: {
    imprint: 'Imprint',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    langSwitch: 'Deutsch',
    signature: 'The original. Faster than the rest.',
    // Consecutively numbered source notes (footer, id="quellen"):
    // ¹ Berlin statistic of the problem story · ² 70% figure of the Ablauf section.
    // TODO: add the real source link (Berliner Zeitung) once available.
    sources: [
      'Statistics: Berliner Zeitung.',
      'Immobilien Bot user data. For comparison: 54% of home seekers search for more than a year (ImmobilienScout24, 2024).',
    ],
  },

  legal: {
    imprint: { title: 'Imprint' },
    privacy: { title: 'Privacy Policy' },
    terms: { title: 'Terms & Conditions' },
    placeholder: 'Content coming soon. [TODO: legal content from Artem]',
  },
};
