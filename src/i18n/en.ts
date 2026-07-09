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
    ctaFree: 'Try 7 days free',
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
    features: { title: 'Features' },
    portals: {
      title: 'All portals in one app',
      count: '{n} property portals – in a single app.',
    },
    pricing: { title: 'Pricing' },
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
    // Footnote for the Berlin statistic (asterisk in the problem story).
    // TODO: add the real source link (Berliner Zeitung) once available.
    sourceNote: '* Statistics: Berliner Zeitung',
  },

  legal: {
    imprint: { title: 'Imprint' },
    privacy: { title: 'Privacy Policy' },
    terms: { title: 'Terms & Conditions' },
    placeholder: 'Content coming soon. [TODO: legal content from Artem]',
  },
};
