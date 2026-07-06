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
 * Phone-Cluster-Einblendung (Choreografie):
 *   a) Haupt-Phone (Mitte) ploppt zuerst sanft rein (Fade + Scale).
 *   b) DANACH fahren die beiden hinteren Phones AUFRECHT (keine Rotation)
 *      seitlich hinter dem Front-Phone hervor (Peek, gestaffelt).
 * Rein additiv (gsap.from/fromTo): ohne JS steht alles sofort in Ruhelage.
 * Die Ruhelage der hinteren Phones steht auch in Hero.astro-CSS (Fallback);
 * die Werte hier MÜSSEN dazu passen.
 */
const FAN_REST = {
  left: { xPercent: -22, yPercent: 5, scale: 0.9 },
  right: { xPercent: 22, yPercent: 7, scale: 0.88 },
} as const;

function initPhoneCluster() {
  const front = document.querySelector<HTMLElement>('#hero [data-phone-front]');
  const backs = gsap.utils.toArray<HTMLElement>('#hero [data-phone-back]');

  // a) Haupt-Phone zuerst: Fade + Scale von leicht klein/transparent auf voll.
  if (front) {
    gsap.from(front, {
      autoAlpha: 0,
      scale: 0.9,
      duration: 0.7,
      ease: 'power3.out',
    });
  }

  // b) Danach hintere Phones aufrecht seitlich hervorfahren (gestaffelt).
  //    Start = deckungsgleich hinter dem Front-Phone (xPercent 0), aufrecht.
  //    x:0/y:0 neutralisieren den aus CSS-translate(%) geerbten px-Versatz;
  //    Endzustand = exakt die CSS-Ruhelage (nahtloser Übergang).
  backs.forEach((el, i) => {
    const rest = FAN_REST[el.dataset.fan as keyof typeof FAN_REST];
    if (!rest) return;
    gsap.fromTo(
      el,
      { x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, autoAlpha: 0 },
      {
        xPercent: rest.xPercent,
        yPercent: rest.yPercent,
        scale: rest.scale,
        autoAlpha: 1,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.7 + i * 0.15, // nach dem Haupt-Phone, gestaffelt
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

  // Start nach Haupt-Phone (a) + hinteren Phones (b), damit es nicht unruhig wird.
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 1.8 });

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
 * Canvas-Partikelfeld im Hero-Hintergrund: viele kleine gelbe Punkte (~150–250)
 * als dichtes Feld. Bewegung = laufende WELLE (vertikaler Sinus, dessen Phase von
 * der x-Position abhängt → die Welle wandert durchs Feld). Zusätzlich weichen die
 * Punkte dem Mauszeiger aus (Repel bei Nähe, weich zurückfedernd).
 *
 * Bewusste Ausnahme von „nur transform/opacity" (CLAUDE.md): Canvas statt Hunderter
 * DOM-Elemente = performant. Eine rAF-Schleife, IntersectionObserver-gated (pausiert
 * wenn der Hero nicht im Bild ist). NUR Desktop (pointer:fine); Mobile & reduced-
 * motion rufen die Funktion gar nicht erst auf.
 */
function initHeroCanvas() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const canvas = document.querySelector<HTMLCanvasElement>('#hero [data-hero-canvas]');
  const hero = document.querySelector<HTMLElement>('#hero');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const YELLOW = '#fff03c';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const REPEL = 120;
  const REPEL_SQ = REPEL * REPEL;
  // Welle: Phase ~ x (läuft nach rechts), leichte y-Abhängigkeit für Organik.
  const WAVE_AMP = 7; // px vertikale Auslenkung
  const WAVE_KX = 0.018; // räumliche Frequenz in x
  const WAVE_KY = 0.01; // leichte y-Kopplung
  const WAVE_SPEED = 1.1; // rad/s

  type P = {
    bx: number; by: number; // Basisposition (Wellenlage)
    ox: number; oy: number; // Repel-Offset
    vx: number; vy: number;
    r: number; a: number;   // Radius, Alpha
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
    // Dichte über jittered Grid (gleichmäßige Verteilung); Ziel ~200 (150–250).
    const target = Math.max(150, Math.min(250, Math.round((W * H) / 6500)));
    const aspect = W / Math.max(1, H);
    const cols = Math.max(1, Math.round(Math.sqrt(target * aspect)));
    const rows = Math.max(1, Math.ceil(target / cols));
    const cw = W / cols;
    const ch = H / rows;
    parts = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        parts.push({
          bx: (c + 0.5) * cw + (Math.random() - 0.5) * cw * 0.6,
          by: (r + 0.5) * ch + (Math.random() - 0.5) * ch * 0.6,
          ox: 0, oy: 0, vx: 0, vy: 0,
          r: 1 + Math.random() * 1.3,
          a: 0.45 + Math.random() * 0.4,
        });
      }
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
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = YELLOW;
    for (const p of parts) {
      // Welle: vertikaler Sinus, Phase abhängig von x → laufende Welle.
      const waveY = Math.sin(p.bx * WAVE_KX + p.by * WAVE_KY - t * WAVE_SPEED) * WAVE_AMP;
      const rx = p.bx + p.ox;
      const ry = p.by + waveY + p.oy;
      // Cursor-Repel (nur im Radius; sqrt nur im Treffer).
      if (mx >= 0) {
        const dxm = rx - mx;
        const dym = ry - my;
        const distSq = dxm * dxm + dym * dym;
        if (distSq < REPEL_SQ && distSq > 0.01) {
          const dist = Math.sqrt(distSq);
          const f = (1 - dist / REPEL) * 4;
          p.vx += (dxm / dist) * f;
          p.vy += (dym / dist) * f;
        }
      }
      // Rückfederung zur Wellenlage (ox/oy → 0) + Dämpfung.
      p.vx += -p.ox * 0.06;
      p.vy += -p.oy * 0.06;
      p.vx *= 0.85;
      p.vy *= 0.85;
      p.ox += p.vx;
      p.oy += p.vy;
      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.bx + p.ox, p.by + waveY + p.oy, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
}

/**
 * Eigener Cursor (Signature-Moment) — nur bei pointer:fine. Drei Modi:
 *  - none : dünne Kontur (#3b3b3a) folgt mit leichter Verzögerung (quickTo 0.15s),
 *           grauer Punkt (#c0c0c1) exakt.
 *  - lens : über a/button/[data-cursor] → durchsichtige Invert-Lupe (~2×,
 *           backdrop-filter invert+grayscale, ohne Füllung/Rand/Punkt).
 *  - label: über [data-cursor-label] (Store-Badges) → mitlaufendes Pill-Label
 *           mit Text aus dem Attribut; Ring/Punkt/Lupe aus. (Osmo-Referenz.)
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

  type Mode = 'none' | 'lens' | 'label';
  let mode: Mode = 'none';
  let hovering: Element | null = null;

  const applyMode = (next: Mode, text?: string) => {
    if (next === mode) return;
    mode = next;
    if (next === 'label') {
      if (label && text != null) label.textContent = text;
      setFilter('none');
      gsap.to(ring, { autoAlpha: 0, scale: 1, borderColor: 'rgba(59,59,58,1)', duration: 0.2, ease: 'power3', overwrite: 'auto' });
      gsap.to(dot, { autoAlpha: 0, duration: 0.15, overwrite: 'auto' });
      if (label) gsap.fromTo(label, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power3', overwrite: 'auto' });
    } else if (next === 'lens') {
      if (label) gsap.to(label, { autoAlpha: 0, scale: 0.85, duration: 0.15, overwrite: 'auto' });
      setFilter(LENS);
      gsap.to(ring, { autoAlpha: 1, scale: 2, borderColor: 'rgba(59,59,58,0)', backgroundColor: 'rgba(59,59,58,0)', duration: 0.25, ease: 'power3', overwrite: 'auto' });
      gsap.to(dot, { autoAlpha: 0, duration: 0.15, overwrite: 'auto' });
    } else {
      // none — zurück zum Default; Lupe erst nach dem Zurückschrumpfen entfernen.
      if (label) gsap.to(label, { autoAlpha: 0, scale: 0.85, duration: 0.15, overwrite: 'auto' });
      gsap.to(ring, {
        autoAlpha: 1, scale: 1, borderColor: 'rgba(59,59,58,1)', duration: 0.25, ease: 'power3', overwrite: 'auto',
        onComplete: () => { if (mode === 'none') setFilter('none'); },
      });
      gsap.to(dot, { autoAlpha: 1, duration: 0.25, overwrite: 'auto' });
    }
  };

  const selLabel = '[data-cursor-label]';
  const selLens = 'a, button, [data-cursor], input, textarea, select, label, summary';
  const selAll = `${selLabel}, ${selLens}`;

  document.addEventListener('mouseover', (e) => {
    const el = (e.target as Element).closest?.(selAll);
    if (!el || el === hovering) return;
    hovering = el;
    const labelText = el.closest(selLabel)?.getAttribute('data-cursor-label');
    if (labelText != null) applyMode('label', labelText);
    else applyMode('lens');
  });
  document.addEventListener('mouseout', (e) => {
    const el = (e.target as Element).closest?.(selAll);
    if (!el || el !== hovering) return;
    const related = (e as MouseEvent).relatedTarget as Node | null;
    if (related && el.contains(related)) return; // noch im selben Element
    hovering = null;
    applyMode('none');
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
