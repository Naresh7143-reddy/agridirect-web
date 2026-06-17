#!/usr/bin/env bash
# run_all.sh — Run component tests + E2E tests, then generate Excel report.
# Exit code = 0 only if ALL tests pass.
# Usage: bash tests/run_all.sh [--base-url http://localhost:3000]
set -euo pipefail

START_TIME=$(date +%s)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPORTS_DIR="$ROOT/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VITEST_OUT="$REPORTS_DIR/vitest-results.json"
PYTEST_OUT="$REPORTS_DIR/pytest-results.xml"
REPORT_OUT="$REPORTS_DIR/test-report-$TIMESTAMP.xlsx"

BASE_URL="${TEST_BASE_URL:-http://localhost:3000}"

# Parse --base-url flag
while [[ $# -gt 0 ]]; do
  case $1 in
    --base-url) BASE_URL="$2"; shift 2 ;;
    *) shift ;;
  esac
done

mkdir -p "$REPORTS_DIR"
mkdir -p "$REPORTS_DIR/screenshots"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     AgriDirect Full Test Suite                       ║"
echo "║     Base URL: $BASE_URL"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

COMPONENT_EXIT=0
E2E_EXIT=0

# ── 1. Component tests (Vitest) ───────────────────────────────────────────────
echo "▶ [1/2] Running component tests (Vitest + RTL)..."
cd "$ROOT"
npx vitest run --reporter=verbose --reporter=json --outputFile.json="$VITEST_OUT" \
  || COMPONENT_EXIT=$?

if [ $COMPONENT_EXIT -eq 0 ]; then
  echo "  ✅ Component tests PASSED"
else
  echo "  ❌ Component tests FAILED (exit $COMPONENT_EXIT)"
fi

# ── 2. E2E tests (Selenium / pytest) ─────────────────────────────────────────
echo ""
echo "▶ [2/2] Running E2E tests (Selenium / pytest) against $BASE_URL..."

cd "$ROOT/tests/e2e"
TEST_BASE_URL="$BASE_URL" python -m pytest \
  --junitxml="$PYTEST_OUT" \
  --tb=short \
  -v \
  --continue-on-collection-errors \
  || E2E_EXIT=$?

if [ $E2E_EXIT -eq 0 ]; then
  echo "  ✅ E2E tests PASSED"
else
  echo "  ❌ E2E tests FAILED (exit $E2E_EXIT)"
fi

# ── 3. Generate Excel report ──────────────────────────────────────────────────
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "▶ Generating Excel report..."
cd "$ROOT"
python tests/generate_report.py \
  --vitest "$VITEST_OUT" \
  --pytest  "$PYTEST_OUT" \
  --out     "$REPORT_OUT" \
  --duration "$DURATION"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Report saved → $REPORT_OUT"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 4. Final exit code ────────────────────────────────────────────────────────
if [ $COMPONENT_EXIT -ne 0 ] || [ $E2E_EXIT -ne 0 ]; then
  echo "❌ One or more test suites failed."
  exit 1
fi
echo "✅ All tests passed!"
exit 0
