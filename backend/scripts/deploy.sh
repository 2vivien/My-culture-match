#!/bin/sh
# ─────────────────────────────────────────────────────────────
# Deploy — My Culture Match backend (MP20)
#
# Cible supportée : Railway ou Fly.io, ou SSH vers un hôte Docker.
# Choisir via DEPLOY_TARGET : railway | fly | ssh
#
# Prérequis :
#   railway  → RAILWAY_TOKEN (GitHub Secret) + `railway` CLI (voir .github/workflows/deploy.yml)
#   fly      → FLY_API_TOKEN + flyctl
#   ssh      → SSH_HOST, SSH_USER, SSH_KEY + hôte avec Docker et `docker compose pull/up`
#
# L'image doit être poussée en amont (GHCR) :
#   ghcr.io/<owner>/my-culture-match/backend:<sha>
# ─────────────────────────────────────────────────────────────
set -e

TARGET="${DEPLOY_TARGET:-}"
IMAGE="${IMAGE_NAME:?IMAGE_NAME manquant (ex: ghcr.io/org/repo/backend:sha)}"

case "$TARGET" in
  railway)
    [ -n "$RAILWAY_TOKEN" ] || { echo "RAILWAY_TOKEN manquant" >&2; exit 1; }
    railway login --token "$RAILWAY_TOKEN"
    railway up --service backend --detach
    echo "Deployé sur Railway : $IMAGE"
    ;;
  fly)
    [ -n "$FLY_API_TOKEN" ] || { echo "FLY_API_TOKEN manquant" >&2; exit 1; }
    flyctl deploy --image "$IMAGE" --detach
    echo "Deployé sur Fly.io : $IMAGE"
    ;;
  ssh)
    [ -n "$SSH_HOST" ] && [ -n "$SSH_USER" ] && [ -n "$SSH_KEY" ] || {
      echo "SSH_HOST/SSH_USER/SSH_KEY manquants" >&2; exit 1
    }
    printf '%s' "$SSH_KEY" > /tmp/deploy_key
    chmod 600 /tmp/deploy_key
    ssh -i /tmp/deploy_key -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" \
      "docker pull '$IMAGE' && cd /app && docker compose pull api && docker compose up -d api && docker compose exec -T api npm run migrate"
    rm -f /tmp/deploy_key
    echo "Deployé via SSH : $IMAGE"
    ;;
  *)
    echo "⚠  Aucune cible de déploiement configurée (DEPLOY_TARGET=railway|fly|ssh)."
    echo "   L'image est prête et testée : $IMAGE"
    echo "   Définissez DEPLOY_TARGET et les secrets associés pour activer le déploiement."
    exit 0
    ;;
esac
