# CLAUDE.md — Immobilien Bot Homepage

Kontext & Regeln für Claude Code. Diese Datei ist die **zentrale Quelle der Wahrheit** für das Projekt.
Bei Änderungen an Tokens, Struktur oder Konventionen: hier mitpflegen. Gilt für alle, die am Repo arbeiten.

---

## Projekt

Statische Marketing-Website für die App **"Immobilien Bot"** (Wohnungssuche-App). Migration von
WordPress/Jupiter X auf eine reine Static-Site (kein CMS, kein Server).

**Ziel der Seite: App-Downloads** (iOS + Android). Kernnutzen der App: scannt rund um die Uhr
Deutschlands Immobilienportale und benachrichtigt Nutzer per Echtzeit-Push, sobald ein passendes
Angebot online geht — „bevor es andere tun".

- Markt: Deutschland
- Sprachen: **DE (Standard) + EN**
- Ansatz: **Mobile-first One-Pager** (die meisten Nutzer sind mobil), makellos auch auf Desktop
- Haltung: clean, minimalistisch, Flat, leichte Apple-Ästhetik. Keine überladenen Schatten oder
  unruhigen Backgrounds. Maximale Lesbarkeit, klare Hierarchie, Conversion-Fokus.

---

## Tech-Stack

- **Astro** — Static Site Generation, gibt reines HTML aus
- **Tailwind CSS** — über die offizielle Astro-Integration
- **TypeScript**
- **npm** als Paketmanager
- **Animation:** GSAP + ScrollTrigger (Scroll-Reveals) + Lenis (Smooth Scroll), gezielt als
  Astro-Islands / Client-Skripte nur wo nötig. GSAP ist kostenlos.
- **Bilder:** Astros `astro:assets` / `<Image>` für automatisches WebP/AVIF + responsive `srcset`
  + Lazy-Loading. Alle App-Screenshots laufen durch diese Pipeline.

### Befehle
- `npm run dev` — Dev-Server (http://localhost:4321)
- `npm run build` — Build nach `dist/`
- `npm run preview` — gebautes Ergebnis lokal ansehen

### Hosting / Deploy
- **Cloudflare Pages**, verbunden mit dem GitHub-Repo `Immobilienbot/Homepage`.
- Push auf `main` → automatischer Build (`npm run build`, Output `dist`) → Deploy.
  Jeder Branch bekommt eine eigene Preview-URL.
- Domain `immobilien-bot.de` zeigt später (beim Launch) per DNS auf Cloudflare; bis dahin auf der
  Cloudflare-Preview-URL arbeiten.

---

## Design-System (aus dem Corporate Design)

Das CD denkt **proportional**. In Tokens übersetzen und konsequent nutzen — das erzeugt die
Ordnung/Ruhe.

### Farben
| Token | Hex | Verwendung |
|---|---|---|
| yellow | `#fff03c` | Primär, Akzent, CTAs, Keyword-Highlights |
| black | `#3b3b3a` | Text, dunkle Sektionen |
| grey | `#eaebeb` | heller Standard-Hintergrund |
| white | `#f6f6f6` | Off-White |
| darkgrey | `#d9dada` | Trennflächen |
| grey-yellow | `#c0c0c1` | Sekundärakzent auf Gelb |
| grey-text | `#686868` | **funktionale Web-Erweiterung (barrierefreies Text-Grau), kein CD-Originalton** — kleine Sekundärtexte (Eyebrows/Labels) auf hellen Flächen; hellstes Grau mit Kontrast ≥ 4,6:1 auf `#f6f6f6` **und** `#eaebeb`. Nicht auf `black` ausweichen (Hierarchie erhalten). |

### Typografie
- **Roboto** (Google Font). Headlines: **Roboto Black**. Fließtext: **Roboto Regular**.
- Proportionale Skala aus dem CD (Headline = Anker):
  - SubHead ≈ **35 %** der Headline
  - Body ≈ **25 %** der Headline
- Zeilenabstände: Headline eng (~1,0–1,05), SubHead ~1,1, Body ~1,2.
- Fürs Web: responsive Skala mit `clamp()` (mobil → Desktop), Proportionen beibehalten.
- Wiederkehrendes Stilmittel: **gelber Marker-Highlight** auf einzelnen Keywords in Headlines.

### Spacing & Layout
- **8px-Grid** als Basis.
- Content-Inset („Einschub") ~100 px auf Desktop, mobil proportional kleiner.
- **Ein einheitlicher Sektions-Rhythmus:** überall derselbe vertikale Abstand zwischen den Blöcken
  (nicht pro Sektion frei wählen). Zentrales Ordnungsprinzip.
- Buttons: Pill-Form. Karten/Container: dezent abgerundet.

### CTA-Buttons & Keyword-Marker (verbindliche Standards)
- **CTA-Buttons: ausschließlich `PillButton`** (`src/components/ui/PillButton.astro`). Gelbe Pille
  ohne Kontur, dunkler Dot links; Hover (nur Desktop) lässt einen Füll-Kreis **aus dem Dot** wachsen
  (`#3b3b3a`, auf dunklen Sektionen `#f6f6f6`), invertiert den Text und **slidet das Icon** von links
  ein. Größen `sm`/`md`, Surfaces `light`/`dark`/`yellow`, Icons `bolt`/`arrow-down`/`arrow-right`/
  `check`. Label kommt als Slot. Rein CSS, nur `transform`/`opacity`; Touch = kein Hover, `:active`-
  Feedback; `prefers-reduced-motion` = harter Zustandswechsel ohne Bewegung. **Einzige Ausnahme:**
  offizielle Store-Badges (`StoreBadges.astro`). Keine eigenen Button-Styles mehr bauen.
- **Keyword-Marker: ausschließlich `.marker`** (global in `src/styles/global.css`), auf **gelben
  Flächen** die Variante `.marker--dark`. Feste Geometrie — **nie neu erfinden, nie abweichen:**
  `skewX(-8deg)`, `border-radius: .13em`, `padding: 0 .14em` (alle Maße in `em` → skaliert mit der
  Schrift). Markup: `.marker` › `.marker__bg` (aria-hidden) + `.marker__label`, sitzt IM `h1`/`h2`/`p`.
  Animierte Wipes fahren `.marker__bg` per GSAP herein (`scaleX 0→1`) und **führen `skewX:-8` in
  jedem `set`/`tween` mit**. Ohne JS / `prefers-reduced-motion` sofort voll sichtbar.
- **Nav-Links = „Marker-Nav"** (Header, `Header.astro`; CD S. 29 — der aktive Punkt trägt den
  Marker). Button-Typo: Roboto Black, `uppercase`, `.8rem`, Tracking `.05em`. Inaktiv `#666665`
  (≥ 4,5:1 auf `#f6f6f6` **und** `#eaebeb` — keine Opazität). Hover: dezenter grauer Marker-Wipe
  (`#d9dada`); aktiver Punkt (Scroll-Spy `.is-active`): **gelber Marker** (`#fff03c`) in
  Marker-Geometrie (`skewX(-8deg)`, `scaleX 0→1`). Rein CSS — kein GSAP für die Nav; Aktiv schlägt
  Hover (bleibt beim Hover gelb). Fokus: `:focus-visible`-Outline. `prefers-reduced-motion`: hart.

### Bot / Maskottchen
Bewusst **zurückhaltend**. Der Bot lebt im Logo; maximal eine kleine Signatur am Schluss
(„Das Original. Schneller als die anderen."). Wiedererkennung tragen v. a. **Farbe + Typo + echte
App-Screens**, nicht ein Cartoon. Nicht als durchgehender Erzähler verwenden.

---

## Awwwards Visual Language / Motion-System

Über dem Design-System liegt eine **Awwwards-taugliche Bewegungssprache**. Sie macht aus der
cleanen Flat-Basis ein preisverdächtiges, kinetisches Erlebnis — **ohne** die Ruhe, Lesbarkeit
und Conversion-Härte zu opfern. **Jede Sektion erbt diese Sprache** (gleiche Reveal-Muster,
gleiche Tiefe, gleicher Rhythmus), damit die Seite als *ein* durchkomponiertes Stück wirkt.

### Kinetische Typografie
- Headlines **riesig**, **Roboto Black**, **enges Tracking** und **enge Zeilenhöhe** (~0,9–0,95).
- **Mask-Reveal zeilenweise:** jede Zeile sitzt in einem `overflow:hidden`-Container und gleitet
  von unten herein (gestaffelt, `stagger`). Dramatischer Auftritt, aber schnell.
- **Animierter Marker:** der gelbe Keyword-Highlight wischt per `scaleX` (transform-origin links)
  hinter dem Wort herein, *nachdem* die Zeile steht. Der Marker ist der Signature-Move.

### Scroll-Choreografie
- **Lenis** (Smooth Scroll) + **GSAP ScrollTrigger** treiben die Sektions-Auftritte.
- **Parallax-Tiefe:** Vordergrund (Mockups, Karten) und Hintergrund (Glow, Deko) bewegen sich mit
  leicht **unterschiedlicher Geschwindigkeit** → räumliche Tiefe.
- **Stagger:** Elemente einer Sektion treten versetzt auf (nicht alles gleichzeitig).

### Geschmackvolle Tiefe (statt Flat-Langeweile)
- **Weiche, große Elevation:** großflächige Schatten mit **niedriger Opacity** (kein harter,
  kleiner Drop-Shadow). Ergibt „schwebende", edle Karten.
- **Leichter 3D-Tilt** auf Mockups/Key-Visuals — subtil, reagiert dezent auf **Maus** (Desktop)
  und **Scroll**. Nie kippelig.
- **Weiches gelbes Glow** hinter Phone-Mockups/Key-Visuals (großer, stark geblurter Gelb-Verlauf,
  niedrige Opacity) — hebt das Produkt aus dem Grau.
- **Optional:** sehr feine **Grain-Textur** als Overlay für analoge Wärme (nur wenn Performance
  es hergibt).

### Signature-Moments (wiederverwendbar)
Vier feste „Signature-Moments" tragen den Awwwards-Charakter durch die ganze Seite. Sie werden
**einmal global** gebaut und von späteren Sektionen wiederverwendet (nicht neu erfinden):

1. **Eigener Cursor (global, in `BaseLayout`).** Kreis-Umriss (~30 px) folgt dem Zeiger mit
   leichter Verzögerung (`gsap.quickTo`), dazu ein kleiner Punkt (~5 px) an der exakten Position.
   Über `a`, `button` und `[data-cursor]` wächst der Kreis (~1,8×) und füllt sich.
   `mix-blend-mode: difference` (lesbar auf Gelb **und** Schwarz). **Nur** bei `(pointer: fine)`:
   nativer Cursor aus, Custom an. Bei Touch **und** `prefers-reduced-motion`: nativer Cursor
   bleibt, kein Custom. Interaktive Elemente können per `[data-cursor]` opt-in andocken.
2. **Nav → Pille (Header).** `scrollY` < ~60 px: volle Breite, transparent, kein Rand/Schatten.
   Danach schrumpft die Nav weich zu einer **zentrierten, schwebenden Pille** (kleinere max-width,
   `rounded-full`, `offwhite/95` + backdrop-blur, weicher großer Schatten, leicht vom oberen Rand
   abgesetzt). Zitiert die **App-Bottom-Bar**. Logo, Links und „App laden"-CTA durchgehend nutzbar.
3. **Gelbes Glow / Aurora (hinter Key-Visuals).** Großer, stark geblurter **gelber Radial-Verlauf**
   mit niedriger Opacity hinter Phone-Mockups/Key-Visuals, langsam **„atmend"** (~10 s
   ease-in-out-Loop: leichtes translate + scale + Opacity). Nur Gelb, dezent. Parallaxt beim
   Scrollen **langsamer** als der Vordergrund (Tiefe). `prefers-reduced-motion`: statisch.
4. **Scroll-Text-Fill (Emphasis-Sektionen).** Großer Text (Roboto Black) startet **ausgegraut**
   und wird beim Scrollen **Wort für Wort** auf volle CD-Farbe „geflutet" (ScrollTrigger `scrub`).
   Emphasis-Wörter (z. B. Zahlen) leuchten **gelb** bzw. kräftig schwarz auf. Fallback: bei
   `prefers-reduced-motion`/ohne JS sofort in voller Farbe. Erstverwendung: Problem-Sektion.

### Farbwelt
Bleibt strikt **Gelb / Schwarz / Grau** (die CD-Tokens). Der „Awwwards-Look" kommt aus
**Bewegung, Typo-Drama und Tiefe** — **nicht** aus neuen Farben oder Verläufen in Fremdtönen.

### Schutzplanken (nicht verhandelbar)
- **CTA darf nie im Effekt untergehen** — Store-Buttons/Conversion-Elemente bleiben jederzeit
  klar sichtbar, lesbar und sofort klickbar. Effekte dienen der Führung zum CTA, nicht umgekehrt.
- **Mobile reduziert:** auf kleinen Screens weniger/kleinere Bewegung, kein Maus-Tilt,
  günstigere Effekte. Die Choreografie ist Desktop-first-Zugabe, kein Muss.
- **`prefers-reduced-motion`** strikt respektieren: Reveals/Loops/Tilt aus, Inhalte sofort im
  Endzustand sichtbar.
- **Lighthouse ~100** (mobil) bleibt Pflicht. Nur `transform`/`opacity` animieren, kein Layout-
  Thrash; Performance-Budget je Sektion. Im Zweifel: weniger Effekt.

### Verzögerte Init-Bündel (`requestIdleCallback`) — verbindliche Muster
Below-fold-Reveals werden aus Performance-Gründen erst nach dem First Paint in einem
`requestIdleCallback`-Bündel initialisiert (`src/scripts/animations.ts`). Das ist gefährlich:
der Callback kann feuern, während der Nutzer schon **mitten auf der Seite** steht (Scroll-
Restoration nach Reload, schnelles Scrollen im Idle-Fenster). Ein einmaliger ScrollTrigger
(`once`/`toggleActions:play`) feuert dann **nicht nachträglich** → der versteckte Startzustand
bliebe kleben = **leere Sektion**. Vier Regeln, nicht verhandelbar:
- **R1 — Fehler-Isolation:** Jeder Init im Bündel einzeln kapseln (`safeInit(name, fn)`,
  try/catch + `console.error`). Ein Wurf darf **nie** die nachfolgenden Inits mitreißen.
- **R2 — kein statisches Verstecken:** Reveal-Grundzustände **nur per JS** (`gsap.set`/`gsap.from`)
  unmittelbar vor dem Trigger setzen — **nie** per Stylesheet (`visibility:hidden`/`opacity:0` auf
  Reveal-Elementen). Ohne JS / reduced-motion muss alles im sichtbaren Endzustand stehen.
- **R3 — Late-Setup-Garde (Kern):** Vor dem Erstellen jedes Reveals prüfen, ob das Element beim
  (verzögerten) Setup schon an/über seiner Trigger-Startlinie liegt (`isPastRevealStart(el, startVh)`,
  `startVh` = Bruchteil aus dem `start`, z. B. `'top 85%'` → `0.85`). Wenn ja: **keine Auftritts-
  Animation, sofort Endzustand** (Trigger überspringen). Scroll-Restoration/Fast-Scroll dürfen nie
  leere Sektionen erzeugen — egal wann der Callback feuert.
- **R4 — Refresh:** Nach dem gebündelten Setup **einmal** `ScrollTrigger.refresh()` (die Triggers
  entstehen nach dem `load`-Auto-Refresh → sonst veraltete Start-/End-Marken).
- **Pflicht-Sichtprüfung:** Nach **jeder** Änderung an Init-Timing/-Reihenfolge (v. a. am Idle-
  Bündel) visuell prüfen — inklusive **Scroll-Restoration-Repro**: zu einer tiefen Sektion scrollen,
  **Hard Reload**, prüfen dass keine Sektion leer bleibt (DE **und** EN).

---

## Seitenstruktur

One-Pager (DE auf `/`, EN auf `/en/`), Sektionen in dieser Reihenfolge:

1. **Header** — sticky, minimal. Logo, Anchor-Nav (Der Bot · Features · Preise · FAQ), persistenter
   Store-CTA. Kein Blog.
2. **Hero** — siehe unten.
3. **Problem** — stärkster Aufhänger: **43.000 Bewerber · 30 Minuten · 288 Wohnungen**
   (Berliner Zeitung). Kurz, hart. [TODO: Quelle verlinken]
4. **Lösung (Bridge)** — IB dreht den Spieß um: überwacht 24/7 alle Portale, pingt zuerst.
5. **Features** — die 4 Säulen (siehe unten), scroll-animiert, je mit echtem Screenshot.
   Bento-Grid. Ersetzt eine geklickte Demo.
6. **Portale** — die überwachten Portale als **Text-Liste** (keine Logos, rechtliche Gründe).
   Anzahl wird aus `site.ts` abgeleitet (`portalCount`) und als **exakte Zahl** gezeigt (kein „über 10").
7. **Preise** — 3 Karten (siehe unten) + 4-Vorteile-Streifen. CTA-Fokus auf
   „7 Tage kostenlos testen – kein Risiko".
8. **Social Proof** — Bewertungszahlen + Testimonials. [TODO: Testimonials]
9. **FAQ** — Welche Portale? Kosten? Wie schnell? Seriös/legal? Kündbar? DE/EN? Dark Mode?
   Telegram? (Conversion + SEO)
10. **Kontakt** — kompakte Sektion unten.
11. **Finaler CTA** — „Deine nächste Wohnung wartet nicht." Store-Badges + **QR-Code (nur Desktop)**.
12. **Footer** — Impressum · Datenschutz · AGB · Kontakt · Sprachumschalter DE/EN · Store-Badges.
    Juris Bot-Seiten hier dezent verlinkbar.

### Hero
- **Ein** Phone-Mockup (frameless PNG in schlankem Geräterahmen), groß und sauber (mobil-optimiert).
- Als **einziger** Bewegungsmoment: eine **echte HTML-Notification-Karte**, die per GSAP
  hereingleitet (leicht federnd) — App-Icon, „Immobilien Bot", „Neues Angebot: 3-Zimmer in Berlin –
  gerade online". **Kein Lottie** (Text muss DE/EN-lokalisierbar, scharf, barrierefrei sein).
- Headline: „Finde deine Traumwohnung, bevor es andere tun." (CD-Zeile, Keywords mit gelbem Marker).
- Subline: 24/7-Scan + Echtzeit-Benachrichtigung.
- Store-Badges + Trust-Microline: „4,6★ App Store · 5.000+ Downloads".

---

## Feature-Architektur (die App-Features als 4 Säulen)

Nicht als flache Liste — als **Ablauf einer Wohnungssuche** gruppieren:

1. **Finden** — Suchbereich per Zeichnung oder Radius · mehrere Suchorte gleichzeitig ·
   Zimmer/Größe/Preis · erweiterte Kriterien (möbliert, WG-Zimmer, WBS, Tauschwohnung,
   Zwischen-/Untermiete, ohne IS24-Plus).
2. **Sofort benachrichtigt** — Echtzeit-Push in Sekunden · Telegram-Verknüpfung.
3. **Überblick behalten** — Favoriten · Filter (Alle / Ungesehen / Favs / Beworben) ·
   Aktionen (löschen, favorisieren, als beworben, teilen, Notizen) ·
   Listenansichten (klein/mittel/groß).
4. **Zuerst bewerben** — Bewerbungsschreiben hinterlegen → beim Antippen eines Angebots automatisch
   in die Zwischenablage.

**Extras** (schmaler Streifen, klein): DE/EN · Light- & Dark-Mode.

**Hero-Features** (groß rausgestellt, die echten Differenzierer):
20 Portale in einer App · Echtzeit-Push · Suchbereich auf der Karte zeichnen · Bewerbung-Auto-Copy.

---

## Produkt-Fakten  (Quelle: `src/data/site.ts`)

**Store-Links** (mit UTM/Tracking-Parametern — zentral hier pflegen; Platzierungs-Parameter wie
`ct` / `utm_content` pro CTA-Position anpassbar):
- iOS: `https://apps.apple.com/de/app/apple-store/id6741714480?pt=127566053&ct=Homepage_Top&mt=8`
- Android: `https://play.google.com/store/apps/details?id=immobilien.bot&hl=de&referrer=utm_source%3Dwebsite%26utm_medium%3Dbutton%26utm_campaign%3Dhomepage%26utm_content%3Dhome_top`

**Bewertungen:** App Store 4,6★ (85) · Play Store 4,2★ (48) · Google Maps 5,0★ (33) · 5.000+ Downloads

**Preise:**
- Gratis — „7 Tage kostenlos testen – kein Risiko" (0,00 €)
- 7 Tage — 2,99 €
- 1 Monat — 7,99 €
- Vorteile-Streifen: Echtzeit-Push (auch via Telegram) · Alle Portale in einer App ·
  Alle Features (Favoriten, Bewerbungsschreiben etc.) · Kein Risiko: jederzeit kündbar.

**Portale:** 20 Quellen (10 bundesweit + 10 regional). **Anzahl immer aus `site.ts` ableiten
(`portalCount`); sichtbare Formulierung = exakte Zahl, kein „über 10" mehr.** Struktur je Portal:
`{ name, domain, scope: 'national' | 'regional', region? }`. Abgeleitete Exports: `portalCount`,
`nationalPortals`, `regionalPortals`.
- **Bundesweit (10):** Immobilienscout24.de, Immobilien.de, Immowelt.de, Kleinanzeigen.de,
  LEG-wohnen.de, Ohne-Makler.net, Quoka.de, Vonovia.de, WG-Gesucht.de, Wohnungsboerse.net.
- **Regional (10):** Inberlinwohnen.de (Berlin), WBM.de (Berlin), Gesobau.de (Berlin),
  Howoge.de (Berlin), Gewobag.de (Berlin), Degewo.de (Berlin), Berlinovo.de (Berlin),
  GAG-koeln.de (Köln/NRW), ABG.de (Frankfurt/Hessen), NHW.de (Hessen).

Anzeige-Name (Domain-Schreibweise) sichtbar; volle Domain nur in `site.ts` (`Portal.domain`) für
strukturierte Daten/JSON-LD.

---

## Persistenter CTA & Store-Routing

- **Dauerhafter CTA** auf der ganzen Seite: mobil eine sticky Bottom-Bar mit Store-Badges
  (Daumenzone); Desktop kompakte Store-Buttons im sticky Header. Bar ausblenden, sobald der finale
  CTA im Viewport ist.
- Zusätzliche In-Flow-Buttons: Hero, Preise, finaler Abschluss.
- **QR-Codes** nur auf Desktop (am finalen CTA, optional bei Preisen). Klickbar → verlinken auf
  `/go/app`.
- **`/go/app`**: kleine Redirect-Seite, die per Client-Skript das Betriebssystem erkennt und auf den
  passenden Store weiterleitet (Handy-Scan wie PC-Klick landen im richtigen Store). Liest die
  Ziel-URLs zentral aus `site.ts`, damit UTM an einer Stelle steuerbar bleibt.

---

## Tracking & Consent

- **Google Tag Manager** (ein Container) verwaltet **Meta Pixel + GA4 + Google Ads**.
  [TODO: GTM-Container-ID]
- **Google Consent Mode v2** ist **Pflicht** (EU/DE). Default auf „denied"; Tags feuern erst nach
  Einwilligung.
- **Cookie-Banner:** CookieYes im `<head>` (Start: Free-Tier), mit Consent Mode v2 verknüpft.
  Meta-Pixel-Tag über eigenen Consent-Trigger im GTM gaten (Meta kennt Googles Consent Mode nicht
  nativ).
- **dataLayer-Events** für Store-Button-Klicks (als Conversions). Store-Klicks = zentrales
  Conversion-Event.

---

## SEO

- **`src/components/seo/SEO.astro`** — Props: `title`, `description`, `canonical`, `ogImage`,
  `noindex`. Rendert Title, Meta-Description, Canonical, OpenGraph, Twitter Card, robots, lang,
  Favicon-Set.
- **JSON-LD** (strukturierte Daten): `MobileApplication` / `SoftwareApplication` (mit Store-Links +
  `aggregateRating` aus den Bewertungszahlen), `Organization`, `WebSite`.
- **`@astrojs/sitemap`** (auto sitemap.xml) + `public/robots.txt`.
- **hreflang**: reziproke DE/EN-Verlinkung auf jeder Seite.

---

## KI-/Agent-Lesbarkeit

Die Seite muss nicht nur für Menschen und Suchmaschinen, sondern auch für **KI-Systeme/Agents**
(LLM-Crawler, Antwort-Engines, Assistenten) sauber lesbar sein — sie werden zunehmend zur
Entdeckungs- und Empfehlungsschicht.

- **Semantisches HTML:** echte Landmarks (`header`, `nav`, `main`, `section`, `footer`),
  `article`/`figure` wo passend. Keine „`div`-Suppe", Bewegung/Styling nie auf Kosten der Semantik.
- **Saubere Heading-Hierarchie:** genau **ein `h1`** pro Seite (Hero-Headline), danach lückenlos
  `h2`/`h3`. Reihenfolge = Bedeutung. Mask-Reveal-Wrapper dürfen die Heading-Struktur nicht
  zerreißen (Text bleibt im `h1`/`h2`, Animation nur auf inneren Spans).
- **Aussagekräftige Alt-Texte** für alle inhaltlichen Bilder (App-Screens beschreiben, was zu
  sehen ist) und **sprechende Link-Texte** (kein „hier klicken"); Store-Buttons benennen die
  Zielplattform.
- **Umfassendes JSON-LD:** `MobileApplication`/`SoftwareApplication` (Store-Links, Preise/`offers`,
  `aggregateRating`), `Organization`, `WebSite`, sowie wo sinnvoll `FAQPage` (aus der FAQ-Sektion)
  und `BreadcrumbList`. Strukturierte Fakten decken sich mit `src/data/site.ts`.
- **`public/llms.txt`:** kompakte, faktische Kurzbeschreibung der App für KI-Systeme (was sie tut,
  Kernfeatures, Preise, Store-Links, Sprachen) — Fakten aus `site.ts`, konsistent zu JSON-LD.
  Bei Faktenänderungen (`site.ts`) **mitpflegen**.

---

## Audit-System

Automatisches Qualitäts-Audit: **Lighthouse CI** (Performance/A11y/Best-Practices/SEO) +
**eigenes SEO/GEO-Skript** (`scripts/audit-seo.ts`, prüft das gebaute `dist/` statisch gegen die
Fakten aus `site.ts`). Läuft lokal per npm-Script und als **GitHub Action bei jedem Push/PR**.

- **`npm run audit`** (lokal) = `build` → `audit:seo` → `audit:lh`. **Pflicht**, wenn eine Sektion
  fertig gemeldet wird ODER etwas Performance-/SEO-Relevantes geändert wurde (Bilder, Fonts, neue
  Animationen, neue Seiten, Meta/JSON-LD/i18n-Fakten). **Nicht** bei jeder Mikro-Iteration.
  `npm run audit:seo` allein prüft nur das (bereits gebaute) `dist/` schnell.
- **Schwellen (nicht verhandelbar):** Performance **≥ 95**, Accessibility / Best Practices / SEO
  **= 100** (mobil, Lighthouse-Default-Emulation).
- **Lokal vs. CI — Rollenverteilung:**
  - **Lokal** läuft `audit:lh` (`scripts/audit-lh.ts`, Einzellauf je Seite): die **deterministischen
    Gates A11y/Best-Practices/SEO = 100 sind hart** (Exit 1). **Performance ist advisory** — nur eine
    WARN-Zeile bei < 95 (Einzellauf ist maschinenabhängig). Grund für das eigene Skript: `lhci autorun`
    scheitert auf dem Windows-Setup am chrome-launcher-EPERM (Temp-Cleanup) — `audit:lh` liest das von
    Lighthouse trotzdem geschriebene JSON und bleibt so lauffähig.
  - **CI** ist für **Performance maßgeblich:** die GitHub Action fährt weiter `lhci autorun`
    (Median aus 3 Läufen, alle 4 Schwellen **hart**; `lighthouserc.cjs`). Der CI-Workflow bleibt
    bewusst unverändert.
- **`audit:seo`-Errors werden wie Build-Fehler behandelt:** sofort fixen, nie ignorieren.
  **Warnings** (z. B. das bekannte `og:image`-TODO) gesammelt an Artem melden.
- Das SEO-Skript auditiert nur **indexierbare** Seiten (`noindex`-Rechts-/Redirect-Seiten und
  `dist/bot/**` werden übersprungen) und deckt u. a. ab: genau ein `h1`, Heading-Hierarchie,
  Title/Description, Canonical, hreflang (de/en/x-default, reziprok), OG/Twitter, `img alt`,
  JSON-LD-Validität + Pflichttypen, **Fakten-Sync** (Preise/Portale/Rating aus `site.ts` müssen
  im HTML + JSON-LD stehen), interne Links/Anker, GEO-Klartext ohne JS, sowie global
  `llms.txt` / `robots.txt` (AI-Crawler offen) / Sitemap.
- Die **GitHub Action** (`.github/workflows/audit.yml`) prüft dasselbe bei jedem Push — ein
  **Wächter**, der den Cloudflare-Deploy **nicht** blockiert (separate Pipeline), aber
  Performance-/SEO-/GEO-Regressionen sichtbar macht. `concurrency` bricht ältere Läufe ab.

---

## Recht (in DE Pflicht)

- **Impressum**, **Datenschutzerklärung**, **AGB** als eigene Seiten.
  [TODO: Inhalte von Artem/juristisch]. Primär DE; EN-Versionen optional.

---

## Konventionen & Regeln

- **Alle Texte** in i18n-Dateien (`src/i18n/de.ts` + `en.ts`), **nie** hart in Komponenten —
  hält DE/EN synchron.
- **Alle Produkt-Fakten** (Store-Links, Preise, Bewertungen, Portale) in `src/data/site.ts` —
  eine Quelle der Wahrheit.
- **Bilder** immer über `astro:assets` / `<Image>` (WebP/AVIF, responsive).
- **Keine Fake-Live-Zähler** und keine erfundenen Daten (z. B. „gerade X Angebote online").
  Eine gezeigte Push-Benachrichtigung ist ok (echte Funktion), erfundene Marktzahlen nicht.
- **Keine Portal-Logos** (rechtlich) — nur Text-Namen.
- **Mobile-first**; mobiler Lighthouse-Score ~100 halten (Animationen mit Performance-Budget).
- **`prefers-reduced-motion`** respektieren (Animationen reduzieren/abschalten).
- **Secrets:** GTM-ID darf ins Repo (öffentlich). Echte Keys/Tokens **nie** ins Repo — in
  Cloudflare-Environment-Variablen.
- **Static bleiben** (SSG); kein Server-Runtime nötig (client-seitiges JS für `/go/app` ist ok).
- **Auto-Commit & -Push:** Nach jeder abgeschlossenen Aufgabe und **erfolgreichem `npm run build`**
  alle Änderungen mit kurzer, beschreibender Commit-Message committen und auf `main` pushen
  (Cloudflare deployt automatisch). **Nur bei grünem Build pushen** — schlägt der Build fehl, erst
  fixen, dann committen.

---

## Nicht anfassen / Bereiche

- **`src/pages/bot/`** ist **Juris Bereich** (technische Bot-Landingpages mit eigenen Skripten).
  Nicht ändern, außer ausdrücklich beauftragt.
- Design-Tokens nicht ohne Update dieser Datei ändern.

---

## Offene TODOs (Assets/Infos von Artem)

- [ ] Frameless App-Screenshots (PNG) — je Säule + Hero
- [x] Portal-Liste (10, mit Domains) in `site.ts` gepflegt; Anzahl wird abgeleitet
- [x] Store-Badges DE + EN (`app-store-badge-{de,en}.svg` / `google-play-badge-{de,en}.svg`), sprachabhängig via `StoreBadges.astro`
- [ ] Berliner-Zeitung-Quelle (Link) zur 43.000 / 30-Min / 288-Statistik
- [ ] Testimonials (Text + Name/Stadt) für Social Proof
- [ ] App-Icon (für die Hero-Notification-Karte)
- [ ] GTM-Container-ID
- [ ] Inhalte der Rechtsseiten (Impressum/Datenschutz/AGB)
