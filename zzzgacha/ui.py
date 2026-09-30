"""Fungsi bantu untuk halaman Streamlit (state sesi, pemuatan model)."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import streamlit as st

from .config import BANNERS
from .records import PityState, annotate, current_states

ROOT = Path(__file__).resolve().parents[1]
MODELS_PATH = ROOT / "models" / "models.joblib"
REPORT_PATH = ROOT / "models" / "report.json"

_RECORDS = "records"
_MANUAL = "manual_state"


@st.cache_resource(show_spinner="Memuat model machine learning ...")
def load_models() -> dict | None:
    """Model hasil ``scripts/train_models.py``. None kalau gagal dimuat."""
    try:
        import joblib

        return joblib.load(MODELS_PATH)
    except Exception:  # file hilang / versi library berbeda
        return None


@st.cache_data(show_spinner=False)
def load_report() -> dict | None:
    try:
        return json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def get_records() -> pd.DataFrame | None:
    df = st.session_state.get(_RECORDS)
    return df if isinstance(df, pd.DataFrame) and not df.empty else None


def set_records(df: pd.DataFrame) -> None:
    st.session_state[_RECORDS] = df


def clear_records() -> None:
    st.session_state.pop(_RECORDS, None)


def get_annotated() -> pd.DataFrame | None:
    df = get_records()
    return annotate(df) if df is not None else None


def history_states() -> list[PityState]:
    annotated = get_annotated()
    return current_states(annotated) if annotated is not None else []


def get_manual(banner_key: str) -> dict:
    manual = st.session_state.setdefault(_MANUAL, {})
    return manual.get(banner_key, {"pity": 0, "guaranteed": False})


def set_manual(banner_key: str, pity: int, guaranteed: bool) -> None:
    st.session_state.setdefault(_MANUAL, {})[banner_key] = {"pity": int(pity), "guaranteed": bool(guaranteed)}


def pct(x: float | None, digits: int = 1) -> str:
    if x is None or pd.isna(x):
        return "-"
    return f"{x * 100:.{digits}f}%"


def banner_picker(key: str) -> str:
    return st.segmented_control(
        "Banner",
        options=list(BANNERS),
        format_func=lambda k: "🧑 Agent" if k == "agent" else "⚙️ W-Engine",
        default="agent",
        required=True,
        key=key,
    )


def data_status_badge() -> None:
    df = get_records()
    if df is None:
        st.caption("📭 Belum ada riwayat yang dimuat. Buka halaman **Import Data**.")
    else:
        st.caption(f"✅ Riwayat dimuat: {len(df):,} pull dari {df['uid'].nunique()} akun.")
