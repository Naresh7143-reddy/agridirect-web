"""
Shared pytest fixtures for AgriDirect Selenium tests.

Spins up a Chrome browser once per test session, pointed at the live site
(override with BASE_URL env var to test localhost).
"""
import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = os.environ.get("BASE_URL", "https://agridirect-web.vercel.app")


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="function")
def driver():
    opts = Options()
    # Comment out the next line to watch the browser drive itself
    opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1440,900")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")

    service = Service(ChromeDriverManager().install())
    drv = webdriver.Chrome(service=service, options=opts)
    drv.implicitly_wait(10)
    yield drv
    drv.quit()
