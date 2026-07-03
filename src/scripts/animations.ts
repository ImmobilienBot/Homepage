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

/** Dezente Scroll-Parallax-Tiefe rund ums (tiltende) Phone — Desktop only. */
function initHeroParallax() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const glow = document.querySelector<HTMLElement>('#hero .phone-glow');
  const stack = document.querySelector<HTMLElement>('#hero [data-notif-stack]');
  const trigger = { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true };
  if (glow) gsap.to(glow, { yPercent: 14, ease: 'none', scrollTrigger: { ...trigger } });
  if (stack) gsap.to(stack, { yPercent: -10, ease: 'none', scrollTrigger: { ...trigger } });
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
  initHeroReveal();
  initHeroNotifications();
  initPhoneTilt();
  initHeroParallax();
  initReveals();
}
