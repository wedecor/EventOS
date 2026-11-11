export function e2eCredentials(): { email: string; password: string } | null {
  const email = process.env.E2E_ADMIN_EMAIL ?? 'admin@wedecor.events';
  const password =
    process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? '';
  if (!password) return null;
  return { email, password };
}

export function requireE2eCredentials(): { email: string; password: string } {
  const creds = e2eCredentials();
  if (!creds) {
    throw new Error(
      'Set E2E_ADMIN_PASSWORD or SEED_ADMIN_PASSWORD to run Playwright E2E.',
    );
  }
  return creds;
}

export const API_BASE =
  process.env.E2E_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3000';
