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
