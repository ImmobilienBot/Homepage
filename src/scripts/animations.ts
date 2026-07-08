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

  // Invert-Zustand in der dunklen Story-Sektion: Ring + Punkt auf Off-White,
  // damit der Cursor auf dunklem BG nicht untergeht (CSS: html.cursor-invert).
  // pointerenter/leave bubbeln nicht → sauberer Wechsel an der Sektionsgrenze.
  const darkSection = document.querySelector<HTMLElement>('.story-dark');
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
 * Problem → Lösung: cinematischer Dark-to-Light-Scroll (ein Storytelling-Bogen).
 *
 * GEPINNTE Scroll-Story via GSAP ScrollTrigger (pin + scrub), sauber über Lenis
 * (ScrollTrigger.update hängt an Lenis' scroll; KEIN wheel/touch-preventDefault,
 * KEIN Auto-Jump — frei scrollbar):
 *  - DIM-IN (onEnter #problem, vor dem Pin): Overlay 0→1; reverse nur nach oben.
 *  - PIN+SCRUB: der 100svh-Stage wird gepinnt; beim Scrubben Crossfade zwischen
 *    den absolut gestapelten Beats (alter Beat unscharf[Desktop]+transparent nach
 *    oben, neuer scharf von unten). Fortschrittsbalken = Scrub-Progress.
 *  - Zahlen-Counter: echte Statistik (KEIN Live-Zähler) — je Zahl EINMAL beim
 *    Erreichen des Beats (tl.call + Latch), tabular-nums/feste Breite → kein CLS.
 *  - LICHT-AN: HARTER, schneller Cut 1→0 (~140ms) + EIN Weiß-Blitz (kein
 *    Stroboskop); Lösung vorher verborgen (gsap.set), erscheint erst danach.
 *    Zwei Wege: Scroll bis Lösungs-Panel ODER Ketten-Klick (Zustand direkt,
 *    KEINE gecachten Pixel → Klick-Bug bleibt behoben).
 *
 * Guardrail: läuft NUR im (prefers-reduced-motion:no-preference)-Block. Bei
 * reduced-motion / ohne JS: kein Pin/Scrub/Blur, Beats statisch untereinander,
 * Overlay 0 (hell), Zahlen Endwert, Lösung sichtbar, keine Kette/kein Blitz.
 */
function initProblemStory(lenis: Lenis) {
  const story = document.querySelector<HTMLElement>('[data-story]');
  const overlay = document.querySelector<HTMLElement>('[data-story-overlay]');
  const flash = document.querySelector<HTMLElement>('[data-story-flash]');
  if (!story || !overlay) return;

  const pinStage = document.querySelector<HTMLElement>('[data-pin-stage]');
  const beatTrack = document.querySelector<HTMLElement>('[data-problem]');
  const beats = gsap.utils.toArray<HTMLElement>('#problem [data-beat]');
  const progress = document.querySelector<HTMLElement>('[data-progress]');
  const progressFill = document.querySelector<HTMLElement>('[data-progress-fill]');
  const solPanel = document.querySelector<HTMLElement>('#loesung');
  const solItems = gsap.utils.toArray<HTMLElement>('#loesung [data-sol-item]');

  // Lösung vor dem Licht-an komplett verbergen (kein Durchscheinen auf Dunkel).
  if (solItems.length) gsap.set(solItems, { autoAlpha: 0, y: 24 });

  const nf = new Intl.NumberFormat(
    document.documentElement.lang === 'en' ? 'en-US' : 'de-DE',
  );
  // Blur (ausscrollender Beat) NUR Desktop/pointer:fine — sonst nur opacity/transform.
  const canBlur = window.matchMedia('(pointer: fine)').matches;

  // Zahlen initial auf 0 (Beats sind beim Laden unter dem Falz → kein Flash).
  gsap.utils.toArray<HTMLElement>('#problem .fill-num').forEach((el) => {
    el.textContent = nf.format(0);
  });
  // Counter läuft je Zahl EINMAL (Latch via dataset), wenn der Beat eintrifft.
  const fireCounters = (beatEl: HTMLElement) => {
    beatEl.querySelectorAll<HTMLElement>('.fill-num').forEach((el) => {
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      const target = parseInt(el.dataset.countTo || '0', 10);
      if (!target) return;
      const proxy = { v: 0 };
      gsap.to(proxy, {
        v: target,
        duration: 1.1,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = nf.format(Math.round(proxy.v));
        },
        onComplete: () => {
          el.textContent = nf.format(target);
        },
      });
    });
  };

  // Weiß-Blitz: GENAU EIN kurzer Hell-Impuls beim Licht-an (kein Stroboskop).
  let flashed = false;
  const doFlash = () => {
    if (flashed || !flash) return;
    flashed = true;
    gsap
      .timeline()
      .to(flash, { opacity: 0.6, duration: 0.06, ease: 'power1.out' })
      .to(flash, { opacity: 0, duration: 0.18, ease: 'power1.in' });
  };
  const showProgress = (on: boolean) => {
    if (progress) gsap.to(progress, { opacity: on ? 1 : 0, duration: 0.3, overwrite: 'auto' });
  };

  // Zustandsgesteuerte Overlay-Übergänge (overwrite:'auto', Latches).
  let darkOn = false;
  let lightOn = false;

  // DIM: dunkel beim Eintritt in die Story (vor dem Pin); reverse nur nach oben raus.
  const turnDark = () => {
    if (darkOn) return;
    darkOn = true;
    gsap.to(overlay, { opacity: 1, duration: 0.5, ease: 'power2.in', overwrite: 'auto' });
    showProgress(true);
  };
  const undimAtStart = () => {
    if (!darkOn) return;
    darkOn = false;
    gsap.to(overlay, { opacity: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    showProgress(false);
  };
  ScrollTrigger.create({
    trigger: '#problem',
    start: 'top 70%',
    onEnter: turnDark,
    onEnterBack: turnDark,
    onLeaveBack: undimAtStart,
  });

  // LICHT-AN: startet zuverlässig über ZWEI Wege mit UNTERSCHIEDLICHER Anmutung:
  //  - KLICK (Kette, hard=true): HARTER Schalter-Cut (~140ms) + EIN Weiß-Blitz —
  //    „klackt" instant an. Der dunkle Track wird NICHT geblurrt (Cut, kein Wisch).
  //  - SCROLL (Story-Ende, hard=false): schneller Blur-Wisch — der ganze dunkle
  //    Ketten-Track wischt unscharf (nur Desktop) + transparent nach OBEN raus, das
  //    Overlay fadet weich weg (Licht an), die Lösung fadet scharf & zentriert herein.
  //    KEIN Blitz. Wir animieren den .beat-track (NICHT die einzelnen, gescrubbten
  //    Beats) → kein Konflikt mit der Scrub-Timeline.
  const turnOnLight = (hard = false) => {
    if (lightOn) return;
    lightOn = true;
    showProgress(false);
    if (hard) {
      doFlash();
      gsap.to(overlay, { opacity: 0, duration: 0.14, ease: 'power2.in', overwrite: 'auto' });
    } else {
      if (beatTrack) {
        gsap.to(beatTrack, {
          autoAlpha: 0,
          yPercent: -8,
          ...(canBlur ? { filter: 'blur(8px)' } : {}),
          duration: 0.4,
          ease: 'power2.in',
          overwrite: 'auto',
        });
      }
      gsap.to(overlay, { opacity: 0, duration: 0.4, ease: 'power2.inOut', overwrite: 'auto' });
    }
    if (solItems.length) {
      gsap.to(solItems, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.06,
        delay: hard ? 0 : 0.1,
        overwrite: 'auto',
      });
    }
  };
  const turnOffLight = () => {
    if (!lightOn) return;
    lightOn = false;
    gsap.to(overlay, { opacity: 1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    showProgress(true);
    // Blur-Wisch zurücknehmen (falls der Scroll-Weg den Track geblurrt hat).
    if (beatTrack) {
      gsap.to(beatTrack, {
        autoAlpha: 1,
        yPercent: 0,
        ...(canBlur ? { filter: 'blur(0px)' } : {}),
        duration: 0.2,
        overwrite: 'auto',
      });
    }
    if (solItems.length) {
      gsap.to(solItems, { autoAlpha: 0, y: 24, duration: 0.2, overwrite: 'auto' });
    }
  };
  // PIN + SCRUB: gepinnte Beat-Story. Die Beats liegen absolut gestapelt in der
  // Mitte; beim Scrubben blendet der alte Beat unscharf (Desktop) + transparent
  // nach oben aus, der neue scharf von unten herein (Crossfade „mitte mitte").
  // Sauber über Lenis (ScrollTrigger.update hängt an Lenis' scroll). Kein Hijack.
  //
  // WICHTIG (Overlay-Timing): Das Overlay bleibt über die GESAMTE gepinnte Story
  // konstant dunkel — es ist NICHT an den Scrub gekoppelt. Der Wechsel auf Hell
  // passiert ausschließlich am ENDE des Pins (onLeave = Story-Ende erreicht) als
  // harter Cut; onEnterBack (zurück in die Story) macht wieder dunkel. Dadurch
  // sind ALLE Problem-Beats dunkel; nur die Lösung dahinter ist hell.
  if (pinStage && beats.length > 1) {
    gsap.set(beats[0], { autoAlpha: 1, yPercent: 0 });
    if (canBlur) gsap.set(beats, { filter: 'blur(0px)' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pinStage,
        start: 'top top',
        // Kürzerer Pin (war +0.5) → weniger Leerweg; der Licht-Wisch triggert
        // früher, der Ketten-Slide „klebt" nicht mehr.
        end: () => '+=' + Math.round(window.innerHeight * (beats.length + 0.1)),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (progressFill) gsap.set(progressFill, { scaleY: self.progress });
        },
        onLeave: () => turnOnLight(false), // Story-Ende → schneller Blur-Wisch
        onEnterBack: turnOffLight, // zurück in die Story → wieder dunkel
      },
    });

    tl.call(fireCounters, [beats[0]], 0.05);
    let pos = 0.8;
    for (let i = 1; i < beats.length; i++) {
      const prev = beats[i - 1];
      const cur = beats[i];
      tl.to(
        prev,
        {
          autoAlpha: 0,
          yPercent: -12,
          ...(canBlur ? { filter: 'blur(6px)' } : {}),
          duration: 0.5,
          ease: 'power1.in',
        },
        pos,
      );
      tl.fromTo(
        cur,
        { autoAlpha: 0, yPercent: 12 },
        { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: 'power1.out' },
        pos,
      );
      tl.call(fireCounters, [cur], pos + 0.3);
      // Letzter Beat (Kette): kurzer Nachlauf statt langem Dwell → der Übergang
      // zur Lösung kommt schnell (kein Kleben).
      pos += i < beats.length - 1 ? 1.5 : 0.7;
    }
    tl.to({}, { duration: 0.25 }); // knapper Auslauf für den letzten Beat (Kette)
  }

  // Kette: Klick schaltet das Licht SOFORT an (Timeline-Zustand direkt) und
  // gleitet per Lenis aufs Lösungs-Panel (Position frisch gelesen). Reines
  // Weiterscrollen bis ans Ende der Story löst dasselbe via ScrollTrigger aus.
  const lamp = document.querySelector<HTMLElement>('[data-lamp]');
  if (lamp && solPanel) {
    lamp.addEventListener('click', () => {
      turnOnLight(true); // Ketten-Klick = HARTER Schalter-Cut (+ Blitz), kein Wisch
      lenis.scrollTo(solPanel, { offset: -40, duration: 0.8 });
    });
  }
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
  initProblemStory(lenis);
  initReveals();
}
