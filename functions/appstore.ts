/** /appstore — App-Store-Shortcut (301). Ziel byte-exakt aus der alten .htaccess. */
import { APPLE_APPSTORE, redirect } from './_lib/shortlinks';

export const onRequest = (): Response => redirect(APPLE_APPSTORE, 301);
