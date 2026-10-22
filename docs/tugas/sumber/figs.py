"""Buat ulang grafik yang memakai hasil data asli, langsung dari models/report.json.

    python3 figs.py          (dari folder docs/tugas/sumber, butuh matplotlib)

Menghasilkan semua grafik yang bergantung pada hasil model: fig_akurasi, fig_real_cv,
fig_metrik, fig_cm, fig_kurva, fig_importance, dan fig_softpity. Jalankan setelah
scripts/train_models.py, lalu bash build.sh untuk memperbarui docx/pptx.

Diagram proposal (fig_petajalan dan fig_metode) tidak bergantung pada hasil model,
tetapi ikut dibuat ulang di sini supaya semua gambar ada di satu tempat.
"""

import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import FancyBboxPatch  # noqa: E402

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
REPORT = ROOT / "models" / "report.json"
FIG = HERE / "fig"

BASELINE = "Baseline: selalu tebak 'tidak S'"
MARKOV = "Markov Chain (teori)"
ML = ["Naive Bayes", "KNN", "Logistic Regression", "Decision Tree", "Random Forest", "XGBoost"]
LABEL = {
    BASELINE: "Baseline", MARKOV: "Markov\n(teori)", "Naive Bayes": "Naive\nBayes", "KNN": "KNN",
    "Logistic Regression": "Logistic\nRegression", "Decision Tree": "Decision\nTree",
    "Random Forest": "Random\nForest", "XGBoost": "XGBoost",
}
COLOR = {
    "Naive Bayes": "#8E6AC8", "KNN": "#D9548C", "Logistic Regression": "#2F6FD6",
    "Decision Tree": "#E08A00", "Random Forest": "#C8463C", "XGBoost": "#2E9B4E",
}
BLUE, ORANGE, GREEN = "#2F6FD6", "#E08A00", "#2E9B4E"


def style(ax):
    ax.grid(axis="y", color="#DDDDDD", linewidth=0.8)
    ax.set_axisbelow(True)
    ax.tick_params(axis="x", length=0)


def fig_akurasi(task, accounts):
    """Tugas B: akurasi cross-validation simulasi vs uji data asli (model dilatih di simulasi)."""
    names = [BASELINE, MARKOV, *ML]
    sim = [task["cross_validation"]["scores"][n]["accuracy"]["mean"] * 100 for n in names]
    real = [task["real"][n]["accuracy"] * 100 for n in names]
    fig, ax = plt.subplots(figsize=(9, 4.4), dpi=200)
    x = range(len(names))
    w = 0.4
    for off, vals, color, label in ((-w / 2, sim, BLUE, "Simulasi (5-fold CV)"), (w / 2, real, ORANGE, f"Data asli ({accounts} akun)")):
        bars = ax.bar([i + off for i in x], vals, w, color=color, label=label)
        for b, v in zip(bars, vals):
            ax.text(b.get_x() + b.get_width() / 2, v + 0.25, f"{v:.1f}", ha="center", va="bottom", fontsize=8)
    ax.set_xticks(list(x), [LABEL[n] for n in names], fontsize=9)
    ax.set_ylim(80, 97)
    ax.set_ylabel("Accuracy (%)")
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, 1.13), ncol=2, frameon=False)
    style(ax)
    fig.tight_layout()
    fig.savefig(FIG / "fig_akurasi.png")
    plt.close(fig)


def fig_real_cv(task):
    """Tugas B: latih DAN uji hanya dengan data asli (rata-rata ± simpangan baku 5-fold)."""
    sc = task["real_cv"]["scores"]
    mean = [sc[n]["accuracy"]["mean"] * 100 for n in ML]
    std = [sc[n]["accuracy"]["std"] * 100 for n in ML]
    base = sc[BASELINE]["accuracy"]["mean"] * 100
    markov = sc[MARKOV]["accuracy"]["mean"] * 100
    fig, ax = plt.subplots(figsize=(9, 4.4), dpi=200)
    bars = ax.bar(range(len(ML)), mean, 0.8, color=[COLOR[n] for n in ML],
                  yerr=std, capsize=5, error_kw={"ecolor": "#555555", "elinewidth": 1.3})
    for b, v in zip(bars, mean):
        ax.text(b.get_x() + b.get_width() / 2, 81.4, f"{v:.1f}%", ha="center", va="center",
                color="white", fontsize=10, fontweight="bold")
    ax.axhline(base, color="#666666", linestyle=":", linewidth=1.5, label=f"Baseline ({base:.1f}%)")
    ax.axhline(markov, color="#222222", linestyle="--", linewidth=1.5, label=f"Markov / teori ({markov:.1f}%)")
    ax.set_xticks(range(len(ML)), [LABEL[n] for n in ML], fontsize=9)
    ax.set_ylim(80, 100)
    ax.set_ylabel("Accuracy (%) ± simpangan baku")
    ax.legend(loc="upper left", ncol=2, frameon=False, fontsize=9)
    style(ax)
    fig.tight_layout()
    fig.savefig(FIG / "fig_real_cv.png")
    plt.close(fig)


def fig_softpity(rows):
    fig, axes = plt.subplots(1, 2, figsize=(9, 4.0), dpi=200, gridspec_kw={"width_ratios": [4, 3]})
    for ax, key, title in ((axes[0], "agent", "Agent"), (axes[1], "wengine", "W-Engine")):
        r = [row for row in rows if row["banner"] == key]
        x = range(len(r))
        data = [row["rate"] * 100 for row in r]
        model = [row["model"] * 100 for row in r]
        ax.bar(x, data, 0.6, color=ORANGE, label="Data asli")
        ax.plot(x, model, "D--", color="#222222", markersize=6, linewidth=1, label="Model Markov")
        for i, row in enumerate(r):
            top = max(data[i], model[i])
            ax.text(i, top + 2, f"{data[i]:.1f}%\n({row['s']}/{row['pulls']})", ha="center", va="bottom", fontsize=8)
        ax.set_xticks(list(x), [f"pull ke-\n{row['lo']}–{row['hi']}" for row in r], fontsize=8)
        ax.set_title(f"{title} (soft pity estimasi: pull ke-{r[0]['soft_pity_start']})", fontsize=10)
        ax.set_ylim(0, 58)
        style(ax)
    axes[0].set_ylabel("Laju S-Rank per pull (%)")
    axes[0].legend(loc="upper left", frameon=False, fontsize=8)
    fig.tight_layout()
    fig.savefig(FIG / "fig_softpity.png")
    plt.close(fig)


def fig_metrik(task):
    """Tugas B: Accuracy, Balanced Accuracy, dan F1 dari cross-validation simulasi."""
    names = [BASELINE, MARKOV, *ML]
    sc = task["cross_validation"]["scores"]
    fig, ax = plt.subplots(figsize=(9, 4), dpi=200)
    w = 0.27
    for i, (key, label, color) in enumerate((("accuracy", "Accuracy", BLUE), ("balanced_accuracy", "Balanced Accuracy", ORANGE),
                                             ("f1", "F1-score", GREEN))):
        ax.bar([k + (i - 1) * w for k in range(len(names))], [sc[n][key]["mean"] for n in names], w, color=color, label=label)
    ax.set_xticks(range(len(names)), [LABEL[n] for n in names], fontsize=9)
    ax.set_ylim(0, 1.0)
    ax.legend(loc="upper left", ncol=3, frameon=False, fontsize=12)
    style(ax)
    fig.tight_layout()
    fig.savefig(FIG / "fig_metrik.png")
    plt.close(fig)


def fig_cm(task):
    """Tugas B: confusion matrix di data uji simulasi untuk tiga model contoh."""
    shown = ((BASELINE, "Baseline"), ("Logistic Regression", "Logistic Regression"), ("XGBoost", "XGBoost"))
    fig, axes = plt.subplots(1, 3, figsize=(11, 3.5), dpi=200)
    for ax, (name, title) in zip(axes, shown):
        cm = task["test"][name]["confusion_matrix"]
        grid = [[cm["tn"], cm["fp"]], [cm["fn"], cm["tp"]]]
        top = max(max(row) for row in grid)
        ax.imshow(grid, cmap="Blues", vmin=0, vmax=top)
        for r in range(2):
            for c in range(2):
                v = grid[r][c]
                ax.text(c, r, f"{v:,}".replace(",", "."), ha="center", va="center", fontsize=12,
                        color="white" if v > top / 2 else "black")
        ax.set_xticks([0, 1], ["Tebak: tidak S", "Tebak: S"])
        ax.set_yticks([0, 1], ["Asli: tidak S", "Asli: S"])
        ax.set_title(title, fontsize=13)
    fig.tight_layout()
    fig.savefig(FIG / "fig_cm.png")
    plt.close(fig)


def fig_kurva(task):
    """Tugas B: peluang dapat S dalam 10 pull menurut setiap model, per banner."""
    fig, axes = plt.subplots(1, 2, figsize=(10, 4), dpi=200, sharey=True)
    for ax, (key, title) in zip(axes, (("agent", "Agent Terbatas"), ("wengine", "W-Engine Terbatas"))):
        curve, emp = task["curves"][key], task["empirical"]["sim"][key]
        ax.scatter(emp["pity"], [v * 100 for v in emp["rate"]], s=6, color="#BBBBBB", label="Data (empiris)", zorder=1)
        ax.plot(curve["pity"], [v * 100 for v in curve[MARKOV]], "--", color="#333333", linewidth=3.5, label=MARKOV, zorder=2)
        for name in ML:
            ax.plot(curve["pity"], [v * 100 for v in curve[name]], color=COLOR[name], linewidth=1.6, label=name, zorder=3)
        ax.set_title(title, fontsize=13)
        ax.set_xlabel("Pity sekarang")
        ax.grid(color="#DDDDDD", linewidth=0.8)
        ax.set_axisbelow(True)
    axes[0].set_ylabel("Peluang dapat S dalam 10 pull (%)")
    axes[1].legend(loc="upper left", frameon=False, fontsize=8)
    fig.tight_layout()
    fig.savefig(FIG / "fig_kurva.png")
    plt.close(fig)


def fig_importance(task):
    """Tugas B: feature importance tiga model berbasis pohon."""
    imp = task["feature_importances"]
    models = (("Decision Tree", ORANGE), ("Random Forest", COLOR["Random Forest"]), ("XGBoost", GREEN))
    features = list(imp["Decision Tree"])
    fig, ax = plt.subplots(figsize=(8, 3.4), dpi=200)
    h = 0.27
    for i, (name, color) in enumerate(models):
        ax.barh([k + (i - 1) * h for k in range(len(features))], [imp[name][f] for f in features], h, color=color, label=name)
    ax.set_yticks(range(len(features)), features)
    ax.set_xlabel("Feature importance")
    ax.legend(loc="upper right", frameon=False, fontsize=11)
    ax.grid(axis="x", color="#DDDDDD", linewidth=0.8)
    ax.set_axisbelow(True)
    fig.tight_layout()
    fig.savefig(FIG / "fig_importance.png")
    plt.close(fig)


# ---------- diagram proposal ----------
# Hitam-putih dengan huruf serif, seperti diagram yang digambar sendiri di Word.
SERIF = {"family": "Liberation Serif"}


def _box(ax, x, y, w, h, text, size=10, bold=False, fill="white", round_=False, dashed=False, align="center"):
    style = "round,pad=0,rounding_size=0.22" if round_ else "square,pad=0"
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=style, fc=fill, ec="black", linewidth=1.0,
                                linestyle="--" if dashed else "-"))
    tx = x + w / 2 if align == "center" else x + 0.12
    ax.text(tx, y + h / 2, text, ha=align, va="center", fontsize=size, color="black", linespacing=1.35,
            fontweight="bold" if bold else "normal", fontdict=SERIF)


def _arrow(ax, x0, y0, x1, y1):
    ax.annotate("", xy=(x1, y1), xytext=(x0, y0), arrowprops={"arrowstyle": "-|>", "color": "black", "lw": 1.0})


def fig_petajalan():
    """Peta jalan penelitian 14 minggu: rintisan, fundamental, terapan."""
    stages = [
        ("Minggu 1-3", "Penelitian Rintisan", [
            "Pembentukan kelompok", "Pemilihan topik", "Studi literatur", "Mempelajari aturan gacha",
        ], "Topik dan rancangan\npenelitian"),
        ("Minggu 4-7", "Penelitian Fundamental", [
            "Pengambilan data riwayat", "Pembuatan data simulasi", "Pra-pemrosesan data", "Penyusunan proposal",
        ], "Dataset dan proposal\n(UTS)"),
        ("Minggu 8-14", "Penelitian Terapan", [
            "Grid search dan pelatihan", "Evaluasi dan uji signifikansi", "Pembuatan aplikasi web", "Laporan dan presentasi",
        ], "Model, aplikasi web,\nlaporan akhir (UAS)"),
    ]
    fig, ax = plt.subplots(figsize=(6.6, 2.86), dpi=300)  # ukuran asli ±17 cm: huruf tetap terbaca di kertas
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 3.9)
    ax.axis("off")
    w, gap = 2.6, 0.5
    for i, (week, title, items, output) in enumerate(stages):
        x = 0.1 + i * (w + gap)
        _box(ax, x, 3.05, w, 0.75, f"{title}\n({week})", size=10.5, bold=True, fill="#E6E6E6")
        _box(ax, x, 1.3, w, 1.4, "\n".join(f"- {t}" for t in items), size=9.5, align="left")
        _box(ax, x, 0.1, w, 0.85, output, size=9.5, bold=True)
        _arrow(ax, x + w / 2, 3.05, x + w / 2, 2.72)
        _arrow(ax, x + w / 2, 1.3, x + w / 2, 0.97)
        if i < len(stages) - 1:
            _arrow(ax, x + w + 0.03, 3.42, x + w + gap - 0.03, 3.42)
    fig.tight_layout(pad=0.2)
    fig.savefig(FIG / "fig_petajalan.png")
    plt.close(fig)


def fig_metode():
    """Alur metode yang diusulkan, dari pengambilan data sampai aplikasi."""
    fig, ax = plt.subplots(figsize=(6.6, 4.55), dpi=300)
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 6.2)
    ax.axis("off")
    _box(ax, 3.6, 5.6, 1.8, 0.45, "Mulai", round_=True)
    _box(ax, 0.2, 4.35, 2.6, 0.85, "Data riwayat gacha asli\n(3 akun)")
    _box(ax, 6.2, 4.35, 2.6, 0.85, "Data simulasi\nMonte Carlo")
    _box(ax, 3.2, 4.35, 2.6, 0.85, "Pra-pemrosesan data")
    _box(ax, 3.2, 3.1, 2.6, 0.85, "Pembentukan fitur\ndan target")
    _box(ax, 0.2, 1.75, 2.6, 0.95, "Model Markov Chain\n(acuan teori)", dashed=True)
    _box(ax, 3.2, 1.75, 2.6, 0.95, "Grid search dan\npelatihan 6 algoritma")
    _box(ax, 6.2, 1.75, 2.6, 0.95, "Evaluasi dan\nuji signifikansi")
    _box(ax, 6.2, 0.55, 2.6, 0.75, "Deployment\n(aplikasi Streamlit)")
    _box(ax, 3.6, 0.7, 1.8, 0.45, "Selesai", round_=True)
    _arrow(ax, 4.5, 5.6, 4.5, 5.22)
    _arrow(ax, 2.8, 4.78, 3.18, 4.78)
    _arrow(ax, 6.2, 4.78, 5.82, 4.78)
    _arrow(ax, 4.5, 4.35, 4.5, 3.97)
    _arrow(ax, 4.5, 3.1, 4.5, 2.72)
    # Markov tidak ikut dilatih; hasilnya hanya dibandingkan saat evaluasi
    ax.plot([1.5, 1.5, 6.6], [1.75, 1.45, 1.45], color="black", lw=1.0, linestyle="--")
    _arrow(ax, 6.6, 1.45, 6.6, 1.73)
    ax.text(4.05, 1.5, "pembanding", ha="center", va="bottom", fontsize=9, style="italic", fontdict=SERIF)
    _arrow(ax, 5.8, 2.22, 6.18, 2.22)
    _arrow(ax, 7.5, 1.75, 7.5, 1.32)
    _arrow(ax, 6.2, 0.92, 5.42, 0.92)
    fig.tight_layout(pad=0.2)
    fig.savefig(FIG / "fig_metode.png")
    plt.close(fig)


def main(report_path=REPORT):
    report = json.loads(Path(report_path).read_text(encoding="utf-8"))
    task = report["tasks"]["next_10"]
    fig_akurasi(task, report["real_data"]["accounts"])
    for make in (fig_real_cv, fig_metrik, fig_cm, fig_kurva, fig_importance):
        make(task)
    if report.get("softpity"):
        fig_softpity(report["softpity"]["ranges"])
    fig_petajalan()
    fig_metode()
    print("selesai: grafik di", FIG)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else REPORT)
