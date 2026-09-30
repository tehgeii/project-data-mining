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


def test_training_script_end_to_end(tmp_path):
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
    mod.main(["--accounts", "12", "--cv", "2", "--real-dir", str(real_dir), "--out", str(out)])
    report = json.loads((out / "report.json").read_text())
    assert set(report["tasks"]) == set(M.TASKS)
    assert report["tasks"]["next_10"]["real"] is not None
    assert (out / "models.joblib").exists()
