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
      // Two-line headline; „Try it" carries the inverted marker.
      headline: { line1: 'Try it first.', line2: 'Then decide.', mark: 'Try it' },
      subline:
        "7 days of full access to everything — for €0. You pick week or month at the start, and you're only charged from day 8. Cancel anytime.",
      trial: {
        label: 'Try it free',
        priceSuffix: '· 7 days',
        desc: 'The full feature set from second one: all portals, real-time push, favorites, application letters.',
        timeline: [
          { lead: 'Today', text: 'get the app, pick week or month, start for free' },
          { lead: 'Days 1–7', text: 'test everything, cancel anytime' },
          { lead: 'Day 8', text: 'only now does your chosen plan start' },
        ],
        storeNote:
          "You start your trial by picking week or month in the store — Apple and Google call this 'subscribing', but you're only charged from day 8. Cancel before then and you pay nothing.",
        qrCaption: "Scan with your phone — you'll land in the right store automatically.",
      },
      plans: {
        label: 'From day 8',
        week: { name: 'Week', suffix: '/ week', desc: 'short and intense for the final sprint' },
        month: { name: 'Month', suffix: '/ month', desc: 'the standard for a serious search' },
        chip: 'Save 33%',
        perDay: '≈ {price} a day',
        note: 'No fine print: both plans always include every feature, renew automatically, and can be cancelled in the store at any time.',
      },
      benefits: {
        label: 'Everything included — in every plan',
        items: [
          'Real-time push, also via Telegram',
          'All portals in one app',
          'All features: favorites, application letter & more',
          'No risk: cancel anytime',
        ],
      },
    },
    socialProof: { title: 'What users say' },
    faq: { title: 'Frequently asked questions' },
    contact: { title: 'Contact' },
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
