"""Simulasi Monte Carlo riwayat gacha berdasarkan model probabilitas.

Dipakai untuk:
1. Membuat dataset sintetis (data asli dari kelompok terlalu sedikit).
2. Menguji bahwa perhitungan Markov Chain cocok dengan simulasi.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .config import BANNERS, BannerConfig
from .probability import hazard

SIM_COLUMNS = ["account", "banner", "gacha_type", "pity", "guaranteed", "is_s", "featured", "first_segment"]


def simulate_banner(banner: BannerConfig, n_pulls: int, rng: np.random.Generator) -> dict[str, np.ndarray]:
    """Simulasikan ``n_pulls`` pull berurutan dari pity 0, belum guaranteed."""
    h = hazard(banner)
    u_s = rng.random(n_pulls)
    u_f = rng.random(n_pulls)
    pity_col = np.empty(n_pulls, dtype=np.int16)
    guar_col = np.empty(n_pulls, dtype=np.int8)
    s_col = np.zeros(n_pulls, dtype=np.int8)
    feat_col = np.full(n_pulls, np.nan)
    pity = 0
    guaranteed = False
    for i in range(n_pulls):
        pity += 1
        pity_col[i] = pity
        guar_col[i] = guaranteed
        if u_s[i] < h[pity - 1]:
            s_col[i] = 1
            featured = guaranteed or u_f[i] < banner.featured_rate
            feat_col[i] = float(featured)
            guaranteed = not featured
            pity = 0
    return {"pity": pity_col, "guaranteed": guar_col, "is_s": s_col, "featured": feat_col}


def simulate_dataset(
    n_accounts: int = 400,
    min_pulls: int = 80,
    max_pulls: int = 700,
    seed: int = 42,
) -> pd.DataFrame:
    """Dataset sintetis: banyak akun, masing-masing punya riwayat dua banner."""
    if n_accounts < 1 or not 1 <= min_pulls <= max_pulls:
        raise ValueError("Parameter simulasi tidak valid.")
    rng = np.random.default_rng(seed)
    frames = []
    for acc in range(n_accounts):
        for banner in BANNERS.values():
            n = int(rng.integers(min_pulls, max_pulls + 1))
            cols = simulate_banner(banner, n, rng)
            frame = pd.DataFrame(cols)
            frame.insert(0, "account", f"sim-{acc:04d}")
            frame.insert(1, "banner", banner.key)
            frame.insert(2, "gacha_type", banner.real_gacha_types[0])
            frame["first_segment"] = 0  # awal riwayat diketahui, jadi lengkap
            frames.append(frame)
    return pd.concat(frames, ignore_index=True)[SIM_COLUMNS]
