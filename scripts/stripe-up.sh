#!/usr/bin/env bash
#
# Starts the Stripe CLI webhook listener forwarding to the local API and
# writes the session's signing secret (whsec_) into the root .env, so the API
# can verify webhook signatures without manual copy-paste.
#
# Usage:  npm run stripe:up
#
# Keep this running in its own terminal while testing payments. The whsec is
# regenerated each run, so .env is updated automatically — restart the API
# afterwards to pick it up.
#
set -euo pipefail

API_PORT="${API_PORT:-3232}"
FORWARD_TO="localhost:${API_PORT}/subscriptions/webhook"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"

if ! command -v stripe >/dev/null 2>&1; then
  echo "Stripe CLI not found. Install it:" >&2
  echo "  brew install stripe/stripe-cli/stripe" >&2
  echo "  (or download from https://github.com/stripe/stripe-cli/releases)" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo ".env not found at ${ENV_FILE}" >&2
  exit 1
fi

LOG="$(mktemp)"
trap 'rm -f "$LOG"' EXIT

echo "Starting stripe listen (forwarding to ${FORWARD_TO})..."
# Run the listener in the background, mirroring output to the terminal and a log.
stripe listen --forward-to "$FORWARD_TO" 2>&1 | tee "$LOG" &
LISTEN_PID=$!

# Wait for the signing secret to appear (printed once the tunnel is ready).
WHSEC=""
for _ in $(seq 1 30); do
  WHSEC="$(grep -o 'whsec_[a-f0-9]*' "$LOG" 2>/dev/null | head -n1 || true)"
  [ -n "$WHSEC" ] && break
  sleep 1
done

if [ -z "$WHSEC" ]; then
  echo "Could not read the webhook signing secret. Is the Stripe CLI authenticated? Run 'stripe login'." >&2
  kill "$LISTEN_PID" 2>/dev/null || true
  exit 1
fi

# Persist the secret into .env, creating the line if missing.
if grep -q '^STRIPE_WEBHOOK_SECRET=' "$ENV_FILE"; then
  sed -i.bak "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=${WHSEC}|" "$ENV_FILE"
  rm -f "${ENV_FILE}.bak"
else
  printf '\nSTRIPE_WEBHOOK_SECRET=%s\n' "$WHSEC" >> "$ENV_FILE"
fi

echo ""
echo "Webhook signing secret written to .env: ${WHSEC}"
echo "Restart the API (e.g. npm run dev) so it picks up the new secret."
echo ""

# Keep the listener in the foreground so events stream here; Ctrl+C stops it.
wait "$LISTEN_PID"
