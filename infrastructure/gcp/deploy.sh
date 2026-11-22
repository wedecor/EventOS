#!/usr/bin/env bash
# M5-01 — build → push → migrate → deploy Cloud Run → smoke test → print URL.
#
#   infrastructure/gcp/deploy.sh <staging|prod>
#
# Fails fast on any step. On a failed smoke test it routes traffic back to the
# previous revision (set AUTO_ROLLBACK=0 to disable). Database migrations are never
# rolled back automatically (forward-fix only — see README §Rollback).
#
# Required environment:
#   CORS_ORIGIN   explicit browser origin(s) for the target environment (no "*")
# Optional environment (defaults in brackets):
#   PROJECT_ID [wedecorenquries]  REGION [asia-south1]  AR_REPO [eventos]
#   SQL_INSTANCE [eventos-pg]     VPC_CONNECTOR [eventos-connector]
#   IMAGE_TAG [git short SHA / $GITHUB_SHA]   SKIP_BUILD=1 to reuse pushed images
#   AUTO_ROLLBACK [1]
#
# Requires: gcloud (authenticated), docker, curl, git. Never prints secrets.
set -euo pipefail

ENVIRONMENT="${1:-}"
case "$ENVIRONMENT" in
  staging|prod) ;;
  *) echo "usage: $0 <staging|prod>" >&2; exit 2 ;;
esac

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$ROOT/infrastructure/gcp"

PROJECT_ID="${PROJECT_ID:-wedecorenquries}"
REGION="${REGION:-asia-south1}"
AR_REPO="${AR_REPO:-eventos}"
SQL_INSTANCE="${SQL_INSTANCE:-eventos-pg}"
VPC_CONNECTOR="${VPC_CONNECTOR:-eventos-connector}"
AUTO_ROLLBACK="${AUTO_ROLLBACK:-1}"
# Per-environment runtime SA (least privilege: each env accesses only its secrets/bucket).
RUNTIME_SA="eventos-api-${ENVIRONMENT}@${PROJECT_ID}.iam.gserviceaccount.com"
SERVICE="eventos-api-${ENVIRONMENT}"
MIGRATE_JOB="eventos-migrate-${ENVIRONMENT}"
SQL_CONNECTION="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}"
IMAGE_TAG="${IMAGE_TAG:-${GITHUB_SHA:-$(git -C "$ROOT" rev-parse --short=12 HEAD)}}"
IMAGE="${REGISTRY}/eventos-api:${IMAGE_TAG}"
MIGRATOR_IMAGE="${REGISTRY}/eventos-migrator:${IMAGE_TAG}"

if [[ -z "${CORS_ORIGIN:-}" || "$CORS_ORIGIN" == "*" || "$CORS_ORIGIN" == *REPLACE* ]]; then
  echo "error: set CORS_ORIGIN to the explicit HTTPS origin(s) for ${ENVIRONMENT} (never '*')." >&2
  exit 1
fi

step() { printf '\n==> %s\n' "$*"; }

step "Deploying ${SERVICE} (${IMAGE_TAG}) to ${PROJECT_ID}/${REGION}"

# --- 1. build + push ---------------------------------------------------------
if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  step "Build and push images"
  docker build --pull -t "$IMAGE" "$ROOT/apps/api"
  docker build --target migrator -t "$MIGRATOR_IMAGE" "$ROOT/apps/api"
  docker push "$IMAGE"
  docker push "$MIGRATOR_IMAGE"
fi

# --- 2. migrate (Cloud Run Job, before the new revision; never at app start) -----
step "Run database migrations (${MIGRATE_JOB})"
gcloud run jobs deploy "$MIGRATE_JOB" \
  --project "$PROJECT_ID" --region "$REGION" \
  --image "$MIGRATOR_IMAGE" \
  --service-account "$RUNTIME_SA" \
  --set-cloudsql-instances "$SQL_CONNECTION" \
  --vpc-connector "$VPC_CONNECTOR" --vpc-egress private-ranges-only \
  --set-secrets "DATABASE_URL=eventos-${ENVIRONMENT}-database-url:latest" \
  --set-env-vars "NODE_ENV=production" \
  --command node_modules/.bin/prisma --args migrate,deploy \
  --max-retries 0 --task-timeout 900s
gcloud run jobs execute "$MIGRATE_JOB" --project "$PROJECT_ID" --region "$REGION" --wait

# --- 3. deploy ------------------------------------------------------------------
PREVIOUS_REVISION="$(gcloud run services describe "$SERVICE" \
  --project "$PROJECT_ID" --region "$REGION" \
  --format='value(status.traffic[0].revisionName)' 2>/dev/null || true)"

step "Deploy Cloud Run revision"
RENDERED="$(mktemp "${TMPDIR:-/tmp}/eventos-${ENVIRONMENT}-XXXXXX")"
trap 'rm -f "$RENDERED"' EXIT
sed -e "s|__IMAGE__|${IMAGE}|g" \
    -e "s|__CORS_ORIGIN__|${CORS_ORIGIN}|g" \
    "$HERE/cloudrun.${ENVIRONMENT}.yaml" > "$RENDERED"
if grep -q "__[A-Z_]*__" "$RENDERED"; then
  echo "error: unresolved placeholder left in the rendered service definition:" >&2
  grep -n "__[A-Z_]*__" "$RENDERED" >&2
  exit 1
fi
gcloud run services replace "$RENDERED" --project "$PROJECT_ID" --region "$REGION"

# Public HTTPS entry point; the API authenticates requests itself (JWT / HMAC).
gcloud run services add-iam-policy-binding "$SERVICE" \
  --project "$PROJECT_ID" --region "$REGION" \
  --member="allUsers" --role="roles/run.invoker" >/dev/null

# --- 4. smoke test --------------------------------------------------------------
URL="$(gcloud run services describe "$SERVICE" \
  --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"

smoke_failed() {
  echo "SMOKE TEST FAILED: $1" >&2
  if [[ "$AUTO_ROLLBACK" == "1" && -n "$PREVIOUS_REVISION" ]]; then
    echo "Routing traffic back to ${PREVIOUS_REVISION}" >&2
    gcloud run services update-traffic "$SERVICE" \
      --project "$PROJECT_ID" --region "$REGION" \
      --to-revisions "${PREVIOUS_REVISION}=100" || true
  fi
  exit 1
}

step "Smoke test ${URL}"
ready=0
for attempt in $(seq 1 12); do
  status="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${URL}/health/ready" || true)"
  if [[ "$status" == "200" ]]; then ready=1; break; fi
  echo "  /health/ready -> ${status:-no response} (attempt ${attempt}/12)"
  sleep 5
done
[[ "$ready" == "1" ]] || smoke_failed "/health/ready did not return 200"

# The feed must be reachable but refuse unsigned requests (proves the route, the
# raw-body parser and the HMAC guard are live and fail closed).
feed_status="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
  -X POST -H 'Content-Type: application/json' -d '{}' \
  "${URL}/api/v1/integrations/enquiries/sync" || true)"
[[ "$feed_status" == "401" ]] || smoke_failed "unsigned feed request returned ${feed_status:-no response} (expected 401)"

step "Done"
echo "Service:  ${SERVICE}"
echo "Revision: $(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.latestReadyRevisionName)')"
echo "Image:    ${IMAGE}"
echo "URL:      ${URL}"
