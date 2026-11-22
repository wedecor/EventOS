/**
 * M5-01 — Cloud Run (and Cloudflare in front of it) forwards the client address in
 * `X-Forwarded-For`. Trust exactly one proxy hop: `req.ip` — the rate-limit key and
 * audit-log address — is then the address Google's front end saw, and a
 * client-supplied `X-Forwarded-For` prefix cannot spoof it.
 */
export const TRUSTED_PROXY_HOPS = 1;

export function configureProxyTrust(app: {
  set(setting: string, value: unknown): unknown;
}): void {
  app.set('trust proxy', TRUSTED_PROXY_HOPS);
}
