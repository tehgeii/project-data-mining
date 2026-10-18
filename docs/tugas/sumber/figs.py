"""Buat ulang grafik yang memakai hasil data asli, langsung dari models/report.json.

    python3 figs.py          (dari folder docs/tugas/sumber, butuh matplotlib)

Menghasilkan fig/fig_akurasi.png, fig/fig_real_cv.png, dan fig/fig_softpity.png (pola soft pity
langsung dari data/real). Jalankan setelah scripts/train_models.py, lalu bash build.sh untuk
memperbarui docx/pptx. Angka tabel pola soft pity ikut dicetak supaya laporan bisa disamakan.
"""

import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

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


# Rentang "pull ke-n sejak S-Rank terakhir" untuk melihat kapan peluang mulai melonjak.
RANGES = {"agent": [(1, 60), (61, 73), (74, 78), (79, 90)], "wengine": [(1, 55), (56, 64), (65, 80)]}


def softpity_table():
    """Laju S-Rank per rentang pull pada data asli, dibandingkan rata-rata peluang model Markov."""
    sys.path.insert(0, str(ROOT))
    from zzzgacha import models as M
    from zzzgacha import probability as P
    from zzzgacha.config import BANNERS
    from zzzgacha.dataset import load_real_dir

    data = M.build_features(load_real_dir(ROOT / "data" / "real"), horizon=1)
    data = data.assign(n=data["pity"] + 1)  # pull ke-n sejak S-Rank terakhir
    rows = []
    for key, ranges in RANGES.items():
        banner = BANNERS[key]
        part = data[data["is_wengine"] == int(key == "wengine")]
        for lo, hi in ranges:
            x = part[(part["n"] >= lo) & (part["n"] <= hi)]
            model = sum(P.s_chance_at_pity(banner, int(n)) for n in x["n"]) / len(x)
            rows.append({"banner": key, "lo": lo, "hi": hi, "pulls": len(x), "s": int(x["is_s"].sum()),
                         "data": float(x["is_s"].mean()), "model": model, "soft": banner.soft_pity_start})
    return rows


def fig_softpity(rows):
    fig, axes = plt.subplots(1, 2, figsize=(9, 4.0), dpi=200, gridspec_kw={"width_ratios": [4, 3]})
    for ax, key, title in ((axes[0], "agent", "Agent"), (axes[1], "wengine", "W-Engine")):
        r = [row for row in rows if row["banner"] == key]
        x = range(len(r))
        data = [row["data"] * 100 for row in r]
        model = [row["model"] * 100 for row in r]
        ax.bar(x, data, 0.6, color=ORANGE, label="Data asli")
        ax.plot(x, model, "D--", color="#222222", markersize=6, linewidth=1, label="Model Markov")
        for i, row in enumerate(r):
            top = max(data[i], model[i])
            ax.text(i, top + 2, f"{data[i]:.1f}%\n({row['s']}/{row['pulls']})", ha="center", va="bottom", fontsize=8)
        ax.set_xticks(list(x), [f"pull ke-\n{row['lo']}–{row['hi']}" for row in r], fontsize=8)
        ax.set_title(f"{title} (soft pity estimasi: pull ke-{r[0]['soft']})", fontsize=10)
        ax.set_ylim(0, 58)
        style(ax)
    axes[0].set_ylabel("Laju S-Rank per pull (%)")
    axes[0].legend(loc="upper left", frameon=False, fontsize=8)
    fig.tight_layout()
    fig.savefig(FIG / "fig_softpity.png")
    plt.close(fig)


if __name__ == "__main__":
    task = json.loads(REPORT.read_text(encoding="utf-8"))["tasks"]["next_10"]
    fig_akurasi(task)
    fig_real_cv(task)
    rows = softpity_table()
    fig_softpity(rows)
    print("selesai:", FIG / "fig_akurasi.png", FIG / "fig_real_cv.png", FIG / "fig_softpity.png")
    print("\nPola soft pity (data asli):")
    for row in rows:
        print(f"  {row['banner']:8s} pull ke-{row['lo']}–{row['hi']}: {row['pulls']:4d} pull, {row['s']:2d} S, "
              f"data {row['data'] * 100:.1f}%, model {row['model'] * 100:.1f}%")
