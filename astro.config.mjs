// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Zentrale Site-URL — beim Launch auf die finale Domain zeigen.
// Bis dahin wird auf der Cloudflare-Preview-URL gearbeitet (siehe CLAUDE.md).
const SITE = 'https://immobilien-bot.de';

// https://astro.build/config
export default defineConfig({
  site: SITE,

  // Perf: ALLE Seiten-Stylesheets inline in den <head> statt als render-blockende
  // <link>-Requests. Die Komponenten-CSS kamen sonst als separate Roundtrips in den
  // kritischen Pfad (Lighthouse: render-blocking ~430–450 ms, größter Einzelposten).
  // Das Gesamt-CSS ist nach Tailwind-Purge klein → Inlining lohnt sich klar.
  build: {
    inlineStylesheets: 'always',
  },

  // DE (Standard) auf /, EN auf /en/ — mit reziprokem hreflang (in SEO.astro).
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    sitemap({
      // Aus der Sitemap ausschließen: /go/app (Redirect-Weiche), die noindex-Danke-
      // Seiten des Kontaktformulars (/danke, /en/thanks), die Blog-Platzhalter-Route
      // sowie die noindex-Utility-Seiten (/verify-email, /account-loeschen).
      filter: (page) =>
        !page.includes('/go/') &&
        !page.includes('/danke') &&
        !page.includes('/thanks') &&
        !page.includes('/blog') &&
        !page.includes('/verify-email') &&
        !page.includes('/account-loeschen'),
      i18n: {
        defaultLocale: 'de',
        locales: {
          de: 'de-DE',
          en: 'en-US',
        },
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
