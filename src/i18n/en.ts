/**
 * Englische Texte.
 *
 * DÜNNER WRAPPER: sichtbare Texte in `strings.en.json` (CMS-editierbar). Exportiert die
 * bisherige API (`en`). Zur BUILD-ZEIT läuft ein Struktur-Wächter, der bricht, sobald EN
 * einen in DE vorhandenen Key NICHT hat (oder die Struktur abweicht). `astro build`
 * type-checkt nicht — deshalb eine Laufzeit-Garde, die den Build hart fehlschlagen lässt.
 */
import strings from './strings.en.json';
import { de, type Messages } from './de';

/**
 * Rekursiver Struktur-Wächter: jeder DE-Key muss in EN existieren; Arrays beidseitig
 * gleich lang, Objekte beidseitig Objekte. Übersetzte Primitiv-WERTE sind egal.
 */
function assertShape(d: unknown, e: unknown, path = 'root'): void {
  if (Array.isArray(d)) {
    if (!Array.isArray(e)) throw new Error(`[i18n] EN[${path}] ist kein Array.`);
    if (d.length !== e.length)
      throw new Error(`[i18n] EN[${path}] hat ${e.length} Einträge, DE ${d.length}.`);
    d.forEach((v, i) => assertShape(v, e[i], `${path}[${i}]`));
  } else if (d && typeof d === 'object') {
    if (!e || typeof e !== 'object' || Array.isArray(e))
      throw new Error(`[i18n] EN[${path}] ist kein Objekt.`);
    for (const k of Object.keys(d as Record<string, unknown>)) {
      if (!(k in (e as Record<string, unknown>)))
        throw new Error(`[i18n] EN fehlt der Key „${path}.${k}".`);
      assertShape(
        (d as Record<string, unknown>)[k],
        (e as Record<string, unknown>)[k],
        `${path}.${k}`,
      );
    }
  }
}
assertShape(de, strings);

export const en: Messages = strings;
