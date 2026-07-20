/**
 * functions/_lib/email-templates.ts — HTML- und Plain-Text-Bausteine für die
 * beiden Mails des Kontaktformulars (interne Benachrichtigung + Bestätigung an
 * die Absender:in). Eigener Scope der Cloudflare Pages Functions — NICHT aus
 * `src/i18n` importieren (das ist das Client-Bundle). Alle sichtbaren Texte
 * beider Mails leben als DE/EN-Strings hier im Modul.
 *
 * Visuelle Sprache (CD):
 *  - Tabellen-Layout (Outlook-kompatibel), max-width 600px, zentriert, ALLE
 *    Styles inline, KEINE externen Bilder, KEINE Webfonts.
 *  - Header-Balken #3b3b3a, Wortmarke als reiner Text (IMMOBILIEN #f6f6f6 +
 *    BOT #fff03c), fett/kursiv/gesperrt, darunter 4px-Akzentlinie #fff03c.
 *  - Body #eaebeb, Content-Karte #f6f6f6 (Radius 12px), Text #3b3b3a.
 *
 * SICHERHEIT: Jede Nutzereingabe wird vor dem Einsetzen in HTML escaped
 * (`escapeHtml`), Namen zusätzlich von Zeilenumbrüchen befreit und auf 100
 * Zeichen begrenzt (`sanitizeName`, verhindert u. a. Header-Injection im
 * Betreff). Der Freitext der Nachricht erscheint AUSSCHLIESSLICH in der internen
 * Mail — niemals in der Bestätigungsmail.
 */

export type Lang = 'de' | 'en';

/** Themen-Key → Label je Sprache. Einzige Quelle der sichtbaren Themen-Labels. */
export const TOPIC_LABELS: Record<Lang, Record<string, string>> = {
  de: {
    app: 'Frage zur App',
    feedback: 'Feedback',
    problem: 'Problem melden',
    presse: 'Presse & Kooperation',
    sonstiges: 'Sonstiges',
  },
  en: {
    app: 'Question about the app',
    feedback: 'Feedback',
    problem: 'Report a problem',
    presse: 'Press & partnerships',
    sonstiges: 'Other',
  },
};

/** Whitelist der gültigen Themen-Keys (Reihenfolge = Chips im Formular). */
export const TOPIC_KEYS = ['app', 'feedback', 'problem', 'presse', 'sonstiges'] as const;

/** Gültiger Themen-Key? (Whitelist-Prüfung serverseitig.) */
export function isValidTopic(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(TOPIC_LABELS.de, key);
}

/** Label eines Themen-Keys in der gewünschten Sprache (Fallback: „Sonstiges"). */
export function topicLabel(key: string, lang: Lang): string {
  return TOPIC_LABELS[lang][key] ?? TOPIC_LABELS[lang].sonstiges;
}

/**
 * Anzeige-Host aus dem Origin (z. B. „immobilien-bot.de" oder der Preview-Host).
 * Der Origin wird von der Function aus der Request-URL durchgereicht — keine hart
 * codierte Domain im Modul, Logo-URL und Footer-Link zeigen automatisch auf die
 * Domain, auf der das Formular läuft.
 */
function siteHost(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return origin.replace(/^https?:\/\//, '');
  }
}

/* ---------------------------------------------------------------------------
   Sicherheits-Helfer.
   --------------------------------------------------------------------------- */

/** Escaped ALLE HTML-relevanten Zeichen. Für jede Nutzereingabe im HTML-Kontext. */
export function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Name bereinigen: Zeilenumbrüche/Steuerzeichen raus, auf 100 Zeichen kürzen. */
export function sanitizeName(input: string): string {
  return String(input)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

/* ---------------------------------------------------------------------------
   Gemeinsame visuelle Hülle (HTML). Content wird als fertiges HTML übergeben.
   --------------------------------------------------------------------------- */

/**
 * Rahmen beider Mails: gelber Header-Balken mit der CD-Primär-Wortbildmarke
 * (dunkles Logo-PNG auf Gelb), dunkle Akzentlinie, graue Bühne, Content-Karte,
 * Footer. Tabellen-Layout, alles inline. Logo- und Footer-URL kommen aus dem
 * durchgereichten `origin` (Preview heute, Domain nach Launch — ohne TODO/Env).
 *
 * TODO(Artem): Sobald Impressumsdaten vorliegen, den Footer um eine
 * rechtssichere Anbieterkennzeichnung ergänzen (Anbieter, ladungsfähige
 * Anschrift, Kontakt) — aktuell nur Wortmarke + Website.
 */
function emailShell(title: string, contentHtml: string, origin: string): string {
  const host = siteHost(origin);
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#eaebeb;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eaebeb;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

<!-- Gelber Header-Balken mit Logo (bgcolor-Attribut für Outlook) -->
<tr><td bgcolor="#fff03c" style="background-color:#fff03c;border-radius:12px 12px 0 0;padding:24px 28px;text-align:center;">
<img src="${origin}/email-assets/logo@2x.png" width="200" alt="Immobilien Bot" style="display:block;width:200px;max-width:200px;height:auto;margin:0 auto;border:0;color:#3b3b3a;">
</td></tr>
<!-- Akzentlinie (dunkel, sonst gelb auf gelb unsichtbar) -->
<tr><td style="background-color:#3b3b3a;height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>

<!-- Content-Karte -->
<tr><td style="background-color:#f6f6f6;padding:32px 28px;font-family:Roboto,Helvetica,Arial,sans-serif;color:#3b3b3a;font-size:16px;line-height:1.5;">
${contentHtml}
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 28px 8px;text-align:center;font-family:Roboto,Helvetica,Arial,sans-serif;color:#8a8a88;font-size:12px;line-height:1.5;">
Immobilien Bot · <a href="${origin}" style="color:#8a8a88;text-decoration:underline;">${escapeHtml(host)}</a>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ---------------------------------------------------------------------------
   Interne Benachrichtigung (an CONTACT_TO). Team-facing → Deutsch.
   Enthält als einzige Mail den Freitext der Nachricht.
   --------------------------------------------------------------------------- */

export interface InternalEmailInput {
  name: string; // roh (wird hier bereinigt/escaped)
  email: string; // roh (wird hier escaped)
  message: string; // roh (wird hier escaped, pre-wrap)
  topicKey: string; // Whitelist-Key
  lang: Lang; // gewählte Formularsprache
  sentAt: string; // vorformatiert, Europe/Berlin
  origin: string; // Request-Origin (Logo-/Footer-URL)
}

const LANG_LABEL_DE: Record<Lang, string> = {
  de: 'Deutsch (de)',
  en: 'Englisch (en)',
};

/** Betreff der internen Mail: „Kontaktformular · {Thema} · {Name}". */
export function internalSubject(input: InternalEmailInput): string {
  const name = sanitizeName(input.name);
  const label = topicLabel(input.topicKey, 'de');
  return `Kontaktformular · ${label} · ${name}`;
}

function fieldRow(label: string, valueHtml: string): string {
  return `<tr>
<td style="padding:10px 0;border-bottom:1px solid #d9dada;vertical-align:top;width:120px;font-weight:700;color:#686868;font-size:13px;">${label}</td>
<td style="padding:10px 0;border-bottom:1px solid #d9dada;vertical-align:top;color:#3b3b3a;font-size:15px;">${valueHtml}</td>
</tr>`;
}

/** Interne Mail: HTML + Plain-Text + Betreff. */
export function renderInternalEmail(input: InternalEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const name = sanitizeName(input.name);
  const label = topicLabel(input.topicKey, 'de');
  const langLabel = LANG_LABEL_DE[input.lang];

  const nameE = escapeHtml(name);
  const emailE = escapeHtml(input.email);
  const messageE = escapeHtml(input.message);
  const sentAtE = escapeHtml(input.sentAt);

  const content = `
<p style="margin:0 0 20px;font-size:20px;font-weight:800;color:#3b3b3a;">Neue Kontaktanfrage</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
${fieldRow('Thema', escapeHtml(label))}
${fieldRow('Name', nameE)}
${fieldRow('E-Mail', `<a href="mailto:${emailE}" style="color:#3b3b3a;">${emailE}</a>`)}
${fieldRow('Sprache', escapeHtml(langLabel))}
${fieldRow('Zeitpunkt', sentAtE)}
</table>
<p style="margin:24px 0 8px;font-weight:700;color:#686868;font-size:13px;">Nachricht</p>
<div style="background-color:#eaebeb;border-radius:12px;padding:16px 18px;color:#3b3b3a;font-size:15px;line-height:1.5;white-space:pre-wrap;word-break:break-word;">${messageE}</div>
`;

  const html = emailShell('Neue Kontaktanfrage', content, input.origin);

  const text =
    `Neue Kontaktanfrage\n\n` +
    `Thema:     ${label}\n` +
    `Name:      ${name}\n` +
    `E-Mail:    ${input.email}\n` +
    `Sprache:   ${langLabel}\n` +
    `Zeitpunkt: ${input.sentAt} (Europe/Berlin)\n\n` +
    `Nachricht:\n${input.message}\n\n` +
    `— Immobilien Bot · ${siteHost(input.origin)}`;

  return { subject: internalSubject(input), html, text };
}

/* ---------------------------------------------------------------------------
   Bestätigungsmail an die Absender:in (DE/EN). Rein transaktional:
   KEINE Store-Badges, KEINE Marketing-CTAs (§ 7 UWG). Einziger Link: Website.
   Enthält NIE den Freitext der Nachricht.
   --------------------------------------------------------------------------- */

export interface ConfirmationEmailInput {
  name: string; // roh (wird hier bereinigt/escaped)
  topicKey: string; // Whitelist-Key
  lang: Lang;
  origin: string; // Request-Origin (Logo-/Footer-URL)
}

/** Alle sichtbaren Strings der Bestätigungsmail, je Sprache. */
const CONFIRM_STRINGS: Record<
  Lang,
  {
    subject: string;
    greeting: (name: string) => string;
    intro: string;
    topicLine: (label: string) => string;
    reassure: string;
    nothingToDo: string;
    signoff: string;
  }
> = {
  de: {
    subject: 'Deine Nachricht ist angekommen · Immobilien Bot',
    greeting: (name) => `Hi ${name},`,
    intro: 'vielen Dank für deine Nachricht – sie ist bei uns angekommen.',
    topicLine: (label) => `Dein Anliegen: ${label}`,
    reassure: 'Wir lesen jede Nachricht persönlich und melden uns so schnell wie möglich.',
    nothingToDo: 'Du musst nichts weiter tun.',
    signoff: 'Dein Immobilien Bot Team',
  },
  en: {
    subject: 'We got your message · Immobilien Bot',
    greeting: (name) => `Hi ${name},`,
    intro: 'thanks for reaching out – your message has arrived.',
    topicLine: (label) => `Your topic: ${label}`,
    reassure: 'We read every message personally and will get back to you as soon as we can.',
    nothingToDo: "There's nothing else you need to do.",
    signoff: 'Your Immobilien Bot team',
  },
};

/** Betreff der Bestätigungsmail (sprachabhängig). */
export function confirmationSubject(lang: Lang): string {
  return CONFIRM_STRINGS[lang].subject;
}

/** Bestätigungsmail: HTML + Plain-Text + Betreff. */
export function renderConfirmationEmail(input: ConfirmationEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const s = CONFIRM_STRINGS[input.lang];
  const name = sanitizeName(input.name);
  const label = topicLabel(input.topicKey, input.lang);

  const nameE = escapeHtml(name);
  const labelE = escapeHtml(label);

  const content = `
<p style="margin:0 0 16px;font-size:17px;font-weight:700;color:#3b3b3a;">${s.greeting(nameE)}</p>
<p style="margin:0 0 16px;">${escapeHtml(s.intro)}</p>
<p style="margin:0 0 16px;color:#686868;font-size:15px;">${s.topicLine(`<strong style="color:#3b3b3a;">${labelE}</strong>`)}</p>
<p style="margin:0 0 16px;">${escapeHtml(s.reassure)}</p>
<p style="margin:0 0 24px;">${escapeHtml(s.nothingToDo)}</p>
<p style="margin:0;color:#3b3b3a;">${escapeHtml(s.signoff)}</p>
`;

  const html = emailShell(s.subject, content, input.origin);

  const text =
    `${s.greeting(name)}\n\n` +
    `${s.intro}\n\n` +
    `${s.topicLine(label)}\n\n` +
    `${s.reassure}\n` +
    `${s.nothingToDo}\n\n` +
    `${s.signoff}\n\n` +
    `— Immobilien Bot · ${siteHost(input.origin)}`;

  return { subject: s.subject, html, text };
}

/* ---------------------------------------------------------------------------
   Account-Löschanfrage (an mail@ …). Interne, team-facing Mail (Deutsch).
   Enthält NUR die für die Löschung nötigen Daten: User ID + Kontakt-E-Mail.
   Betreff exakt „Immobilien Bot - Account löschen" (Play-Console-Vorgabe).
   --------------------------------------------------------------------------- */

export interface AccountDeleteEmailInput {
  userId: string; // roh (wird hier escaped)
  email: string; // roh (wird hier escaped)
  sentAt: string; // vorformatiert, Europe/Berlin
  origin: string; // Request-Origin (Logo-/Footer-URL)
}

/** Fester Betreff der Löschanfrage. */
export const ACCOUNT_DELETE_SUBJECT = 'Immobilien Bot - Account löschen';

/** Löschanfrage-Mail: HTML + Plain-Text + Betreff. */
export function renderAccountDeleteEmail(input: AccountDeleteEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const userIdE = escapeHtml(input.userId);
  const emailE = escapeHtml(input.email);
  const sentAtE = escapeHtml(input.sentAt);

  const content = `
<p style="margin:0 0 20px;font-size:20px;font-weight:800;color:#3b3b3a;">Account-Löschanfrage</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
${fieldRow('User ID', userIdE)}
${fieldRow('E-Mail', `<a href="mailto:${emailE}" style="color:#3b3b3a;">${emailE}</a>`)}
${fieldRow('Zeitpunkt', sentAtE)}
</table>
<p style="margin:24px 0 0;color:#686868;font-size:14px;line-height:1.5;">Die Nutzer:in hat der Löschung ausdrücklich zugestimmt und um Löschung innerhalb von 24 Stunden gebeten.</p>
`;

  const html = emailShell('Account-Löschanfrage', content, input.origin);

  const text =
    `Account-Löschanfrage\n\n` +
    `User ID:   ${input.userId}\n` +
    `E-Mail:    ${input.email}\n` +
    `Zeitpunkt: ${input.sentAt} (Europe/Berlin)\n\n` +
    `Die Nutzer:in hat der Löschung ausdrücklich zugestimmt.\n\n` +
    `— Immobilien Bot · ${siteHost(input.origin)}`;

  return { subject: ACCOUNT_DELETE_SUBJECT, html, text };
}
