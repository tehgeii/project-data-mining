import streamlit as st

from zzzgacha.config import AGENT, WENGINE
from zzzgacha.ui import data_status_badge, pct

st.title("🎰 ZZZ Gacha Predictor")
st.write(
    "Hitung peluang mendapatkan **S-Rank Agent** dan **S-Rank W-Engine** di banner "
    "terbatas *Zenless Zone Zero*, lalu bandingkan akurasi beberapa algoritma "
    "data mining dalam memprediksinya."
)
data_status_badge()

st.subheader("Mulai dari mana?")
c1, c2 = st.columns(2)
with c1:
    st.page_link("app_pages/import_data.py", label="1. Import riwayat gacha", icon="📥")
    st.page_link("app_pages/kalkulator.py", label="2. Hitung peluang", icon="🎲")
with c2:
    st.page_link("app_pages/riwayat.py", label="3. Lihat statistik", icon="📊")
    st.page_link("app_pages/perbandingan.py", label="4. Bandingkan algoritma", icon="🤖")
st.info(
    "Tidak punya game atau main di HP? Pakai **Input Manual** atau **Data Contoh** "
    "di halaman Import Data.",
    icon="📱",
)

st.subheader("Aturan banner yang dipakai")
st.dataframe(
    {
        "Banner": ["Agent Terbatas", "W-Engine Terbatas"],
        "Rate dasar S": [pct(AGENT.base_rate), pct(WENGINE.base_rate)],
        "Rate gabungan": [pct(AGENT.consolidated_rate), pct(WENGINE.consolidated_rate)],
        "Hard pity": [AGENT.hard_pity, WENGINE.hard_pity],
        "Soft pity (estimasi)": [AGENT.soft_pity_start, WENGINE.soft_pity_start],
        "Peluang rate-up": [pct(AGENT.featured_rate, 0), pct(WENGINE.featured_rate, 0)],
    },
    hide_index=True,
)
st.caption(
    "Rate dan hard pity sesuai detail banner resmi. Titik soft pity adalah estimasi komunitas; "
    "kenaikan peluang setelah soft pity dihitung supaya rate gabungan sama dengan angka resmi."
)

with st.expander("Metode yang dipakai"):
    st.markdown(
        """
- **Markov Chain**: model matematis sistem pity. Menghasilkan peluang *eksak*
  (misalnya peluang dapat S rate-up dalam 50 pull dari pity 30).
- **Logistic Regression, Decision Tree, Random Forest, XGBoost**: algoritma
  klasifikasi yang *belajar dari data* pull untuk menebak apakah S akan keluar.
- Semua model dibandingkan dengan **Accuracy**, **Balanced Accuracy**,
  **Precision/Recall/F1**, **ROC-AUC**, **Log Loss**, dan **Brier Score**.
"""
    )
st.caption("Proyek mata kuliah Penambangan Data. Tidak berafiliasi dengan HoYoverse.")
