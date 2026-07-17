/**
 * gen-cms-config.mjs — generiert public/admin/config.yml für Sveltia CMS.
 *
 * Die „Website-Texte"-Collection-Felder werden REKURSIV aus src/i18n/strings.de.json
 * abgeleitet → deckt GARANTIERT 100 % der i18n-Keys ab (sonst würden beim CMS-Speichern
 * nicht abgebildete Keys verworfen). Widget-Wahl spiegelt den JSON-Typ (object → object,
 * array-of-objects → list+fields, array-of-scalars → list+field, number → number,
 * langer String → text, sonst string) → sauberer JSON-Round-Trip.
 *
 * Bei NEUEN i18n-Keys: dieses Skript erneut ausführen (`node scripts/gen-cms-config.mjs`)
 * und das aktualisierte config.yml committen. Der SEO-Audit (Check G5) erzwingt, dass die
 * config.yml alle strings.de.json-Keys abdeckt.
 *
 * Testimonials- und Ratgeber-Collection sind fest (kleine, stabile Schemata) und unten
 * als YAML-Blöcke eingebettet — inkl. ALLER Frontmatter-Felder (auch hidden), damit auch
 * dort beim Speichern nichts verloren geht.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const de = JSON.parse(readFileSync(join(root, 'src', 'i18n', 'strings.de.json'), 'utf8'));

/* ---------- Deutsche Labels (laienverständlich) ---------- */
// Voll-Pfad-Labels (überschreiben Key-Labels) für die Top-Abschnitte in Seiten-Reihenfolge.
const PATH_LABELS = {
  meta: 'Meta / SEO – Startseite',
  nav: 'Navigation & Menü',
  smartBar: 'Mobile Sticky-Leiste',
  hero: 'Hero – oberster Bereich',
  sections: 'Seitenabschnitte',
  'sections.problem': 'Abschnitt: Problem',
  'sections.features': 'Abschnitt: Features',
  'sections.portals': 'Abschnitt: Portale',
  'sections.ablauf': 'Abschnitt: Ablauf',
  'sections.pricing': 'Abschnitt: Preise',
  'sections.bewertungen': 'Abschnitt: Bewertungen',
  'sections.faq': 'Abschnitt: FAQ',
  'sections.contact': 'Abschnitt: Kontakt',
  about: 'Seite „Über uns"',
  cta: 'Buttons – App laden',
  footer: 'Footer',
  legal: 'Rechtsseiten – Titel',
  blog: 'Blog – Platzhalter',
  ratgeber: 'Ratgeber – UI-Texte',
};
// Häufige Key-Namen → deutsches Label.
const KEY_LABELS = {
  title: 'Titel', metaTitle: 'Seitentitel (Browser-Tab / SEO)', description: 'Beschreibung (SEO)',
  headline: 'Überschrift', h2: 'Überschrift', h3: 'Zwischenüberschrift', h4: 'Zwischenüberschrift',
  h4Label: 'Zwischenüberschrift', headlineLines: 'Überschrift (Zeilen)',
  headlineMark: 'Gelb markiertes Wort', headlineMarker: 'Gelb markiertes Wort',
  h2Mark: 'Gelb markiertes Wort', bentoMark: 'Gelb markiertes Wort', mark: 'Gelb markiertes Wort',
  markKeyword: 'Gelb markiertes Wort', p1Mark: 'Gelb markiertes Wort', headlineMarkKey: 'Gelb markiertes Wort',
  subline: 'Unterzeile', sub: 'Unterzeile', copy: 'Fließtext', body: 'Text', lead: 'Einleitung',
  intro: 'Einleitung', eyebrow: 'Kleine Überzeile', kicker: 'Kleine Überzeile',
  label: 'Beschriftung', cta: 'Button-Text', ctaFree: 'Button-Text (gratis)', ctaShort: 'Button-Text (kurz)',
  desc: 'Beschreibung', name: 'Name', namePlaceholder: 'Platzhalter Name', role: 'Rolle',
  pill: 'Kleines Label (Pill)', num: 'Nummer', value: 'Wert', note: 'Fußnoten-Nummer',
  alt: 'Alt-Text (Bildbeschreibung)', mockupAlt: 'Alt-Text (Bildbeschreibung)',
  mapAlt: 'Alt-Text (Bildbeschreibung)', configAlt: 'Alt-Text (Bildbeschreibung)',
  iconAlt: 'Alt-Text (Bildbeschreibung)', mobilePhoneAlt: 'Alt-Text (Bildbeschreibung)',
  trust: 'Trust-Zeile', rating: 'Bewertung', ratingLabel: 'Bewertungs-Label', downloads: 'Downloads-Zeile',
  notification: 'Benachrichtigungs-Karte', notif: 'Benachrichtigungs-Karte', app: 'App-Name',
  time: 'Uhrzeit', items: 'Einträge', steps: 'Schritte', checks: 'Häkchen-Punkte', chips: 'Filter-Chips',
  tickets: 'Tickets', categories: 'Kategorien', members: 'Team-Mitglieder', tiles: 'Kacheln',
  quote: 'Zitat-Zeilen', footnotes: 'Fußnoten', footnotesTitle: 'Titel Fußnoten', sources: 'Quellen',
  benefits: 'Vorteile', channels: 'Kontaktkanäle', form: 'Formular', topics: 'Themen (Auswahl)',
  topicLegend: 'Themen-Überschrift', success: 'Erfolgsmeldung', error: 'Fehlermeldung', thanks: 'Danke-Seite',
  per: 'Zeitraum-Label', day: 'Tagespreis-Text', badge: 'Spar-Badge', micro: 'Kleingedrucktes',
  toggle: 'Umschalter', toggleAria: 'Umschalter (Vorlese-Text)', flats: 'Wohnungs-Beispiele',
  board: 'Zahlen-Tafel', stat: 'Statistik-Zeile', trustCancel: 'Kündigungs-Hinweis', moreLink: 'Mehr-Link',
  count: 'Anzahl-Text', groupNational: 'Gruppe bundesweit', groupRegional: 'Gruppe regional',
  accordionTitle: 'Akkordeon-Titel', accordionSub: 'Akkordeon-Unterzeile',
  pushTitle: 'Push-Titel', pushTemplate: 'Push-Vorlage', contactCard: 'Kontakt-Karte',
  message: 'Nachricht', messagePlaceholder: 'Platzhalter Nachricht', email: 'E-Mail',
  emailPlaceholder: 'Platzhalter E-Mail', submit: 'Absenden-Button', sending: 'Sende-Status',
  privacy: 'Datenschutz-Hinweis', privacyLink: 'Datenschutz-Linktext', again: 'Nochmal-Button',
  imprint: 'Impressum', terms: 'AGB', contact: 'Kontakt', blog: 'Blog', signature: 'Signatur',
  copyright: 'Copyright', langSwitch: 'Sprachumschalter', colLegal: 'Spalte Rechtliches',
  colMore: 'Spalte Mehr', colLang: 'Spalte Sprache', colApp: 'Spalte App',
  q: 'Frage', a: 'Antwort', id: 'ID', t: 'Zeile', heading: 'Überschrift', stats: 'Zahlen',
  reasons: 'Gründe', unfair: 'Unfair-Block', origin: 'Entstehung', believe: 'Überzeugung',
  team: 'Team', ratingsLine: 'Bewertungs-Zeile', moreTitle: 'Mehr-Titel', publishedLabel: 'Veröffentlicht-Label',
  appStore: 'App Store', playStore: 'Google Play', tryFree: 'Gratis testen', skipToContent: 'Skip-Link',
  langToDe: 'Sprache → Deutsch', langToEn: 'Sprache → Englisch', menuOpen: 'Menü öffnen', menuClose: 'Menü schließen',
  aria: 'Vorlese-Text (aria-label)', close: 'Schließen', soon: 'Bald-Text', back: 'Zurück-Link',
  placeholder: 'Platzhalter-Text', week: 'Woche', month: 'Monat', card: 'Karte', telegram: 'Telegram',
  instagram: 'Instagram', telegramSub: 'Telegram-Unterzeile', instagramSub: 'Instagram-Unterzeile',
  metaDescription: 'Beschreibung (SEO)', ariaChain: 'Vorlese-Text (aria-label)', darkmode: 'Dark-Mode',
  language: 'Sprache', listviews: 'Listenansichten', filter: 'Filter', bentoTitle: 'Bento-Titel',
  qrCaption: 'QR-Beschriftung', p1: 'Absatz 1', p2: 'Absatz 2', p3: 'Absatz 3', p4: 'Absatz 4', p5: 'Absatz 5',
  p3pre: 'Absatz 3 (vor fett)', p3bold: 'Absatz 3 (fett)', p3post: 'Absatz 3 (nach fett)',
  tempoLabel: 'Tempo-Label', tempoBody: 'Tempo-Text', reachLabel: 'Reichweite-Label', reachBody: 'Reichweite-Text',
  timeNow: 'Uhrzeit jetzt', time3: 'Uhrzeit -3', time6: 'Uhrzeit -6', fallbackPushes: 'Fallback-Pushes',
  starsSr: 'Sterne (Vorlese-Text)', tileLabel: 'Kachel-Label', transNote: 'Übersetzungs-Hinweis', footnote: 'Fußnote',
  applicants: 'Bewerber', minutes: 'Minuten', flatsCount: 'Wohnungen', berlin: 'Berlin', koeln: 'Köln',
  frankfurt: 'Frankfurt', hessen: 'Hessen', national: 'Bundesweit', em: 'Gelb hervorheben (an/aus)',
};

const humanize = (k) => k.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
const labelFor = (path, key) => PATH_LABELS[path] ?? KEY_LABELS[key] ?? humanize(key);
const isLong = (v) => typeof v === 'string' && (v.length > 64 || v.includes('\n'));

/* ---------- Feldbaum rekursiv aus dem JSON ---------- */
function buildField(key, val, path) {
  const label = labelFor(path, key);
  if (Array.isArray(val)) {
    const first = val[0];
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      // Liste von Objekten → widget:list + fields. Schlüssel über ALLE Items vereinen
      // (Items können optionale Keys haben, z. B. about.quote[].em), sonst Datenverlust.
      const objs = val.filter((x) => x && typeof x === 'object' && !Array.isArray(x));
      const keys = [];
      const seen = new Set();
      for (const it of objs) for (const k of Object.keys(it)) if (!seen.has(k)) { seen.add(k); keys.push(k); }
      const fields = keys.map((k) => {
        const rep = objs.find((it) => k in it)[k];
        const f = buildField(k, rep, `${path}.${k}`);
        if (!objs.every((it) => k in it)) f.required = false; // Key nicht in allen Items → optional
        return f;
      });
      return { name: key, label, widget: 'list', i18n: true, fields };
    }
    // Liste von Skalaren → widget:list + field (Array of scalars)
    const w = typeof first === 'number' ? 'number' : isLong(first) ? 'text' : 'string';
    const field = { name: 'wert', label: 'Wert', widget: w };
    if (w === 'number') field.value_type = 'int';
    return { name: key, label, widget: 'list', i18n: true, field };
  }
  if (val && typeof val === 'object') {
    return {
      name: key, label, widget: 'object', i18n: true, collapsed: true,
      fields: Object.entries(val).map(([k, v]) => buildField(k, v, `${path}.${k}`)),
    };
  }
  if (typeof val === 'number') {
    return { name: key, label, widget: 'number', value_type: 'int', i18n: true };
  }
  if (typeof val === 'boolean') {
    return { name: key, label, widget: 'boolean', i18n: true };
  }
  return { name: key, label, widget: isLong(val) ? 'text' : 'string', i18n: true };
}

/* ---------- Minimaler YAML-Emitter (nur unsere Schema-Formen) ---------- */
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
// Emittiert ein Feld als Listen-Element (mit „- ") + Kinder.
function emitField(f, indent) {
  const p = '  '.repeat(indent);
  const L = [];
  L.push(`${p}- name: ${f.name}`);
  L.push(`${p}  label: ${q(f.label)}`);
  L.push(`${p}  widget: ${f.widget}`);
  if (f.value_type) L.push(`${p}  value_type: ${f.value_type}`);
  if (f.required !== undefined) L.push(`${p}  required: ${f.required}`);
  if (f.i18n !== undefined) L.push(`${p}  i18n: ${f.i18n}`);
  if (f.collapsed !== undefined) L.push(`${p}  collapsed: ${f.collapsed}`);
  if (f.field) {
    L.push(`${p}  field:`);
    L.push(`${p}    name: ${f.field.name}`);
    L.push(`${p}    label: ${q(f.field.label)}`);
    L.push(`${p}    widget: ${f.field.widget}`);
    if (f.field.value_type) L.push(`${p}    value_type: ${f.field.value_type}`);
  }
  if (f.fields) {
    L.push(`${p}  fields:`);
    for (const sub of f.fields) L.push(...emitField(sub, indent + 2));
  }
  return L;
}

const websiteFields = Object.entries(de).map(([k, v]) => buildField(k, v, k));
const websiteFieldsYaml = websiteFields.flatMap((f) => emitField(f, 5)).join('\n');

/* ---------- Vollständige config.yml ---------- */
const yaml = `# AUTOGENERIERT von scripts/gen-cms-config.mjs — NICHT von Hand editieren.
# Bei neuen i18n-Keys: \`node scripts/gen-cms-config.mjs\` erneut ausführen und committen.
# Die „Website-Texte"-Felder decken 100 % von src/i18n/strings.de.json ab (SEO-Audit G5 erzwingt das).

backend:
  name: github
  repo: ImmobilienBot/Homepage
  branch: staging
  base_url: https://sveltia-cms-auth.socialmedia-9bf.workers.dev

# Bild-Uploads sind NICHT Teil von v1 (Bilder laufen über Artem). media_folder ist nur formal gesetzt.
media_folder: src/assets/images/ratgeber
public_folder: /src/assets/images/ratgeber

# DE/EN nebeneinander: pro Sprache eine Datei (strings.de.json / strings.en.json).
i18n:
  structure: multiple_files
  locales: [de, en]
  default_locale: de

collections:
  # ── 1) Alle sichtbaren Website-Texte (DE/EN nebeneinander) ─────────────────────────
  - name: website-texte
    label: 'Website-Texte'
    label_singular: 'Website-Texte'
    description: 'Alle sichtbaren Texte der Startseite und der Über-uns-Seite (Deutsch & Englisch nebeneinander).'
    i18n: true
    files:
      - name: strings
        label: 'Alle Texte'
        i18n: true
        file: 'src/i18n/strings.{{locale}}.json'
        format: json
        fields:
${websiteFieldsYaml}

  # ── 2) Bewertungen (Testimonials) ──────────────────────────────────────────────────
  - name: testimonials
    label: 'Bewertungen'
    description: 'Die echten Kundenstimmen in der Bewertungen-Sektion (Text zweisprachig am selben Eintrag).'
    files:
      - name: liste
        label: 'Alle Bewertungen'
        file: 'src/data/testimonials.json'
        format: json
        fields:
          - name: testimonials
            label: 'Bewertungen'
            label_singular: 'Bewertung'
            widget: list
            summary: '{{fields.name}} · {{fields.platform}} · {{fields.rating}}★'
            fields:
              - name: id
                label: 'ID (nicht ändern)'
                widget: string
                readonly: true
                hint: 'Stabile, technische ID – bitte nicht verändern.'
              - name: name
                label: 'Name'
                widget: string
              - name: city
                label: 'Ort (optional)'
                widget: string
                required: false
              - name: platform
                label: 'Plattform'
                widget: select
                options:
                  - { label: 'App Store', value: appstore }
                  - { label: 'Google Play', value: googleplay }
                  - { label: 'Google Maps', value: googlemaps }
              - name: rating
                label: 'Sterne (1–5)'
                widget: number
                value_type: int
                min: 1
                max: 5
              - name: text
                label: 'Zitat'
                widget: object
                fields:
                  - name: de
                    label: 'Deutsch'
                    widget: text
                  - name: en
                    label: 'Englisch'
                    widget: text

  # ── 3) Ratgeber-Artikel (DE-only, Markdown) ────────────────────────────────────────
  - name: ratgeber
    label: 'Ratgeber-Artikel'
    label_singular: 'Ratgeber-Artikel'
    description: 'Die Ratgeber-/Blog-Artikel. Text bearbeiten ist ok – URL (path) und Datum bitte nicht ändern.'
    folder: src/content/ratgeber
    extension: md
    format: frontmatter
    create: true
    delete: false
    slug: '{{fields.slug}}'
    fields:
      - name: title
        label: 'Titel (Überschrift H1)'
        widget: string
      - name: metaTitle
        label: 'Seitentitel (Browser-Tab / SEO)'
        widget: string
      - name: description
        label: 'Beschreibung (SEO)'
        widget: text
      - name: path
        label: 'URL-Pfad (nicht ändern!)'
        widget: string
        readonly: true
        hint: 'Kanonische URL des Artikels – Änderung bricht Google-Rankings. Nur Artem ändert das.'
      - name: pubDate
        label: 'Veröffentlicht am (Anzeige, nicht ändern)'
        widget: string
        readonly: true
      - name: datetime
        label: 'Datum (technisch)'
        widget: string
        readonly: true
      - name: heroImage
        label: 'Titelbild (über Artem)'
        widget: string
        readonly: true
        required: false
        hint: 'Bilder laufen in v1 über Artem – hier nicht ändern.'
      - name: heroAlt
        label: 'Titelbild-Beschreibung (Alt-Text)'
        widget: string
        required: false
      - name: body
        label: 'Artikel-Inhalt'
        widget: markdown
`;

const out = join(root, 'public', 'admin', 'config.yml');
writeFileSync(out, yaml);
console.log(`[gen-cms-config] public/admin/config.yml geschrieben (${websiteFields.length} Top-Gruppen, Website-Texte).`);
