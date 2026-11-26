/**
 * Connection-pool sizing for Cloud SQL db-f1-micro (~25 max_connections).
 * Cloud Run runs a single instance (maxScale=1) with 5 pooled connections,
 * leaving headroom for the migrate/seed Cloud Run jobs, admin sessions and
 * Cloud SQL's reserved superuser slots.
 */
export const DEFAULT_CONNECTION_LIMIT = 5;
export const DEFAULT_POOL_TIMEOUT_SECONDS = 20;

function hasParam(url: string, name: string): boolean {
  return new RegExp(`[?&]${name}=`).test(url);
}

function readParam(url: string, name: string): number | undefined {
  const match = new RegExp(`[?&]${name}=([^&#]*)`).exec(url);
  const value = match ? Number(match[1]) : NaN;
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Appends `connection_limit` / `pool_timeout` when absent, without changing the
 * secret's format. Works for URLs that already carry a query string (Cloud SQL
 * socket URLs: `…/db?host=/cloudsql/project:region:instance`). Explicit values
 * in DATABASE_URL always win.
 */
export function withPoolDefaults(databaseUrl: string): string {
  const additions = [
    ...(hasParam(databaseUrl, 'connection_limit')
      ? []
      : [`connection_limit=${DEFAULT_CONNECTION_LIMIT}`]),
    ...(hasParam(databaseUrl, 'pool_timeout')
      ? []
      : [`pool_timeout=${DEFAULT_POOL_TIMEOUT_SECONDS}`]),
  ];
  if (additions.length === 0) {
    return databaseUrl;
  }

  const hashIndex = databaseUrl.indexOf('#');
  const base = hashIndex === -1 ? databaseUrl : databaseUrl.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : databaseUrl.slice(hashIndex);
  const separator = !base.includes('?')
    ? '?'
    : base.endsWith('?') || base.endsWith('&')
      ? ''
      : '&';
  return `${base}${separator}${additions.join('&')}${hash}`;
}

/**
 * `pg` Pool options for the Prisma driver adapter. The adapter ignores the
 * Prisma-engine URL params, so the same limits are applied as `max` and
 * `connectionTimeoutMillis`, read back from the (defaulted) URL.
 */
export function buildPoolConfig(databaseUrl: string): {
  connectionString: string;
  max: number;
  connectionTimeoutMillis: number;
} {
  const connectionString = withPoolDefaults(databaseUrl);
  return {
    connectionString,
    max:
      readParam(connectionString, 'connection_limit') ??
      DEFAULT_CONNECTION_LIMIT,
    connectionTimeoutMillis:
      (readParam(connectionString, 'pool_timeout') ??
        DEFAULT_POOL_TIMEOUT_SECONDS) * 1000,
  };
}
