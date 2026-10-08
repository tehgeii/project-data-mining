"""Buat ulang grafik yang memakai hasil data asli, langsung dari models/report.json.

    python3 figs.py          (dari folder docs/tugas/sumber, butuh matplotlib)

Menghasilkan fig/fig_akurasi.png dan fig/fig_real_cv.png. Jalankan setelah
scripts/train_models.py, lalu bash build.sh untuk memperbarui docx/pptx.
"""

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

HERE = Path(__file__).resolve().parent
REPORT = HERE.parents[2] / "models" / "report.json"
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
BLUE, ORANGE = "#2F6FD6", "#E08A00"


def style(ax):
    ax.grid(axis="y", color="#DDDDDD", linewidth=0.8)
    ax.set_axisbelow(True)
    ax.tick_params(axis="x", length=0)


def fig_akurasi(task):
    """Tugas B: akurasi cross-validation simulasi vs uji data asli (model dilatih di simulasi)."""
    names = [BASELINE, MARKOV, *ML]
    sim = [task["cross_validation"]["scores"][n]["accuracy"]["mean"] * 100 for n in names]
    real = [task["real"][n]["accuracy"] * 100 for n in names]
    fig, ax = plt.subplots(figsize=(9, 4.4), dpi=200)
    x = range(len(names))
    w = 0.4
    for off, vals, color, label in ((-w / 2, sim, BLUE, "Simulasi (5-fold CV)"), (w / 2, real, ORANGE, "Data asli (2 akun)")):
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


if __name__ == "__main__":
    task = json.loads(REPORT.read_text(encoding="utf-8"))["tasks"]["next_10"]
    fig_akurasi(task)
    fig_real_cv(task)
    print("selesai:", FIG / "fig_akurasi.png", FIG / "fig_real_cv.png")
