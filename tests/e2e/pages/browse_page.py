"""Browse Page Object."""
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from .base_page import BasePage


class BrowsePage(BasePage):
    PATH = "/buyer/browse"

    def open(self):
        self.navigate(self.PATH)
        return self

    def search(self, query: str):
        el = self.find("browse-search-input")
        el.clear()
        el.send_keys(query)
        return self

    def clear_search(self):
        self.find("browse-search-input").clear()
        return self

    @property
    def search_value(self) -> str:
        return self.find("browse-search-input").get_attribute("value") or ""

    @property
    def product_count_text(self) -> str:
        try:
            el = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "p.text-ink-2"))
            )
            return el.text
        except Exception:
            return ""

    @property
    def add_to_cart_buttons(self):
        return self.find_all("add-to-cart-btn")

    def add_first_product_to_cart(self):
        btns = self.add_to_cart_buttons
        if btns:
            btns[0].click()
        return self

    @property
    def is_empty_state_visible(self) -> bool:
        try:
            body = self.driver.find_element(By.TAG_NAME, "body")
            return "No products match" in body.text
        except Exception:
            return False

    @property
    def is_loading(self) -> bool:
        skeletons = self.driver.find_elements(By.CSS_SELECTOR, ".animate-pulse")
        return len(skeletons) > 0
