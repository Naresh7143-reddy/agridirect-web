"""E2E tests for the Login page.

These tests verify UI behaviour only — they do NOT send real OTPs.
Firebase test credentials (8919012622 / 123456) are used where OTP
flow needs to be exercised in a real environment.
"""
import pytest
from pages import LoginPage

BASE_URL = None  # injected from conftest via env var


@pytest.fixture
def login_page(driver):
    import os
    base_url = os.environ.get("TEST_BASE_URL", "http://localhost:3000")
    page = LoginPage(driver, base_url)
    page.open()
    return page


@pytest.mark.smoke
class TestLoginPageLoad:
    def test_page_loads(self, login_page):
        assert "AgriDirect" in login_page.driver.page_source

    def test_phone_input_visible(self, login_page):
        assert login_page.is_visible("phone-input")

    def test_send_otp_btn_visible(self, login_page):
        assert login_page.is_visible("send-otp-btn")

    def test_title_text(self, login_page):
        assert "AgriDirect" in login_page.driver.find_element(
            "css selector", "h1"
        ).text


class TestPhoneValidation:
    def test_send_otp_disabled_initially(self, login_page):
        btn = login_page.find("send-otp-btn")
        # Button must be disabled before phone is entered
        assert btn.get_attribute("disabled") is not None

    def test_send_otp_disabled_for_short_number(self, login_page):
        login_page.enter_phone("12345")
        btn = login_page.find("send-otp-btn")
        assert btn.get_attribute("disabled") is not None

    def test_send_otp_enabled_for_10_digits(self, login_page):
        login_page.enter_phone("9876543210")
        btn = login_page.find("send-otp-btn")
        assert btn.get_attribute("disabled") is None

    def test_phone_accepts_only_digits(self, login_page):
        from selenium.webdriver.common.keys import Keys
        el = login_page.find("phone-input")
        el.send_keys("abc123def")
        # Only numeric chars should be kept
        assert el.get_attribute("value").isdigit() or el.get_attribute("value") == ""

    def test_phone_max_length_10(self, login_page):
        login_page.enter_phone("12345678901234")
        el = login_page.find("phone-input")
        assert len(el.get_attribute("value")) <= 10


class TestSignInCopy:
    def test_subtitle_present(self, login_page):
        body = login_page.driver.find_element("tag name", "body")
        assert "Sign in" in body.text or "sign in" in body.text.lower()

    def test_test_credentials_hint_visible(self, login_page):
        assert "8919012622" in login_page.driver.page_source

    def test_back_to_phone_step_link_not_visible_initially(self, login_page):
        # "Use a different number" link only appears on OTP step
        body_text = login_page.driver.find_element("tag name", "body").text
        assert "Use a different number" not in body_text


class TestResponsiveLayout:
    def test_layout_on_mobile_viewport(self, driver):
        import os
        driver.set_window_size(375, 812)
        base_url = os.environ.get("TEST_BASE_URL", "http://localhost:3000")
        page = LoginPage(driver, base_url)
        page.open()
        assert page.is_visible("phone-input")
        assert page.is_visible("send-otp-btn")

    def test_layout_on_desktop_viewport(self, driver):
        import os
        driver.set_window_size(1280, 900)
        base_url = os.environ.get("TEST_BASE_URL", "http://localhost:3000")
        page = LoginPage(driver, base_url)
        page.open()
        assert page.is_visible("phone-input")
