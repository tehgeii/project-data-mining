"""Latih dan bandingkan semua model, lalu simpan hasilnya untuk aplikasi web.

Cara pakai (dari folder utama proyek):
    python scripts/train_models.py
    python scripts/train_models.py --accounts 400 --seed 42 --real-dir data/real

Hasil:
    models/models.joblib  -> model yang sudah dilatih
    models/report.json    -> semua metrik, kurva peluang, feature importance
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import joblib
import numpy as np
import sklearn
import xgboost
from sklearn.tree import export_text

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from zzzgacha import models as M  # noqa: E402
from zzzgacha.config import AGENT, WENGINE  # noqa: E402
from zzzgacha.dataset import load_real_dir  # noqa: E402
from zzzgacha.probability import calibrate_step  # noqa: E402
from zzzgacha.simulate import simulate_dataset  # noqa: E402


def _json_default(value):
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return None if np.isnan(value) else float(value)
    raise TypeError(type(value))


def _clean_nan(obj):
    if isinstance(obj, dict):
        return {k: _clean_nan(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_clean_nan(v) for v in obj]
    if isinstance(obj, float) and np.isnan(obj):
        return None
    return obj


def main(argv: list[str] | None = None) -> dict:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--accounts", type=int, default=400, help="jumlah akun simulasi")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--cv", type=int, default=5, help="jumlah fold cross-validation")
    parser.add_argument("--real-dir", default=str(ROOT / "data" / "real"))
    parser.add_argument("--out", default=str(ROOT / "models"))
    parser.add_argument("--save-dataset", action="store_true", help="simpan dataset simulasi ke CSV")
    args = parser.parse_args(argv)

    started = time.time()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    print(f"[1/4] Membuat dataset simulasi ({args.accounts} akun, seed={args.seed}) ...")
    sim_raw = simulate_dataset(n_accounts=args.accounts, seed=args.seed)
    if args.save_dataset:
        sim_raw.to_csv(out / "simulated_dataset.csv.gz", index=False)

    print("[2/4] Memuat data asli dari", args.real_dir, "...")
    real_raw = load_real_dir(args.real_dir)
    print(f"      {len(real_raw)} pull asli dari {real_raw['account'].nunique()} akun")

    report = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "seed": args.seed,
        "versions": {"scikit-learn": sklearn.__version__, "xgboost": xgboost.__version__},
        "features": M.FEATURES,
        "banner_params": {
            b.key: {
                "base_rate": b.base_rate,
                "consolidated_rate": b.consolidated_rate,
                "hard_pity": b.hard_pity,
                "soft_pity_start": b.soft_pity_start,
                "soft_pity_step": calibrate_step(b.base_rate, b.consolidated_rate, b.soft_pity_start, b.hard_pity),
                "featured_rate": b.featured_rate,
            }
            for b in (AGENT, WENGINE)
        },
        "tasks": {},
    }
    all_models = {}

    for task_key, task in M.TASKS.items():
        horizon = task["horizon"]
        print(f"[3/4] Tugas '{task_key}' (horizon {horizon}): cross-validation {args.cv}-fold ...")
        sim = M.build_features(sim_raw, horizon=horizon)
        real = M.build_features(real_raw, horizon=horizon)
        cv = M.cross_validate(sim, n_splits=args.cv, random_state=args.seed, horizon=horizon)

        train, test = M.split_by_account(sim, test_size=0.2, random_state=args.seed)
        fitted = M.fit_all(train, random_state=args.seed, horizon=horizon)
        test_scores = M.evaluate_all(fitted, test)
        has_real = len(real) > 0 and real["is_s"].nunique() == 2
        real_scores = M.evaluate_all(fitted, real) if has_real else None
        all_models[task_key] = fitted

        report["tasks"][task_key] = {
            "label": task["label"],
            "horizon": horizon,
            "dataset": {
                "sim_accounts": int(sim["account"].nunique()),
                "sim_rows": int(len(sim)),
                "sim_positive_rate": float(sim["is_s"].mean()),
                "train_rows": int(len(train)),
                "test_rows": int(len(test)),
                "real_accounts": int(real["account"].nunique()) if len(real) else 0,
                "real_rows": int(len(real)),
                "real_positive": int(real["is_s"].sum()) if len(real) else 0,
            },
            "cross_validation": cv,
            "test": test_scores,
            "real": real_scores,
            "curves": M.probability_curves(fitted),
            "empirical": {
                "sim": {b: M.empirical_curve(sim, b) for b in (AGENT.key, WENGINE.key)},
                "real": {b: M.empirical_curve(real, b) for b in (AGENT.key, WENGINE.key)} if len(real) else None,
            },
            "feature_importances": M.feature_importances(fitted),
            "decision_tree_rules": export_text(fitted["Decision Tree"], feature_names=M.FEATURES, decimals=2),
        }

        print(f"\n  Hasil data test simulasi - {task['label']}")
        print(f"  {'Model':36s} {'Acc':>7s} {'BalAcc':>7s} {'F1':>7s} {'AUC':>7s} {'LogLoss':>8s} {'Brier':>7s}")
        for name, sc in test_scores.items():
            print(
                f"  {name:36s} {sc['accuracy']:7.4f} {sc['balanced_accuracy']:7.4f} {sc['f1']:7.4f} "
                f"{sc['roc_auc']:7.4f} {sc['log_loss']:8.4f} {sc['brier']:7.4f}"
            )
        print()

    report = _clean_nan(report)
    print("[4/4] Menyimpan model dan laporan ke", out)
    joblib.dump(all_models, out / "models.joblib", compress=3)
    (out / "report.json").write_text(json.dumps(report, indent=2, default=_json_default), encoding="utf-8")
    print(f"\nSelesai dalam {time.time() - started:.1f} detik.")
    return report


if __name__ == "__main__":
    main()
