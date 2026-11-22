#!/usr/bin/env bash
# M5-01 — send 100% of traffic back to the previous Cloud Run revision.
#
#   infrastructure/gcp/rollback.sh <staging|prod> [REVISION]
#
# Without REVISION it picks the newest Ready revision that is not the one currently
# serving. Database migrations are NOT reverted (they are additive; forward-fix — see
# README §Rollback). Requires an authenticated gcloud. Never prints secrets.
set -euo pipefail

ENVIRONMENT="${1:-}"
case "$ENVIRONMENT" in
  staging|prod) ;;
  *) echo "usage: $0 <staging|prod> [REVISION]" >&2; exit 2 ;;
esac

PROJECT_ID="${PROJECT_ID:-wedecorenquries}"
REGION="${REGION:-asia-south1}"
SERVICE="eventos-api-${ENVIRONMENT}"

CURRENT="$(gcloud run services describe "$SERVICE" \
  --project "$PROJECT_ID" --region "$REGION" \
  --format='value(status.traffic[0].revisionName)')"

TARGET="${2:-}"
if [[ -z "$TARGET" ]]; then
  TARGET="$(gcloud run revisions list \
    --service "$SERVICE" --project "$PROJECT_ID" --region "$REGION" \
    --sort-by='~metadata.creationTimestamp' \
    --filter='status.conditions.type=Ready AND status.conditions.status=True' \
    --format='value(metadata.name)' \
    | grep -vx "$CURRENT" | head -n 1 || true)"
fi

if [[ -z "$TARGET" ]]; then
  echo "error: no previous Ready revision found for ${SERVICE} (current: ${CURRENT:-unknown})." >&2
  exit 1
fi

echo "Rolling back ${SERVICE}: ${CURRENT:-unknown} -> ${TARGET}"
gcloud run services update-traffic "$SERVICE" \
  --project "$PROJECT_ID" --region "$REGION" \
  --to-revisions "${TARGET}=100"

URL="$(gcloud run services describe "$SERVICE" \
  --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
status="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${URL}/health/ready" || true)"
echo "Serving: ${TARGET} (${URL}/health/ready -> ${status:-no response})"
[[ "$status" == "200" ]] || { echo "warning: readiness check did not return 200" >&2; exit 1; }
