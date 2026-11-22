/**
 * Controlled live OpenAI smoke for Lead Intelligence (M4 market gate).
 *
 * Usage (never print AI_API_KEY):
 *   set -a; source .env; set +a
 *   AI_PROVIDER=openai pnpm exec tsx scripts/ai-live-smoke.ts
 *
 * Requires: AI_PROVIDER=openai, AI_API_KEY, DATABASE_URL, JWT auth against a
 * running API (default http://localhost:3100) with SEED_ADMIN_PASSWORD or
 * AI_SMOKE_PASSWORD, and isolated/non-production data.
 *
 * Exits non-zero on failure. Does not mutate lead business fields beyond
 * creating one synthetic lead for the smoke.
 */
import 'dotenv/config';

const API_BASE = process.env.AI_SMOKE_API_BASE ?? 'http://localhost:3100';
const EMAIL = process.env.AI_SMOKE_EMAIL ?? 'admin@wedecor.events';
const PASSWORD =
  process.env.AI_SMOKE_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? '';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function keyPresent(): boolean {
  const key = process.env.AI_API_KEY?.trim() ?? '';
  return key.length > 8;
}

async function jsonFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = (await res.json()) as T;
  return { status: res.status, body };
}

async function main(): Promise<void> {
  assert(
    process.env.AI_PROVIDER === 'openai',
    'AI_PROVIDER must be openai for live smoke (got: ' +
      String(process.env.AI_PROVIDER) +
      ')',
  );
  assert(keyPresent(), 'AI_API_KEY is missing or too short');
  assert(PASSWORD.length > 0, 'Set AI_SMOKE_PASSWORD or SEED_ADMIN_PASSWORD');

  console.log('live_openai_smoke: starting');
  console.log('api_base:', API_BASE);
  console.log('model:', process.env.AI_MODEL ?? 'gpt-4o-mini');
  console.log('key: present');

  const login = await jsonFetch<{
    data?: { accessToken: string };
    error?: { code: string; message: string };
  }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  assert(login.status === 200 && login.body.data?.accessToken, 'login failed');
  const token = login.body.data!.accessToken;

  const lead = await jsonFetch<{ data: { id: string } }>('/api/v1/leads', {
    method: 'POST',
    token,
    body: JSON.stringify({
      source: 'manual',
      eventType: 'wedding',
      notes: 'Live smoke synthetic lead — do not invent budget 999999',
    }),
  });
  assert(lead.status === 201 || lead.status === 200, 'lead create failed');
  const leadId = lead.body.data.id;
  console.log('synthetic_lead:', leadId);

  const before = await jsonFetch<{
    data: {
      version: number;
      estimatedBudgetAmount: number | null;
      notes: string | null;
    };
  }>(`/api/v1/leads/${leadId}`, { token });

  const started = Date.now();
  const intel = await jsonFetch<{
    data?: {
      readOnly: boolean;
      provider: string;
      intelligence: {
        budget: { value: unknown; evidence: string };
        eventType: { value: string | null; evidence: string };
        missingInformation: string[];
      };
      usage: {
        promptTokens: number | null;
        completionTokens: number | null;
        totalTokens: number | null;
        estimatedCostUsd: number | null;
      };
    };
    error?: { code: string; message: string };
  }>(`/api/v1/leads/${leadId}/ai/intelligence`, {
    method: 'POST',
    token,
    body: '{}',
  });
  const durationMs = Date.now() - started;

  assert(intel.status === 200 && intel.body.data, 'intelligence call failed');
  const data = intel.body.data!;
  assert(data.readOnly === true, 'readOnly must be true');
  assert(data.provider === 'openai', 'provider must be openai');
  assert(
    data.intelligence.eventType.value === 'wedding',
    'eventType should stay wedding',
  );
  assert(
    data.intelligence.budget.value === null,
    'budget must not be invented when lead budget is null',
  );
  assert(
    data.intelligence.budget.evidence === 'unknown',
    'budget evidence must be unknown',
  );
  assert(
    Array.isArray(data.intelligence.missingInformation) &&
      data.intelligence.missingInformation.length > 0,
    'missingInformation should list gaps',
  );
  assert(
    data.usage.totalTokens != null && data.usage.totalTokens > 0,
    'token usage required from live provider',
  );

  const after = await jsonFetch<{
    data: {
      version: number;
      estimatedBudgetAmount: number | null;
      notes: string | null;
    };
  }>(`/api/v1/leads/${leadId}`, { token });
  assert(
    after.body.data.version === before.body.data.version,
    'lead version mutated',
  );
  assert(
    after.body.data.estimatedBudgetAmount ===
      before.body.data.estimatedBudgetAmount,
    'lead budget mutated',
  );
  assert(after.body.data.notes === before.body.data.notes, 'lead notes mutated');

  console.log(
    JSON.stringify(
      {
        ok: true,
        durationMs,
        provider: data.provider,
        eventType: data.intelligence.eventType,
        budget: data.intelligence.budget,
        missingInformation: data.intelligence.missingInformation,
        usage: data.usage,
        costConfigured: data.usage.estimatedCostUsd != null,
      },
      null,
      2,
    ),
  );
  console.log('live_openai_smoke: PASS');
}

main().catch((error: unknown) => {
  console.error('live_openai_smoke: FAIL', error);
  process.exit(1);
});
