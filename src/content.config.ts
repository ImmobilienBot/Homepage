/**
 * content.config.ts — Astro Content Collections.
 *
 * `ratgeber` = SEO-migrierte Ratgeber-Artikel der alten Live-Seite. Markdown,
 * damit Juri/Benni sie pflegen/entfernen können (siehe CLAUDE.md → Ratgeber).
 * Die Route `src/pages/[...ratgeber].astro` erzeugt exakt `/2025/MM/TT/slug`
 * (kanonisch MIT Trailing Slash — wie die Quelle).
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const ratgeber = defineCollection({
  // Nur .md (keine _-Prefix-Entwürfe); Bilder liegen co-located in Unterordnern.
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/ratgeber' }),
  schema: ({ image }) =>
    z.object({
      /** Sichtbare H1 (1:1 aus der Quelle). */
      title: z.string(),
      /** `<title>` 1:1 aus der Quelle (inkl. Original-Suffix „– Immobilien Bot"). */
      metaTitle: z.string(),
      /** Meta-Description (Quelle hatte keine → sachlich abgeleitet). */
      description: z.string(),
      /** EXAKTER URL-Pfad ohne führenden/abschließenden Slash: „2025/09/19/slug". */
      path: z.string(),
      /** Sichtbares Original-Veröffentlichungsdatum, z. B. „19. September 2025". */
      pubDate: z.string(),
      /** ISO-Zeitpunkt für <time datetime> + JSON-LD datePublished. */
      datetime: z.string(),
      /** Beitragsbild (optional) — über astro:assets optimiert. */
      heroImage: image().optional(),
      heroAlt: z.string().optional(),
    }),
});

export const collections = { ratgeber };
