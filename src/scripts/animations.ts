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
}

/**
 * Kinetische Headline-Enthüllung: Zeilen-Mask-Reveal + animierter Marker,
 * danach gestaffelt Subline, CTA und Trust-Microline.
 * Die CTA wird bewusst per gsap.from (kein CSS-Vorverstecken) animiert —
 * sie bleibt so auch bei JS-Fehler garantiert sichtbar (CLAUDE.md-Schutzplanke).
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

  if (lines.length) {
    tl.fromTo(
      lines,
      { yPercent: 110 },
      { yPercent: 0, duration: 0.9, stagger: 0.12 },
      0,
    );
  }
  if (marks.length) {
    tl.fromTo(
      marks,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.5, ease: 'power2.out', stagger: 0.12 },
      0.35,
    );
  }
  if (fades.length) {
    tl.fromTo(
      fades,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12 },
      0.5,
    );
  }
  if (cta) {
    gsap.from(cta, {
      autoAlpha: 0,
      y: 18,
      duration: 0.6,
      delay: 0.6,
      ease: 'power3.out',
    });
  }
}

/**
 * Endlosschleife der schwebenden Push-Benachrichtigungen: nacheinander
 * hereingleiten, ~3 s halten, wieder verschwinden. Nur transform/opacity.
 */
function initHeroNotifications() {
  const cards = gsap.utils.toArray<HTMLElement>('#hero [data-notif]');
  if (!cards.length) return;

  const IN = 0.6;
  const HOLD = 3;
  const OUT = 0.5;
  const step = IN + HOLD + OUT;

  const tl = gsap.timeline({ repeat: -1, delay: 0.8 });
  cards.forEach((card, i) => {
    const at = i * step;
    tl.fromTo(
      card,
      { yPercent: -60, autoAlpha: 0, scale: 0.96 },
      { yPercent: 0, autoAlpha: 1, scale: 1, duration: IN, ease: 'back.out(1.6)' },
      at,
    ).to(
      card,
      { yPercent: 14, autoAlpha: 0, scale: 0.98, duration: OUT, ease: 'power2.in' },
      at + IN + HOLD,
    );
  });
}

/** Leichter 3D-Tilt des Phones auf Mausbewegung — nur Desktop (pointer:fine). */
function initPhoneTilt() {
  const stage = document.querySelector<HTMLElement>('[data-phone-stage]');
  const phone = document.querySelector<HTMLElement>('[data-phone]');
  if (!stage || !phone) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const rotX = gsap.quickTo(phone, 'rotationX', { duration: 0.6, ease: 'power3' });
  const rotY = gsap.quickTo(phone, 'rotationY', { duration: 0.6, ease: 'power3' });

  stage.addEventListener('mousemove', (e) => {
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    rotY(nx * 10);
    rotX(-ny * 10);
  });
  stage.addEventListener('mouseleave', () => {
    rotX(0);
    rotY(0);
  });
}

/**
 * Hero-Choreografie: atmendes Glow (~10s Loop, immer aktiv) + scroll-gescrubte
 * Bewegung des Phones (leichtes rotateY/rotateX + Skalierung/translateY) und
 * langsamere Glow-Parallax für Tiefe. Scroll-Teil nur Desktop (Mobile reduziert).
 * Nur transform/opacity.
 */
function initHeroChoreography() {
  const glow = document.querySelector<HTMLElement>('#hero [data-phone-glow]');
  const glowWrap = document.querySelector<HTMLElement>('#hero [data-glow-wrap]');
  const choreo = document.querySelector<HTMLElement>('#hero [data-phone-choreo]');
  const stack = document.querySelector<HTMLElement>('#hero [data-notif-stack]');

  // „Atmendes" Glow — 5s hin, yoyo zurück ≈ 10s Zyklus. Nur Gelb, dezent.
  if (glow) {
    gsap.to(glow, {
      scale: 1.12,
      xPercent: 4,
      yPercent: -4,
      opacity: 0.72,
      duration: 5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  // Scroll-Choreografie nur auf Desktop.
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const st = { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } as const;
  if (choreo) {
    gsap.fromTo(
      choreo,
      { rotationX: 0, rotationY: 0, scale: 1, yPercent: 0 },
      {
        rotationY: 8,
        rotationX: -4,
        scale: 0.96,
        yPercent: -6,
        ease: 'none',
        scrollTrigger: { ...st },
      },
    );
  }
  // Glow parallaxt langsamer (auf dem Wrapper, kollidiert nicht mit dem Breathing).
  if (glowWrap) gsap.to(glowWrap, { yPercent: 16, ease: 'none', scrollTrigger: { ...st } });
  if (stack) gsap.to(stack, { yPercent: -12, ease: 'none', scrollTrigger: { ...st } });
}

/**
 * Eigener Cursor (Signature-Moment) — nur bei pointer:fine. Ring folgt mit
 * Verzögerung (quickTo), Punkt exakt; über interaktiven Elementen wächst der
 * Ring (~1,8×) und füllt sich. Ohne pointer:fine bleibt der native Cursor.
 */
function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const ring = document.querySelector<HTMLElement>('[data-cursor-ring]');
  const dot = document.querySelector<HTMLElement>('[data-cursor-dot]');
  if (!ring || !dot) return;

  document.documentElement.classList.add('has-custom-cursor');
  gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });

  const ringX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });

  window.addEventListener('mousemove', (e) => {
    ringX(e.clientX);
    ringY(e.clientY);
    dotX(e.clientX);
    dotY(e.clientY);
  });

  const hoverSel = 'a, button, [data-cursor], input, textarea, select, label, summary';
  document.addEventListener('mouseover', (e) => {
    if ((e.target as Element).closest?.(hoverSel)) {
      gsap.to(ring, {
        scale: 1.8,
        backgroundColor: 'rgba(255,255,255,1)',
        duration: 0.25,
        ease: 'power3',
      });
    }
  });
  document.addEventListener('mouseout', (e) => {
    if ((e.target as Element).closest?.(hoverSel)) {
      gsap.to(ring, {
        scale: 1,
        backgroundColor: 'rgba(255,255,255,0)',
        duration: 0.25,
        ease: 'power3',
      });
    }
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
  initSmoothScroll();
  initCursor();
  initHeroReveal();
  initHeroNotifications();
  initPhoneTilt();
  initHeroChoreography();
  initProblemFill();
  initReveals();
}
