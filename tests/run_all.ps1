# run_all.ps1 — Windows equivalent of run_all.sh
# Usage: .\tests\run_all.ps1 [-BaseUrl http://localhost:3000]
param(
    [string]$BaseUrl = $env:TEST_BASE_URL ?? "http://localhost:3000"
)

$ROOT = Split-Path $PSScriptRoot -Parent
$REPORTS_DIR = "$ROOT\reports"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$VITEST_OUT = "$REPORTS_DIR\vitest-results.json"
$PYTEST_OUT  = "$REPORTS_DIR\pytest-results.xml"
$REPORT_OUT  = "$REPORTS_DIR\test-report-$TIMESTAMP.xlsx"

New-Item -ItemType Directory -Force -Path $REPORTS_DIR | Out-Null
New-Item -ItemType Directory -Force -Path "$REPORTS_DIR\screenshots" | Out-Null

Write-Host ""
Write-Host "AgriDirect Full Test Suite — Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

$ComponentExit = 0
$E2EExit = 0
$StartTime = [System.Diagnostics.Stopwatch]::StartNew()

# 1. Component tests
Write-Host "[1/2] Running component tests (Vitest + RTL)..." -ForegroundColor Yellow
Push-Location $ROOT
npx vitest run --reporter=verbose --reporter=json "--outputFile.json=$VITEST_OUT"
$ComponentExit = $LASTEXITCODE
Pop-Location

if ($ComponentExit -eq 0) {
    Write-Host "  Component tests PASSED" -ForegroundColor Green
} else {
    Write-Host "  Component tests FAILED (exit $ComponentExit)" -ForegroundColor Red
}

# 2. E2E tests
Write-Host ""
Write-Host "[2/2] Running E2E tests (Selenium / pytest) against $BaseUrl..." -ForegroundColor Yellow
$env:TEST_BASE_URL = $BaseUrl
Push-Location "$ROOT\tests\e2e"
python -m pytest "--junitxml=$PYTEST_OUT" --tb=short -v --continue-on-collection-errors
$E2EExit = $LASTEXITCODE
Pop-Location

if ($E2EExit -eq 0) {
    Write-Host "  E2E tests PASSED" -ForegroundColor Green
} else {
    Write-Host "  E2E tests FAILED (exit $E2EExit)" -ForegroundColor Red
}

# 3. Excel report
$StartTime.Stop()
$DurationSec = [math]::Round($StartTime.Elapsed.TotalSeconds, 1)
Write-Host ""
Write-Host "Generating Excel report..." -ForegroundColor Yellow
Push-Location $ROOT
python tests\generate_report.py --vitest $VITEST_OUT --pytest $PYTEST_OUT --out $REPORT_OUT --duration $DurationSec
Pop-Location

Write-Host ""
Write-Host "Report saved → $REPORT_OUT" -ForegroundColor Cyan

if ($ComponentExit -ne 0 -or $E2EExit -ne 0) {
    Write-Host "One or more suites failed." -ForegroundColor Red
    exit 1
}
Write-Host "All tests passed!" -ForegroundColor Green
exit 0
