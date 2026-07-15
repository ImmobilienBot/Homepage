/**
 * aboutJsonLd.ts — Zusätzliche JSON-LD-Knoten der Über-uns-Seite (an SEO.astro via
 * `extraJsonLd`). AboutPage + Organization (um `founder` Juri Schmidt ergänzt,
 * gleiches @id wie das Basis-Organization → Merge) + Team als Person-Einträge
 * (nur name + jobTitle, keine weiteren personenbezogenen Daten).
 */
import { site } from '../data/site';
import { hreflangCodes } from '../i18n';
import type { Locale } from '../data/site';

interface Member {
  name: string;
  role: string;
}

export function buildAboutJsonLd(
  lang: Locale,
  title: string,
  description: string,
  members: Member[],
): unknown[] {
  const aboutPath = lang === 'en' ? '/en/about/' : '/ueber-uns/';
  const founder = members[0];
  return [
    {
      '@type': 'AboutPage',
      name: title,
      description,
      url: `${site.url}${aboutPath}`,
      inLanguage: hreflangCodes[lang],
      about: { '@id': `${site.url}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      ...(founder ? { founder: { '@type': 'Person', name: founder.name, jobTitle: founder.role } } : {}),
      employee: members.map((m) => ({ '@type': 'Person', name: m.name, jobTitle: m.role })),
    },
  ];
}
