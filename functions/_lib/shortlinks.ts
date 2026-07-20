/**
 * functions/_lib/shortlinks.ts — Store-/Kampagnen-Shortlink-Ziele.
 *
 * Ziele & Parameter sind BYTE-EXAKT aus der alten IONOS-`.htaccess`
 * (Webspace: /Immobilienbot/.htaccess) übernommen, damit gedruckte Poster-QRs und
 * laufende Kampagnen-Links 1:1 weiterfunktionieren. BEWUSST NICHT aus `src/data/site.ts`
 * (dort stehen andere ct-/utm-Werte für die Homepage-CTAs). Nichts hinzuerfinden.
 *
 * Play-Referrer-Werte sind bereits URL-encodiert (`%3D`=„=", `%26`=„&") — genau wie
 * die `.htaccess` sie mit dem B-Flag erzeugt.
 */

/** Apple App Store — Shortcut-/Poster-Varianten (unterschiedliche ct-Kampagnenwerte). */
export const APPLE_APPSTORE = 'https://apps.apple.com/de/app/immobilien-bot/id6741714480?pt=127566053&ct=Shortcut_AppStore&mt=8';
export const APPLE_APPLE = 'https://apps.apple.com/de/app/immobilien-bot/id6741714480?pt=127566053&ct=Shortcut_Apple&mt=8';
export const APPLE_POSTER_001 = 'https://apps.apple.com/de/app/immobilien-bot/id6741714480?pt=127566053&ct=Poster_001&mt=8';

/** Google Play — Basis + fertige (encodierte) Referrer-Fallbacks. */
export const PLAY_BASE = 'https://play.google.com/store/apps/details?id=immobilien.bot&hl=de&referrer=';
export const PLAY_REFERRER_PLAYSTORE = 'utm_source%3Dshortcut%26utm_medium%3Dredirect%26utm_campaign%3Dplaystore';
export const PLAY_REFERRER_GOOGLE = 'utm_source%3Dshortcut%26utm_medium%3Dredirect%26utm_campaign%3Dgoogle';
export const PLAY_REFERRER_POSTER_001 = 'utm_source%3Doffline%26utm_medium%3Dqr%26utm_campaign%3Dposter%26utm_content%3Dposter_001';

/** Poster-QR ohne App (Desktop) → Startseite mit UTM (absolut, wie in der .htaccess). */
export const HOME_POSTER_001 = 'https://immobilien-bot.de/?utm_source=offline&utm_medium=qr&utm_campaign=poster&utm_content=poster_001';

export const isIOS = (ua: string): boolean => /(iPhone|iPad|iPod)/i.test(ua);
export const isAndroid = (ua: string): boolean => /android/i.test(ua);

/** Redirect-Response; erlaubt relative Location (Response.redirect verlangt absolut). */
export function redirect(location: string, status: number, headers: Record<string, string> = {}): Response {
  return new Response(null, { status, headers: { Location: location, ...headers } });
}

/**
 * Play-Install-Referrer aus der eingehenden Query bilden (wie `.htaccess`: die ganze
 * Query-String wird URL-encodiert an `referrer=` gehängt), sonst den Fallback nutzen.
 */
export function playReferrer(url: URL, fallback: string): string {
  const qs = url.search.slice(1); // ohne führendes '?'
  return qs ? encodeURIComponent(qs) : fallback;
}

/** Header, damit UA-abhängige Weichen nicht geräteübergreifend gecacht werden. */
export const UA_VARY = { 'Cache-Control': 'no-store', Vary: 'User-Agent' } as const;
