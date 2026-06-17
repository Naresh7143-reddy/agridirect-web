"""Cart Page Object."""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class CartPage(BasePage):
    PATH = "/buyer/cart"

    def open(self):
        self.navigate(self.PATH)
        return self

    @property
    def cart_items(self):
        return self.find_all("cart-item")

    @property
    def cart_count(self) -> int:
        try:
            return len(self.cart_items)
        except Exception:
            return 0

    def click_increase_qty(self, index: int = 0):
        btns = self.find_all("qty-increase")
        if index < len(btns):
            btns[index].click()
        return self

    def click_decrease_qty(self, index: int = 0):
        btns = self.find_all("qty-decrease")
        if index < len(btns):
            btns[index].click()
        return self

    def get_qty_value(self, index: int = 0) -> int:
        values = self.find_all("qty-value")
        if index < len(values):
            return int(values[index].text)
        return 0

    def remove_item(self, index: int = 0):
        btns = self.find_all("remove-item")
        if index < len(btns):
            btns[index].click()
        return self

    def click_clear_all(self):
        self.find_clickable("cart-clear-btn").click()
        return self

    def click_checkout(self):
        self.find_clickable("checkout-btn").click()
        return self

    @property
    def is_empty(self) -> bool:
        try:
            body = self.driver.find_element(By.TAG_NAME, "body")
            return "Your cart is empty" in body.text
        except Exception:
            return False

    @property
    def grand_total_text(self) -> str:
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, ".text-2xl.font-extrabold.text-primary")
            return el.text
        except Exception:
            return ""
