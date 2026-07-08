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
  const marks = gsap.utils.toArray<HTMLElement>('#hero .mark-hl');
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
      { scaleX: 0, duration: 0.5, ease: 'power2.out', stagger: 0.12 },
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
  const front = document.querySelector<HTMLElement>('#hero [data-phone-front]');
  const backs = gsap.utils.toArray<HTMLElement>('#hero [data-phone-back]');

  // a) Haupt-Phone zuerst: Auftritt von leicht transparent auf voll.
  //    (Start um HERO_START_DELAY verzögert — kurze Ruhe am Anfang.)
  //    Desktop: Fade + Scale (unverändert). Mobile: dezenter Rise von +24px
  //    (ohne Scale) — Teil der komponierten Mobile-Auftritts-Sequenz
  //    (Headline → Marker → Phone-Rise → Notification).
  if (front) {
    if (isDesktopHero) {
      gsap.from(front, {
        autoAlpha: 0,
        scale: 0.9,
        duration: 0.7,
        ease: 'power3.out',
        delay: HERO_START_DELAY,
      });
    } else {
      gsap.from(front, {
        autoAlpha: 0,
        y: 24,
        duration: 0.6,
        ease: 'power3.out',
        delay: HERO_START_DELAY,
      });
    }
  }

  // b) Danach hintere Phones aufrecht seitlich hervorfahren (gestaffelt).
  //    Start = deckungsgleich hinter dem Front-Phone (xPercent 0), aufrecht.
  //    transform-origin OBEN (50% 0%) → beim Skalieren bleibt die Oberkante
  //    verankert; mit positivem yPercent liegen die Oberkanten unter der Notch.
  //    Muss zur Hero.astro-CSS passen. x:0/y:0 neutralisieren geerbten px-Versatz.
  //    NUR Desktop: mobil sind die hinteren Phones ausgeblendet (hidden md:block).
  if (!isDesktopHero) return;
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
        delay: HERO_START_DELAY + 0.7 + i * 0.15, // nach dem Haupt-Phone, gestaffelt
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
 * Problem „3c": die Zahl „43.000" FORMT sich aus Partikeln (erprobter Sampling-
 * Algorithmus) — EIGENE, vom Hero vollständig entkoppelte Canvas-Instanz.
 *
 *  - FONT-GATE: erst sampeln/zeichnen, wenn Roboto Black geladen ist
 *    (`document.fonts.load('900 250px Roboto')`) — sonst würde die Zahl leer/kaputt
 *    gesampelt (das war der alte Bug).
 *  - SAMPLING: „43.000" auf ein Offscreen-Canvas zeichnen, Alpha-Pixel abtasten →
 *    Ziel-Positionen; pro Ziel ein Partikel, das aus zufälliger Startlage zum Ziel
 *    east → die Zahl entsteht.
 *  - MAUS-REPEL nur Desktop (pointer:fine); Touch: kein Repel.
 *  - „DU"-MOMENT (~2300ms): das Partikel nahe der Zahl-Mitte wächst, wird gelb mit
 *    Glow + winziges „du"/„you"-Label; ~400ms später Reveal der Headline-Gruppe.
 *  - TRIGGER: Formung startet, sobald die Sektion in den Viewport scrollt.
 *  - Läuft NUR im no-preference-Block. reduced-motion / ohne JS: statische „43.000"
 *    (DOM-Text) + Headline sofort sichtbar (Reveal ist reine JS-Zugabe). DPR ≤ 2.
 */
async function initProblem3c() {
  const section = document.querySelector<HTMLElement>('#problem.problem3c');
  const stage = document.querySelector<HTMLElement>('[data-p3-stage]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-p3-canvas]');
  const numEl = document.querySelector<HTMLElement>('[data-p3-num]');
  if (!section || !stage || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fine = window.matchMedia('(pointer: fine)').matches;
  const YELLOW = '#fff03c';
  const duLabel = section.querySelector('.mark')?.textContent?.trim() || 'du';

  // Headline-Gruppe initial verbergen — NUR JS-Zugabe (ohne JS/reduced-motion sichtbar).
  const reveals = gsap.utils.toArray<HTMLElement>('#problem [data-p3-reveal]');
  if (reveals.length) gsap.set(reveals, { autoAlpha: 0, y: 22 });
  let revealed = false;
  const doReveal = () => {
    if (revealed) return;
    revealed = true;
    if (reveals.length) {
      gsap.to(reveals, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.08,
      });
    }
  };

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  type P = { x: number; y: number; hx: number; hy: number; delay: number; size: number; du: boolean };
  let parts: P[] = [];
  let W = 0;
  let H = 0;
  let started = false;
  let startT = 0;
  let duPicked = false;
  let duP: P | null = null;
  let duStart = 0;
  let duGrow = 0;
  // Größen skalieren mit der (jetzt großen) Zahl — in setup() gesetzt.
  let pSize = 2.5; // Basis-Partikelgröße
  let duMax = 7.5; // „du"-Partikel-Endgröße
  let duLabelPx = 15; // „du"-Label-Schriftgröße
  let duLabelDy = 14; // „du"-Label-Abstand über dem Partikel
  let numTop = 0; // Oberkante der Zahl (Canvas-px) — für den „du"-Zielpunkt
  let numH = 0; // Höhe der Zahl (Canvas-px)

  // FONT-GATE (Grund des alten Bugs): erst nach dem Laden der Schrift sampeln.
  try {
    await (document.fonts?.load('900 300px Roboto') ?? Promise.resolve());
  } catch {
    /* Font-API nicht verfügbar → best effort */
  }

  const setup = () => {
    const stageW = stage.clientWidth;
    if (!stageW) return;
    W = stageW;

    // Font DYNAMISCH aus der Stage-/Sektionsbreite: „43.000" füllt ~80% der Breite
    // → DOMINANTER Blickfang. KEINE künstliche Deckelung (kein 1/250px) mehr; nur ein
    // dezenter Höhen-Guard (Zahl soll den Viewport vertikal nicht sprengen).
    const measurer = document.createElement('canvas').getContext('2d');
    if (!measurer) return;
    measurer.font = '900 100px Roboto';
    const w100 = measurer.measureText('43.000').width || 300;
    const targetW = stageW * 0.8; // Zielbreite der Zahl (~80% der Stage)
    let fontPx = Math.round((100 * targetW) / w100);
    // Höhen-Guard: Ziffernhöhe max ~40% der Viewporthöhe (sonst überläuft die Zahl).
    fontPx = Math.max(56, Math.min(fontPx, Math.round(window.innerHeight * 0.4)));

    // Verifikation (einmalig): finale Font-px + Verhältnis Zahlbreite/Stage-Breite.
    if (!(window as unknown as { __p3logged?: boolean }).__p3logged) {
      (window as unknown as { __p3logged?: boolean }).__p3logged = true;
      const numW = (measurer.measureText('43.000').width / 100) * fontPx;
      // eslint-disable-next-line no-console
      console.info(
        `[3c] Stage ${Math.round(stageW)}px · Font ${fontPx}px · Zahlbreite ${Math.round(numW)}px (${Math.round((numW / stageW) * 100)}% der Stage)`,
      );
    }

    const ow = stageW; // Offscreen = volle Stage-Breite (Zahl zentriert)
    const oh = Math.round(fontPx * 1.1); // knappe Höhe (Ziffern haben keine Unterlängen)
    // Stage-Höhe an die Zahl koppeln (≈13% Luft oben/unten) → Satz bleibt ENG darunter.
    H = Math.round(oh / 0.8);
    stage.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // in CSS-px zeichnen

    // Offscreen: „43.000" groß zeichnen und Alpha-Pixel abtasten.
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

    const offX = (W - ow) / 2; // = 0 (Zahl füllt die Stage-Breite)
    const offY = H * 0.14;

    // DICHTE: kleine Schrittweite (scharfe, definierte Ziffern), aber Gesamtzahl
    // deckeln (Performance-Budget, flüssig auf Mobile) — bei Überschreitung gröber.
    const CAP = fine ? 4000 : 1800;
    let step = fine ? 4 : 5;
    let next: P[] = [];
    for (let iter = 0; iter < 8; iter++) {
      next = [];
      for (let y = 0; y < oh; y += step) {
        for (let x = 0; x < ow; x += step) {
          if (data[(y * ow + x) * 4 + 3] > 128) {
            next.push({
              x: Math.random() * W,
              y: Math.random() * H,
              hx: x + offX,
              hy: y + offY,
              delay: Math.random() * 900,
              size: pSize,
              du: false,
            });
          }
        }
      }
      if (next.length <= CAP) break;
      step += 1; // zu viele Partikel → eine Stufe gröber sampeln
    }

    // „du"-/Partikel-Größen mit der großen Zahl skalieren (skalieren mit).
    pSize = Math.max(2.2, fontPx / 95);
    duMax = pSize * 3;
    duLabelPx = Math.max(13, Math.round(fontPx * 0.085));
    duLabelDy = duMax + Math.max(6, Math.round(fontPx * 0.03));
    for (const p of next) p.size = pSize;
    numTop = offY;
    numH = oh;

    parts = next;
    duPicked = false;
    duP = null;
    duGrow = 0;
    // Nur wenn wirklich Partikel gesampelt wurden, die DOM-Zahl verstecken (sonst
    // bliebe die Fläche leer). DOM-Zahl bleibt für a11y/SEO/No-JS im Markup.
    if (numEl) numEl.style.opacity = parts.length ? '0' : '';
  };

  setup();

  // Maus relativ zur Stage (nur Desktop).
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
    const elapsed = started ? now - startT : 0;

    // „DU"-Moment: nach ~2300ms das der Zahl-Mitte nächste Partikel wählen.
    if (started && !duPicked && elapsed >= 2300 && parts.length) {
      const tx = W / 2;
      const ty = numTop + numH * 0.5; // Mitte der Zahl (skaliert mit der Größe)
      let best = parts[0];
      let bd = Infinity;
      for (const p of parts) {
        const d = (p.hx - tx) * (p.hx - tx) + (p.hy - ty) * (p.hy - ty);
        if (d < bd) {
          bd = d;
          best = p;
        }
      }
      best.du = true;
      duP = best;
      duPicked = true;
      duStart = now;
      gsap.delayedCall(0.4, doReveal); // Reveal ~400ms nach dem „du"-Partikel
    }

    for (const p of parts) {
      // Formung: nach Ablauf des delays zum Ziel easen.
      if (started && elapsed > p.delay) {
        p.x += (p.hx - p.x) * 0.075;
        p.y += (p.hy - p.y) * 0.075;
      }
      // Maus-Repel (nur Desktop): d² < 62² = 3844.
      if (fine) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 3844 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = ((62 - d) / 62) * 4.5;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
      }
      // „du"-Partikel wächst pSize→duMax über 500ms (skaliert mit der Zahlgröße).
      if (p.du) {
        duGrow = Math.min(1, (now - duStart) / 500);
        p.size = pSize + duGrow * (duMax - pSize);
      }
      if (p.du) {
        ctx.fillStyle = YELLOW;
        ctx.shadowColor = YELLOW;
        ctx.shadowBlur = duMax * 1.8;
      } else {
        ctx.fillStyle = 'rgba(220,221,220,0.66)';
        ctx.shadowBlur = 0;
      }
      const s = p.size;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.shadowBlur = 0;

    // Winziges „du"/„you"-Label ab halbem Wachstum, knapp über dem Partikel.
    if (duP && duGrow >= 0.5) {
      ctx.fillStyle = YELLOW;
      ctx.font = `700 ${duLabelPx}px Roboto`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(duLabel, duP.x, duP.y - duLabelDy);
    }

    rafId = requestAnimationFrame(loop);
  };

  // TRIGGER: Formung startet beim Scrollen in die Sektion.
  ScrollTrigger.create({
    trigger: section,
    start: 'top 75%',
    once: true,
    onEnter: () => {
      if (!started) {
        started = true;
        startT = performance.now();
        // Sicherheitsnetz: Headline SPÄTESTENS ~2,7s nach Eintritt einblenden —
        // auch falls der Loop (schnelles Wegscrollen) den „du"-Moment nie erreicht.
        gsap.delayedCall(2.7, doReveal);
      }
    },
  });

  // Loop nur laufen lassen, wenn die Sektion sichtbar ist (Performance).
  const io = new IntersectionObserver((entries) => {
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
  });
  io.observe(section);

  // Resize: sauber neu aufsetzen (Partikel + Stage-Höhe). Läuft die Formung schon,
  // re-formt sie aus neuen Startlagen; „du"/Reveal-Zustand bleibt (revealed-Latch).
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      setup();
      if (started) startT = performance.now();
    }, 150);
  });
}

function initReveals() {
  // Convention: Elemente mit [data-reveal] gleiten dezent herein.
  const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  targets.forEach((el) => {
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
 * Dunkel-Übergang Hero → 3c: scroll-gescrubbte Opacity-Ebene (0 → 1) über dem
 * GESAMTEN Hero-Inhalt (Text, Phones, Konstellation-Canvas; z-20 > deren z ≤ 10,
 * aber < Nav-Pille z-40 → Nav bleibt lesbar). Overlay-Farbe = #3b3b3a = exakt die
 * 3c-Sektionsfarbe → nahtlos, kein Farbsprung an der Grenze.
 *
 * Rampe (leicht justierbar): Abdunkeln beginnt bei ~40% durch den Hero und erreicht
 * VOLLE Deckung (opacity 1.0) bereits bei ~85% → die letzten 15% des Hero-Scrolls
 * sind komplett dunkel, sodass am 3c-Eintritt keine Kante/kein Sprung sichtbar ist.
 * An Lenis gehängt (ScrollTrigger.update hängt an Lenis' scroll) — KEIN Pin, KEIN
 * preventDefault, KEIN Auto-Jump. Nur opacity.
 */
const HERO_DARK_START = '40% top'; // Beginn der Abdunkelung (~40% durch den Hero)
const HERO_DARK_END = '85% top'; // volle Deckung (opacity 1.0) bei ~85% des Hero-Scrolls
function initHeroDarkOverlay() {
  const overlay = document.querySelector<HTMLElement>('[data-hero-dark]');
  if (!overlay) return;
  gsap.fromTo(
    overlay,
    { opacity: 0 },
    {
      opacity: 1, // Endwert VOLL dunkel (#3b3b3a deckt den Hero komplett)
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: HERO_DARK_START,
        end: HERO_DARK_END,
        scrub: true,
      },
    },
  );
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

if (!prefersReducedMotion) {
  const lenis = initSmoothScroll();
  initAnchorScroll(lenis);
  initCursor();
  initHeroReveal();
  initPhoneCluster();
  initHeroNotifications();
  initHeroChoreography();
  initHeroCanvas();
  initHeroScrollCue();
  initHeroDarkOverlay();
  initProblem3c();
  initBenefitLottie();
  initReveals();
}
