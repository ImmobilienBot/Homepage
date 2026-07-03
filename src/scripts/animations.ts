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

function initHeroNotification() {
  const card = document.querySelector<HTMLElement>('[data-hero-notification]');
  if (!card) return;
  // Dezentes, leicht federndes Hereingleiten (CD: einziger Bewegungsmoment im Hero).
  gsap.fromTo(
    card,
    { y: -16, opacity: 0, scale: 0.98 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.7,
      ease: 'back.out(1.5)',
      delay: 0.35,
    },
  );
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
  initHeroNotification();
  initReveals();
}
