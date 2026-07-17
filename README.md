# Immobilien Bot – Homepage

Statische Marketing-Website (Astro · Tailwind · TypeScript) für die App **Immobilien Bot**.
Die vollständige technische Referenz steht in **[CLAUDE.md](./CLAUDE.md)** (Design-System, Tokens,
Sektionen, Audit, Deploy). Diese README erklärt vor allem, **wie die Texte gepflegt werden**.

## Entwicklung

```bash
npm install       # installiert Abhängigkeiten (synchronisiert dabei das CMS-Bundle nach public/admin/)
npm run dev       # Dev-Server auf http://localhost:4321
npm run build     # Build nach dist/
npm run audit     # build + SEO/GEO-Audit + Lighthouse (vor „fertig"-Meldung Pflicht)
```

---

## Texte pflegen (für Juri) ✍️

Alle sichtbaren Texte der Website lassen sich **ohne Code** über ein kleines Redaktions-Tool
(**Sveltia CMS**) bearbeiten. Kein Programmieren, kein Terminal – nur Browser.

### 1. Einloggen

1. **`https://<Preview-URL>/admin`** öffnen (die Cloudflare-Preview-URL des `staging`-Branches –
   Artem gibt sie dir; lokal: `http://localhost:4321/admin`).
2. Auf **„Login with GitHub"** klicken und mit deinem GitHub-Konto anmelden.
   (Du brauchst Schreibrechte am Repo `ImmobilienBot/Homepage` – einmalig von Artem einrichten lassen.)

### 2. Was liegt wo?

Nach dem Login siehst du **drei Bereiche**:

| Bereich | Inhalt |
|---|---|
| **Website-Texte** | Alle Texte der Startseite und der „Über uns"-Seite. **Deutsch und Englisch stehen nebeneinander** – bitte immer beide Sprachen pflegen. Gegliedert nach Seitenabschnitten (Hero, Problem, Features, Portale, Preise, Bewertungen, FAQ, Kontakt …). |
| **Bewertungen** | Die echten Kundenstimmen (Marquee in der Bewertungen-Sektion). Zitat, Name, Plattform, Sterne. |
| **Ratgeber-Artikel** | Die Ratgeber-/Blog-Artikel (nur Deutsch). Titel, SEO-Felder und der Artikeltext (Markdown). |

### 3. So läuft eine Änderung

1. Text ändern → oben rechts **„Save"**.
2. Sveltia schreibt die Änderung in den **`staging`-Branch** auf GitHub.
3. Cloudflare baut daraus automatisch eine **Preview-Seite** – dort kannst du deine Änderung prüfen.
4. Wenn alles passt, macht **Artem** aus `staging` einen Pull Request auf `main` und gibt ihn frei.
   Erst dann geht die Änderung live. (So kann nie versehentlich etwas Kaputtes online gehen.)

### 4. Wichtige Regeln

- **Immer DE *und* EN** ausfüllen. Ein Text, der nur in einer Sprache existiert, lässt den Build
  scheitern (eine automatische Prüfung wacht darüber).
- **Bilder** (Titelbilder der Ratgeber, App-Screens): **laufen über Artem** – im CMS nicht ändern.
- **Artikel löschen** oder **URL/Datum eines Artikels ändern**: **nur über Artem** (betrifft
  Google-Rankings). Die Felder „URL-Pfad" und „Datum" sind deshalb gesperrt.
- **Neue Ratgeber-Artikel** vorher **kurz mit Artem abstimmen** (URL-Pfad muss er setzen).
- **Parallel arbeiten:** Wenn mehrere gleichzeitig editieren, vorher absprechen – sonst
  überschreibt ihr euch gegenseitig.
- **Unerwartete Fehlermeldung im CMS?** (z. B. „X fields have an error", Speichern klappt nicht)
  → **nichts improvisieren, nichts erfinden**, keine Platzhalter wie „Test" eintragen. Mach einen
  **Screenshot und schick ihn an Artem**. Ein leeres Feld ist bei uns oft völlig in Ordnung.

### 5. Optional: automatische Übersetzung (DeepL)

Sveltia kann per Klick einen deutschen Text ins Englische vorübersetzen. Dazu einmalig in den
CMS-Einstellungen (Zahnrad → *Advanced*) einen persönlichen **DeepL-API-Key** hinterlegen.
Ist rein optional; die Vorübersetzung immer gegenlesen.

---

## CMS technisch (für Entwickler)

- **Sveltia CMS** liegt ausschließlich unter **`/admin`** (noindex, `Disallow` in `robots.txt`,
  nicht in der Sitemap). Auf der öffentlichen Seite ändert sich dadurch **nichts** – kein Skript,
  kein Request, kein Markup.
- **Bundle ohne CDN:** `@sveltia/cms` ist als **devDependency mit exakt gepinnter Version**
  installiert. `scripts/sync-cms.mjs` kopiert das Bundle bei jedem `npm install` (postinstall) und
  vor jedem Build (prebuild) nach `public/admin/sveltia-cms.js` (gitignored, ~2 MB).
  **Update = bewusster Versions-Bump** von `@sveltia/cms` in `package.json` (nie „latest"), danach
  `npm install` + kurzer Smoke-Test von `/admin`.
- **Konfiguration:** `public/admin/config.yml` wird von **`scripts/gen-cms-config.mjs`** aus
  `src/i18n/strings.de.json` generiert und deckt so **100 % der Text-Keys** ab. **Neuer i18n-Key
  ⇒ `node scripts/gen-cms-config.mjs` laufen lassen und committen** – sonst schlägt der SEO-Audit
  (Check **G5**) fehl (und der Key ginge beim CMS-Speichern verloren).
- **Alle generierten Felder sind `required: false`** (bewusst): leere Werte sind bei uns legitimer
  Inhalt (z. B. der EN-only-Bewertungshinweis, dessen DE-Pendant leer ist). Die Existenz jedes Keys
  garantieren der Buildzeit-Guard (`en.ts`) und die Audits G4/G5 — **nicht** Sveltias
  Pflichtfeld-Validierung. Der Generator setzt das automatisch; nie von Hand auf `required: true`.
- **i18n-Struktur:** Texte liegen in `src/i18n/strings.de.json` / `strings.en.json`; `de.ts`/`en.ts`
  sind dünne Wrapper mit unveränderter API. `en.ts` prüft die Struktur zur Buildzeit → fehlender/
  überzähliger EN-Key bricht den Build. `audit:seo` (Check **G4**) erzwingt DE↔EN-Parität.
