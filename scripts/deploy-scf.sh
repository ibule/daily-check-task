#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ZIP_FILE="$ROOT_DIR/deploy/tencent-scf/function.zip"

REGION="${TENCENT_SCF_REGION:-ap-guangzhou}"
NAMESPACE="${TENCENT_SCF_NAMESPACE:-default}"
FUNCTION_NAME="${TENCENT_SCF_NAME:-daily-check-ai}"
TIMEOUT="${TENCENT_SCF_TIMEOUT:-30}"

if ! command -v tccli >/dev/null 2>&1; then
  echo "tccli is required. Install it first and run: tccli auth login" >&2
  exit 1
fi

"$ROOT_DIR/scripts/build-scf.sh"

ZIP_BASE64="$(base64 < "$ZIP_FILE" | tr -d '\n')"

tccli scf UpdateFunctionCode \
  --region "$REGION" \
  --FunctionName "$FUNCTION_NAME" \
  --Namespace "$NAMESPACE" \
  --CodeSource ZipFile \
  --ZipFile "$ZIP_BASE64"

tccli scf UpdateFunctionConfiguration \
  --region "$REGION" \
  --FunctionName "$FUNCTION_NAME" \
  --Namespace "$NAMESPACE" \
  --Timeout "$TIMEOUT"

echo "Deployed SCF function: $FUNCTION_NAME ($REGION/$NAMESPACE), timeout=${TIMEOUT}s"
