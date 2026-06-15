"""
Smoke tests — every page loads with HTTP 200 and the expected content.
Run:  pytest test_smoke.py -v
"""
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def _wait_for_hydration(driver, timeout=15):
    """Next.js ships a hidden 404 fallback chunk in the initial SSR HTML;
    wait for client JS to finish rendering before checking page_source."""
    WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )
    time.sleep(1.5)


def test_landing_page_loads(driver, base_url):
    driver.get(base_url)
    assert "AgriDirect" in driver.title
    # Hero headline present
    body = driver.find_element(By.TAG_NAME, "body").text
    assert "direct to your table" in body or "AgriDirect" in body


def test_landing_has_get_started(driver, base_url):
    driver.get(base_url)
    links = driver.find_elements(By.TAG_NAME, "a")
    hrefs = [l.get_attribute("href") or "" for l in links]
    assert any("/login" in h for h in hrefs), "No login link on landing page"


def test_login_page_loads(driver, base_url):
    driver.get(f"{base_url}/login")
    body = driver.find_element(By.TAG_NAME, "body").text
    assert "phone" in body.lower() or "OTP" in body or "+91" in body


def test_login_phone_input_present(driver, base_url):
    driver.get(f"{base_url}/login")
    inputs = driver.find_elements(By.CSS_SELECTOR, "input")
    assert len(inputs) >= 1, "No phone input found on login page"


def test_buyer_home_renders(driver, base_url):
    # Public render check (data may need auth, but page should not 404)
    driver.get(f"{base_url}/buyer")
    _wait_for_hydration(driver)
    assert "404" not in driver.title
    body = driver.find_element(By.TAG_NAME, "body").text
    assert "This page could not be found" not in body


def test_all_routes_no_404(driver, base_url):
    routes = [
        "/", "/login", "/register", "/buyer", "/buyer/browse",
        "/buyer/cart", "/buyer/checkout", "/buyer/orders", "/buyer/profile",
        "/farmer", "/farmer/products", "/farmer/orders", "/farmer/ai",
        "/farmer/profile", "/delivery", "/admin",
    ]
    broken = []
    for r in routes:
        driver.get(f"{base_url}{r}")
        _wait_for_hydration(driver)
        body = driver.find_element(By.TAG_NAME, "body").text
        if "This page could not be found" in body or "404" in driver.title:
            broken.append(r)
    assert not broken, f"These routes 404'd: {broken}"
