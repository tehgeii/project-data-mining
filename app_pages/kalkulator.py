import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from zzzgacha import probability as P
from zzzgacha.config import BANNERS
from zzzgacha.models import FEATURES, ML_MODELS, TASKS
from zzzgacha.ui import banner_picker, get_manual, history_states, load_models, pct

st.title("🎲 Kalkulator Peluang")

key = banner_picker("calc_banner")
banner = BANNERS[key]

# --- Status pity: dari riwayat kalau ada, kalau tidak dari input manual ----
states = [s for s in history_states() if s.banner == key]
source_options = ["Input manual"]
if states:
    source_options = [f"Riwayat (tipe {s.gacha_type})" for s in states] + source_options
source = st.radio("Sumber status pity", source_options, horizontal=True)
if source == "Input manual":
    manual = get_manual(key)
    default_pity, default_guar = manual["pity"], manual["guaranteed"]
else:
    state = states[source_options.index(source)]
    default_pity, default_guar = state.pity, state.guaranteed
    if state.may_be_incomplete:
        st.warning(
            "Belum ada S di riwayat yang tercatat. Kalau kamu sudah pull lebih lama dari "
            "riwayat yang disimpan server, pity aslinya bisa lebih besar.",
            icon="⚠️",
        )

c1, c2 = st.columns(2)
with c1:
    pity = st.number_input(
        "Pity sekarang", 0, banner.hard_pity - 1, int(default_pity), key=f"calc_pity_{key}_{source}"
    )
with c2:
    guaranteed = st.toggle("Guaranteed rate-up", bool(default_guar), key=f"calc_guar_{key}_{source}")

with st.expander("Hitung jumlah pull dari Polychrome / Encrypted Master Tape"):
    p1, p2 = st.columns(2)
    poly = p1.number_input("Polychrome", 0, 10_000_000, 0, step=160)
    tapes = p2.number_input("Encrypted Master Tape", 0, 100_000, 0)
    from_resources = P.polychrome_to_pulls(poly, tapes)
    st.write(f"Setara **{from_resources} pull**.")

max_pulls = P.worst_case_pulls_for_featured(banner, pity, guaranteed)
default_n = min(max(from_resources, 10), max_pulls) if from_resources else min(10, max_pulls)
if max_pulls > 1:
    n_pulls = st.slider("Rencana jumlah pull", 1, max_pulls, default_n)
else:
    n_pulls = 1
    st.info("Pull berikutnya pasti S rate-up (hard pity + guaranteed).")

# --- Perhitungan Markov Chain ---------------------------------------------
next_s = P.next_s_distribution(banner, pity)
p_any_s = float(next_s[: min(n_pulls, len(next_s))].sum())
cdf = P.featured_cdf(banner, pity, guaranteed, max_pulls)
p_featured = float(cdf[n_pulls - 1])
expected = P.expected_pulls_for_featured(banner, pity, guaranteed)

m1, m2 = st.columns(2)
m1.metric(f"Peluang dapat S apa saja dalam {n_pulls} pull", pct(p_any_s))
m2.metric(f"Peluang dapat S rate-up dalam {n_pulls} pull", pct(p_featured))
m3, m4 = st.columns(2)
m3.metric("Rata-rata pull sampai S rate-up", f"{expected:.1f}")
m4.metric("Paling sial (pasti dapat) dalam", f"{max_pulls} pull")

targets = [0.5, 0.75, 0.9]
st.write(
    "Pull yang dibutuhkan agar peluang dapat S rate-up mencapai: "
    + ", ".join(f"**{int(t * 100)}%** → {P.pulls_for_confidence(banner, pity, guaranteed, t)} pull" for t in targets)
)
st.caption(f"Peluang S di pull berikutnya: {pct(P.s_chance_at_pity(banner, pity + 1), 2)}")

fig = go.Figure()
x = np.arange(1, max_pulls + 1)
fig.add_trace(go.Scatter(x=x, y=cdf * 100, mode="lines", name="S rate-up", line=dict(width=3, color="#F5A623")))
any_cdf = np.cumsum(next_s) * 100
fig.add_trace(go.Scatter(x=x[: len(any_cdf)], y=any_cdf, mode="lines", name="S apa saja", line=dict(dash="dot", width=2, color="#58A6FF")))
fig.add_vline(x=n_pulls, line_dash="dash", line_color="#8B949E")
fig.update_layout(
    title="Peluang kumulatif (Markov Chain)",
    xaxis_title="Jumlah pull dari sekarang",
    yaxis_title="Peluang (%)",
    yaxis_range=[0, 100],
    height=360,
    margin=dict(l=10, r=10, t=50, b=10),
    legend=dict(orientation="h", y=-0.25),
)
st.plotly_chart(fig, config={"displayModeBar": False})

# --- Prediksi algoritma machine learning ----------------------------------
st.subheader("Prediksi algoritma machine learning")
models = load_models()
if models is None:
    st.warning("File model belum tersedia. Jalankan `python scripts/train_models.py` terlebih dahulu.")
else:
    row = pd.DataFrame(
        [{"pity": pity, "pity_ratio": pity / banner.hard_pity, "guaranteed": int(guaranteed), "is_wengine": int(key == "wengine")}]
    )[FEATURES]
    table = {"Model": []}
    for task_key in TASKS:
        table[TASKS[task_key]["label"]] = []
    names = ["Markov Chain (teori)", *ML_MODELS]
    for name in names:
        table["Model"].append(name)
        for task_key, task in TASKS.items():
            model = models.get(task_key, {}).get(name)
            value = float(model.predict_proba(row)[0, 1]) if model is not None else None
            table[task["label"]].append(pct(value))
    st.dataframe(pd.DataFrame(table), hide_index=True)
    st.caption(
        "Model ML dilatih dari data pull. Semakin dekat angkanya dengan Markov Chain (teori), "
        "semakin baik model itu menangkap mekanisme pity yang sebenarnya."
    )
