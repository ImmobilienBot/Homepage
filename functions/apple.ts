/** /apple — App-Store-Shortcut (301). Ziel byte-exakt aus der alten .htaccess. */
import { APPLE_APPLE, redirect } from './_lib/shortlinks';

export const onRequest = (): Response => redirect(APPLE_APPLE, 301);
