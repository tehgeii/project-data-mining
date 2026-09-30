"""Memuat data asli (hasil kumpulan kelompok) untuk pelatihan/pengujian."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from .importers import anonymize, parse_json_bytes
from .records import annotate, to_dataframe
from .simulate import SIM_COLUMNS


def load_real_dir(directory: str | Path) -> pd.DataFrame:
    """Baca semua file .json (UIGF) dan .csv (dataset anonim) di folder."""
    directory = Path(directory)
    frames = []
    if not directory.is_dir():
        return pd.DataFrame(columns=SIM_COLUMNS)
    for path in sorted(directory.iterdir()):
        if path.suffix.lower() == ".json":
            df = annotate(to_dataframe(parse_json_bytes(path.read_bytes())))
            frames.append(anonymize(df))
        elif path.suffix.lower() == ".csv":
            df = pd.read_csv(path)
            missing = set(SIM_COLUMNS) - set(df.columns)
            if missing:
                raise ValueError(f"{path.name}: kolom kurang {sorted(missing)}")
            frames.append(df[SIM_COLUMNS])
    if not frames:
        return pd.DataFrame(columns=SIM_COLUMNS)
    real = pd.concat(frames, ignore_index=True)
    real["account"] = "real-" + real["account"].astype(str)
    return real
