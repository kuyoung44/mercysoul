#!/bin/bash
# deploy-all.sh — Verified multi-platform MercySoul deployment
# Each platform is reported as deployed only after its command succeeds.
# This script does not claim governmental, law-enforcement, military, or
# other external authority. It deploys MercySoul-controlled application assets.

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PASSED=()
FAILED=()
SKIPPED=()

record_pass() { PASSED+=("$1"); }
record_fail() { FAILED+=("$1"); }
record_skip() { SKIPPED+=("$1"); }

run_required() {
  local name="$1"; shift
  echo "==> $name"
  if "$@"; then
    echo "PASS: $name"
    record_pass "$name"
  else
    echo "FAIL: $name"
    record_fail "$name"
  fi
}

run_optional() {
  local name="$1"; shift
  echo "==> $name"
  if "$@"; then
    echo "PASS: $name"
    record_pass "$name"
  else
    echo "FAIL: $name"
    record_fail "$name"
  fi
}

# Build once before platform deployment.
run_required "Build" npm run build

if (( ${#FAILED[@]} == 0 )); then
  run_required "GitHub main" git push origin main

  if command -v vercel >/dev/null 2>&1; then
    run_optional "Vercel" vercel --prod
  else
    echo "SKIP: Vercel CLI not installed"
    record_skip "Vercel"
  fi

  if command -v netlify >/dev/null 2>&1; then
    run_optional "Netlify" netlify deploy --prod
  else
    echo "SKIP: Netlify CLI not installed"
    record_skip "Netlify"
  fi

  if command -v wrangler >/dev/null 2>&1; then
    run_optional "Cloudflare Pages" wrangler pages deploy ./dist --project-name=mercysoul
  else
    echo "SKIP: Wrangler CLI not installed"
    record_skip "Cloudflare Pages"
  fi

  if [[ -n "${PINATA_JWT:-}" ]]; then
    echo "==> IPFS / Pinata"
    if curl -fsS -X POST \
      "https://api.pinata.cloud/pinning/pinFileToIPFS" \
      -H "Authorization: Bearer $PINATA_JWT" \
      -F "file=@./dist/index.html"; then
      echo "PASS: IPFS / Pinata"
      record_pass "IPFS / Pinata"
    else
      echo "FAIL: IPFS / Pinata"
      record_fail "IPFS / Pinata"
    fi
  else
    echo "SKIP: IPFS / Pinata (PINATA_JWT not configured)"
    record_skip "IPFS / Pinata"
  fi

  if npm run deploy:arweave; then
    echo "PASS: Arweave"
    record_pass "Arweave"
  else
    echo "FAIL: Arweave"
    record_fail "Arweave"
  fi
else
  echo "Build failed; platform deployment was not attempted."
fi

# Render is not triggered by this script. It is verified by its deployment system.
# The expected main commit is supplied so operators can compare Render's deployed SHA.
EXPECTED_RENDER_COMMIT="${EXPECTED_RENDER_COMMIT:-$(git rev-parse HEAD 2>/dev/null || true)}"
echo ""
echo "Render verification required: expected commit ${EXPECTED_RENDER_COMMIT:-unknown}"
record_skip "Render (external deployment verification)"

# Do not publish a global status claim from this script. X/social publication must
# happen only after the operator verifies the actual URLs and chooses the wording.
record_skip "Social announcement (manual after verification)"

echo ""
echo "========================================"
echo "VERIFIED DEPLOYMENT SUMMARY"
echo "========================================"

echo "PASSED:"
if (( ${#PASSED[@]} )); then printf '  - %s\n' "${PASSED[@]}"; else echo "  - none"; fi

echo "FAILED:"
if (( ${#FAILED[@]} )); then printf '  - %s\n' "${FAILED[@]}"; else echo "  - none"; fi

echo "SKIPPED / MANUAL VERIFICATION:"
if (( ${#SKIPPED[@]} )); then printf '  - %s\n' "${SKIPPED[@]}"; else echo "  - none"; fi

echo ""

if (( ${#FAILED[@]} > 0 )); then
  echo "DEPLOYMENT STATUS: FAILED — no all-platform success claim is permitted."
  exit 1
fi

echo "DEPLOYMENT STATUS: AUTOMATED STEPS PASSED."
echo "Render and social publication remain explicitly unverified/manual."
