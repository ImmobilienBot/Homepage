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
}

/**
 * Problem-Sektion: Scroll-Text-Fill. Wörter fluten beim Scrollen von ausgegraut
 * auf volle CD-Farbe (scrub), Emphasis-Marker wischen gelb herein.
 * (Farbe = Paint-only, kein Layout — bewusste Ausnahme für diesen Signature-Move.)
 */
function initProblemFill() {
  const el = document.querySelector<HTMLElement>('#problem [data-problem]');
  if (!el) return;
  const words = gsap.utils.toArray<HTMLElement>('#problem .fill-word');
  const marks = gsap.utils.toArray<HTMLElement>('#problem .em-mark');
  if (!words.length) return;

  const cs = getComputedStyle(document.documentElement);
  const full = cs.getPropertyValue('--color-black').trim() || '#3b3b3a';
  const muted = cs.getPropertyValue('--color-grey-yellow').trim() || '#c0c0c1';

  const tl = gsap.timeline({
    scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 55%', scrub: 0.4 },
  });
  tl.fromTo(words, { color: muted }, { color: full, ease: 'none', stagger: { each: 0.4 } }, 0);
  if (marks.length) {
    tl.fromTo(marks, { scaleX: 0 }, { scaleX: 1, ease: 'none', stagger: { each: 0.4 } }, 0.1);
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
  initProblemFill();
  initReveals();
}
