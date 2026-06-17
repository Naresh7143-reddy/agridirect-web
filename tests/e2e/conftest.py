"""pytest fixtures — driver setup, screenshot-on-failure, base URL."""
import os
import datetime
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:3000")
SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "reports", "screenshots")


@pytest.fixture(scope="session", autouse=True)
def ensure_screenshots_dir():
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)


@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280,900")
    # Disable web security so cookies work across same-origin in CI
    options.add_argument("--disable-web-security")

    drv = webdriver.Chrome(options=options)
    drv.implicitly_wait(0)  # We use explicit waits only (no implicit)
    yield drv
    drv.quit()


@pytest.fixture(autouse=True)
def screenshot_on_failure(driver, request):
    """Capture screenshot when a test fails."""
    yield
    if request.node.rep_call.failed if hasattr(request.node, "rep_call") else False:
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        name = request.node.nodeid.replace("/", "_").replace("::", "_").replace(" ", "_")
        path = os.path.join(SCREENSHOTS_DIR, f"FAIL_{name}_{ts}.png")
        driver.save_screenshot(path)
        print(f"\n[SCREENSHOT] {path}")


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)


def pytest_configure(config):
    config.addinivalue_line("markers", "slow: mark test as slow")
    config.addinivalue_line("markers", "smoke: smoke tests")
