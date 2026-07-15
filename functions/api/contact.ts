/**
 * functions/api/contact.ts — Cloudflare Pages Function für das Kontaktformular.
 *
 * Einzige Server-Ausnahme der ansonsten statischen Site (siehe CLAUDE.md). KEINE
 * neue Dependency: direkter fetch auf die Resend-REST-API. Der API-Key kommt
 * AUSSCHLIESSLICH aus env (Cloudflare-Secret) — nie im Repo.
 *
 * Env:
 *  - RESEND_API_KEY  (Secret, Pflicht)
 *  - CONTACT_TO      (Empfänger der internen Mail; Fallback = Testadresse im Code)
 *  - CONTACT_FROM    (Absender beider Mails; Fallback = Resend-Sandbox
 *                     "Immobilien Bot <onboarding@resend.dev>" → Testmodus bleibt
 *                     lauffähig; produktiver Versand braucht in Resend eine
 *                     verifizierte Domain)
 *
 * Zwei Mails:
 *  1) Interne Benachrichtigung an CONTACT_TO — wird AWAITED gesendet; ihr Erfolg
 *     bestimmt die Response an den User (wie bisher).
 *  2) Bestätigungsmail an die Absender:in — danach via `waitUntil` (kostet dem
 *     User keine Latenz); Fehler sind NICHT blockierend (try/catch), die Anfrage
 *     IST angekommen. Im Testmodus (Fallback-From) schlägt sie erwartbar fehl.
 *
 * Zwei Antwort-Modi: Accept: application/json → JSON ({ok:boolean}); sonst (No-JS-
 * Formular-POST) → 303-Redirect auf die Danke-Seite bzw. eine minimale Fehlerseite.
 */
import {
  isValidTopic,
  renderInternalEmail,
  renderConfirmationEmail,
  type Lang,
} from '../_lib/email-templates';

interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

interface Ctx {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
}

/** Absender-Fallback (Resend-Sandbox) → Testmodus bleibt ohne Env lauffähig. */
const FROM_FALLBACK = 'Immobilien Bot <onboarding@resend.dev>';
/** Empfänger-Fallback der internen Mail (Testphase). */
const TO_FALLBACK = 'socialmedia@immobilien-bot.de';

/** Öffentliche Kontaktadresse (nur für die No-JS-Fehlerseite; = site.ts contact.email). */
const PUBLIC_EMAIL = 'mail@immobilien-bot.de';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const json = (obj: unknown, status: number): Response =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const redirect = (to: string, base: URL): Response =>
  Response.redirect(new URL(to, base).toString(), 303);

const thanksPath = (lang: string): string => (lang === 'en' ? '/en/thanks' : '/danke');
const backToContact = (lang: string): string => (lang === 'en' ? '/en/#kontakt' : '/#kontakt');

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '(no body)';
  }
}

/** Ein Resend-Call. Wirft bei Netzfehler; gibt sonst die (evtl. !ok) Response zurück. */
function sendEmail(
  apiKey: string,
  payload: Record<string, unknown>,
): Promise<Response> {
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
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Senden fehlgeschlagen</title></head><body style="font-family:Roboto,system-ui,-apple-system,Segoe UI,Arial,sans-serif;background:#3b3b3a;color:#f6f6f6;margin:0;min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px;line-height:1.6"><div><p>Das Senden hat leider nicht geklappt.<br>Schreib uns direkt an <a href="mailto:${PUBLIC_EMAIL}" style="color:#fff03c">${PUBLIC_EMAIL}</a>.</p><p><a href="/" style="color:#fff03c">Zurück zur Startseite</a></p></div></body></html>`;
  return new Response(html, {
    status: 502,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

const failure = (wantsJson: boolean): Response => (wantsJson ? json({ ok: false }, 502) : errorHtml());

export const onRequestPost = async ({ request, env, waitUntil }: Ctx): Promise<Response> => {
  const url = new URL(request.url);
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');

  // 1) Origin-Check: fremder Origin (CSRF) → 403. Kein Origin-Header (No-JS-POST auf
  //    manchen Browsern) → zulassen. Funktioniert auf Preview-URLs wie auf der Domain.
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== url.host) return new Response('Forbidden', { status: 403 });
    } catch {
      return new Response('Forbidden', { status: 403 });
    }
  }

  // 2) FormData (deckt urlencoded + multipart ab), alle Werte trimmen.
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return wantsJson ? json({ ok: false }, 400) : redirect(backToContact('de'), url);
  }
  const get = (k: string): string => String(data.get(k) ?? '').trim();

  const name = get('name');
  const email = get('email');
  const message = get('message');
  const website = get('website'); // Honeypot
  let topic = get('topic');
  const langRaw = get('lang');

  // 5a) lang + topic serverseitig gegen Whitelist normalisieren.
  const lang: Lang = langRaw === 'en' ? 'en' : 'de'; // Default „de"
  if (!isValidTopic(topic)) topic = 'sonstiges';

  // 4) Honeypot gefüllt → NICHT senden (auch keine Bestätigung), Erfolg vortäuschen.
  if (website) {
    return wantsJson ? json({ ok: true }, 200) : redirect(thanksPath(lang), url);
  }

  // 5b) Validierung.
  const emailOk = /^\S+@\S+\.\S+$/.test(email) && email.length <= 200;
  const valid =
    name.length >= 1 &&
    name.length <= 100 &&
    emailOk &&
    message.length >= 1 &&
    message.length <= 3000;
  if (!valid) {
    return wantsJson ? json({ ok: false }, 400) : redirect(backToContact(lang), url);
  }

  // 7) Key muss aus env kommen.
  if (!env.RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY fehlt in der Umgebung.');
    return failure(wantsJson);
  }

  const from = env.CONTACT_FROM ?? FROM_FALLBACK;
  const to = env.CONTACT_TO ?? TO_FALLBACK;
  const sentAt = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin',
  }).format(new Date());

  // 8) Interne Benachrichtigung — AWAITED. Erfolg bestimmt die User-Response.
  //    Freitext der Nachricht erscheint AUSSCHLIESSLICH hier. Reply-To = Absender:in.
  const internal = renderInternalEmail({ name, email, message, topicKey: topic, lang, sentAt });
  let res: Response;
  try {
    res = await sendEmail(env.RESEND_API_KEY, {
      from,
      to: [to],
      reply_to: email,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
    });
  } catch (err) {
    console.error('[contact] Resend-Request fehlgeschlagen:', err instanceof Error ? err.message : String(err));
    return failure(wantsJson);
  }

  if (!res.ok) {
    console.error('[contact] Resend-Fehler:', res.status, await safeText(res));
    return failure(wantsJson);
  }

  // 8b) Bestätigungsmail an die Absender:in — NICHT blockierend, via waitUntil.
  //     Testmodus (Fallback-From) schlägt erwartbar fehl → try/catch schluckt das,
  //     die Formular-Response bleibt Erfolg (die Anfrage IST angekommen).
  const confirm = renderConfirmationEmail({ name, topicKey: topic, lang });
  waitUntil(
    (async () => {
      try {
        const cRes = await sendEmail(env.RESEND_API_KEY, {
          from,
          to: [email],
          subject: confirm.subject,
          html: confirm.html,
          text: confirm.text,
        });
        if (!cRes.ok) {
          console.error('[contact] Bestätigungsmail-Fehler:', cRes.status, await safeText(cRes));
        }
      } catch (err) {
        console.error(
          '[contact] Bestätigungsmail fehlgeschlagen:',
          err instanceof Error ? err.message : String(err),
        );
      }
    })(),
  );

  // 9) Erfolg.
  return wantsJson ? json({ ok: true }, 200) : redirect(thanksPath(lang), url);
};
