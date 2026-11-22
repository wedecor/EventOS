#!/usr/bin/env bash
# R5-02 — validate a production env file for currently required boot keys.
# Does not connect to any remote service and does not deploy anything.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${1:-$ROOT/infrastructure/production/.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: env file not found: $ENV_FILE" >&2
  echo "hint: cp infrastructure/production/.env.production.example infrastructure/production/.env.production" >&2
  exit 1
fi

while IFS= read -r line || [[ -n "$line" ]]; do
  case "$line" in
    ''|\#*) continue ;;
  esac
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    if [[ "$value" =~ ^\"(.*)\"$ ]]; then
      value="${BASH_REMATCH[1]}"
    elif [[ "$value" =~ ^\'(.*)\'$ ]]; then
      value="${BASH_REMATCH[1]}"
    fi
    printf -v "$key" '%s' "$value"
    export "$key"
  fi
done < "$ENV_FILE"

fail=0
warn=0

is_placeholder() {
  local value="$1"
  [[ -z "$value" ]] \
    || [[ "$value" == REPLACE* ]] \
    || [[ "$value" == *REPLACE_* ]] \
    || [[ "$value" == *REPLACE* ]] \
    || [[ "$value" == change-me* ]]
}

require() {
  local key="$1"
  local value="${!key-}"
  if is_placeholder "$value"; then
    echo "MISSING/PLACEHOLDER: $key"
    fail=1
  else
    echo "OK: $key"
  fi
}

warn_optional() {
  local key="$1"
  local value="${!key-}"
  if is_placeholder "$value"; then
    echo "WARN (not yet boot-required): $key unset or still placeholder"
    warn=1
  else
    echo "OK (future): $key"
  fi
}

echo "== Required for API bootstrap (NODE_ENV=production) =="
require NODE_ENV
if [[ "${NODE_ENV:-}" != "production" ]]; then
  echo "ERROR: NODE_ENV must be 'production' (got: ${NODE_ENV:-unset})"
  fail=1
fi
require PORT
require CORS_ORIGIN
if [[ "${CORS_ORIGIN:-}" == "*" ]]; then
  echo "ERROR: CORS_ORIGIN must not be '*' in production (R1-06 / docs/14)"
  fail=1
fi
if [[ "${CORS_ORIGIN:-}" == http://* ]]; then
  echo "ERROR: CORS_ORIGIN must use HTTPS in production (got: ${CORS_ORIGIN})"
  fail=1
fi
require DATABASE_URL
require REDIS_HOST
require REDIS_PORT
require JWT_SECRET
if [[ ${#JWT_SECRET} -lt 32 ]]; then
  echo "ERROR: JWT_SECRET must be at least 32 characters (got ${#JWT_SECRET})"
  fail=1
fi

echo
echo "== Documented for production readiness (docs/16; not yet boot-required) =="
warn_optional APP_URL
warn_optional STORAGE_ENDPOINT
warn_optional STORAGE_ACCESS_KEY
warn_optional STORAGE_SECRET_KEY
warn_optional STORAGE_BUCKET
warn_optional AI_PROVIDER_API_KEY
warn_optional EMAIL_API_KEY
warn_optional SENTRY_DSN

echo
echo "== Frontend build-time (apps/web; validate separately when building portal) =="
if [[ -n "${NEXT_PUBLIC_API_BASE_URL:-}" ]]; then
  if is_placeholder "$NEXT_PUBLIC_API_BASE_URL" || [[ "$NEXT_PUBLIC_API_BASE_URL" == http://localhost* ]]; then
    echo "WARN: NEXT_PUBLIC_API_BASE_URL looks non-production: ${NEXT_PUBLIC_API_BASE_URL}"
    warn=1
  else
    echo "OK: NEXT_PUBLIC_API_BASE_URL"
  fi
else
  echo "WARN: NEXT_PUBLIC_API_BASE_URL not in this file — set at web build time"
  warn=1
fi

echo
if [[ "$fail" -ne 0 ]]; then
  echo "RESULT: FAIL — fix required boot variables before production deploy."
  exit 1
fi

if [[ "$warn" -ne 0 ]]; then
  echo "RESULT: PASS (boot keys) — future docs/16 secrets or frontend URL still placeholders."
  exit 0
fi

echo "RESULT: PASS — boot keys and documented future secrets look populated."
