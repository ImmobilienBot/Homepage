/**
 * English strings. Must stay structurally identical to de.ts.
 */
import type { Dict } from './de';

export const en: Dict = {
  meta: {
    title: 'Immobilien Bot – Find your dream flat before anyone else',
    description:
      'Immobilien Bot scans all major German property portals 24/7 and sends you a real-time push the moment a matching flat goes live. Try it free for 7 days.',
  },

  nav: {
    bot: 'The Bot',
    features: 'Features',
    pricing: 'Pricing',
    faq: 'FAQ',
    cta: 'Get the app',
    ctaFree: 'Try for free',
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
      title: 'The Problem',
      text: "In Berlin, a single new development drew **43,000 applicants** – in just **30 minutes**. For only **288 flats**. Click too late and it's gone.",
      source: 'Source: Berliner Zeitung',
    },
    solution: { title: 'The Solution' },
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
