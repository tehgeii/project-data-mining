import json

import numpy as np
import pandas as pd
import pytest

from zzzgacha import models as M
from zzzgacha.config import AGENT, WENGINE
from zzzgacha.dataset import load_real_dir
from zzzgacha.demo import demo_items
from zzzgacha.importers import anonymize, to_uigf
from zzzgacha.probability import hazard
from zzzgacha.records import annotate, to_dataframe
from zzzgacha.simulate import simulate_dataset


@pytest.fixture(scope="module")
def sim():
    return simulate_dataset(n_accounts=30, seed=1)


def test_simulation_is_reproducible():
    a = simulate_dataset(n_accounts=3, seed=5)
    b = simulate_dataset(n_accounts=3, seed=5)
    pd.testing.assert_frame_equal(a, b)


def test_features_next_pull(sim):
    df = M.build_features(sim, horizon=1)
    assert len(df) == len(sim)
    assert df["pity"].min() == 0
    assert df.loc[df["is_wengine"] == 1, "pity"].max() <= WENGINE.hard_pity - 1
    assert df.loc[df["is_wengine"] == 0, "pity"].max() <= AGENT.hard_pity - 1
    assert df["is_s"].sum() == sim["is_s"].sum()


def test_features_horizon_window():
    frame = pd.DataFrame(
        {
            "account": "a", "banner": "agent", "gacha_type": 2,
            "pity": [1, 2, 3, 4, 1, 2], "guaranteed": 0,
            "is_s": [0, 0, 0, 1, 0, 0], "first_segment": 0,
        }
    )
    df = M.build_features(frame, horizon=2)
    # titik keputusan 0..4; target = ada S di [i, i+1]
    assert df["is_s"].tolist() == [0, 0, 1, 1, 0]
    assert df["pity"].tolist() == [0, 1, 2, 3, 0]


def test_first_segment_excluded():
    frame = pd.DataFrame(
        {"account": "a", "banner": "agent", "gacha_type": 2, "pity": [1, 2, 1],
         "guaranteed": 0, "is_s": [0, 1, 0], "first_segment": [1, 1, 0]}
    )
    assert len(M.build_features(frame)) == 1


def test_theory_probability_horizon_1_matches_hazard():
    pity = np.arange(AGENT.hard_pity)
    p = M.theory_probability(pity, np.zeros_like(pity), 1)
    np.testing.assert_allclose(p, hazard(AGENT))
    p10 = M.theory_probability(pity, np.zeros_like(pity), 10)
    assert np.all(p10 >= p) and p10[-10:].min() == 1.0


def test_evaluate_metrics():
    s = M.evaluate(np.array([0, 0, 1, 1]), np.array([0.1, 0.6, 0.4, 0.9]))
    assert s["accuracy"] == 0.5
    assert s["confusion_matrix"] == {"tn": 1, "fp": 1, "fn": 1, "tp": 1}
    assert s["roc_auc"] == 0.75
    one_class = M.evaluate(np.array([0, 0]), np.array([0.1, 0.2]))
    assert np.isnan(one_class["roc_auc"])


def test_all_models_train_and_beat_dummy_on_logloss(sim):
    df = M.build_features(sim, horizon=10)
    train, test = M.split_by_account(df, random_state=0)
    assert set(train["account"]).isdisjoint(test["account"])
    fitted = M.fit_all(train, horizon=10)
    scores = M.evaluate_all(fitted, test)
    assert set(scores) == {M.BASELINE_DUMMY, M.BASELINE_MARKOV, *M.ML_MODELS}
    for name in M.ML_MODELS:
        assert scores[name]["log_loss"] < scores[M.BASELINE_DUMMY]["log_loss"]
        assert scores[name]["roc_auc"] > 0.7
    curves = M.probability_curves(fitted)
    assert len(curves["agent"]["pity"]) == AGENT.hard_pity


def test_cross_validation_groups(sim):
    df = M.build_features(sim, horizon=1)
    cv = M.cross_validate(df.iloc[:20000], n_splits=3)
    assert cv["n_splits"] == 3
    assert "accuracy" in cv["scores"]["XGBoost"]


def test_load_real_dir(tmp_path):
    df = to_dataframe(demo_items())
    (tmp_path / "a.json").write_bytes(to_uigf(df))
    anonymize(annotate(df)).to_csv(tmp_path / "b.csv", index=False)
    (tmp_path / "ignore.txt").write_text("x")
    real = load_real_dir(tmp_path)
    assert len(real) == 2 * len(df)
    assert real["account"].str.startswith("real-").all()
    assert len(M.build_features(real, horizon=10)) > 0


SMALL_GRIDS = {
    "KNN": {"kneighborsclassifier__n_neighbors": [101, 15]},
    "Decision Tree": {"max_depth": [6, 3], "min_samples_leaf": [50]},
}


def test_training_script_end_to_end(tmp_path, monkeypatch):
    import importlib.util
    from pathlib import Path

    path = Path(__file__).resolve().parents[1] / "scripts" / "train_models.py"
    spec = importlib.util.spec_from_file_location("train_models", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    real_dir = tmp_path / "real"
    real_dir.mkdir()
    (real_dir / "demo.json").write_bytes(to_uigf(to_dataframe(demo_items())))
    out = tmp_path / "out"
    monkeypatch.setattr(M, "PARAM_GRIDS", SMALL_GRIDS)  # grid kecil supaya test cepat
    mod.main(["--accounts", "12", "--cv", "2", "--tune-accounts", "8", "--real-dir", str(real_dir), "--out", str(out)])
    report = json.loads((out / "report.json").read_text())
    assert set(report["tasks"]) == set(M.TASKS)
    assert report["real_data"]["accounts"] == 1 and report["real_data"]["pulls"] == len(demo_items())
    assert report["tasks"]["next_10"]["real"] is not None
    real_cv = report["tasks"]["next_10"]["real_cv"]
    assert real_cv is not None and real_cv["rows"] > 0 and real_cv["groups"] >= 5
    assert set(real_cv["params"]) == set(SMALL_GRIDS) and "manual" in real_cv
    assert real_cv["significance"]["best"] in M.ML_MODELS
    task = report["tasks"]["next_10"]
    assert set(task["tuning"]["models"]) == set(SMALL_GRIDS)
    assert task["cross_validation"]["significance"]["best"] in M.ML_MODELS
    assert report["softpity"]["ranges"] and report["softpity"]["tree_root"]["feature"] in M.FEATURES
    assert (out / "models.joblib").exists()


def test_cycle_groups_split_on_pity_reset():
    frame = pd.DataFrame(
        {"account": "a", "banner": "agent", "pity": [0, 1, 2, 0, 1, 0], "guaranteed": 0,
         "pity_ratio": 0.0, "is_wengine": 0, "is_s": [0, 0, 1, 0, 1, 0]}
    )
    g = M.add_cycle_groups(frame)["cycle_group"].tolist()
    assert g[0] == g[1] == g[2] and g[3] == g[4] and len(set(g)) == 3


def test_make_models_applies_chosen_params():
    models = M.make_models(params={"KNN": {"kneighborsclassifier__n_neighbors": 7}, "Decision Tree": {"max_depth": 3}})
    assert models["KNN"][-1].n_neighbors == 7 and models["Decision Tree"].max_depth == 3
    assert M.make_models()["KNN"][-1].n_neighbors == 101  # bawaan tidak berubah


def test_grid_order_starts_with_current_settings():
    defaults = M.make_models()
    for name, grid in M.PARAM_GRIDS.items():
        for key, values in grid.items():
            assert defaults[name].get_params()[key] == values[0], (name, key)


def test_tune_hyperparameters_picks_from_grid(sim, monkeypatch):
    monkeypatch.setattr(M, "PARAM_GRIDS", SMALL_GRIDS)
    df = M.build_features(sim, horizon=10)
    tuned = M.tune_hyperparameters(df, horizon=10, n_splits=3)
    assert set(tuned) == set(SMALL_GRIDS)
    for name, t in tuned.items():
        for key, value in t["best_params"].items():
            assert value in SMALL_GRIDS[name][key]
        assert t["best_score"] >= t["manual_score"] - 1e-12


def test_nested_cv_records_params_per_fold(sim, monkeypatch):
    monkeypatch.setattr(M, "PARAM_GRIDS", SMALL_GRIDS)
    df = M.build_features(sim, horizon=10)
    cv = M.cross_validate(df, n_splits=3, horizon=10, tune=True, tune_splits=2)
    assert all(len(v) == 3 for v in cv["params"].values())
    assert all(len(v) == 3 for v in cv["folds"].values()) and 0 < cv["test_train_ratio"] < 1


def test_corrected_ttest():
    assert M.corrected_ttest([0.9, 0.8, 0.7], [0.9, 0.8, 0.7], 0.25) == (0.0, 1.0)
    t, p = M.corrected_ttest([0.95, 0.96, 0.94, 0.95, 0.96], [0.80, 0.81, 0.79, 0.80, 0.82], 0.25)
    assert t > 0 and p < 0.01
    # rumus Nadeau & Bengio: t = mean(d) / sqrt((1/k + ratio) * var(d))
    a, b = np.array([0.93, 0.90, 0.95, 0.91, 0.94]), np.array([0.92, 0.91, 0.93, 0.90, 0.92])
    d = a - b
    expected = d.mean() / np.sqrt((1 / 5 + 0.25) * d.var(ddof=1))
    assert M.corrected_ttest(a, b, 0.25)[0] == pytest.approx(expected)


def test_significance_compares_with_best_ml_model():
    folds = {name: [0.80, 0.81, 0.79] for name in [M.BASELINE_DUMMY, M.BASELINE_MARKOV, *M.ML_MODELS]}
    folds["XGBoost"] = [0.90, 0.91, 0.89]
    sig = M.significance({"folds": folds, "test_train_ratio": 0.25})
    assert sig["best"] == "XGBoost" and "XGBoost" not in sig["rows"]
    assert sig["tied"] == ["XGBoost"]
    assert all(0 <= r["p"] <= 1 and r["diff"] > 0 for r in sig["rows"].values())


def test_significance_reports_ties():
    folds = {name: [0.98, 0.99, 0.97] for name in [M.BASELINE_DUMMY, M.BASELINE_MARKOV, *M.ML_MODELS]}
    sig = M.significance({"folds": folds, "test_train_ratio": 0.25})
    assert sig["tied"] == M.ML_MODELS
    assert all(r["p"] == 1.0 and not r["significant"] for r in sig["rows"].values())


def test_softpity_table_covers_every_pull(sim):
    rows = M.softpity_table(sim)
    assert sum(r["pulls"] for r in rows) == len(M.build_features(sim, horizon=1))
    assert all(0 <= r["rate"] <= 1 and 0 < r["model"] <= 1 for r in rows)


def test_tree_root_split_translates_pity_ratio():
    X = pd.DataFrame({"pity": range(90), "pity_ratio": [i / 90 for i in range(90)], "guaranteed": 0, "is_wengine": 0})
    y = (X["pity"] >= 70).astype(int)
    tree = M.DecisionTreeClassifier(max_depth=1).fit(X[M.FEATURES], y)
    root = M.tree_root_split(tree)
    assert root["feature"] in ("pity", "pity_ratio")
    if root["feature"] == "pity_ratio":
        assert root["agent_pity"] == pytest.approx(root["threshold"] * 90)
