#!/bin/sh
# ─────────────────────────────────────────────────────────────
# Smoke test — vérifie qu'une instance déployée répond (MP20)
#
# Usage : BASE_URL=http://localhost:3000 ./scripts/smoke.sh
# Échoue (exit 1) dès qu'un check ne passe pas (3 tentatives
# espacées de 5s pour laisser le service démarrer).
# ─────────────────────────────────────────────────────────────
set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
TRIES="${SMOKE_TRIES:-3}"
SLEEP="${SMOKE_SLEEP:-5}"

check() {
  url="$1"
  label="$2"
  n=1
  while [ "$n" -le "$TRIES" ]; do
    if wget -q --spider "$url" 2>/dev/null; then
      echo "OK  $label ($url)"
      return 0
    fi
    echo "    $label : tentative $n/$TRIES échouée — retry dans ${SLEEP}s"
    n=$((n + 1))
    [ "$n" -le "$TRIES" ] && sleep "$SLEEP"
  done
  echo "FAIL $label ($url)" >&2
  exit 1
}

echo "Smoke test → $BASE_URL"
check "$BASE_URL/health/live" "liveness /health/live"
check "$BASE_URL/health" "health /health"
check "$BASE_URL/health/ready" "readiness /health/ready"
check "$BASE_URL/metrics" "métriques /metrics"
echo "Smoke test OK ✓"
