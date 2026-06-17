"""Login Page Object."""
from .base_page import BasePage


class LoginPage(BasePage):
    PATH = "/login"

    def open(self):
        self.navigate(self.PATH)
        return self

    def enter_phone(self, phone: str):
        el = self.find("phone-input")
        el.clear()
        el.send_keys(phone)
        return self

    def click_send_otp(self):
        self.find_clickable("send-otp-btn").click()
        return self

    def enter_otp(self, otp: str):
        el = self.find("otp-input")
        el.clear()
        el.send_keys(otp)
        return self

    def click_verify(self):
        self.find_clickable("verify-otp-btn").click()
        return self

    @property
    def send_otp_btn_enabled(self) -> bool:
        el = self.find("send-otp-btn")
        return el.is_enabled() and not el.get_attribute("disabled")

    @property
    def verify_btn_enabled(self) -> bool:
        try:
            el = self.find("verify-otp-btn")
            return el.is_enabled() and not el.get_attribute("disabled")
        except Exception:
            return False

    @property
    def is_on_otp_step(self) -> bool:
        return self.is_visible("otp-input")

    @property
    def is_on_phone_step(self) -> bool:
        return self.is_visible("phone-input")
