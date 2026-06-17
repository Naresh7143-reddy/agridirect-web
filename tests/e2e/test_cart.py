"""E2E tests for Cart page.

Note: Cart state is stored in localStorage. These tests pre-seed it via JS
so they don't depend on a live product listing.
"""
import os
import json
import pytest
from pages import CartPage

BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:3000")

CART_ITEM = {
    "productId": "e2e-prod-1",
    "name": "Test Tomatoes",
    "price": 50,
    "unit": "kg",
    "image": "",
    "quantity": 2,
    "farmerName": "E2E Farmer",
}

CART_STATE = {
    "state": {"items": [CART_ITEM]},
    "version": 0,
}


def seed_cart(driver, items=None):
    """Inject cart state into localStorage before page load."""
    state = {
        "state": {"items": items if items is not None else [CART_ITEM]},
        "version": 0,
    }
    driver.execute_script(
        f"window.localStorage.setItem('agridirect-cart', JSON.stringify({json.dumps(state)}));"
    )
    driver.refresh()


@pytest.fixture
def cart_page_empty(driver):
    driver.get(f"{BASE_URL}/buyer/cart")
    import time; time.sleep(0.5)
    return CartPage(driver, BASE_URL)


@pytest.fixture
def cart_page_with_item(driver):
    driver.get(f"{BASE_URL}/buyer/cart")
    import time; time.sleep(0.5)
    seed_cart(driver)
    import time; time.sleep(0.5)
    return CartPage(driver, BASE_URL)


class TestCartEmptyState:
    def test_shows_empty_message(self, cart_page_empty):
        assert cart_page_empty.is_empty

    def test_no_cart_items_rendered(self, cart_page_empty):
        assert cart_page_empty.cart_count == 0

    def test_browse_link_present(self, cart_page_empty):
        assert "Browse products" in cart_page_empty.driver.find_element("tag name", "body").text


class TestCartWithItems:
    def test_item_name_displayed(self, cart_page_with_item):
        assert "Test Tomatoes" in cart_page_with_item.driver.find_element("tag name", "body").text

    def test_cart_item_testid_present(self, cart_page_with_item):
        assert cart_page_with_item.cart_count == 1

    def test_checkout_button_visible(self, cart_page_with_item):
        assert cart_page_with_item.is_visible("checkout-btn")

    def test_initial_quantity_is_2(self, cart_page_with_item):
        assert cart_page_with_item.get_qty_value(0) == 2


class TestCartQuantityControls:
    def test_increase_quantity(self, cart_page_with_item):
        cart_page_with_item.click_increase_qty(0)
        import time; time.sleep(0.2)
        assert cart_page_with_item.get_qty_value(0) == 3

    def test_decrease_quantity(self, cart_page_with_item):
        cart_page_with_item.click_decrease_qty(0)
        import time; time.sleep(0.2)
        assert cart_page_with_item.get_qty_value(0) == 1


class TestCartRemove:
    def test_remove_item_clears_list(self, cart_page_with_item):
        cart_page_with_item.remove_item(0)
        import time; time.sleep(0.3)
        assert cart_page_with_item.is_empty

    def test_clear_all_empties_cart(self, driver):
        driver.get(f"{BASE_URL}/buyer/cart")
        import time; time.sleep(0.5)
        seed_cart(driver, [CART_ITEM, {**CART_ITEM, "productId": "e2e-prod-2", "name": "E2E Onions"}])
        time.sleep(0.5)
        page = CartPage(driver, BASE_URL)
        assert page.cart_count == 2
        page.click_clear_all()
        time.sleep(0.3)
        assert page.is_empty


class TestCartMiddlewareRedirect:
    def test_unauthenticated_cart_redirects(self, driver):
        driver.delete_all_cookies()
        driver.get(f"{BASE_URL}/buyer/cart")
        import time; time.sleep(1)
        assert "/login" in driver.current_url
