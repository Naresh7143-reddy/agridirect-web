"""Base Page Object — shared helpers for all pages."""
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import os


class BasePage:
    DEFAULT_TIMEOUT = 10

    def __init__(self, driver: WebDriver, base_url: str):
        self.driver = driver
        self.base_url = base_url.rstrip("/")
        self.wait = WebDriverWait(driver, self.DEFAULT_TIMEOUT)

    def navigate(self, path: str = "") -> None:
        self.driver.get(f"{self.base_url}{path}")

    def find(self, testid: str):
        return self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, f'[data-testid="{testid}"]'))
        )

    def find_clickable(self, testid: str):
        return self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, f'[data-testid="{testid}"]'))
        )

    def find_all(self, testid: str):
        self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, f'[data-testid="{testid}"]'))
        )
        return self.driver.find_elements(By.CSS_SELECTOR, f'[data-testid="{testid}"]')

    def wait_for_url(self, path: str) -> None:
        self.wait.until(EC.url_contains(path))

    def wait_for_text(self, text: str) -> None:
        self.wait.until(EC.text_to_be_present_in_element((By.TAG_NAME, "body"), text))

    def is_visible(self, testid: str) -> bool:
        try:
            el = self.driver.find_element(By.CSS_SELECTOR, f'[data-testid="{testid}"]')
            return el.is_displayed()
        except Exception:
            return False

    @property
    def title(self) -> str:
        return self.driver.title

    @property
    def current_url(self) -> str:
        return self.driver.current_url
