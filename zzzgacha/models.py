"""Pelatihan dan evaluasi model: Logistic Regression, Decision Tree,
Random Forest, XGBoost, Naive Bayes, KNN, ditambah dua pembanding (baseline).

Ada dua tugas klasifikasi. Keduanya memakai fitur yang sudah diketahui
SEBELUM pull dilakukan (tidak ada kebocoran informasi masa depan):

- ``next_pull`` (horizon 1): apakah pull berikutnya menghasilkan S?
- ``next_10``   (horizon 10): apakah dapat minimal satu S dalam 10 pull
  berikutnya (satu kali ten-pull)?

Fitur:
- pity        : pity yang terlihat di game = jumlah pull sejak S terakhir
                (0..hard_pity-1)
- pity_ratio  : pity / hard_pity (menyamakan skala dua banner)
- guaranteed  : 1 kalau S berikutnya pasti rate-up
- is_wengine  : 1 untuk banner W-Engine, 0 untuk banner Agent
"""

from __future__ import annotations

import warnings

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    log_loss,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GroupKFold, GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier

from .config import AGENT, WENGINE
from .probability import hazard

FEATURES = ["pity", "pity_ratio", "guaranteed", "is_wengine"]
TARGET = "is_s"

ML_MODELS = ["Naive Bayes", "KNN", "Logistic Regression", "Decision Tree", "Random Forest", "XGBoost"]
BASELINE_DUMMY = "Baseline: selalu tebak 'tidak S'"
BASELINE_MARKOV = "Markov Chain (teori)"


TASKS = {
    "next_pull": {"horizon": 1, "label": "Dapat S di pull berikutnya?"},
    "next_10": {"horizon": 10, "label": "Dapat S dalam 10 pull berikutnya (1x ten-pull)?"},
}


def build_features(frame: pd.DataFrame, horizon: int = 1) -> pd.DataFrame:
    """Ubah riwayat per pull menjadi baris fitur + target untuk satu tugas.

    Setiap baris adalah satu "titik keputusan" tepat sebelum sebuah pull.
    Target = 1 kalau ada S dalam ``horizon`` pull mulai dari titik itu.
    Baris yang pity-nya belum pasti (segmen pertama) atau yang ``horizon``
    pull-nya belum terjadi (ujung riwayat) dibuang.

    ``frame`` harus urut kronologis di dalam tiap (account, gacha_type).
    """
    required = {"account", "banner", "gacha_type", "pity", "guaranteed", "is_s", "first_segment"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Kolom dataset kurang: {sorted(missing)}")
    if horizon < 1:
        raise ValueError("horizon minimal 1.")
    frame = frame[frame["banner"].isin([AGENT.key, WENGINE.key])]
    parts = []
    for _, group in frame.groupby(["account", "gacha_type"], sort=False):
        n = len(group)
        if n < horizon:
            continue
        s = group["is_s"].to_numpy(dtype=int)
        cs = np.concatenate(([0], np.cumsum(s)))
        target = (cs[horizon:] - cs[: n - horizon + 1]) > 0
        part = group.iloc[: n - horizon + 1].copy()
        part[TARGET] = target.astype(int)
        parts.append(part)
    if not parts:
        return pd.DataFrame(columns=["account", "banner", *FEATURES, TARGET])
    df = pd.concat(parts, ignore_index=True)
    df = df[df["first_segment"] == 0]
    df["is_wengine"] = (df["banner"] == WENGINE.key).astype(int)
    hard = np.where(df["is_wengine"] == 1, WENGINE.hard_pity, AGENT.hard_pity)
    # kolom pity di riwayat = nomor pull (1..hard); pity di game = pull sebelumnya
    df["pity"] = df["pity"].astype(int) - 1
    df["pity_ratio"] = df["pity"] / hard
    df["guaranteed"] = df["guaranteed"].astype(int)
    df[TARGET] = df[TARGET].astype(int)
    return df[["account", "banner", *FEATURES, TARGET]].reset_index(drop=True)


def theory_probability(pity: np.ndarray, is_wengine: np.ndarray, horizon: int) -> np.ndarray:
    """Peluang teoretis dapat minimal satu S dalam ``horizon`` pull dari ``pity``."""
    pity = np.asarray(pity, dtype=int)
    is_wengine = np.asarray(is_wengine, dtype=int) == 1
    out = np.empty(len(pity))
    for banner, mask in ((WENGINE, is_wengine), (AGENT, ~is_wengine)):
        hz = hazard(banner)
        # survival[k] = peluang tidak dapat S dari pity k sampai pity hard-1
        table = np.array(
            [1.0 - np.prod(1.0 - hz[k : min(k + horizon, banner.hard_pity)]) for k in range(banner.hard_pity)]
        )
        out[mask] = table[np.clip(pity[mask], 0, banner.hard_pity - 1)]
    return out


class MarkovTheoryClassifier(ClassifierMixin, BaseEstimator):
    """'Model' yang langsung memakai rumus peluang teoretis (tidak belajar)."""

    def __init__(self, horizon: int = 1):
        self.horizon = horizon

    def fit(self, X, y=None):
        self.classes_ = np.array([0, 1])
        return self

    def predict_proba(self, X):
        X = pd.DataFrame(X, columns=FEATURES)
        p = theory_probability(X["pity"].to_numpy(), X["is_wengine"].to_numpy(), self.horizon)
        return np.column_stack([1 - p, p])

    def predict(self, X):
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)


def make_models(random_state: int = 42, horizon: int = 1) -> dict[str, BaseEstimator]:
    return {
        BASELINE_DUMMY: DummyClassifier(strategy="most_frequent"),
        BASELINE_MARKOV: MarkovTheoryClassifier(horizon=horizon),
        "Naive Bayes": GaussianNB(),
        # Fitur diskalakan supaya jarak tidak didominasi kolom pity (0..89).
        # k besar karena label sangat berisik (gacha acak).
        "KNN": make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=101, n_jobs=-1)),
        "Logistic Regression": make_pipeline(
            StandardScaler(), LogisticRegression(max_iter=2000, random_state=random_state)
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=6, min_samples_leaf=50, random_state=random_state
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=150,
            max_depth=8,
            min_samples_leaf=20,
            n_jobs=-1,
            random_state=random_state,
        ),
        "XGBoost": XGBClassifier(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=1.0,
            eval_metric="logloss",
            n_jobs=2,
            random_state=random_state,
        ),
    }


def evaluate(y_true: np.ndarray, proba: np.ndarray, threshold: float = 0.5) -> dict:
    y_true = np.asarray(y_true, dtype=int)
    proba = np.clip(np.asarray(proba, dtype=float), 1e-7, 1 - 1e-7)
    pred = (proba >= threshold).astype(int)
    both_classes = len(np.unique(y_true)) == 2
    tn, fp, fn, tp = confusion_matrix(y_true, pred, labels=[0, 1]).ravel()
    with warnings.catch_warnings():
        # data dengan satu kelas saja memicu peringatan sklearn yang tidak relevan
        warnings.simplefilter("ignore", UserWarning)
        balanced = float(balanced_accuracy_score(y_true, pred))
    return {
        "accuracy": float(accuracy_score(y_true, pred)),
        "balanced_accuracy": balanced,
        "precision": float(precision_score(y_true, pred, zero_division=0)),
        "recall": float(recall_score(y_true, pred, zero_division=0)),
        "f1": float(f1_score(y_true, pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, proba)) if both_classes else float("nan"),
        "pr_auc": float(average_precision_score(y_true, proba)) if both_classes else float("nan"),
        "log_loss": float(log_loss(y_true, proba, labels=[0, 1])),
        "brier": float(brier_score_loss(y_true, proba)),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "n": int(len(y_true)),
        "positives": int(y_true.sum()),
    }


def split_by_account(df: pd.DataFrame, test_size: float = 0.2, random_state: int = 42):
    """Bagi train/test per AKUN supaya riwayat satu akun tidak bocor ke dua sisi."""
    splitter = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
    train_idx, test_idx = next(splitter.split(df, df[TARGET], groups=df["account"]))
    return df.iloc[train_idx].reset_index(drop=True), df.iloc[test_idx].reset_index(drop=True)


def cross_validate(
    df: pd.DataFrame, n_splits: int = 5, random_state: int = 42, horizon: int = 1, groups: str = "account"
) -> dict:
    """GroupKFold per kelompok (default: per akun). Mengembalikan rata-rata dan
    standar deviasi metrik."""
    n_groups = df[groups].nunique()
    n_splits = min(n_splits, n_groups)
    if n_splits < 2:
        raise ValueError("Butuh minimal 2 kelompok data untuk cross-validation.")
    scores: dict[str, list[dict]] = {}
    for train_idx, test_idx in GroupKFold(n_splits=n_splits).split(df, groups=df[groups]):
        train, test = df.iloc[train_idx], df.iloc[test_idx]
        for name, model in make_models(random_state, horizon).items():
            model.fit(train[FEATURES], train[TARGET])
            proba = model.predict_proba(test[FEATURES])[:, 1]
            scores.setdefault(name, []).append(evaluate(test[TARGET], proba))
    summary = {}
    metric_names = ["accuracy", "balanced_accuracy", "precision", "recall", "f1", "roc_auc", "pr_auc", "log_loss", "brier"]
    for name, folds in scores.items():
        summary[name] = {
            m: {
                "mean": float(np.nanmean([f[m] for f in folds])),
                "std": float(np.nanstd([f[m] for f in folds])),
            }
            for m in metric_names
        }
    return {"n_splits": n_splits, "scores": summary}


def add_cycle_groups(df: pd.DataFrame) -> pd.DataFrame:
    """Tandai setiap baris dengan siklus pity-nya (dari pity 0 sampai dapat S).

    Dipakai untuk cross-validation di data asli yang hanya berisi sedikit akun:
    data dibagi per siklus pity, bukan per baris, sehingga pull dari siklus yang
    sama tidak pernah ada di data latih dan data uji sekaligus. Siklus pity
    saling bebas karena peluang selalu kembali ke awal setelah dapat S.
    """
    out = df.copy()
    keys = out["account"].astype(str) + "|" + out["banner"].astype(str)
    cycle = (out["pity"] == 0).astype(int).groupby(keys).cumsum()
    out["cycle_group"] = keys + "|" + cycle.astype(str)
    return out


def fit_all(train: pd.DataFrame, random_state: int = 42, horizon: int = 1) -> dict[str, BaseEstimator]:
    models = make_models(random_state, horizon)
    for model in models.values():
        model.fit(train[FEATURES], train[TARGET])
    return models


def evaluate_all(models: dict[str, BaseEstimator], test: pd.DataFrame) -> dict[str, dict]:
    return {
        name: evaluate(test[TARGET], model.predict_proba(test[FEATURES])[:, 1])
        for name, model in models.items()
    }


def feature_grid(banner_key: str) -> pd.DataFrame:
    """Semua kombinasi pity x guaranteed untuk satu banner (buat grafik kurva)."""
    banner = WENGINE if banner_key == WENGINE.key else AGENT
    pity = np.arange(0, banner.hard_pity)
    rows = []
    for g in (0, 1):
        rows.append(
            pd.DataFrame(
                {
                    "pity": pity,
                    "pity_ratio": pity / banner.hard_pity,
                    "guaranteed": g,
                    "is_wengine": int(banner.key == WENGINE.key),
                }
            )
        )
    return pd.concat(rows, ignore_index=True)[FEATURES]


def probability_curves(models: dict[str, BaseEstimator]) -> dict:
    """Peluang S per pity menurut tiap model (guaranteed=0) untuk kedua banner."""
    curves = {}
    for banner in (AGENT, WENGINE):
        grid = feature_grid(banner.key)
        grid = grid[grid["guaranteed"] == 0]
        curves[banner.key] = {
            "pity": grid["pity"].astype(int).tolist(),
            **{name: model.predict_proba(grid)[:, 1].round(6).tolist() for name, model in models.items()},
        }
    return curves


def empirical_curve(df: pd.DataFrame, banner_key: str) -> dict:
    """Peluang S empiris per pity dari data (jumlah S / jumlah pull di pity itu)."""
    sub = df[df["banner"] == banner_key]
    grouped = sub.groupby("pity")[TARGET].agg(["sum", "count"]).reset_index()
    return {
        "pity": grouped["pity"].astype(int).tolist(),
        "rate": (grouped["sum"] / grouped["count"]).round(6).tolist(),
        "count": grouped["count"].astype(int).tolist(),
    }


def feature_importances(models: dict[str, BaseEstimator]) -> dict[str, dict[str, float]]:
    out = {}
    for name in ("Decision Tree", "Random Forest", "XGBoost"):
        model = models.get(name)
        if model is not None and hasattr(model, "feature_importances_"):
            out[name] = {f: float(v) for f, v in zip(FEATURES, model.feature_importances_)}
    lr = models.get("Logistic Regression")
    if lr is not None:
        coef = lr[-1].coef_[0]
        out["Logistic Regression (koefisien)"] = {f: float(v) for f, v in zip(FEATURES, coef)}
    return out
