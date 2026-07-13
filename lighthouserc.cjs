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
      url: ['http://localhost:4321/', 'http://localhost:4321/en/'],
      numberOfRuns: 3,
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
