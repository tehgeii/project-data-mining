"""Smoke test: setiap halaman Streamlit bisa dibuka tanpa error."""

from pathlib import Path

import pytest
from streamlit.testing.v1 import AppTest

from zzzgacha.demo import demo_items
from zzzgacha.records import to_dataframe

ROOT = Path(__file__).resolve().parents[1]
PAGES = ["beranda", "import_data", "kalkulator", "riwayat", "perbandingan", "panduan"]


def _run(page: str, records=None) -> AppTest:
    # Jalankan lewat streamlit_app.py supaya navigasi (st.page_link) ikut aktif.
    at = AppTest.from_file(str(ROOT / "streamlit_app.py"), default_timeout=120)
    if records is not None:
        at.session_state["records"] = records
    at.run()
    at.switch_page(f"app_pages/{page}.py").run()
    return at


@pytest.mark.parametrize("page", PAGES)
def test_page_without_data(page):
    at = _run(page)
    assert not at.exception, [e.value for e in at.exception]


@pytest.mark.parametrize("page", ["import_data", "kalkulator", "riwayat"])
def test_page_with_demo_data(page):
    at = _run(page, to_dataframe(demo_items()))
    assert not at.exception, [e.value for e in at.exception]


def test_demo_button_loads_records():
    at = _run("import_data")
    [btn] = [b for b in at.button if b.label == "Pakai data contoh"]
    btn.click().run()
    assert not at.exception
    assert len(at.session_state["records"]) == 400
    assert any("Berhasil" in s.value for s in at.success)


def test_invalid_url_shows_error_without_crashing():
    at = _run("import_data")
    at.text_area[0].input("https://evil.example.com/getGachaLog?authkey=abc")
    at.button[0].click().run()
    assert not at.exception
    assert any("domain resmi" in e.value for e in at.error)


def test_calculator_guaranteed_at_last_pity():
    at = _run("kalkulator")
    at.number_input[0].set_value(89).run()
    at.toggle[0].set_value(True).run()
    assert not at.exception
    assert any("pasti S rate-up" in i.value for i in at.info)
