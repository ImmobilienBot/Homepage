/**
 * functions/api/contact.ts — Cloudflare Pages Function für das Kontaktformular.
 *
 * Einzige Server-Ausnahme der ansonsten statischen Site (siehe CLAUDE.md). KEINE
 * neue Dependency: direkter fetch auf die Resend-REST-API. Der API-Key kommt
 * AUSSCHLIESSLICH aus env (Cloudflare-Secret) — nie im Repo.
 *
 * Env:
 *  - RESEND_API_KEY  (Secret, Pflicht)
 *  - CONTACT_TO      (Empfänger; Fallback = Testadresse im Code)
 *  - CONTACT_FROM    (Absender; Fallback = Resend-Sandbox onboarding@resend.dev)
 *
 * Zwei Antwort-Modi: Accept: application/json → JSON ({ok:boolean}); sonst (No-JS-
 * Formular-POST) → 303-Redirect auf die Danke-Seite bzw. eine minimale Fehlerseite.
 */
interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

interface Ctx {
  request: Request;
  env: Env;
}

/** Themen-Key → deutsches Label (für Betreff/Body der Mail). */
const TOPIC_LABELS: Record<string, string> = {
  app: 'Frage zur App',
  feedback: 'Feedback',
  problem: 'Problem melden',
  presse: 'Presse & Kooperation',
  sonstiges: 'Sonstiges',
};

/** Öffentliche Kontaktadresse (nur für die No-JS-Fehlerseite; = site.ts contact.email). */
const PUBLIC_EMAIL = 'mail@immobilien-bot.de';

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

/** Minimale, i18n-freie Fehlerseite für den No-JS-Pfad (utf-8). */
function errorHtml(): Response {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Senden fehlgeschlagen</title></head><body style="font-family:Roboto,system-ui,-apple-system,Segoe UI,Arial,sans-serif;background:#3b3b3a;color:#f6f6f6;margin:0;min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px;line-height:1.6"><div><p>Das Senden hat leider nicht geklappt.<br>Schreib uns direkt an <a href="mailto:${PUBLIC_EMAIL}" style="color:#fff03c">${PUBLIC_EMAIL}</a>.</p><p><a href="/" style="color:#fff03c">Zurück zur Startseite</a></p></div></body></html>`;
  return new Response(html, {
    status: 502,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

const failure = (wantsJson: boolean): Response => (wantsJson ? json({ ok: false }, 502) : errorHtml());

export const onRequestPost = async ({ request, env }: Ctx): Promise<Response> => {
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
  let lang = get('lang');

  // 5a) lang + topic normalisieren (vor den Redirects gebraucht).
  if (lang !== 'de' && lang !== 'en') lang = 'de';
  if (!TOPIC_LABELS[topic]) topic = 'sonstiges';

  // 4) Honeypot gefüllt → NICHT senden, aber Erfolg vortäuschen.
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

  const topicLabel = TOPIC_LABELS[topic];

  // 7) Key muss aus env kommen.
  if (!env.RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY fehlt in der Umgebung.');
    return failure(wantsJson);
  }

  // 8) Mail über die Resend-REST-API. KEINE Nachrichteninhalte loggen.
  const sentAt = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin',
  }).format(new Date());
  const text =
    `Thema: ${topicLabel}\n` +
    `Name: ${name}\n` +
    `E-Mail: ${email}\n\n` +
    `${message}\n\n` +
    `— Gesendet über das Kontaktformular am ${sentAt} (Europe/Berlin)`;

  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM ?? 'Immobilien Bot Website <onboarding@resend.dev>',
        to: [env.CONTACT_TO ?? 'socialmedia@immobilien-bot.de'],
        reply_to: email,
        subject: `Kontaktanfrage: ${topicLabel} – ${name}`,
        text,
      }),
    });
  } catch (err) {
    console.error('[contact] Resend-Request fehlgeschlagen:', err instanceof Error ? err.message : String(err));
    return failure(wantsJson);
  }

  // 9) Ergebnis.
  if (res.ok) {
    return wantsJson ? json({ ok: true }, 200) : redirect(thanksPath(lang), url);
  }
  console.error('[contact] Resend-Fehler:', res.status, await safeText(res));
  return failure(wantsJson);
};
