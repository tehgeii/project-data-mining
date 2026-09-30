"""Titik masuk aplikasi Streamlit.

Jalankan secara lokal:
    streamlit run streamlit_app.py
"""

import streamlit as st

st.set_page_config(
    page_title="ZZZ Gacha Predictor",
    page_icon="🎰",
    layout="centered",
    initial_sidebar_state="collapsed",
)

pages = [
    st.Page("app_pages/beranda.py", title="Beranda", icon="🏠", default=True),
    st.Page("app_pages/import_data.py", title="Import Data", icon="📥"),
    st.Page("app_pages/kalkulator.py", title="Kalkulator Peluang", icon="🎲"),
    st.Page("app_pages/riwayat.py", title="Statistik Riwayat", icon="📊"),
    st.Page("app_pages/perbandingan.py", title="Perbandingan Algoritma", icon="🤖"),
    st.Page("app_pages/panduan.py", title="Panduan & FAQ", icon="📖"),
]

st.navigation(pages, position="top").run()
