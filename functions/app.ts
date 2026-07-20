/**
 * /app — Geräte-Weiche wie die alte app/index.html:
 *   iOS     → /apple  (→ App Store, ct=Shortcut_Apple)
 *   Android → /google (→ Play Store)
 *   sonst   → Startseite
 * Relative Ziele (same-origin) → funktioniert auf Preview UND Produktion. 302, da
 * UA-abhängig. (/go/app bleibt unberührt — eigenständige Client-Weiche.)
 */
import { isIOS, isAndroid, redirect, UA_VARY } from './_lib/shortlinks';

export const onRequest = ({ request }: { request: Request }): Response => {
  const ua = request.headers.get('user-agent') || '';
  if (isIOS(ua)) return redirect('/apple', 302, UA_VARY);
  if (isAndroid(ua)) return redirect('/google', 302, UA_VARY);
  return redirect('/', 302, UA_VARY);
};
