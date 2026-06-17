"""E2E tests for the Browse page (buyer/browse)."""
import os
import pytest
from pages import BrowsePage

BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:3000")


@pytest.fixture
def browse_page(driver):
    page = BrowsePage(driver, BASE_URL)
    page.open()
    return page


@pytest.mark.smoke
class TestBrowsePageLoad:
    def test_page_loads_without_error(self, browse_page):
        # Page should not show a 500 or crash screen
        assert "Internal Server Error" not in browse_page.driver.page_source
        assert "Application error" not in browse_page.driver.page_source

    def test_heading_present(self, browse_page):
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.common.by import By
        browse_page.wait.until(
            EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "All produce")
        )
        assert "All produce" in browse_page.driver.find_element("tag name", "body").text

    def test_search_input_present(self, browse_page):
        # Wait for Suspense to resolve
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.common.by import By
        browse_page.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="browse-search-input"]'))
        )
        assert browse_page.is_visible("browse-search-input")


class TestBrowseSearch:
    def test_search_filters_products(self, browse_page):
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.common.by import By
        # Wait for search input (page to load)
        browse_page.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="browse-search-input"]'))
        )
        browse_page.search("tomato")
        import time; time.sleep(0.3)  # allow filter debounce
        body_text = browse_page.driver.find_element("tag name", "body").text.lower()
        # Either finds tomato products OR shows no-match state
        assert "tomato" in body_text or "no products match" in body_text

    def test_empty_search_shows_empty_state(self, browse_page):
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.common.by import By
        browse_page.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="browse-search-input"]'))
        )
        browse_page.search("zzz-definitely-not-a-product-xyz")
        import time; time.sleep(0.3)
        assert browse_page.is_empty_state_visible

    def test_search_is_clearable(self, browse_page):
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.common.by import By
        browse_page.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="browse-search-input"]'))
        )
        browse_page.search("tomato")
        browse_page.clear_search()
        assert browse_page.search_value == ""


class TestBrowseMiddlewareRedirect:
    def test_unauthenticated_browse_redirects_to_login(self, driver):
        """Middleware should redirect unauthenticated users to /login."""
        driver.delete_all_cookies()
        page = BrowsePage(driver, BASE_URL)
        page.open()
        import time; time.sleep(1)
        assert "/login" in driver.current_url
