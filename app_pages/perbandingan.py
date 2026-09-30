import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from zzzgacha.models import BASELINE_DUMMY, BASELINE_MARKOV, ML_MODELS
from zzzgacha.ui import load_report

st.title("🤖 Perbandingan Algoritma")

report = load_report()
if report is None:
    st.error("Laporan model belum ada. Jalankan `python scripts/train_models.py` terlebih dahulu.")
    st.stop()

METRICS = {
    "accuracy": ("Accuracy", True),
    "balanced_accuracy": ("Balanced Acc.", True),
    "precision": ("Precision", True),
    "recall": ("Recall", True),
    "f1": ("F1-score", True),
    "roc_auc": ("ROC-AUC", True),
    "log_loss": ("Log Loss", False),
    "brier": ("Brier", False),
}

tasks = report["tasks"]
task_key = st.segmented_control(
    "Tugas prediksi",
    options=list(tasks),
    format_func=lambda k: tasks[k]["label"],
    default="next_10" if "next_10" in tasks else list(tasks)[0],
    required=True,
)
task = tasks[task_key]
ds = task["dataset"]

st.caption(
    f"Data simulasi: {ds['sim_accounts']} akun, {ds['sim_rows']:,} baris "
    f"(train {ds['train_rows']:,} / test {ds['test_rows']:,}, dibagi per akun). "
    f"Proporsi kelas positif: {ds['sim_positive_rate'] * 100:.1f}%. "
    f"Data asli: {ds['real_accounts']} akun, {ds['real_rows']:,} baris."
)


def metric_table(scores: dict) -> pd.DataFrame:
    rows = []
    for name, s in scores.items():
        row = {"Model": name}
        for m, (label, _) in METRICS.items():
            row[label] = s.get(m)
        rows.append(row)
    return pd.DataFrame(rows)


def styled(df: pd.DataFrame):
    fmt = {label: "{:.4f}" for label, _ in METRICS.values()}
    styler = df.style.format(fmt, na_rep="-")
    ml_rows = df["Model"].isin(ML_MODELS)
    for label, higher in METRICS.values():
        col = df.loc[ml_rows, label].dropna().round(4)
        if col.empty:
            continue
        best = col.max() if higher else col.min()
        # bandingkan setelah dibulatkan 4 angka, sama dengan yang terlihat di tabel
        styler = styler.map(
            lambda v, b=best: "background-color: rgba(46,160,67,0.35); font-weight: bold"
            if v is not None and not pd.isna(v) and round(v, 4) == b
            else "",
            subset=pd.IndexSlice[df.index[ml_rows], [label]],
        )
    return styler


tab_test, tab_cv, tab_curve, tab_cm, tab_imp = st.tabs(
    ["Hasil test", "Cross-validation", "Kurva peluang", "Confusion matrix", "Fitur"]
)

with tab_test:
    df = metric_table(task["test"])
    st.dataframe(styled(df), hide_index=True)
    st.caption("Hijau = terbaik di antara 4 algoritma ML. Log Loss & Brier: makin kecil makin baik.")

    fig = go.Figure()
    for label in ("Accuracy", "Balanced Acc.", "F1-score"):
        fig.add_trace(go.Bar(name=label, x=df["Model"], y=df[label]))
    fig.update_layout(barmode="group", height=380, margin=dict(l=10, r=10, t=30, b=10),
                      legend=dict(orientation="h", y=1.12), yaxis_range=[0, 1])
    st.plotly_chart(fig, config={"displayModeBar": False})

    ml = df[df["Model"].isin(ML_MODELS)].set_index("Model")
    best_acc = ml["Accuracy"].idxmax()
    best_f1 = ml["F1-score"].idxmax()
    best_ll = ml["Log Loss"].idxmin()
    dummy_acc = df.set_index("Model").loc[BASELINE_DUMMY, "Accuracy"]
    st.markdown(
        f"""
**Ringkasan otomatis**
- Akurasi tertinggi: **{best_acc}** ({ml.loc[best_acc, 'Accuracy']:.2%}).
- F1-score tertinggi: **{best_f1}** ({ml.loc[best_f1, 'F1-score']:.4f}).
- Peluang paling akurat (Log Loss terkecil): **{best_ll}**.
- ⚠️ Model bodoh yang **selalu menebak "tidak dapat S"** sudah mendapat akurasi
  **{dummy_acc:.2%}**. Karena itu akurasi saja tidak cukup; lihat juga
  Balanced Accuracy, F1, dan Log Loss.
"""
    )

    if task.get("real"):
        st.subheader("Uji di data asli pemain")
        st.dataframe(styled(metric_table(task["real"])), hide_index=True)
    else:
        st.info(
            "Model di halaman ini baru diuji dengan **data simulasi**. Riwayat yang kamu import "
            "hanya dipakai di Kalkulator dan Statistik, tidak ikut ke perbandingan ini.\n\n"
            "Untuk menguji model dengan data pemain asli: di **Import Data** klik "
            "**Dataset anonim (.csv)**, simpan file-nya ke folder `data/real/` di proyek, lalu "
            "jalankan `python scripts/train_models.py` dan push ke GitHub."
        )

with tab_cv:
    cv = task["cross_validation"]
    rows = []
    for name, s in cv["scores"].items():
        row = {"Model": name}
        for m, (label, _) in METRICS.items():
            if m in s and s[m]["mean"] is not None:
                row[label] = f"{s[m]['mean']:.4f} ± {s[m]['std']:.4f}"
        rows.append(row)
    st.write(f"GroupKFold {cv['n_splits']}-fold (dibagi per akun), rata-rata ± standar deviasi:")
    st.dataframe(pd.DataFrame(rows), hide_index=True)

with tab_curve:
    banner_key = st.segmented_control(
        "Banner", ["agent", "wengine"], default="agent", required=True, key="curve_banner",
        format_func=lambda k: "Agent" if k == "agent" else "W-Engine",
    )
    curve = task["curves"][banner_key]
    fig = go.Figure()
    for name in [BASELINE_MARKOV, *ML_MODELS]:
        if name in curve:
            fig.add_trace(go.Scatter(
                x=curve["pity"], y=[v * 100 for v in curve[name]], mode="lines", name=name,
                line=dict(width=4 if name == BASELINE_MARKOV else 2, dash="dash" if name == BASELINE_MARKOV else "solid"),
            ))
    emp = task["empirical"]["sim"][banner_key]
    fig.add_trace(go.Scatter(x=emp["pity"], y=[v * 100 for v in emp["rate"]], mode="markers",
                             name="Data (empiris)", marker=dict(size=4, color="gray")))
    fig.update_layout(xaxis_title="Pity sekarang", yaxis_title="Peluang (%)", height=420,
                      margin=dict(l=10, r=10, t=30, b=10), legend=dict(orientation="h", y=-0.2))
    st.plotly_chart(fig, config={"displayModeBar": False})
    st.caption(
        "Garis putus-putus tebal = peluang teoretis. Model yang garisnya menempel ke garis ini "
        "berhasil 'menemukan' soft pity dari data. Logistic Regression hanya bisa membuat kurva "
        "berbentuk S yang halus, sehingga sulit meniru lonjakan soft pity."
    )

with tab_cm:
    name = st.selectbox("Model", list(task["test"]))
    cm = task["test"][name]["confusion_matrix"]
    fig = go.Figure(go.Heatmap(
        z=[[cm["tn"], cm["fp"]], [cm["fn"], cm["tp"]]],
        x=["Tebak: tidak S", "Tebak: S"], y=["Asli: tidak S", "Asli: S"],
        text=[[cm["tn"], cm["fp"]], [cm["fn"], cm["tp"]]], texttemplate="%{text:,}",
        colorscale="Blues", showscale=False,
    ))
    fig.update_layout(height=320, margin=dict(l=10, r=10, t=30, b=10), yaxis_autorange="reversed")
    st.plotly_chart(fig, config={"displayModeBar": False})

with tab_imp:
    imp = task["feature_importances"]
    choice = st.selectbox("Model", list(imp))
    values = imp[choice]
    fig = go.Figure(go.Bar(x=list(values.values()), y=list(values.keys()), orientation="h"))
    fig.update_layout(height=280, margin=dict(l=10, r=10, t=30, b=10))
    st.plotly_chart(fig, config={"displayModeBar": False})
    st.caption(
        "Fitur `guaranteed` hampir tidak berpengaruh: status guaranteed memang hanya menentukan "
        "S yang keluar rate-up atau bukan, bukan peluang keluarnya S."
    )
    with st.expander("Aturan Decision Tree"):
        st.code(task["decision_tree_rules"], language="text")

with st.expander("Parameter banner yang dipakai simulasi"):
    st.json(report["banner_params"])
st.caption(f"Dibuat {report['generated_at']} · seed {report['seed']} · {report['versions']}")
