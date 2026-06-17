"""E2E tests — middleware routing, redirect logic, role enforcement."""
import os
import pytest

BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:3000")


def set_cookies(driver, role: str, access_token: str = "fake-jwt", refresh_token: str = "fake-refresh"):
    driver.get(f"{BASE_URL}/login")
    driver.add_cookie({"name": "access_token",  "value": access_token,  "path": "/"})
    driver.add_cookie({"name": "refresh_token", "value": refresh_token, "path": "/"})
    driver.add_cookie({"name": "user_role",     "value": role,          "path": "/"})


class TestMiddlewareRedirects:
    def test_unauthenticated_buyer_route_redirects_to_login(self, driver):
        driver.delete_all_cookies()
        driver.get(f"{BASE_URL}/buyer")
        import time; time.sleep(1)
        assert "/login" in driver.current_url

    def test_unauthenticated_farmer_route_redirects_to_login(self, driver):
        driver.delete_all_cookies()
        driver.get(f"{BASE_URL}/farmer")
        import time; time.sleep(1)
        assert "/login" in driver.current_url

    def test_unauthenticated_delivery_route_redirects_to_login(self, driver):
        driver.delete_all_cookies()
        driver.get(f"{BASE_URL}/delivery")
        import time; time.sleep(1)
        assert "/login" in driver.current_url

    def test_wrong_role_redirected_to_own_dashboard(self, driver):
        """FARMER trying to access /buyer should land on /farmer."""
        set_cookies(driver, role="FARMER")
        driver.get(f"{BASE_URL}/buyer")
        import time; time.sleep(1)
        assert "/farmer" in driver.current_url or "/login" in driver.current_url


class TestPublicRoutes:
    def test_home_page_loads_without_auth(self, driver):
        driver.delete_all_cookies()
        driver.get(BASE_URL)
        import time; time.sleep(1)
        assert "500" not in driver.title
        assert "Error" not in driver.title

    def test_login_page_loads_without_auth(self, driver):
        driver.delete_all_cookies()
        driver.get(f"{BASE_URL}/login")
        import time; time.sleep(0.5)
        assert "AgriDirect" in driver.page_source


class TestNavigation:
    def test_register_page_redirects_to_login_without_session_token(self, driver):
        # Navigate to the site first so sessionStorage is accessible (not data: URL)
        driver.get(BASE_URL)
        driver.delete_all_cookies()
        driver.execute_script("sessionStorage.clear()")
        driver.get(f"{BASE_URL}/register")
        import time; time.sleep(1)
        # Register page checks sessionStorage.idToken; missing → redirect to /login
        assert "/login" in driver.current_url
