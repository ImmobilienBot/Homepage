/**
 * Deutsche Texte (Standard-Sprache).
 *
 * DÜNNER WRAPPER: Die sichtbaren Texte liegen ab jetzt in `strings.de.json`
 * (CMS-editierbar via Sveltia unter /admin). Diese Datei importiert das JSON und
 * exportiert die bisherige API (`de`, `Dict`) UNVERÄNDERT — kein Komponenten-Import
 * ändert sich. Sichtbare Texte NUR in der JSON pflegen, nie hart in Komponenten.
 * Fakten (Preise/Portale/Zahlen) kommen weiterhin AUSSCHLIESSLICH aus site.ts:
 * Platzhalter wie `{n}` / `{count}` / `{price}` werden buildseitig in den Komponenten
 * ersetzt — niemals Fakten in i18n duplizieren.
 */
import strings from './strings.de.json';

export const de = strings;

/** Struktur-/Typ-Wächter — EN muss exakt diese Form haben (Enforcement in en.ts). */
export type Messages = typeof strings;
/** Bisherige API (index.ts importiert `Dict`) — Alias auf Messages. */
export type Dict = Messages;
