#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/deploy/tencent-scf"
OUT_FILE="$OUT_DIR/index.mjs"
ZIP_FILE="$OUT_DIR/function.zip"

mkdir -p "$OUT_DIR"

cd "$ROOT_DIR"
npx esbuild scf/generate-encouragement.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=esm \
  --outfile="$OUT_FILE"

rm -f "$ZIP_FILE"
(
  cd "$OUT_DIR"
  zip -q function.zip index.mjs
)

echo "Built SCF package: $ZIP_FILE"
