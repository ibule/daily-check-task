#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

ENV_ID="${TENCENT_CLOUDBASE_ENV_ID:-work-5go9mdmrce0a3f13}"
DEPLOY_PATH="${TENCENT_CLOUDBASE_DEPLOY_PATH:-/}"
API_BASE_URL="${VITE_API_BASE_URL:-${TENCENT_SCF_BASE_URL:-}}"

if ! command -v tcb >/dev/null 2>&1; then
  echo "CloudBase CLI is required. Install it first and run: tcb login" >&2
  exit 1
fi

if [[ -z "$API_BASE_URL" ]]; then
  echo "Set VITE_API_BASE_URL or TENCENT_SCF_BASE_URL before deploying the web app." >&2
  exit 1
fi

cd "$ROOT_DIR"
VITE_API_BASE_URL="$API_BASE_URL" npm run build
tcb hosting deploy ./dist "$DEPLOY_PATH" -e "$ENV_ID"

echo "Deployed web app to CloudBase env: $ENV_ID"
