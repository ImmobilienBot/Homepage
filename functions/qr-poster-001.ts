/**
 * /qr-poster-001 — Poster-QR mit UA-Weiche (301), byte-exakt aus der alten .htaccess:
 *   iOS      → App Store (ct=Poster_001)
 *   Android  → Play Store (utm_content=poster_001)
 *   sonst    → Startseite mit UTM
 * Reihenfolge wie in der .htaccess (iOS, dann Android, dann Fallback).
 */
import {
  APPLE_POSTER_001,
  PLAY_BASE,
  PLAY_REFERRER_POSTER_001,
  HOME_POSTER_001,
  isIOS,
  isAndroid,
  redirect,
  UA_VARY,
} from './_lib/shortlinks';

export const onRequest = ({ request }: { request: Request }): Response => {
  const ua = request.headers.get('user-agent') || '';
  if (isIOS(ua)) return redirect(APPLE_POSTER_001, 301, UA_VARY);
  if (isAndroid(ua)) return redirect(PLAY_BASE + PLAY_REFERRER_POSTER_001, 301, UA_VARY);
  return redirect(HOME_POSTER_001, 301, UA_VARY);
};
