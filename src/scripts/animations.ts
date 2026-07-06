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
 * Aufgefächerter Phone-Cluster: die beiden hinteren Phones fahren beim Laden
 * aus der Front-Position (deckungsgleich, ungedreht) in ihre gefächerte
 * Ruhelage heraus (gestaffelt). Die Ruhelage steht auch in Hero.astro-CSS
 * (Fallback ohne JS); die Werte hier MÜSSEN dazu passen.
 * Rein additiv (gsap.from): ohne JS sitzen die Phones sofort im Fächer.
 */
const FAN_REST = {
  left: { xPercent: -34, yPercent: 6, rotation: -8, scale: 0.84 },
  right: { xPercent: 33, yPercent: 9, rotation: 8, scale: 0.82 },
} as const;

function initPhoneFan() {
  const backs = gsap.utils.toArray<HTMLElement>('#hero [data-phone-back]');
  if (!backs.length) return;

  backs.forEach((el, i) => {
    const rest = FAN_REST[el.dataset.fan as keyof typeof FAN_REST];
    if (!rest) return;
    // Startzustand = Front-Position (deckungsgleich, ungedreht, volle Größe).
    // x:0/y:0 neutralisieren den aus dem CSS-translate(%) geerbten px-Versatz;
    // der Fächer wird über xPercent/yPercent gefahren (= identisch zur CSS-Ruhelage).
    // Endzustand entspricht exakt der CSS-Fallback-Position → nahtloser Übergang.
    gsap.fromTo(
      el,
      { x: 0, y: 0, xPercent: 0, yPercent: 0, rotation: 0, scale: 1 },
      {
        xPercent: rest.xPercent,
        yPercent: rest.yPercent,
        rotation: rest.rotation,
        scale: rest.scale,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.5 + i * 0.14, // nach dem Headline-Auftakt, gestaffelt
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

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 1.5 });

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
 * Schwebende gelbe Punkte im Hero-Hintergrund — driften langsam und WEICHEN
 * dem Mauszeiger aus (Repel bei Nähe, weich zurückfedernd). Nur Desktop
 * (pointer:fine); auf Mobile & bei prefers-reduced-motion komplett aus (die
 * Funktion wird dann gar nicht erst aufgerufen). Eine einzige rAF-Schleife,
 * günstige quadratische Distanzprüfung, transform-only.
 */
function initHeroDots() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const layer = document.querySelector<HTMLElement>('#hero [data-dots]');
  const hero = document.querySelector<HTMLElement>('#hero');
  if (!layer || !hero) return;

  const COUNT = 30;
  const REPEL = 130; // px Wirkradius des Cursors
  const REPEL_SQ = REPEL * REPEL;

  type Dot = {
    el: HTMLElement;
    hx: number; hy: number;   // Heimatposition (px, relativ zum Hero)
    x: number; y: number;     // aktuelle Position
    vx: number; vy: number;   // Geschwindigkeit
    ph: number; amp: number; sp: number; // Drift-Phase/Amplitude/Speed
  };

  const dots: Dot[] = [];
  let W = hero.clientWidth;
  let H = hero.clientHeight;

  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'hero-dot';
    const size = 5 + Math.random() * 7; // 5–12px
    // WICHTIG: Astro-scoped CSS (.hero-dot) greift NICHT bei per JS erzeugten
    // Elementen (ihnen fehlt das data-astro-cid-Attribut) → deshalb waren die
    // Punkte transparent/positionslos und unsichtbar. Alles Nötige inline setzen.
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = '9999px';
    el.style.backgroundColor = '#fff03c'; // CD-Gelb
    el.style.opacity = `${0.5 + Math.random() * 0.4}`;
    el.style.willChange = 'transform';
    layer.appendChild(el);
    const hx = Math.random() * W;
    const hy = Math.random() * H;
    dots.push({
      el,
      hx, hy,
      x: hx, y: hy,
      vx: 0, vy: 0,
      ph: Math.random() * Math.PI * 2,
      amp: 8 + Math.random() * 16,
      sp: 0.4 + Math.random() * 0.5,
    });
  }

  // Cursor relativ zum Hero; -1 = außerhalb (kein Repel).
  let mx = -1, my = -1;
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  }, { passive: true });
  hero.addEventListener('mouseleave', () => { mx = -1; my = -1; });

  const onResize = () => {
    const nW = hero.clientWidth;
    const nH = hero.clientHeight;
    // Heimatpositionen proportional mitskalieren, damit sie im Bild bleiben.
    for (const d of dots) {
      d.hx = (d.hx / W) * nW;
      d.hy = (d.hy / H) * nH;
    }
    W = nW; H = nH;
  };
  window.addEventListener('resize', onResize);

  // rAF nur, während der Hero sichtbar ist (spart CPU).
  let running = false;
  let t = 0;
  const io = new IntersectionObserver((entries) => {
    const vis = entries[0]?.isIntersecting ?? false;
    if (vis && !running) { running = true; requestAnimationFrame(tick); }
    if (!vis) running = false;
  });
  io.observe(hero);

  function tick() {
    if (!running) return;
    t += 0.016;
    for (const d of dots) {
      // Langsame Drift um die Heimatposition (Sinus).
      const tx = d.hx + Math.cos(t * d.sp + d.ph) * d.amp;
      const ty = d.hy + Math.sin(t * d.sp * 0.9 + d.ph) * d.amp;
      // Federkraft zurück zum Drift-Ziel.
      d.vx += (tx - d.x) * 0.02;
      d.vy += (ty - d.y) * 0.02;
      // Cursor-Repel (nur innerhalb des Radius; quadratisch, keine sqrt außer im Treffer).
      if (mx >= 0) {
        const dx = d.x - mx;
        const dy = d.y - my;
        const distSq = dx * dx + dy * dy;
        if (distSq < REPEL_SQ && distSq > 0.01) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / REPEL) * 6;
          d.vx += (dx / dist) * force;
          d.vy += (dy / dist) * force;
        }
      }
      // Dämpfung + Integration.
      d.vx *= 0.86;
      d.vy *= 0.86;
      d.x += d.vx;
      d.y += d.vy;
      d.el.style.transform = `translate(${d.x}px, ${d.y}px)`;
    }
    requestAnimationFrame(tick);
  }
}

/**
 * Eigener Cursor (Signature-Moment) — nur bei pointer:fine.
 * Ruhezustand: dünne Kontur (#3b3b3a) folgt mit leichter, direkter Verzögerung
 * (quickTo ~0.15s), grauer Punkt (#c0c0c1) exakt an der Zeigerposition.
 * Hover über a/button/[data-cursor]: der Ring wird zu einer DURCHSICHTIGEN
 * Invert-Lupe (~2×) — ohne Füllung, ohne Rand, ohne Punkt; backdrop-filter:
 * invert(1) grayscale(1) invertiert das Darunter neutral (auch über Gelb, KEIN
 * mix-blend). Übergänge per GSAP. KEINE Bounding-Box-Umschließung.
 */
function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const ring = document.querySelector<HTMLElement>('[data-cursor-ring]');
  const dot = document.querySelector<HTMLElement>('[data-cursor-dot]');
  if (!ring || !dot) return;

  document.documentElement.classList.add('has-custom-cursor');
  gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });

  // Ring: leichte, aber direkte Verzögerung. Punkt: quasi exakt.
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.15, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.15, ease: 'power3' });
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.05, ease: 'power2' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.05, ease: 'power2' });

  window.addEventListener(
    'mousemove',
    (e) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    },
    { passive: true },
  );

  const LENS = 'invert(1) grayscale(1)';
  let hovering: Element | null = null;

  const setHover = (on: boolean) => {
    if (on) {
      // Invert-Lupe: sofort Filter an, dann weich vergrößern; Rand/Füllung weg.
      ring.style.backdropFilter = LENS;
      (ring.style as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter = LENS;
      gsap.to(ring, {
        scale: 2,
        borderColor: 'rgba(59,59,58,0)',
        backgroundColor: 'rgba(59,59,58,0)',
        duration: 0.25,
        ease: 'power3',
        overwrite: 'auto',
      });
      gsap.to(dot, { autoAlpha: 0, duration: 0.15, ease: 'power2', overwrite: 'auto' });
    } else {
      gsap.to(ring, {
        scale: 1,
        borderColor: 'rgba(59,59,58,1)',
        duration: 0.25,
        ease: 'power3',
        overwrite: 'auto',
        onComplete: () => {
          // Filter erst nach dem Zurückschrumpfen entfernen (weicher Ausklang),
          // aber nur wenn nicht sofort wieder gehovert wurde.
          if (!hovering) {
            ring.style.backdropFilter = 'none';
            (ring.style as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter = 'none';
          }
        },
      });
      gsap.to(dot, { autoAlpha: 1, duration: 0.25, ease: 'power2', overwrite: 'auto' });
    }
  };

  const sel = 'a, button, [data-cursor], input, textarea, select, label, summary';
  document.addEventListener('mouseover', (e) => {
    const el = (e.target as Element).closest?.(sel);
    if (!el || el === hovering) return;
    hovering = el;
    setHover(true);
  });
  document.addEventListener('mouseout', (e) => {
    const el = (e.target as Element).closest?.(sel);
    if (!el || el !== hovering) return;
    const related = (e as MouseEvent).relatedTarget as Node | null;
    if (related && el.contains(related)) return; // noch innerhalb desselben Elements
    hovering = null;
    setHover(false);
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
  initPhoneFan();
  initHeroNotifications();
  initHeroChoreography();
  initHeroDots();
  initProblemFill();
  initReveals();
}
