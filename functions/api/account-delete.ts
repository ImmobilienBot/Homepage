/**
 * functions/api/account-delete.ts — Cloudflare Pages Function für die
 * Account-Löschanfrage (/account-loeschen/). Gleiche Server-/Spam-Schutz-Mechanik
 * wie das Kontaktformular (functions/api/contact.ts): Origin-Check, Honeypot,
 * serverseitige Validierung, Resend-REST-API per fetch — KEINE neue Dependency.
 *
 * Anders als beim Kontaktformular: nur EINE Mail (interne Benachrichtigung an
 * CONTACT/Lösch-Empfänger), keine Bestätigungsmail. Betreff exakt
 * „Immobilien Bot - Account löschen" (Play-Console-Vorgabe).
 *
 * Env:
 *  - RESEND_API_KEY     (Secret, Pflicht — NUR aus env, nie im Repo)
 *  - CONTACT_FROM       (Absender; Fallback = Resend-Sandbox, Testmodus lauffähig)
 *  - ACCOUNT_DELETE_TO  (Empfänger; Fallback = mail@immobilien-bot.de)
 *
 * Zwei Antwort-Modi (wie contact.ts): Accept: application/json → JSON ({ok:boolean});
 * sonst (No-JS-Formular-POST) → 303-Redirect auf /danke bzw. zurück auf die Seite.
 */
import { renderAccountDeleteEmail } from '../_lib/email-templates';

interface Env {
  RESEND_API_KEY: string;
  CONTACT_FROM?: string;
  ACCOUNT_DELETE_TO?: string;
}

interface Ctx {
  request: Request;
  env: Env;
}

/** Absender-Fallback (Resend-Sandbox) → Testmodus bleibt ohne Env lauffähig. */
const FROM_FALLBACK = 'Immobilien Bot <onboarding@resend.dev>';
/** Empfänger der Löschanfrage (Play-Console-Vorgabe). */
const TO_FALLBACK = 'mail@immobilien-bot.de';
/** Öffentliche Kontaktadresse (nur für die No-JS-Fehlerseite). */
const PUBLIC_EMAIL = 'mail@immobilien-bot.de';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const json = (obj: unknown, status: number): Response =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const redirect = (to: string, base: URL): Response =>
  Response.redirect(new URL(to, base).toString(), 303);

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '(no body)';
  }
}

/** Ein Resend-Call. Wirft bei Netzfehler; gibt sonst die (evtl. !ok) Response zurück. */
function sendEmail(apiKey: string, payload: Record<string, unknown>): Promise<Response> {
  return fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/** Minimale, i18n-freie Fehlerseite für den No-JS-Pfad (utf-8). */
function errorHtml(): Response {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Senden fehlgeschlagen</title></head><body style="font-family:Roboto,system-ui,-apple-system,Segoe UI,Arial,sans-serif;background:#3b3b3a;color:#f6f6f6;margin:0;min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px;line-height:1.6"><div><p>Das Senden hat leider nicht geklappt.<br>Schreib uns direkt an <a href="mailto:${PUBLIC_EMAIL}" style="color:#fff03c">${PUBLIC_EMAIL}</a>.</p><p><a href="/account-loeschen" style="color:#fff03c">Zurück</a></p></div></body></html>`;
  return new Response(html, {
    status: 502,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

const failure = (wantsJson: boolean): Response => (wantsJson ? json({ ok: false }, 502) : errorHtml());

export const onRequestPost = async ({ request, env }: Ctx): Promise<Response> => {
  const url = new URL(request.url);
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');

  // 1) Origin-Check (CSRF) — identisch zu contact.ts.
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== url.host) return new Response('Forbidden', { status: 403 });
    } catch {
      return new Response('Forbidden', { status: 403 });
    }
  }

  // 2) FormData, alle Werte trimmen.
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return wantsJson ? json({ ok: false }, 400) : redirect('/account-loeschen', url);
  }
  const get = (k: string): string => String(data.get(k) ?? '').trim();

  const userId = get('userId');
  const email = get('email');
  const consent = get('consent');
  const website = get('website'); // Honeypot

  // 3) Honeypot gefüllt → NICHT senden, Erfolg vortäuschen.
  if (website) {
    return wantsJson ? json({ ok: true }, 200) : redirect('/danke', url);
  }

  // 4) Validierung: User ID + gültige E-Mail + ausdrückliche Einwilligung (Pflicht-Checkbox).
  const emailOk = /^\S+@\S+\.\S+$/.test(email) && email.length <= 200;
  const valid =
    userId.length >= 1 && userId.length <= 200 && emailOk && consent.length >= 1;
  if (!valid) {
    return wantsJson ? json({ ok: false }, 400) : redirect('/account-loeschen', url);
  }

  // 5) Key muss aus env kommen.
  if (!env.RESEND_API_KEY) {
    console.error('[account-delete] RESEND_API_KEY fehlt in der Umgebung.');
    return failure(wantsJson);
  }

  const from = env.CONTACT_FROM ?? FROM_FALLBACK;
  const to = env.ACCOUNT_DELETE_TO ?? TO_FALLBACK;
  const sentAt = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin',
  }).format(new Date());

  // 6) Interne Benachrichtigung — AWAITED. Erfolg bestimmt die User-Response.
  const mail = renderAccountDeleteEmail({ userId, email, sentAt, origin: url.origin });
  let res: Response;
  try {
    res = await sendEmail(env.RESEND_API_KEY, {
      from,
      to: [to],
      reply_to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  } catch (err) {
    console.error('[account-delete] Resend-Request fehlgeschlagen:', err instanceof Error ? err.message : String(err));
    return failure(wantsJson);
  }

  if (!res.ok) {
    console.error('[account-delete] Resend-Fehler:', res.status, await safeText(res));
    return failure(wantsJson);
  }

  // 7) Erfolg.
  return wantsJson ? json({ ok: true }, 200) : redirect('/danke', url);
};
