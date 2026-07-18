/**
 * Lighthouse CI — misst / und /en/ gegen die gebaute Preview (Port 4321).
 * Mobile-Emulation = Lighthouse-Default (nicht umstellen). Median aus 3 Läufen.
 * Schwellen: Performance ≥ 95, Accessibility/Best-Practices/SEO = 100.
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      // `astro preview` gibt „http://localhost:4321/" auf stdout aus.
      startServerReadyPattern: 'localhost:4321',
      url: [
        'http://localhost:4321/',
        'http://localhost:4321/en/',
        'http://localhost:4321/ueber-uns/',
        'http://localhost:4321/en/about/',
        'http://localhost:4321/2025/09/19/bewerbungsschreiben-fur-wohnung-vorlage/',
      ],
      // 5 statt 3 Läufe → stabilerer Median gegen VM-Streuung der CI-Runner (Kaltstart-
      // Ausreißer ziehen den 3er-Median sonst unter die Schwelle; siehe CLAUDE.md).
      numberOfRuns: 5,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
      },
    },
    upload: {
      // Liefert teilbare Report-Links im Log (kein Server nötig).
      target: 'temporary-public-storage',
    },
  },
};
