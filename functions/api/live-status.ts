/**
 * functions/api/live-status.ts — Same-Origin-Proxy für den Staging-Badge-Sync.
 *
 * Warum: Das Staging-Badge (nur Preview/Nicht-main, siehe BaseLayout.astro) fragte
 * `api.github.com` DIREKT aus dem Browser ab — das scheitert an GitHubs Pro-IP-Rate-
 * Limit / Browser-Blocking und blieb am Fallback hängen. Diese Function ruft die
 * GitHub-Compare-API SERVERSEITIG (User-Agent ist dort Pflicht) und cached die
 * Antwort am Cloudflare-Edge → GitHub-Hits << 60/h, unabhängig von der Client-IP.
 *
 * Liefert nur die öffentliche `ahead`-Zahl (Commits, die staging vor main hat) —
 * kein Secret, daher bewusst ungegatet; aufgerufen wird der Endpunkt ohnehin nur
 * vom Staging-Badge. `behind_by` wird bewusst nicht durchgereicht (Merge-Commit-
 * Rauschen, siehe Badge-Logik).
 *
 * Env (OPTIONAL, nie im Repo — nur als Cloudflare-Pages-Env-Var):
 *  - GITHUB_STATUS_TOKEN — falls gesetzt, als `Authorization: token …` mitgeschickt
 *    (höheres Rate-Limit). Ohne Token läuft der (edge-gecachte) unauth. Pfad.
 */
interface Env {
  GITHUB_STATUS_TOKEN?: string;
}

interface Ctx {
  env: Env;
}

const COMPARE_URL =
  'https://api.github.com/repos/ImmobilienBot/Homepage/compare/main...staging';

const json = (obj: unknown, cacheControl: string): Response =>
  new Response(JSON.stringify(obj), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
    },
  });

export const onRequestGet = async ({ env }: Ctx): Promise<Response> => {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      // User-Agent ist für die GitHub-API vom Server PFLICHT, sonst 403.
      'User-Agent': 'ib-staging-badge',
    };
    if (env.GITHUB_STATUS_TOKEN) {
      headers.Authorization = `token ${env.GITHUB_STATUS_TOKEN}`;
    }

    const res = await fetch(COMPARE_URL, {
      headers,
      // Edge-Cache → GitHub-Hits << 60/h (unabhängig von der Client-IP).
      cf: { cacheTtl: 60, cacheEverything: true },
    } as RequestInit & { cf?: { cacheTtl?: number; cacheEverything?: boolean } });

    if (!res.ok) return json({ ahead: null }, 'no-store');

    const d = (await res.json()) as { ahead_by?: unknown };
    const ahead = typeof d.ahead_by === 'number' ? d.ahead_by : null;
    return json({ ahead }, 'public, max-age=30');
  } catch {
    return json({ ahead: null }, 'no-store');
  }
};
