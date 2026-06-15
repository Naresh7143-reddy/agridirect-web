# AgriDirect Web — Selenium Tests

Browser automation tests for the live website using **Selenium + Python + pytest**.

## What this tests
- Every page loads without 404
- Landing page content + login link
- Login screen renders the phone input
- Phone OTP flow (using Firebase test number, no real SMS)

## One-time setup (3 minutes)

```powershell
# 1. You need Python (already installed) and Chrome browser
cd C:\Users\nares\Downloads\agridirect-web\selenium-tests

# 2. Install dependencies
pip install -r requirements.txt
```

`webdriver-manager` auto-downloads the matching ChromeDriver — no manual driver setup.

## Run the tests

```powershell
cd C:\Users\nares\Downloads\agridirect-web\selenium-tests

# Run all tests against the LIVE site
pytest -v

# Run just the smoke tests (all pages load)
pytest test_smoke.py -v

# Run the login flow
pytest test_login_flow.py -v

# Generate an HTML report
pytest -v --html=report.html --self-contained-html
```

## Watch the browser drive itself

Edit `conftest.py` and comment out this line:
```python
opts.add_argument("--headless=new")
```
Then run `pytest -v` — Chrome will open and you'll see it click through your site.

## Test against localhost instead of production

```powershell
# Start your dev server first:  npm run dev   (in the agridirect-web folder)
$env:BASE_URL = "http://localhost:3000"
pytest -v
```

## Files

| File | Tests |
|---|---|
| `conftest.py` | Browser setup (Chrome), base URL config |
| `test_smoke.py` | All 16 pages load, no 404s, landing + login content |
| `test_login_flow.py` | Phone entry → Send OTP → enter test OTP → reach home |

## Notes

- **reCAPTCHA**: Firebase phone auth uses invisible reCAPTCHA which often blocks
  headless automation. The login test `skips` gracefully if blocked — run
  non-headless (see above) to test the full flow manually-driven.
- **Cold start**: the Render backend sleeps after 15 min idle. The first test
  run may be slow while it wakes up. Re-run if a test times out on first hit.
