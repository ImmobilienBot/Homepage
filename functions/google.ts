/**
 * /google — Play-Store-Shortcut (301). Referrer = eingehende Query (URL-encodiert),
 * sonst der utm-Fallback. Ziel/Parameter byte-exakt aus der alten .htaccess.
 */
import { PLAY_BASE, PLAY_REFERRER_GOOGLE, playReferrer, redirect } from './_lib/shortlinks';

export const onRequest = ({ request }: { request: Request }): Response => {
  const url = new URL(request.url);
  return redirect(PLAY_BASE + playReferrer(url, PLAY_REFERRER_GOOGLE), 301);
};
