/**
 * animations.ts — Smooth Scroll (Lenis) + Scroll-Reveals (GSAP/ScrollTrigger).
 *
 * Grundgerüst. Respektiert prefers-reduced-motion: bei „reduce" werden weder
 * Smooth Scroll noch Reveals aktiviert (Elemente bleiben sichtbar).
 * Performance-Budget beachten (CLAUDE.md) — Reveals bewusst dezent.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;

// Desktop/Mobile-Grenze = Hero-Breakpoint (md = 768px, siehe Hero.astro).
// Auf Mobile: nur EIN Phone (kein hinterer Fächer) und nur EINE Notification.
const isDesktopHero = window.matchMedia('(min-width: 768px)').matches;

// Late-Setup-Garde (siehe CLAUDE.md → „Verzögerte Init-Bündel"). Below-fold-Reveals
// werden im requestIdleCallback u. U. erst erstellt, während der Nutzer schon mitten
// auf der Seite steht (Scroll-Restoration nach Reload, schnelles Scrollen im Idle-
// Fenster). Ein einmaliger ScrollTrigger (`once`/`toggleActions:play`) feuert dann
// NICHT nachträglich für bereits ein-/durchgescrollte Elemente → der versteckte
// Startzustand (opacity/clip) bliebe kleben = leere Sektion. Diese Garde meldet, ob
// das Element beim Setup bereits an oder über seiner Trigger-Startlinie liegt; wenn
// ja, überspringt der Aufrufer die Auftritts-Animation und lässt das Element sofort
// im (sichtbaren) Endzustand. `startVh` = der Bruchteil der Viewport-Höhe aus dem
// jeweiligen ScrollTrigger-`start` (z. B. 'top 85%' → 0.85).
function isPastRevealStart(el: HTMLElement, startVh: number): boolean {
  return el.getBoundingClientRect().top < window.innerHeight * startVh;
}

function initSmoothScroll() {
  const lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
  });

  // Lenis <-> ScrollTrigger synchronisieren
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time: number) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/**
 * In-Page-Anker (#…) sanft per Lenis scrollen (z. B. „Kostenlos testen" →
 * #preise). Existiert das Ziel nicht auf dieser Seite (Cross-Page), bleibt die
 * native Navigation erhalten. Offset für die sticky Nav-Pille.
 */
function initAnchorScroll(lenis: Lenis) {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const hashIdx = href.indexOf('#');
    if (hashIdx < 0) return;
    const id = href.slice(hashIdx + 1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return; // Ziel nicht hier → normale Navigation zulassen
    e.preventDefault();
    lenis.scrollTo(target, { offset: -84 });
    history.pushState(null, '', href);
  });
}

/**
 * Kinetische Headline-Enthüllung: Zeilen-Mask-Reveal + animierter Marker,
 * danach gestaffelt Subline, CTA und Trust-Microline.
 *
 * WICHTIG (CLAUDE.md-Schutzplanke / Headline-Bug-Fix): KEIN CSS-Vorverstecken.
 * Alles wird rein additiv per gsap.from() enthüllt — die Funktionen setzen den
 * Startzustand selbst und animieren zum natürlichen, sichtbaren Endzustand.
 * Läuft dieses Skript nicht (Fehler/kein JS), steht die gesamte Hero-Kopie
 * sofort vollständig da.
 */
function initHeroReveal() {
  const hero = document.querySelector('#hero');
  if (!hero) return;

  const lines = gsap.utils.toArray<HTMLElement>('#hero .line-inner');
  const marks = gsap.utils.toArray<HTMLElement>('#hero .marker__bg');
  const fades = gsap.utils.toArray<HTMLElement>(
    '#hero [data-hero-sub], #hero [data-hero-trust]',
  );
  const cta = hero.querySelector<HTMLElement>('[data-hero-cta]');

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // a) Headline: Zeilen gleiten von unten aus der Maske herein.
  if (lines.length) {
    tl.from(lines, { yPercent: 110, duration: 0.9, stagger: 0.12 }, 0);
  }
  // Marker wischt hinter dem Keyword herein, nachdem die Zeile steht.
  if (marks.length) {
    tl.from(
      marks,
      // skewX:-8 mitführen — GSAP überschreibt transform komplett; sonst ginge der
      // CSS-Default skewX(-8deg) beim Wipe verloren. transformOrigin links = Wisch von links.
      { scaleX: 0, skewX: -8, transformOrigin: 'left center', duration: 0.5, ease: 'power2.out', stagger: 0.12 },
      0.35,
    );
  }
  // Subline + Trust-Microline gestaffelt.
  if (fades.length) {
    tl.from(fades, { autoAlpha: 0, y: 18, duration: 0.6, stagger: 0.12 }, 0.5);
  }
  // CTA (Store-Badges) — nie im Effekt untergehen: additiv, kurzer Versatz.
  if (cta) {
    tl.from(cta, { autoAlpha: 0, y: 18, duration: 0.6 }, 0.55);
  }
}

/**
 * Phone-Cluster-Einblendung (Choreografie):
 *   a) Haupt-Phone (Mitte) ploppt zuerst sanft rein (Fade + Scale).
 *   b) DANACH fahren die beiden hinteren Phones AUFRECHT (keine Rotation)
 *      seitlich hinter dem Front-Phone hervor (Peek, gestaffelt).
 * Rein additiv (gsap.from/fromTo): ohne JS steht alles sofort in Ruhelage.
 * Die Ruhelage der hinteren Phones steht auch in Hero.astro-CSS (Fallback);
 * die Werte hier MÜSSEN dazu passen.
 */
const FAN_REST = {
  // Exakt spiegelgleich (nur Vorzeichen von xPercent unterschiedlich): identischer
  // vertikaler Versatz, identische Skalierung. transform-origin OBEN (siehe Tween)
  // + POSITIVER yPercent → hintere Phones sitzen tiefer; Oberkanten unter der Notch.
  // Größerer Außen-Versatz (±44) → mehr Fläche sichtbar UND klarer Spalt zwischen
  // den hinteren Phones. yPercent +12 (statt 16) hält die Unterkanten INNERHALB des
  // Front-Phones (bottom ≈ 98 %) → keine überstehenden/gekreuzten Rahmen unten.
  // MUSS exakt zur CSS-Ruhelage in Hero.astro passen.
  left: { xPercent: -44, yPercent: 12, scale: 0.86 },
  right: { xPercent: 44, yPercent: 12, scale: 0.86 },
} as const;

// Gesamt-Start der Phone-Cluster-/Notification-Sequenz nach hinten schieben
// (kurze Ruhe am Anfang). Reihenfolge/Dauern/Easings bleiben unverändert; NUR
// der Cluster + Notifications — die Headline/Text-Reveal ist davon unberührt.
const HERO_START_DELAY = 0.5;

function initPhoneCluster() {
  const backs = gsap.utils.toArray<HTMLElement>('#hero [data-phone-back]');

  // a) Front-Phone = LCP-Element (größtes Bild, loading=eager + fetchpriority=high).
  //    Es wird BEWUSST NICHT mehr per gsap.from(autoAlpha:0) versteckt: das hielt
  //    den Contentful Paint bis zum JS-Lauf zurück und schob den LCP ~1 s über den
  //    FCP (Lighthouse: LCP-Render-Delay). Es bleibt ab dem First Paint sichtbar;
  //    die Auftritts-Choreografie spielt UM den Anker herum (Notifications, Glow,
  //    hintere Phones) — der Look bleibt erhalten.

  // NUR Desktop: mobil sind die hinteren Phones ausgeblendet (hidden md:block).
  if (!isDesktopHero) return;

  // Reveal-Reihenfolge: 1) mittleres Phone (oben) → 2) gelber Glow dahinter →
  //    3) die zwei seitlichen Phones. b) Der Glow fadet NACH dem Haupt-Phone ein
  //    (Endzustand = CSS-Ruhe-Opacity, additiv via gsap.from → kein CLS).
  const glow = document.querySelector<HTMLElement>('#hero .phone-glow');
  if (glow) {
    gsap.from(glow, {
      autoAlpha: 0,
      duration: 0.6,
      ease: 'power3.out',
      delay: HERO_START_DELAY + 0.55, // nach dem mittleren Phone
    });
  }

  // c) DANACH (nach dem Glow) die hinteren Phones aufrecht seitlich hervorfahren
  //    (gestaffelt). Start = deckungsgleich hinter dem Front-Phone (xPercent 0),
  //    aufrecht. transform-origin OBEN (50% 0%) → beim Skalieren bleibt die Oberkante
  //    verankert; mit positivem yPercent liegen die Oberkanten unter der Notch.
  //    Muss zur Hero.astro-CSS passen. x:0/y:0 neutralisieren geerbten px-Versatz.
  backs.forEach((el, i) => {
    const rest = FAN_REST[el.dataset.fan as keyof typeof FAN_REST];
    if (!rest) return;
    gsap.fromTo(
      el,
      { x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, autoAlpha: 0, transformOrigin: '50% 0%' },
      {
        xPercent: rest.xPercent,
        yPercent: rest.yPercent,
        scale: rest.scale,
        autoAlpha: 1,
        transformOrigin: '50% 0%',
        duration: 0.8,
        ease: 'power3.out',
        delay: HERO_START_DELAY + 1.1 + i * 0.15, // nach dem Glow, gestaffelt
      },
    );
  });
}

/**
 * Notification-Stapel oben am Front-Phone: die Karten sitzen in festen Slots
 * (flex column, kein Reflow) und poppen per Endlosschleife NACHEINANDER herein,
 * stapeln sich untereinander, halten kurz und faden dann GEMEINSAM weg.
 * Start bewusst verzögert (nach Headline + Fächer), damit es nicht unruhig wird.
 * Nur transform/opacity.
 */
function initHeroNotifications() {
  const cards = gsap.utils.toArray<HTMLElement>('#hero [data-notif]');
  if (!cards.length) return;

  // Mobile: nur EINE Karte, einmal dezent von oben herein (federnd) — bleibt
  // danach sichtbar (Endzustand). Kein Dauer-Loop (Performance/Ruhe). Additiv:
  // ohne JS/reduced-motion steht die Karte per CSS bereits im Endzustand.
  if (!isDesktopHero) {
    gsap.from(cards[0], {
      autoAlpha: 0,
      yPercent: -45,
      duration: 0.7,
      ease: 'back.out(1.4)',
      delay: HERO_START_DELAY + 0.6,
    });
    return;
  }

  // Start nach Haupt-Phone (a) + hinteren Phones (b), damit es nicht unruhig wird.
  // Um HERO_START_DELAY mitverschoben (gleiche Ruhe am Anfang wie der Cluster).
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 1.8 + HERO_START_DELAY });

  // Zyklusstart: Stapel leeren.
  tl.set(cards, { autoAlpha: 0, y: -14, scale: 0.96 });
  // Karten nacheinander in ihren Slot ploppen.
  tl.to(
    cards,
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: 'back.out(1.5)',
      stagger: 0.55,
    },
    0.1,
  );
  // Kurz halten, dann gemeinsam wegfaden.
  tl.to(cards, { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, '+=2.4');
}

/**
 * Sehr dezente Scroll-Parallax des GESAMTEN Clusters (nur translateY + minimale
 * Skalierung) auf der äußeren Choreo-Ebene. KEIN Idle-Float und KEIN Maus-Tilt
 * mehr — die Phones bleiben ruhig; Bewegung kommt nur aus Fächer-Einblendung,
 * Notification-Schleife und dieser leichten Parallax. Nur Desktop, nur transform.
 */
function initHeroChoreography() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const choreo = document.querySelector<HTMLElement>('#hero [data-phone-choreo]');
  if (!choreo) return;

  gsap.fromTo(
    choreo,
    { yPercent: 0, scale: 1 },
    {
      yPercent: -4,
      scale: 0.99,
      ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
    },
  );
}

/**
 * Canvas-KONSTELLATION im Hero-Hintergrund: ~70–110 Partikel driften langsam und
 * prallen an den Rändern ab; nahe Partikel (< LINK_DIST) werden mit dünnen Linien
 * verbunden (Deckkraft nach Distanz abnehmend). Partikel & Linien in Dunkelgrau
 * (#3b3b3a, niedrige Deckkraft) — gut sichtbar auf hellem Grau; nur ~13 % der
 * Partikel in Gelb als Akzent. In Cursor-Nähe verbinden sich Partikel mit GELBEN
 * Linien zum Mauszeiger und werden dezent angezogen.
 *
 * Bewusste Ausnahme von „nur transform/opacity" (CLAUDE.md): Canvas statt Hunderter
 * DOM-Elemente = performant. Eine rAF-Schleife, IntersectionObserver-gated (pausiert
 * wenn der Hero nicht im Bild ist), DPR-aware. NUR Desktop (pointer:fine); Mobile &
 * reduced-motion rufen die Funktion gar nicht erst auf.
 */
function initHeroCanvas() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const canvas = document.querySelector<HTMLCanvasElement>('#hero [data-hero-canvas]');
  const hero = document.querySelector<HTMLElement>('#hero');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const DARK = '59,59,58'; // #3b3b3a als rgb-Tripel (für rgba-Linien)
  const YELLOW = '#fff03c';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const LINK_DIST = 115; // px: Verbindungslinien zwischen nahen Partikeln
  const LINK_SQ = LINK_DIST * LINK_DIST;
  const CURSOR_DIST = 160; // px: gelbe Linien + Anziehung zum Cursor
  const CURSOR_SQ = CURSOR_DIST * CURSOR_DIST;
  const NAME_DIST = 180; // px: Städtenamen erscheinen nur nahe am Cursor
  const NAME_SQ = NAME_DIST * NAME_DIST;

  // Jedes Partikel trägt einen Städtenamen → das Netz wirkt wie eine „gescannte"
  // Deutschlandkarte; die Namen tauchen nur unter dem Cursor auf (Map-Labels).
  const CITIES = [
    'Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart',
    'Düsseldorf', 'Leipzig', 'Dresden', 'Hannover', 'Nürnberg', 'Bremen',
    'Essen', 'Dortmund', 'Bonn',
  ];

  type P = {
    x: number; y: number;
    vx: number; vy: number;
    r: number; a: number; // Radius, Alpha
    yellow: boolean;
    city: string;
  };
  let parts: P[] = [];
  let W = 0;
  let H = 0;

  function build() {
    W = hero.clientWidth;
    H = hero.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // in CSS-px zeichnen
    // Dichte an die Hero-Fläche angepasst; Ziel ~70–110.
    const count = Math.max(70, Math.min(110, Math.round((W * H) / 16000)));
    parts = [];
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 0.12 + Math.random() * 0.28; // langsame Drift
      const yellow = Math.random() < 0.13; // ~13 % Gelb-Akzent
      parts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        r: 2 + Math.random() * 1.8, // etwas größer als zuvor
        a: yellow ? 0.85 : 0.5 + Math.random() * 0.15,
        yellow,
        city: CITIES[Math.floor(Math.random() * CITIES.length)],
      });
    }
  }
  build();

  let mx = -1;
  let my = -1;
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
  }, { passive: true });
  hero.addEventListener('mouseleave', () => { mx = -1; my = -1; });
  window.addEventListener('resize', build);

  let running = false;
  const io = new IntersectionObserver((entries) => {
    const vis = entries[0]?.isIntersecting ?? false;
    if (vis && !running) { running = true; requestAnimationFrame(tick); }
    if (!vis) running = false;
  });
  io.observe(hero);

  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);

    // 1) Bewegung: Drift + Rand-Abprall + dezente Cursor-Anziehung.
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x <= 0) { p.x = 0; p.vx = -p.vx; }
      else if (p.x >= W) { p.x = W; p.vx = -p.vx; }
      if (p.y <= 0) { p.y = 0; p.vy = -p.vy; }
      else if (p.y >= H) { p.y = H; p.vy = -p.vy; }
      if (mx >= 0) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dsq = dx * dx + dy * dy;
        if (dsq < CURSOR_SQ && dsq > 0.01) {
          const d = Math.sqrt(dsq);
          const pull = (1 - d / CURSOR_DIST) * 0.03; // sanft, positional
          p.x += dx * pull;
          p.y += dy * pull;
        }
      }
    }

    // 2) Verbindungslinien zwischen nahen Partikeln (dunkel, Distanz-Fade).
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgb(${DARK})`;
    for (let i = 0; i < parts.length; i++) {
      const a = parts[i];
      for (let j = i + 1; j < parts.length; j++) {
        const b = parts[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dsq = dx * dx + dy * dy;
        if (dsq < LINK_SQ) {
          const d = Math.sqrt(dsq);
          ctx.globalAlpha = (1 - d / LINK_DIST) * 0.22;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // 3) Gelbe Linien zum Cursor (nahe Partikel).
    if (mx >= 0) {
      ctx.strokeStyle = YELLOW;
      for (const p of parts) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dsq = dx * dx + dy * dy;
        if (dsq < CURSOR_SQ) {
          const d = Math.sqrt(dsq);
          ctx.globalAlpha = (1 - d / CURSOR_DIST) * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
      }
    }

    // 4) Partikel zeichnen (Dunkelgrau bzw. Gelb-Akzent).
    for (const p of parts) {
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.yellow ? YELLOW : `rgb(${DARK})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5) Städtenamen NUR nahe am Cursor (Map-Labels), sehr schwach, Distanz-Fade.
    if (mx >= 0) {
      ctx.fillStyle = `rgb(${DARK})`;
      ctx.font = '600 11px Roboto, ui-sans-serif, system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      for (const p of parts) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dsq = dx * dx + dy * dy;
        if (dsq < NAME_SQ) {
          const d = Math.sqrt(dsq);
          ctx.globalAlpha = (1 - d / NAME_DIST) * 0.45;
          ctx.fillText(p.city, p.x + p.r + 5, p.y);
        }
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
}

/**
 * Eigener Cursor (Signature-Moment) — nur bei pointer:fine.
 *  - Ruhezustand: dünne Kontur (#3b3b3a) folgt leicht verzögert (quickTo 0.15s),
 *    dunkler Punkt (#3b3b3a) exakt.
 *  - Über a/button/[data-cursor]: durchsichtige Invert-Lupe (~2×, backdrop-filter
 *    invert+grayscale, ohne Füllung/Rand/Punkt).
 *  - Über [data-cursor-label] (Store-Badges): Invert-Lupe UND zusätzlich das
 *    mitlaufende gelbe Pill-Label — GLEICHZEITIG.
 * Übergänge per GSAP. KEIN mix-blend.
 */
function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const ring = document.querySelector<HTMLElement>('[data-cursor-ring]');
  const dot = document.querySelector<HTMLElement>('[data-cursor-dot]');
  const label = document.querySelector<HTMLElement>('[data-cursor-label-el]');
  if (!ring || !dot) return;

  document.documentElement.classList.add('has-custom-cursor');
  gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });
  if (label) gsap.set(label, { xPercent: -50, yPercent: -50 });

  // Ring: leichte, direkte Verzögerung. Punkt: quasi exakt. Label folgt wie der Ring.
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.15, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.15, ease: 'power3' });
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.05, ease: 'power2' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.05, ease: 'power2' });
  const labelX = label ? gsap.quickTo(label, 'x', { duration: 0.15, ease: 'power3' }) : null;
  const labelY = label ? gsap.quickTo(label, 'y', { duration: 0.15, ease: 'power3' }) : null;

  window.addEventListener(
    'mousemove',
    (e) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      if (labelX && labelY) {
        labelX(e.clientX);
        labelY(e.clientY + 24); // Pille knapp unter dem Zeiger
      }
    },
    { passive: true },
  );

  const LENS = 'invert(1) grayscale(1)';
  const setFilter = (v: string) => {
    ring.style.backdropFilter = v;
    (ring.style as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter = v;
  };

  let hovering: Element | null = null;

  // Lupe für ALLE interaktiven Elemente; das gelbe Label zusätzlich, wenn das
  // Element ein data-cursor-label trägt (Store-Badges). Beide gleichzeitig aktiv.
  const setState = (interactive: boolean, labelText: string | null) => {
    if (interactive) {
      setFilter(LENS);
      gsap.to(ring, { autoAlpha: 1, scale: 2, borderColor: 'rgba(59,59,58,0)', backgroundColor: 'rgba(59,59,58,0)', duration: 0.25, ease: 'power3', overwrite: 'auto' });
      gsap.to(dot, { autoAlpha: 0, duration: 0.15, overwrite: 'auto' });
    } else {
      gsap.to(ring, {
        autoAlpha: 1, scale: 1, borderColor: 'rgba(59,59,58,1)', duration: 0.25, ease: 'power3', overwrite: 'auto',
        onComplete: () => { if (!hovering) setFilter('none'); }, // Lupe nach Ausklang entfernen
      });
      gsap.to(dot, { autoAlpha: 1, duration: 0.25, overwrite: 'auto' });
    }
    if (label) {
      if (labelText != null) {
        label.textContent = labelText;
        gsap.fromTo(label, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power3', overwrite: 'auto' });
      } else {
        gsap.to(label, { autoAlpha: 0, scale: 0.85, duration: 0.15, overwrite: 'auto' });
      }
    }
  };

  const selLabel = '[data-cursor-label]';
  const selLens = 'a, button, [data-cursor], input, textarea, select, label, summary';
  const selAll = `${selLabel}, ${selLens}`;

  document.addEventListener('mouseover', (e) => {
    const el = (e.target as Element).closest?.(selAll);
    if (!el || el === hovering) return;
    hovering = el;
    const labelText = el.closest(selLabel)?.getAttribute('data-cursor-label') ?? null;
    setState(true, labelText);
  });
  document.addEventListener('mouseout', (e) => {
    const el = (e.target as Element).closest?.(selAll);
    if (!el || el !== hovering) return;
    const related = (e as MouseEvent).relatedTarget as Node | null;
    if (related && el.contains(related)) return; // noch im selben Element
    hovering = null;
    setState(false, null);
  });

  // Invert-Zustand in der dunklen Problem-Sektion (3c): Ring + Punkt auf Off-White,
  // damit der Cursor auf dunklem BG nicht untergeht (CSS: html.cursor-invert).
  // pointerenter/leave bubbeln nicht → sauberer Wechsel an der Sektionsgrenze.
  const darkSection = document.querySelector<HTMLElement>('.problem3c');
  if (darkSection) {
    darkSection.addEventListener('pointerenter', () =>
      document.documentElement.classList.add('cursor-invert'),
    );
    darkSection.addEventListener('pointerleave', () =>
      document.documentElement.classList.remove('cursor-invert'),
    );
  }
}

/**
 * Scroll-Cue unter dem Hero („Maus"): fadet beim ersten Wegscrollen weich aus,
 * damit er nicht stört. Nur Opacity (scrub). CSS-Loop (Punkt) läuft separat.
 */
function initHeroScrollCue() {
  const cue = document.querySelector<HTMLElement>('#hero [data-hero-cue]');
  if (!cue) return;
  gsap.to(cue, {
    autoAlpha: 0,
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '30% top', scrub: true },
  });
}

/**
 * Problem „3c": Der Hero→Problem-Übergang + die Partikel-„43.000".
 *
 * ÜBERGANG (triggered, EINMAL, kein Scrub/Reverse) — UNVERÄNDERT:
 *  - Ruhezustand: solide hellgraue Fläche (.section-wipe, #eaebeb) deckt die dunkle
 *    Sektion lückenlos ab (nahtlos zum Hero). Bei Eintritt wischt sie per Clip-Path weg.
 *  - Danach faden die Partikel EIN und formen sich WEICH (ruhiges power3.out, dezenter
 *    Stagger, Startlage NAH am Ziel) zur „43.000" — kein Gewusel, kein Poppen.
 *
 * Maus-Lupe (Desktop): Render = Basis (gehomt) + Repel-OFFSET. Der Offset verschiebt NUR
 * die gezeichnete Position, nicht die Basis → große, satte Wölbung, springt beim Verlassen
 * sofort zurück. Das gelbe „du"-Partikel wird NICHT verschoben (stabiler Anker).
 *
 * du-Punkt: das der optischen Zahl-MITTE nächste Sample → runder GELBER Kreis (Glow) OBEN-
 * AUF (grau-freie Zone drumherum) + „du"-Label knapp darüber. Zeichenreihenfolge: grau →
 * gelber Punkt → Label.
 *
 * FONT-GATE beibehalten. reduced-motion / ohne JS: KEINE Fläche, KEIN Effekt — statische
 * „43.000" (DOM) auf dunklem BG + alles sofort sichtbar. DPR ≤ 2. Vom Hero-Canvas entkoppelt.
 */
async function initProblem3c() {
  const section = document.querySelector<HTMLElement>('#problem.problem3c');
  const stage = document.querySelector<HTMLElement>('[data-p3-stage]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-p3-canvas]');
  const numEl = document.querySelector<HTMLElement>('[data-p3-num]');
  const wipe = document.querySelector<HTMLElement>('[data-p3-wipe]');
  if (!section || !stage || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // Late-Setup-Garde (Formungs-Trigger 'top 65%'): liegt die Sektion beim Setup schon
  // an/über der Startlinie, feuert der Trigger nicht mehr → Headline/Statistik blieben
  // per gsap.set(autoAlpha:0) versteckt. Dann gar nicht erst verstecken/formen: das
  // statische Fallback (sichtbare DOM-„43.000" + Headline) steht wie bei reduced-motion.
  if (isPastRevealStart(section, 0.65)) return;

  const fine = window.matchMedia('(pointer: fine)').matches;
  const YELLOW = '#fff03c';
  const NUM_RGB = [220, 221, 220]; // Zahl-Partikelfarbe (hell, lesbar auf Dunkel)
  const duLabel = section.querySelector('.marker__label')?.textContent?.trim() || 'du';

  // ---- Justierbare Konstanten ----
  const WIPE_DUR = 0.7; // Wisch-Dauer (s) — NICHT anfassen
  const DUR = 950; // Formung: Tween-Dauer je Partikel (ms) — ruhig
  const MAXDELAY = 350; // Formung: dezenter Per-Partikel-Stagger (ms)
  const FADE = 0.55; // Anteil des Tweens, über den ein Partikel einfadet
  // Maus-Lupe — GEKOPPELTES Modell: Repel UND Homing wirken auf die ECHTE Position
  // (p.x/p.y). Nahe dem Cursor akkumuliert der Repel → Partikel „schweben davon";
  // das Homing zieht sie langsam-elastisch zurück. Clamp hält die Zahl stabil.
  // Gleichgewicht ≈ FORCE/HOME ≈ 120px, per MAXDISP auf 200 gedeckelt.
  const HOME = 0.075; // elastische Rückkehr-Rate pro Frame
  const REPEL_R = 140; // Radius (px)
  const REPEL_FORCE = 9; // per-Frame-Kraft
  const MAXDISP = 200; // max. Auslenkung von der Zielposition (Stabilitäts-Clamp)
  const CLEAR_R = 20; // grau-freie Zone um den gelben Punkt (px)
  const CLEAR_R2 = CLEAR_R * CLEAR_R;

  // Headline-Gruppe (inkl. Statistik-Satz) initial verbergen — NUR JS-Zugabe.
  const reveals = gsap.utils.toArray<HTMLElement>('#problem [data-p3-reveal]');
  if (reveals.length) gsap.set(reveals, { autoAlpha: 0, y: 22 });
  let revealed = false;
  const doReveal = () => {
    if (revealed) return;
    revealed = true;
    if (reveals.length) {
      gsap.to(reveals, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08 });
    }
  };

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  type P = {
    sx: number; sy: number; // Startlage (nah am Ziel)
    tx: number; ty: number; // Ziel (Zahl-Pixel)
    x: number; y: number; // ECHTE aktuelle Position (Formung + Homing + Repel wirken hier)
    delay: number;
    t: number; // Tween-Fortschritt 0..1
    du: boolean;
  };
  let parts: P[] = [];
  let duPart: P | null = null;
  let W = 0;
  let H = 0;
  let pSize = 3;
  let duMax = 8;
  let labelPx = 15;
  let started = false;
  let startT = 0;
  let duLandT = 0;

  // Ruhiges, weiches Ease (power3.out) — KEIN elastisches Überschwingen (wirkt hektisch).
  const easeSoft = (t: number) => 1 - Math.pow(1 - t, 3);

  // FONT-GATE (beibehalten): erst nach dem Laden der Schrift sampeln.
  try {
    await (document.fonts?.load('900 300px Roboto') ?? Promise.resolve());
  } catch {
    /* Font-API nicht verfügbar → best effort */
  }

  const setup = () => {
    W = section.clientWidth;
    H = section.clientHeight;
    if (!W || !H) return;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Zahl-Font aus der SEKTIONSBREITE: „43.000" ~66% breit (dominant, mit Luft).
    const measurer = document.createElement('canvas').getContext('2d');
    if (!measurer) return;
    measurer.font = '900 100px Roboto';
    const w100 = measurer.measureText('43.000').width || 314;
    const targetW = W * 0.66;
    let fontPx = Math.round((100 * targetW) / w100);
    fontPx = Math.max(48, Math.min(fontPx, Math.round(window.innerHeight * 0.34)));
    const numW = (measurer.measureText('43.000').width / 100) * fontPx;

    if (!(window as unknown as { __p3logged?: boolean }).__p3logged) {
      (window as unknown as { __p3logged?: boolean }).__p3logged = true;
      // eslint-disable-next-line no-console
      console.info(
        `[3c] Sektion ${Math.round(W)}px · Font ${fontPx}px · Zahlbreite ${Math.round(numW)}px (${Math.round((numW / W) * 100)}% der Sektion)`,
      );
    }

    const ow = W;
    const oh = Math.round(fontPx * 1.05);

    // Stage-Höhe = Zahlhöhe → der Statistik-Satz sitzt ENG darunter. Danach messen.
    stage.style.height = oh + 'px';
    const secR = section.getBoundingClientRect();
    const stR = stage.getBoundingClientRect();
    const offX = 0;
    const offY = stR.top - secR.top; // Canvas-Y der Zahl-Oberkante

    // Offscreen: „43.000" zeichnen + Alpha-Pixel abtasten.
    const off = document.createElement('canvas');
    off.width = ow;
    off.height = oh;
    const octx = off.getContext('2d');
    if (!octx) return;
    octx.fillStyle = '#fff';
    octx.font = `900 ${fontPx}px Roboto`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText('43.000', ow / 2, oh / 2);
    const data = octx.getImageData(0, 0, ow, oh).data;

    const CAP = fine ? 2800 : 1300;
    let step = fine ? 4 : 5;
    let nums: Array<{ x: number; y: number }> = [];
    for (let iter = 0; iter < 10; iter++) {
      nums = [];
      for (let y = 0; y < oh; y += step) {
        for (let x = 0; x < ow; x += step) {
          if (data[(y * ow + x) * 4 + 3] > 128) nums.push({ x: x + offX, y: y + offY });
        }
      }
      if (nums.length <= CAP) break;
      step += 1;
    }
    const M = nums.length;
    if (!M) {
      if (numEl) numEl.style.opacity = '';
      return;
    }

    pSize = Math.max(2, fontPx / 110);
    duMax = pSize * 2.4; // etwas größer als ein graues Partikel (nicht riesig)
    labelPx = Math.max(13, Math.round(fontPx * 0.055));

    // du-Partikel: das der OPTISCHEN MITTE der Zahl (an die tatsächliche Render-Position
    // gekoppelt: W/2, offY + oh/2) nächste Sample → sitzt gut sichtbar in den Ziffern.
    let duIdx = 0;
    let duBd = Infinity;
    const tcx = W / 2;
    const tcy = offY + oh * 0.5;
    for (let i = 0; i < M; i++) {
      const d = (nums[i].x - tcx) * (nums[i].x - tcx) + (nums[i].y - tcy) * (nums[i].y - tcy);
      if (d < duBd) {
        duBd = d;
        duIdx = i;
      }
    }

    // Startlage NAH am Ziel (kleiner Offset) → sanftes Settle statt Screen-Gewusel.
    const spread = fontPx * 0.4;
    const next: P[] = [];
    for (let i = 0; i < M; i++) {
      const tx = nums[i].x;
      const ty = nums[i].y;
      const sx = tx + (Math.random() - 0.5) * spread;
      const sy = ty + (Math.random() - 0.5) * spread;
      next.push({ sx, sy, tx, ty, x: sx, y: sy, delay: Math.random() * MAXDELAY, t: 0, du: i === duIdx });
    }
    parts = next;
    duPart = next[duIdx] || null;
    duLandT = 0;
    canvas.style.opacity = '0'; // bis zur Formung unsichtbar (Fläche deckt eh ab)
    if (numEl) numEl.style.opacity = '0';
  };

  setup();

  // Maus relativ zur Sektion/Canvas (nur Desktop).
  let mx = -9999;
  let my = -9999;
  if (fine) {
    window.addEventListener(
      'mousemove',
      (e) => {
        const r = canvas.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
      },
      { passive: true },
    );
  }

  let running = false;
  let rafId = 0;
  const loop = (now: number) => {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    if (!started) {
      rafId = requestAnimationFrame(loop);
      return;
    }
    const elapsed = now - startT;
    const mouseOn = fine && mx > -9998;

    // Pass 0: ECHTE Position pro Partikel fortschreiben.
    //  - Formung (t<1): weiches Ease von Startlage → Ziel (Fade-in bleibt unberührt).
    //  - Fertig (t≥1): GEKOPPELT — Homing (langsam-elastisch) + Repel (akkumuliert) +
    //    Stabilitäts-Clamp. Gilt für ALLE Partikel inkl. dem gelben „du" (reagiert mit).
    for (const p of parts) {
      const t = Math.min(1, Math.max(0, (elapsed - p.delay) / DUR));
      p.t = t;
      if (t < 1) {
        const e = easeSoft(t);
        p.x = p.sx + (p.tx - p.sx) * e;
        p.y = p.sy + (p.ty - p.sy) * e;
        continue;
      }
      // 1) Homing — langsame elastische Rückkehr auf die ECHTE Position.
      p.x += (p.tx - p.x) * HOME;
      p.y += (p.ty - p.y) * HOME;
      // 2) Repel — verschiebt die ECHTE Position (akkumuliert nahe der Maus).
      if (mouseOn) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < REPEL_R * REPEL_R && d2 > 1) {
          const d = Math.sqrt(d2);
          const f = ((REPEL_R - d) / REPEL_R) * REPEL_FORCE;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
      }
      // 3) Stabilitäts-Clamp — starke Werte zerreißen die Zahl nicht.
      const ddx = p.x - p.tx;
      const ddy = p.y - p.ty;
      const md = Math.hypot(ddx, ddy);
      if (md > MAXDISP) {
        p.x = p.tx + (ddx / md) * MAXDISP;
        p.y = p.ty + (ddy / md) * MAXDISP;
      }
    }

    const du = duPart;

    // Pass A: GRAUE Partikel (Live-Position) — du überspringen + grau-freie Zone (CLEAR_R).
    ctx.shadowBlur = 0;
    for (const p of parts) {
      if (p.du) continue;
      if (du) {
        const ddx = p.x - du.x;
        const ddy = p.y - du.y;
        if (ddx * ddx + ddy * ddy < CLEAR_R2) continue;
      }
      const a = 0.66 * Math.min(1, p.t / FADE);
      ctx.fillStyle = `rgba(${NUM_RGB[0]},${NUM_RGB[1]},${NUM_RGB[2]},${a})`;
      ctx.fillRect(p.x - pSize / 2, p.y - pSize / 2, pSize, pSize);
    }

    // Pass B: gelber „du"-Punkt OBENAUF an seiner LIVE-Position (folgt der Wölbung).
    if (du) {
      const landed = du.t >= 1;
      let r = pSize;
      if (landed) {
        if (!duLandT) duLandT = now;
        const g = Math.min(1, (now - duLandT) / 400);
        r = pSize + g * (duMax - pSize);
        ctx.fillStyle = YELLOW;
        ctx.shadowColor = YELLOW;
        ctx.shadowBlur = 16;
      } else {
        const a = 0.66 * Math.min(1, du.t / FADE);
        ctx.fillStyle = `rgba(${NUM_RGB[0]},${NUM_RGB[1]},${NUM_RGB[2]},${a})`;
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.arc(du.x, du.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pass C: „du"-Label OBENAUF, knapp über dem Punkt (gelb, Roboto 700) — Live-Position.
      if (landed) {
        ctx.fillStyle = YELLOW;
        ctx.font = `700 ${labelPx}px Roboto`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(duLabel, du.x, du.y - r - 8);
      }
    }

    rafId = requestAnimationFrame(loop);
  };

  // TRIGGER: EINMAL beim Eintritt (Oberkante ~65% der Viewporthöhe). Kein Pin/Scrub/Reverse.
  let triggered = false;
  ScrollTrigger.create({
    trigger: section,
    start: 'top 65%',
    once: true,
    onEnter: () => {
      if (triggered) return;
      triggered = true;
      // 1) Fläche wischt per Clip-Path horizontal weg (UNVERÄNDERT).
      if (wipe) {
        gsap.to(wipe, {
          clipPath: 'inset(0% 0% 0% 100%)',
          duration: WIPE_DUR,
          ease: 'power2.inOut',
          onComplete: () => {
            wipe.style.display = 'none';
          },
        });
      }
      // 2) Direkt anschließend: Formung starten (Canvas an; Partikel faden per-Partikel ein).
      const startForm = WIPE_DUR * 0.6;
      gsap.delayedCall(startForm, () => {
        started = true;
        startT = performance.now();
        canvas.style.opacity = '1'; // Fade kommt aus der Per-Partikel-Alpha
      });
      // 3) Headline-Gruppe nach der Formung einblenden (+ Safety-Net).
      gsap.delayedCall(startForm + 2.0, doReveal);
      gsap.delayedCall(startForm + 2.8, doReveal);
    },
  });

  // Loop laufen lassen, sobald die Sektion NAHE ist (rootMargin).
  const io = new IntersectionObserver(
    (entries) => {
      const vis = entries[0]?.isIntersecting ?? false;
      if (vis && !running) {
        running = true;
        rafId = requestAnimationFrame(loop);
      } else if (!vis && running) {
        running = false;
        cancelAnimationFrame(rafId);
        mx = -9999;
        my = -9999;
      }
    },
    { rootMargin: '400px' },
  );
  io.observe(section);

  // Resize: neu aufsetzen. War die Formung schon durch, direkt im Endzustand bleiben.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const wasStarted = started;
      setup();
      if (wasStarted) {
        started = true;
        startT = performance.now() - (MAXDELAY + DUR + 1000);
        canvas.style.opacity = '1';
      }
    }, 150);
  });
}

/**
 * Portale-Lockscreen-Uhr: echte Uhrzeit + Datum in der aktiven Sprache
 * (de-DE / en-GB), Update alle 15s. Läuft IMMER (auch reduced-motion — reine
 * Text-Aktualisierung, keine Bewegung). Ohne JS bleibt der Fallback „09:41".
 */
function initPortaleClock() {
  const section = document.querySelector<HTMLElement>('#portale');
  if (!section) return;
  const timeEl = section.querySelector<HTMLElement>('[data-pf-time]');
  const dateEl = section.querySelector<HTMLElement>('[data-pf-date]');
  if (!timeEl && !dateEl) return;
  const locale = (document.documentElement.lang || 'de').startsWith('en') ? 'en-GB' : 'de-DE';
  const update = () => {
    const now = new Date();
    if (timeEl) timeEl.textContent = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    if (dateEl)
      dateEl.textContent = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  };
  update();
  window.setInterval(update, 15000);
}

/**
 * Portale-Sektion: Entry-Reveal (beide Breakpoints) + Anzeigen-Flug-Choreografie
 * (nur Desktop-Breakpoint, nur sichtbar). Additiv/ohne CSS-Vorverstecken: ohne JS /
 * reduced-motion steht alles im Endzustand (Pills, Phone, 2 statische Pushes).
 */
function initPortale() {
  const section = document.querySelector<HTMLElement>('#portale');
  if (!section) return;
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;

  // --- Entry-Reveal: Headline-Mask + Marker-Wipe → Subline → Pills → Phone ---
  const lineInners = gsap.utils.toArray<HTMLElement>('#portale .pf-line-inner');
  const markHls = gsap.utils.toArray<HTMLElement>('#portale .marker__bg');
  const sub = section.querySelector<HTMLElement>('[data-pf-sub]');
  const pills = gsap.utils.toArray<HTMLElement>('#portale [data-pf-pill]');
  const phoneStage = section.querySelector<HTMLElement>('[data-pf-phone-stage]');

  // Late-Setup-Garde (Trigger 'top 78%'): nur das Entry-Reveal überspringen, wenn die
  // Sektion beim Setup schon an/über der Startlinie liegt (sonst blieben Headline/Pills/
  // Phone auf autoAlpha:0 kleben). Die Flug-Choreografie unten läuft davon unabhängig.
  if (!isPastRevealStart(section, 0.78)) {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 78%', once: true },
      defaults: { ease: 'power3.out' },
    });
    if (lineInners.length) tl.from(lineInners, { yPercent: 110, duration: 0.9, stagger: 0.12 }, 0);
    if (markHls.length)
      tl.from(markHls, { scaleX: 0, skewX: -8, transformOrigin: 'left center', duration: 0.5, ease: 'power2.out' }, 0.35);
    if (sub) tl.from(sub, { autoAlpha: 0, y: 18, duration: 0.6 }, 0.5);
    if (pills.length) tl.from(pills, { autoAlpha: 0, y: 16, duration: 0.5, stagger: 0.035 }, 0.55);
    if (phoneStage)
      tl.from(phoneStage, { autoAlpha: 0, xPercent: isDesktop ? 10 : 0, y: isDesktop ? 0 : 20, duration: 0.85 }, 0.45);
  }

  // Flug-Choreografie nur am Desktop-Breakpoint (unabhängig vom Entry-Reveal).
  if (isDesktop) setupPortaleFlight(section, pills, fine);
}

/**
 * Anzeigen-Flug: Ticker wählt (oder Hover löst) eine Pill → Ping → Mini-Anzeigen-
 * Karte fliegt entlang eines Bézier-Pfads zum Phone → erscheint als Push im Stapel.
 * rAF + getPointAtLength/atan2 (tangential). Ticker + Loop per IntersectionObserver
 * an die Sichtbarkeit gekoppelt (offscreen vollständig pausiert). Pfade nur bei
 * Start/Resize gemessen — keine Layout-Reads im Frame-Loop.
 */
function setupPortaleFlight(section: HTMLElement, pills: HTMLElement[], fine: boolean) {
  const stage = section.querySelector<HTMLElement>('[data-pf-flightstage]');
  const phoneEl = section.querySelector<HTMLElement>('[data-pf-phone]');
  const pushstack = section.querySelector<HTMLElement>('[data-pf-pushstack]');
  if (!stage || !phoneEl || !pushstack || !pills.length) return;

  type Feed = {
    pushTemplate: string;
    timeNow: string;
    time3: string;
    time6: string;
    flats: Record<string, string[]>;
  };
  let feed: Feed;
  try {
    feed = JSON.parse(section.querySelector('[data-pf-i18n]')?.textContent || '');
  } catch {
    return;
  }
  const slotTimes = [feed.timeNow, feed.time3, feed.time6];

  // ---- Live-Push-Stack (aus den 2 SSR-Karten adoptiert; kein Flackern) ----
  const existing = Array.from(pushstack.querySelectorAll<HTMLElement>('[data-pf-push]'));
  if (!existing.length) return;
  const template = existing[0].cloneNode(true) as HTMLElement;
  let cardH = existing[0].offsetHeight;
  let step = cardH + 6;
  const TRANS = 'transform .5s cubic-bezier(.3,1.3,.5,1), opacity .4s ease';
  const slotOpacity = [1, 0.93, 0.82];

  pushstack.classList.add('pf-pushstack--live');
  pushstack.style.height = 3 * step + 'px';
  let stackArr = existing.slice(0, 3);
  const layout = () => {
    stackArr.forEach((card, i) => {
      card.style.transition = TRANS;
      card.style.transform = `translateY(${i * step}px)`;
      card.style.opacity = String(slotOpacity[i] ?? 0);
      const tEl = card.querySelector<HTMLElement>('[data-pf-push-time]');
      if (tEl) tEl.textContent = slotTimes[i] ?? feed.time6;
    });
  };
  layout();

  const buildCard = (msg: string): HTMLElement => {
    const card = template.cloneNode(true) as HTMLElement;
    const msgEl = card.querySelector<HTMLElement>('.pf-push-msg');
    if (msgEl) msgEl.textContent = msg;
    const tEl = card.querySelector<HTMLElement>('[data-pf-push-time]');
    if (tEl) tEl.textContent = feed.timeNow;
    return card;
  };

  const pushNotif = (portal: string, poolKey: string) => {
    const flats = feed.flats[poolKey] || feed.flats.national || [];
    const flat = flats.length ? flats[Math.floor(Math.random() * flats.length)] : '';
    const msg = feed.pushTemplate.replace('{flat}', flat).replace('{portal}', portal);
    const card = buildCard(msg);
    card.style.transition = 'none';
    card.style.transform = 'translateY(-20px) scale(0.93)';
    card.style.opacity = '0';
    pushstack.insertBefore(card, pushstack.firstChild);
    stackArr.unshift(card);
    // Überzählige Karte (Slot 3) rausfallen lassen.
    if (stackArr.length > 3) {
      const dropped = stackArr.pop() as HTMLElement;
      dropped.style.transition = TRANS;
      dropped.style.transform = `translateY(${3 * step + 10}px) scale(0.96)`;
      dropped.style.opacity = '0';
      window.setTimeout(() => dropped.remove(), 430);
    }
    void card.offsetWidth; // Reflow → Start-Transform greift
    requestAnimationFrame(() => {
      card.style.transition = TRANS;
      card.style.transform = 'translateY(0) scale(1)';
      card.style.opacity = '1';
      layout(); // bestehende Karten einen Slot tiefer + Zeitlabels
    });
  };

  // ---- Flug-Overlay (SVG) + Flieger-Pool (5 Instanzen, recycelt) ----
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'pf-flight-overlay');
  svg.setAttribute('aria-hidden', 'true');
  stage.appendChild(svg);

  // Referenz-Phonebreite → proportionale Flieger-Skalierung. Faktor 1.15: Flieger
  // ~15 % größer, damit er zu den vergrößerten Pills passt.
  const REF = 240;
  const FLIER_SCALE = 1.15;
  let baseScale = (phoneEl.getBoundingClientRect().width / REF) * FLIER_SCALE;

  const createFlierCard = (): SVGGElement => {
    const g = document.createElementNS(NS, 'g') as SVGGElement;
    const mk = (tag: string, attrs: Record<string, string | number>) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, String(attrs[k]));
      g.appendChild(el);
    };
    // Schatten → Karte → 2 graue Zeilen → gelber Preis-Marker (um (0,0) zentriert).
    mk('rect', { x: -10, y: -5.8, width: 20, height: 14, rx: 3, fill: 'rgba(59,59,58,0.16)' });
    mk('rect', { x: -10, y: -7, width: 20, height: 14, rx: 3, fill: '#ffffff', stroke: 'rgba(59,59,58,0.22)', 'stroke-width': 0.8 });
    mk('rect', { x: -7.5, y: -4, width: 11, height: 1.7, rx: 0.6, fill: '#c6c6c5' });
    mk('rect', { x: -7.5, y: -1, width: 8, height: 1.7, rx: 0.6, fill: '#d8d8d7' });
    mk('rect', { x: -7.5, y: 2.2, width: 6.4, height: 2.6, rx: 0.7, fill: '#fff03c', stroke: 'rgba(59,59,58,0.5)', 'stroke-width': 0.4 });
    g.style.visibility = 'hidden';
    return g;
  };

  type Flier = {
    path: SVGPathElement;
    g: SVGGElement;
    active: boolean;
    running: boolean;
    startTime: number;
    dur: number;
    len: number;
    portal: string;
    poolKey: string;
    pending: number;
  };
  const fliers: Flier[] = [];
  for (let i = 0; i < 5; i++) {
    const path = document.createElementNS(NS, 'path') as SVGPathElement;
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'none');
    svg.appendChild(path);
    const g = createFlierCard();
    svg.appendChild(g);
    fliers.push({ path, g, active: false, running: false, startTime: 0, dur: 0, len: 0, portal: '', poolKey: '', pending: 0 });
  }

  let activeCount = 0;
  let running = false;
  let rafId = 0;
  let tickId = 0;

  // Pill-Ping (dekorativ): Gelb-Blitz + Scale + Ring (CSS). Neu triggerbar.
  const pinging = new WeakSet<HTMLElement>();
  const pingPill = (pill: HTMLElement) => {
    if (pinging.has(pill)) return;
    pinging.add(pill);
    pill.classList.remove('is-ping');
    void pill.offsetWidth;
    pill.classList.add('is-ping');
    window.setTimeout(() => {
      pill.classList.remove('is-ping');
      pinging.delete(pill);
    }, 660);
  };

  // power1.inOut (quad in-out)
  const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  const launchFlight = (pill: HTMLElement) => {
    if (!running) return;
    const f = fliers.find((x) => !x.active);
    if (!f) return;
    f.active = true;
    activeCount++;
    pingPill(pill);
    const portal = pill.dataset.name || '';
    const poolKey = pill.dataset.pool || 'national';
    f.g.style.visibility = 'hidden';
    // Nach 260ms (Ping läuft) den Flieger an der Pill-Rechtskante starten.
    f.pending = window.setTimeout(() => {
      f.pending = 0;
      if (!running) {
        f.active = false;
        activeCount = Math.max(0, activeCount - 1);
        return;
      }
      const sr = stage.getBoundingClientRect();
      const pr = pill.getBoundingClientRect();
      const phr = phoneEl.getBoundingClientRect();
      const ps = pushstack.getBoundingClientRect();
      const sx = pr.right - sr.left;
      const sy = pr.top + pr.height / 2 - sr.top;
      const tx = phr.left - sr.left + 5; // linke Phone-Außenkante +5px
      const ty = ps.top + cardH / 2 - sr.top; // Mitte der obersten Stack-Position
      const dx = tx - sx;
      f.path.setAttribute('d', `M ${sx},${sy} C ${sx + dx * 0.42},${sy} ${tx - dx * 0.32},${ty} ${tx},${ty}`);
      f.len = f.path.getTotalLength();
      f.dur = 1750 + Math.random() * 550;
      f.portal = portal;
      f.poolKey = poolKey;
      f.startTime = performance.now();
      f.g.style.visibility = '';
      f.running = true;
    }, 260);
  };

  const frame = (now: number) => {
    if (!running) return;
    for (const f of fliers) {
      if (!f.active || !f.running) continue;
      const p = Math.min(1, (now - f.startTime) / f.dur);
      if (p >= 1) {
        f.running = false;
        f.active = false;
        activeCount = Math.max(0, activeCount - 1);
        f.g.style.visibility = 'hidden';
        f.g.removeAttribute('transform');
        pushNotif(f.portal, f.poolKey);
        continue;
      }
      const at = f.len * easeInOut(p);
      const pt = f.path.getPointAtLength(at);
      const pt2 = f.path.getPointAtLength(Math.min(f.len, at + 1));
      const ang = (Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180) / Math.PI;
      // Scale-Dramaturgie: 0→1 (erste 11 %), 1→0 (letzte 14 %).
      let s = 1;
      if (p < 0.11) s = p / 0.11;
      else if (p > 0.86) s = (1 - p) / 0.14;
      s = Math.max(0, s) * baseScale;
      f.g.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${ang}) scale(${s})`);
    }
    rafId = requestAnimationFrame(frame);
  };

  const tick = () => {
    if (!running || activeCount >= 2) return; // max 2 gleichzeitige Flüge (Ticker)
    const pill = pills[Math.floor(Math.random() * pills.length)];
    if (pill) launchFlight(pill);
  };

  const start = () => {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(frame);
    tickId = window.setInterval(tick, 2900);
  };
  const stop = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    window.clearInterval(tickId);
    for (const f of fliers) {
      if (f.pending) window.clearTimeout(f.pending);
      f.pending = 0;
      f.active = false;
      f.running = false;
      f.g.style.visibility = 'hidden';
      f.g.removeAttribute('transform');
    }
    activeCount = 0;
  };

  // Sichtbarkeits-Gate: offscreen komplett pausiert (Ticker + rAF + Flüge).
  const io = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) start();
    else stop();
  });
  io.observe(section);

  // Hover (nur pointer:fine): löst zusätzlich die Sequenz für genau diese Pill aus.
  if (fine) {
    stage.addEventListener('mouseover', (e) => {
      if (!running) return;
      const pill = (e.target as Element).closest?.('[data-pf-pill]') as HTMLElement | null;
      if (pill) launchFlight(pill);
    });
  }

  // Resize: Maße/Scale neu, laufende Flüge sauber abbrechen (Debounce).
  let rt = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(rt);
    rt = window.setTimeout(() => {
      const wasRunning = running;
      stop();
      const anyCard = pushstack.querySelector<HTMLElement>('[data-pf-push]');
      if (anyCard) cardH = anyCard.offsetHeight || cardH;
      step = cardH + 6;
      pushstack.style.height = 3 * step + 'px';
      stackArr = Array.from(pushstack.querySelectorAll<HTMLElement>('[data-pf-push]')).slice(0, 3);
      layout();
      baseScale = (phoneEl.getBoundingClientRect().width / REF) * FLIER_SCALE;
      if (wasRunning) start();
    }, 160);
  });
  ro.observe(stage);
}

function initReveals() {
  // Convention: Elemente mit [data-reveal] gleiten dezent herein.
  const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  targets.forEach((el) => {
    // Late-Setup-Garde: liegt das Element beim (verzögerten) Setup schon an/über der
    // Startlinie ('top 85%'), würde der einmalige Trigger nicht mehr feuern → nicht
    // verstecken, sichtbaren Grundzustand belassen (kein gsap.from).
    if (isPastRevealStart(el, 0.85)) return;
    gsap.from(el, {
      opacity: 0,
      y: 24,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });
}

/**
 * Bewertungen-Sektion: eine Timeline (once:true). Startzustände NUR per gsap.set
 * (ohne JS / reduced-motion alles im Endzustand). H2 Mask-Reveal + Marker-Wipe →
 * Subline → Rating-Kacheln gestaffelt → Marquee-Reihen weich einfaden. Nur
 * transform/opacity (die Marquee selbst ist CSS-only und läuft unabhängig weiter).
 */
function initBewertungen() {
  const section = document.querySelector<HTMLElement>('#bewertungen');
  if (!section) return;
  // Late-Setup-Garde (Trigger 'top 80%'): schon an/über der Startlinie → keine
  // Startzustände, kein Trigger; Sektion bleibt im natürlichen (sichtbaren) Endzustand.
  if (isPastRevealStart(section, 0.8)) return;

  const maskIns = gsap.utils.toArray<HTMLElement>('#bewertungen .bw-mask-in');
  const markHls = gsap.utils.toArray<HTMLElement>('#bewertungen .marker__bg');
  const sub = section.querySelector<HTMLElement>('[data-bw-sub]');
  const tiles = gsap.utils.toArray<HTMLElement>('#bewertungen [data-bw-tile]');
  const rows = gsap.utils.toArray<HTMLElement>('#bewertungen [data-bw-marquee]');

  if (maskIns.length) gsap.set(maskIns, { yPercent: 110 });
  if (markHls.length) gsap.set(markHls, { scaleX: 0, skewX: -8, transformOrigin: 'left center' });
  if (sub) gsap.set(sub, { autoAlpha: 0, y: 18 });
  if (tiles.length) gsap.set(tiles, { autoAlpha: 0, y: 24 });
  if (rows.length) gsap.set(rows, { autoAlpha: 0, y: 20 });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top 80%', once: true },
    defaults: { ease: 'power3.out' },
  });
  if (maskIns.length) tl.to(maskIns, { yPercent: 0, duration: 0.7, ease: 'power4.out' }, 0);
  if (markHls.length) tl.to(markHls, { scaleX: 1, skewX: -8, duration: 0.4, ease: 'power2.out' }, 0.35);
  if (sub) tl.to(sub, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.4);
  if (tiles.length) tl.to(tiles, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.12 }, 0.45);
  if (rows.length) tl.to(rows, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.15 }, 0.7);
}

/**
 * Ablauf-Sektion (Ticket-Leiste): eine Timeline (once:true). Startzustände NUR
 * per gsap.set (ohne JS / reduced-motion alles im Endzustand). H2 zeilenweiser
 * Mask-Reveal + Marker-Wipe → Subline → Tickets gestaffelt. Nur transform/opacity.
 */
function initAblauf() {
  const section = document.querySelector<HTMLElement>('#ablauf');
  if (!section) return;
  // Late-Setup-Garde (Trigger 'top 80%'): schon an/über der Startlinie → keine
  // Startzustände setzen, kein Trigger; Sektion bleibt im natürlichen (sichtbaren)
  // Endzustand — identisch zur reduced-motion-Behandlung.
  if (isPastRevealStart(section, 0.8)) return;

  const maskIns = gsap.utils.toArray<HTMLElement>('#ablauf .ab-mask-in');
  const markHls = gsap.utils.toArray<HTMLElement>('#ablauf .marker__bg');
  const sub = section.querySelector<HTMLElement>('[data-ab-sub]');
  const tickets = gsap.utils.toArray<HTMLElement>('#ablauf [data-ab-ticket]');
  const isMobile = !window.matchMedia('(min-width: 1024px)').matches;

  if (maskIns.length) gsap.set(maskIns, { yPercent: 110 });
  if (markHls.length) gsap.set(markHls, { scaleX: 0, skewX: -8, transformOrigin: 'left center' });
  if (sub) gsap.set(sub, { autoAlpha: 0, y: 18 });
  if (tickets.length) gsap.set(tickets, { autoAlpha: 0, y: isMobile ? 16 : 24 });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top 80%', once: true },
    defaults: { ease: 'power3.out' },
  });
  if (maskIns.length) tl.to(maskIns, { yPercent: 0, duration: 0.7, ease: 'power4.out' }, 0);
  if (markHls.length)
    tl.to(markHls, { scaleX: 1, skewX: -8, duration: 0.4, ease: 'power2.out' }, 0.35);
  if (sub) tl.to(sub, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.4);
  if (tickets.length)
    // clearProps:'transform' entfernt den Inline-Transform nach Abschluss → der
    // CSS-:hover-Lift (translateY(-6px)) kann greifen. opacity/visibility bleiben.
    tl.to(
      tickets,
      { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.1, clearProps: 'transform' },
      0.45,
    );
}

/**
 * Preise-Sektion: eine Timeline (once:true). Startzustände AUSSCHLIESSLICH per
 * gsap.set (ohne JS steht alles im Endzustand; reduced-motion überspringt die
 * Funktion komplett — inkl. der sets). Sektions-Wipe per clip-path (bewusste
 * Ausnahme wie Problem-Sektion, hier vertikal invertiert), Rest nur transform/
 * opacity. Store-Badges kommen mit dem Karten-Stagger (kein separates Verzögern).
 */
function initPreise() {
  const section = document.querySelector<HTMLElement>('#preise');
  if (!section) return;
  // Late-Setup-Garde (Trigger 'top 75%'): schon an/über der Startlinie → keine
  // Startzustände (u. a. clip-path der Riesen-Kachel!) setzen, kein Trigger; Sektion
  // bleibt im natürlichen (sichtbaren) Endzustand.
  if (isPastRevealStart(section, 0.75)) return;

  const tile = section.querySelector<HTMLElement>('[data-pr-tile]');
  const lineIns = gsap.utils.toArray<HTMLElement>('#preise .pr-line-in');
  const markHls = gsap.utils.toArray<HTMLElement>('#preise .marker__bg');
  const sub = section.querySelector<HTMLElement>('[data-pr-sub]');
  const cards = gsap.utils.toArray<HTMLElement>('#preise [data-pr-card]');
  const benefits = gsap.utils.toArray<HTMLElement>('#preise [data-pr-benefit]');
  const isMobile = !window.matchMedia('(min-width: 1024px)').matches;
  // round-Wert an den tatsächlichen Kachel-Radius koppeln (clamp → aufgelöste px).
  const radius = tile ? getComputedStyle(tile).borderTopLeftRadius || '40px' : '40px';

  // Startzustände NUR per gsap.set (ohne JS / reduced-motion: Kachel sofort da).
  if (tile) gsap.set(tile, { clipPath: `inset(0 0 100% 0 round ${radius})` });
  if (lineIns.length) gsap.set(lineIns, { yPercent: 110 });
  if (markHls.length) gsap.set(markHls, { scaleX: 0, skewX: -8, transformOrigin: 'left center' });
  if (sub) gsap.set(sub, { autoAlpha: 0, y: 18 });
  if (cards.length) gsap.set(cards, { autoAlpha: 0, y: 24 });
  if (benefits.length) gsap.set(benefits, { autoAlpha: 0, y: 16 });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top 75%', once: true },
    defaults: { ease: 'power3.out' },
  });

  // Kachel-Wipe (Echo der Problem-Sektion, vertikal invertiert) — clip-path nimmt
  // den Radius mit. onComplete: clip-path lösen, sonst würde inset(0 0 0 0) den
  // weichen Schatten der Kachel wegklippen.
  if (tile)
    tl.to(
      tile,
      {
        clipPath: `inset(0% 0 0% 0 round ${radius})`,
        duration: isMobile ? 0.7 : 0.9,
        ease: 'power3.inOut',
        onComplete: () => {
          tile.style.clipPath = 'none';
        },
      },
      0,
    );
  // Headline zeilenweise aus der Maske, +0.45s nach Wipe-Beginn.
  if (lineIns.length) tl.to(lineIns, { yPercent: 0, duration: 0.7, ease: 'power4.out', stagger: 0.09 }, 0.45);
  // Marker ~0.35s nach seiner Zeile.
  if (markHls.length) tl.to(markHls, { scaleX: 1, skewX: -8, duration: 0.4, ease: 'power2.out' }, 0.8);
  // Subline.
  if (sub) tl.to(sub, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.5);
  // Karten (Trial, Plan 1, Plan 2) gestaffelt — Store-Badges kommen mit.
  if (cards.length) tl.to(cards, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12 }, 0.5);
  // Benefits-Items.
  if (benefits.length) tl.to(benefits, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06 }, 0.7);
}

/**
 * Sprach-Kachel: Globus als Lottie (dieselbe Player-Lösung wie die Problem-
 * Sektion → gemeinsamer lottie_light-Chunk, kein zweites Runtime-Bundle). Instanz
 * erst laden, wenn die Kachel den Viewport betritt (IntersectionObserver),
 * autoplay:false, Ruhezustand = Frame 0. mouseenter (ganze Kachel) → ab Frame 0
 * einmal abspielen; mouseleave → laufende Wiedergabe zu Ende, dann Frame 0 (kein
 * abruptes Zurückspringen); erneutes Hover startet neu. Die JSON-Farben sind
 * bereits CD-Schwarz #3b3b3a → keine Umfärbung nötig. reduced-motion / Touch:
 * gar nicht initialisieren → statisches Fallback-SVG (Frame 0), spielt nie.
 */
function initFeatureLangLottie(section: HTMLElement) {
  if (prefersReducedMotion) return;
  const holder = section.querySelector<HTMLElement>('[data-ft-lang-lottie]');
  const tile = holder?.closest<HTMLElement>('.ft-tile');
  const src = holder?.getAttribute('data-lottie-src');
  if (!holder || !tile || !src) return;

  type LottieAnim = {
    goToAndPlay: (v: number, isFrame?: boolean) => void;
    goToAndStop: (v: number, isFrame?: boolean) => void;
    addEventListener: (ev: string, cb: () => void) => void;
  };
  let anim: LottieAnim | null = null;
  let loaded = false;
  let pendingPlay = false;

  const load = async () => {
    if (loaded) return;
    loaded = true;
    let lottie: { loadAnimation: (cfg: Record<string, unknown>) => LottieAnim };
    try {
      const mod = (await import('lottie-web/build/player/lottie_light')) as unknown as {
        default: typeof lottie;
      };
      lottie = mod.default;
    } catch {
      return; // Lib nicht ladbar → Fallback-SVG bleibt (Frame 0)
    }
    let data: unknown;
    try {
      data = await (await fetch(src)).json();
    } catch {
      return; // Fetch fehlgeschlagen → Fallback-SVG bleibt
    }
    holder.innerHTML = ''; // Fallback-SVG entfernen, Lottie übernimmt
    anim = lottie.loadAnimation({
      container: holder,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: data,
    });
    anim.goToAndStop(0, true);
    // loop:false → nach Durchlauf zurück auf Frame 0 (Ruhezustand).
    anim.addEventListener('complete', () => anim?.goToAndStop(0, true));
    if (pendingPlay) {
      pendingPlay = false;
      anim.goToAndPlay(0, true);
    }
  };

  // Instanz erst bei Viewport-Eintritt initialisieren.
  const io = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      load();
      io.disconnect();
    }
  });
  io.observe(tile);

  tile.addEventListener('mouseenter', () => {
    if (anim) anim.goToAndPlay(0, true);
    else {
      pendingPlay = true;
      load();
    }
  });
  // mouseleave: laufende Wiedergabe zu Ende spielen lassen; der complete-Handler
  // stoppt danach auf Frame 0. Ist bereits nichts am Laufen, steht sie schon auf 0.
  tile.addEventListener('mouseleave', () => {
    pendingPlay = false;
  });
}

/**
 * TIER 1 — Autoplay-Accordion V2 (≥lg + JS) bzw. Basis-Stapel sonst.
 *
 * ≥lg: zweispaltig [gemeinsames Phone | Accordion]. Ein Item offen; ein
 * ENDLOSES 8s-Autoplay (rAF mit dt-Akkumulation, kein setInterval) klappt weiter
 * und treibt den Fortschrittsbalken (scaleX). Der Timer tickt NUR, wenn: Section
 * im Viewport UND kein Hover über dem Tier-1-Container UND kein Tastatur-Fokus im
 * Accordion UND kein reduced-motion. Hover friert den Füllstand ein (kein Reset),
 * mouseleave läuft ab da weiter. Klick auf einen INAKTIVEN Kopf öffnet diesen
 * Schritt und setzt seinen Balken auf 0 (Autoplay bleibt aktiv — bei Hover wartet
 * er bei 0). Klick auf den AKTIVEN Kopf ist ein No-op. Balken sind ab Init
 * sichtbar. reduced-motion: Accordion (Klick schaltet hart), KEIN Autoplay/Balken.
 * < lg: Basis-Stapel (dezenter Reveal nur bei Bewegung); alle Bodies offen.
 */
function initFeatureAccordion(section: HTMLElement) {
  const steps = section.querySelector<HTMLElement>('[data-ft-steps]');
  const blocks = gsap.utils.toArray<HTMLElement>('#features [data-ft-block]');
  if (!steps || blocks.length !== 3) return;

  const canEnhance = window.matchMedia('(min-width: 1024px)').matches;
  if (!canEnhance) {
    // Basis-Stapel: dezenter einmaliger Reveal je Block (nur bei Bewegung).
    if (!prefersReducedMotion) {
      blocks.forEach((block) => {
        gsap.from(block, {
          autoAlpha: 0,
          y: 24,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: block, start: 'top 85%', once: true },
        });
      });
    }
    return;
  }

  // ---- Enhancement aktiv ----
  steps.classList.add('is-enhanced');

  const shots = gsap.utils.toArray<HTMLElement>('#features [data-ft-shared] [data-ft-shot]');
  const fills = blocks.map((b) => b.querySelector<HTMLElement>('[data-ft-progress-fill]'));
  const heads = blocks.map((b) => b.querySelector<HTMLButtonElement>('[data-ft-acc-head]'));
  const list = section.querySelector<HTMLElement>('.ft-blocks');

  const STEP_MS = 8000; // Autoplay-Takt (zentral, leicht tunebar)

  let cur = 0;
  let visible = false;
  let hovering = false;
  let focusInside = false;
  let accum = 0;
  let last = 0;
  let rafId = 0;

  const setFill = (i: number, p: number) => {
    const f = fills[i];
    if (f) f.style.transform = `scaleX(${p})`;
  };

  const openStep = (n: number) => {
    cur = n;
    blocks.forEach((b, i) => {
      const open = i === n;
      b.classList.toggle('is-open', open);
      b.classList.toggle('is-collapsed', !open);
      heads[i]?.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open) setFill(i, 0);
    });
    shots.forEach((s, i) => s.classList.toggle('is-active', i === n));
    accum = 0;
    setFill(n, 0);
  };

  // Init: Schritt 01 offen, 02/03 zu.
  openStep(0);

  // Klick: inaktiver Kopf öffnet (Balken-Reset via openStep); aktiver Kopf = No-op.
  heads.forEach((head, i) => {
    head?.addEventListener('click', () => {
      if (i === cur) return; // aktiver Kopf: nichts tun
      openStep(i);
    });
  });

  // reduced-motion: Accordion statisch (Klick schaltet hart) — kein Autoplay/Balken.
  if (prefersReducedMotion) return;

  // Balken ab jetzt sichtbar (Enhancement + Bewegung aktiv).
  steps.classList.add('is-autoplaying');

  const stopRaf = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
  const startRaf = () => {
    if (rafId) return;
    last = 0;
    rafId = requestAnimationFrame(frame);
  };
  // Timer tickt nur, wenn sichtbar, nicht gehovert und ohne Fokus im Accordion.
  const canTick = () => visible && !hovering && !focusInside;
  function frame(now: number) {
    if (!last) last = now;
    let dt = now - last;
    last = now;
    if (dt > 250) dt = 250; // Sprung nach Hintergrund-Tab / Resume abfedern
    if (canTick()) {
      accum += dt;
      const p = Math.min(1, accum / STEP_MS);
      setFill(cur, p);
      if (p >= 1) {
        accum = 0;
        openStep((cur + 1) % 3);
      }
    }
    rafId = requestAnimationFrame(frame);
  }

  // Hover über dem Tier-1-Container (Phone + Accordion) → Pause (Füllstand friert
  // ein). mouseleave → Weiterlauf ab dem eingefrorenen Stand (kein Reset).
  steps.addEventListener('mouseenter', () => {
    hovering = true;
  });
  steps.addEventListener('mouseleave', () => {
    hovering = false;
  });

  // Tastatur-Fokus im Accordion → pausieren; Fokusverlust → fortsetzen.
  if (list) {
    list.addEventListener('focusin', () => {
      focusInside = true;
    });
    list.addEventListener('focusout', (e) => {
      if (!list.contains(e.relatedTarget as Node | null)) focusInside = false;
    });
  }

  // Viewport-Pause: rAF läuft nur, solange die Sektion sichtbar ist; bei Re-Entry
  // nahtloser Weiterlauf (accum bleibt erhalten).
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) startRaf();
      else stopRaf();
    },
    { threshold: 0.35 },
  );
  io.observe(steps);
}

/**
 * Features-Sektion (Orchestrierung).
 *
 * IMMER (auch reduced-motion / mobil):
 *  - Easter-Egg B: Dark-Mode-Kachel toggelt hart per Klick (aria-pressed).
 *  - Sprach-Globus-Lottie (nur Hover+Bewegung; sonst statisches Fallback).
 *  (Listenansichten-Kachel: reine CSS-Hover-Choreografie, kein JS.)
 *  - TIER 1: Autoplay-Accordion (≥lg+JS) bzw. Basis-Stapel; Accordion greift auch
 *    bei reduced-motion (statisch), Autoplay nur bei erlaubter Bewegung.
 *
 * NUR bei erlaubter Bewegung: Header-Mask-Reveal + Bento-Reveal (additiv).
 */
function initFeatures() {
  const section = document.querySelector<HTMLElement>('#features');
  if (!section) return;

  // ---- Easter-Egg B: Dark-Mode-Kachel (immer, auch reduced-motion) ----
  const darkTile = section.querySelector<HTMLElement>('[data-ft-darktile]');
  const chain = section.querySelector<HTMLButtonElement>('[data-ft-chain]');
  if (darkTile && chain) {
    chain.addEventListener('click', () => {
      const on = darkTile.classList.toggle('is-dark');
      chain.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  // ---- Sprach-Kachel: Globus-Lottie (Hover) ----
  initFeatureLangLottie(section);

  // ---- TIER 1: Autoplay-Accordion (≥lg + JS) / Basis-Stapel sonst ----
  initFeatureAccordion(section);

  if (prefersReducedMotion) return;

  // ---- Header-Reveal: Mask-Zeile + Marker-Wipe → Subline ----
  const maskIns = gsap.utils.toArray<HTMLElement>('#features .ft-head .ft-mask-in');
  const headHls = gsap.utils.toArray<HTMLElement>('#features .ft-head .marker__bg');
  const sub = section.querySelector<HTMLElement>('[data-ft-sub]');
  const headTl = gsap.timeline({
    scrollTrigger: { trigger: '#features .ft-head', start: 'top 82%', once: true },
    defaults: { ease: 'power3.out' },
  });
  if (maskIns.length) headTl.from(maskIns, { yPercent: 110, duration: 0.9 }, 0);
  if (headHls.length)
    headTl.from(headHls, { scaleX: 0, skewX: -8, transformOrigin: 'left center', duration: 0.5, ease: 'power2.out' }, 0.35);
  if (sub) headTl.from(sub, { autoAlpha: 0, y: 18, duration: 0.6 }, 0.5);

  // ---- TIER 2: Bento-Reveal (Titel-Marker + Kacheln) ----
  const bentoIns = gsap.utils.toArray<HTMLElement>('#features .ft-bento-title .ft-mask-in');
  const bentoHls = gsap.utils.toArray<HTMLElement>('#features .ft-bento-title .marker__bg');
  const tiles = gsap.utils.toArray<HTMLElement>('#features .ft-tile');
  const bentoTl = gsap.timeline({
    scrollTrigger: { trigger: '#features .ft-bento-wrap', start: 'top 80%', once: true },
    defaults: { ease: 'power3.out' },
  });
  if (bentoIns.length) bentoTl.from(bentoIns, { yPercent: 110, duration: 0.8 }, 0);
  if (bentoHls.length)
    bentoTl.from(bentoHls, { scaleX: 0, skewX: -8, transformOrigin: 'left center', duration: 0.5, ease: 'power2.out' }, 0.3);
  if (tiles.length) bentoTl.from(tiles, { autoAlpha: 0, y: 22, duration: 0.55, stagger: 0.08 }, 0.35);
}

/**
 * Vorteils-Icons (3c) als Lottie — LAZY. lottie-web (light build) erst per
 * dynamischem Import laden, wenn die 3c-Sektion nahe/im Viewport ist. Die JSONs
 * sind dunkel gefärbt (helle Vorlage) → zur Laufzeit auf CD-Gelb umfärben, damit
 * sie auf dem dunklen BG lesbar sind. Autoplay + Loop, via IntersectionObserver
 * pausiert außerhalb des Viewports. Fällt eine Datei aus, bleibt ihr Fallback-SVG.
 * reduced-motion ruft diese Funktion NICHT auf → statische Fallback-SVGs.
 */
// Rekursiv jede solide Füll-/Strichfarbe (c.a===0, k=[r,g,b,a]) auf die Zielfarbe setzen.
function recolorLottie(node: unknown, rgb: number[]): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const n of node) recolorLottie(n, rgb);
    return;
  }
  const o = node as Record<string, unknown>;
  const c = o.c as { a?: number; k?: number[] } | undefined;
  if (c && c.a === 0 && Array.isArray(c.k) && c.k.length === 4) {
    c.k = [rgb[0], rgb[1], rgb[2], c.k[3]];
  }
  for (const key in o) {
    if (key === 'c') continue;
    recolorLottie(o[key], rgb);
  }
}

function initBenefitLottie() {
  const holders = gsap.utils.toArray<HTMLElement>('[data-p3-lottie]');
  const section = document.querySelector<HTMLElement>('#problem.problem3c');
  if (!holders.length || !section) return;

  const YELLOW_RGB = [1, 0.941, 0.235]; // #fff03c
  let loaded = false;

  const load = async () => {
    if (loaded) return;
    loaded = true;
    type LottieAnim = {
      play: () => void;
      pause: () => void;
      setSpeed: (n: number) => void;
      addEventListener: (ev: string, cb: () => void) => void;
    };
    let lottie: { loadAnimation: (cfg: Record<string, unknown>) => LottieAnim };
    try {
      const mod = (await import('lottie-web/build/player/lottie_light')) as unknown as {
        default: typeof lottie;
      };
      lottie = mod.default;
    } catch {
      return; // Lib nicht ladbar → Fallback-SVGs bleiben stehen
    }
    for (const holder of holders) {
      const src = holder.getAttribute('data-lottie-src');
      if (!src) continue;
      try {
        const res = await fetch(src);
        const data = await res.json();
        recolorLottie(data, YELLOW_RGB);
        holder.innerHTML = ''; // Fallback-SVG entfernen, Lottie übernimmt
        const anim = lottie.loadAnimation({
          container: holder,
          renderer: 'svg',
          loop: true,
          autoplay: false,
          animationData: data,
        });
        anim.setSpeed(0.5); // ruhiger, halbe Geschwindigkeit (0.4–0.6)
        // Kleine Pause zwischen den Loops → nicht hektisch. Nur wenn im Viewport.
        let visible = false;
        let paused = false;
        anim.addEventListener('loopComplete', () => {
          if (paused || !visible) return;
          paused = true;
          anim.pause();
          window.setTimeout(() => {
            paused = false;
            if (visible) anim.play();
          }, 800);
        });
        // Play/Pause nach Sichtbarkeit (Performance).
        const io = new IntersectionObserver((entries) => {
          visible = entries[0]?.isIntersecting ?? false;
          if (visible && !paused) anim.play();
          else anim.pause();
        });
        io.observe(holder);
      } catch {
        /* dieses Icon behält sein Fallback-SVG */
      }
    }
  };

  // Lazy: laden, sobald die Sektion nahe ist (rootMargin ~300px).
  const near = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        load();
        near.disconnect();
      }
    },
    { rootMargin: '300px' },
  );
  near.observe(section);
}

// Läuft IMMER (auch reduced-motion / mobil): reine Text-Aktualisierung der
// Lockscreen-Uhr, keine Bewegung. Ohne JS bleibt der Fallback „09:41".
initPortaleClock();

// Above-the-fold SOFORT nach dem Parsen: Cursor + der komplette Hero-Auftritt.
// Nichts hiervon versteckt das LCP-Element (Front-Phone bleibt sichtbar) → kein
// LCP-Einfluss.
if (!prefersReducedMotion) {
  initCursor();
  initHeroReveal();
  initPhoneCluster();
  initHeroNotifications();
  initHeroChoreography();
  initHeroCanvas();
  initHeroScrollCue();
}

// Alles Below-the-fold ERST nach dem First Paint (requestIdleCallback, Fallback
// setTimeout). Grund: Lenis + die Below-fold-ScrollTrigger messen beim Setup
// synchron Layout; liefen sie im LCP-Fenster mit, verlängerten sie über Style-&-
// Layout-Thrash den LCP-Render-Delay und die Total Blocking Time. initFeatures läuft
// IMMER (Dark-Toggle-Interaktion; Bewegungsteile intern per prefersReducedMotion
// gegated) und NACH initSmoothScroll, damit Lenis steht, bevor dessen ScrollTrigger
// greifen.
const runIdle = (fn: () => void): void => {
  if ('requestIdleCallback' in window) {
    (
      window as unknown as {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void;
      }
    ).requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 200);
  }
};

// R1 (Fehler-Isolation): Jeder Init im Idle-Bündel einzeln gekapselt. Ein Wurf in
// einem Init darf NIE die nachfolgenden Inits im selben Callback mitreißen (sonst
// bleiben ganze Sektionen im versteckten Startzustand = leer). Fehler werden
// geloggt, nicht verschluckt.
const safeInit = (name: string, fn: () => void): void => {
  try {
    fn();
  } catch (err) {
    console.error(`[init] „${name}" fehlgeschlagen (andere Sektionen laufen weiter):`, err);
  }
};

runIdle(() => {
  if (!prefersReducedMotion) {
    let lenis: ReturnType<typeof initSmoothScroll> | null = null;
    safeInit('SmoothScroll', () => {
      lenis = initSmoothScroll();
    });
    if (lenis) safeInit('AnchorScroll', () => initAnchorScroll(lenis!));
    safeInit('Problem3c', () => initProblem3c());
    safeInit('BenefitLottie', () => initBenefitLottie());
    safeInit('Portale', () => initPortale());
    safeInit('Ablauf', () => initAblauf());
    safeInit('Bewertungen', () => initBewertungen());
    safeInit('Preise', () => initPreise());
    safeInit('Reveals', () => initReveals());
  }
  safeInit('Features', () => initFeatures());

  // R4: Nach dem gebündelten (verzögerten) Setup EINMAL die Trigger-Positionen neu
  // berechnen. Nötig, weil die Triggers erst nach dem window-'load'-Auto-Refresh von
  // ScrollTrigger erstellt werden — ohne dieses Refresh können ihre Start-/End-Marken
  // veraltet sein und beim Scrollen nicht sauber feuern.
  safeInit('ScrollTrigger.refresh', () => ScrollTrigger.refresh());
});
