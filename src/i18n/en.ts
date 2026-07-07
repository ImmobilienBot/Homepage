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
    problem: {
      // sr-only heading (the „The Problem" eyebrow is removed — the dark staging
      // is the declaration; heading kept for SEO/structure).
      title: 'The Problem',
      // Dark story beats, flooded in via scroll-fill. **…** = emphasis (yellow).
      beats: [
        'In Berlin, a single new development drew **43,000 applicants**.',
        'For **288 flats**. After **30 minutes**, it was over.',
      ],
      beat2Sub: 'By the time you even see the listing, hundreds were already faster.',
      // Turning point (reframe) — right before the „lights on".
      turn: "It's not on you. You were just never **the first**.",
      source: 'Source: Berliner Zeitung',
    },
    solution: {
      title: 'The Solution',
      // Visible H2 (keyword with yellow marker).
      headline: 'Time to turn the tables.',
      headlineMark: 'turn the tables',
      // {n} = portal count from site.ts. **…** = yellow marker.
      text: "Immobilien Bot watches **{n} portals** around the clock and pings you within seconds the moment your flat goes live. **From now on, you're the first**.",
    },
    features: { title: 'Features' },
    portals: {
      title: 'All portals in one app',
      count: 'Over {n} property portals – in a single app.',
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
  },

  legal: {
    imprint: { title: 'Imprint' },
    privacy: { title: 'Privacy Policy' },
    terms: { title: 'Terms & Conditions' },
    placeholder: 'Content coming soon. [TODO: legal content from Artem]',
  },
};
