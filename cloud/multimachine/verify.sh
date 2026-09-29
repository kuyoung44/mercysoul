#!/usr/bin/env bash
set -euo pipefail

: "${MERCYSOUL_BASE_URL:?Set MERCYSOUL_BASE_URL}"
echo "== MercySoul Cloud verification =="

health="$(curl -fsS "${MERCYSOUL_BASE_URL}/health")"
echo "$health"

echo "$health" | grep -q '"ok":true'
echo "PASS: gateway/application health"

echo "Next required checks:"
echo "1. database write"
echo "2. database read-back"
echo "3. audit record"
echo "4. storage object write/read"
echo "5. controlled deployment verification"
echo "PASS: basic live endpoint"
