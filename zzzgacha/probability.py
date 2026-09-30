"""Model probabilitas gacha berbasis Markov Chain.

Definisi pity yang dipakai di seluruh proyek:
    pity = urutan pull sejak S terakhir, TERMASUK pull saat ini (1..hard_pity).
    Contoh: pull pertama setelah dapat S punya pity = 1.

Peluang dapat S pada pull dengan pity ``n`` (dengan syarat belum dapat S di
pull-pull sebelumnya) disebut *hazard* ``h(n)``:

    h(n) = base_rate                                  untuk n <  soft_start
    h(n) = min(1, base_rate + step * (n - soft_start + 1))  untuk n >= soft_start
    h(hard_pity) = 1

``step`` dikalibrasi supaya rate gabungan (1 / rata-rata pull per S) sama dengan
angka resmi.

Rantai Markov untuk "dapat S rate-up" punya state (pity_sebelumnya, guaranteed):
- dengan peluang h(pity+1) keluar S:
    * kalau guaranteed -> pasti S rate-up (selesai)
    * kalau tidak -> S rate-up dengan peluang featured_rate (selesai),
      selain itu kalah 50/50 -> state (0, guaranteed=True)
- selain itu -> state (pity+1, guaranteed sama)
"""

from __future__ import annotations

from functools import lru_cache

import numpy as np

from .config import POLYCHROME_PER_PULL, BannerConfig


def _hazard(base_rate: float, soft_start: int, hard_pity: int, step: float) -> np.ndarray:
    n = np.arange(1, hard_pity + 1)
    h = np.where(n < soft_start, base_rate, base_rate + step * (n - soft_start + 1))
    h = np.clip(h, 0.0, 1.0)
    h[-1] = 1.0
    return h


def _expected_pulls(h: np.ndarray) -> float:
    # E[N] = sum_{n>=1} P(N >= n) = sum survival sebelum pull n
    survival_before = np.concatenate(([1.0], np.cumprod(1.0 - h)[:-1]))
    return float(survival_before.sum())


@lru_cache(maxsize=None)
def calibrate_step(
    base_rate: float, consolidated_rate: float, soft_start: int, hard_pity: int
) -> float:
    """Cari kenaikan peluang per pull (step) agar rate gabungan = angka resmi.

    Rata-rata pull per S turun secara monoton ketika step naik, jadi cukup
    dicari dengan metode biseksi.
    """
    target = 1.0 / consolidated_rate
    lo, hi = 0.0, 1.0
    if _expected_pulls(_hazard(base_rate, soft_start, hard_pity, lo)) < target:
        raise ValueError("Rate gabungan terlalu kecil untuk parameter banner ini.")
    if _expected_pulls(_hazard(base_rate, soft_start, hard_pity, hi)) > target:
        raise ValueError("Rate gabungan terlalu besar untuk parameter banner ini.")
    for _ in range(100):
        mid = (lo + hi) / 2
        if _expected_pulls(_hazard(base_rate, soft_start, hard_pity, mid)) > target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def hazard(banner: BannerConfig) -> np.ndarray:
    """Array h[0..hard_pity-1]; h[i] = peluang S pada pull dengan pity i+1."""
    step = calibrate_step(
        banner.base_rate, banner.consolidated_rate, banner.soft_pity_start, banner.hard_pity
    )
    return _hazard(banner.base_rate, banner.soft_pity_start, banner.hard_pity, step)


def s_chance_at_pity(banner: BannerConfig, pity: int) -> float:
    """Peluang S tepat di pull dengan nomor pity ``pity`` (1..hard_pity)."""
    _check_pity(banner, pity, minimum=1)
    return float(hazard(banner)[pity - 1])


def expected_pulls_per_s(banner: BannerConfig) -> float:
    return _expected_pulls(hazard(banner))


def next_s_distribution(banner: BannerConfig, current_pity: int) -> np.ndarray:
    """Distribusi jumlah pull sampai S berikutnya.

    ``current_pity`` = jumlah pull yang SUDAH dilakukan sejak S terakhir
    (0..hard_pity-1), sama dengan angka pity yang ditampilkan tracker.
    Elemen ke-j (0-based) = peluang S keluar tepat di pull ke-(j+1) dari sekarang.
    """
    _check_pity(banner, current_pity, minimum=0, maximum=banner.hard_pity - 1)
    h = hazard(banner)[current_pity:]
    survival_before = np.concatenate(([1.0], np.cumprod(1.0 - h)[:-1]))
    return survival_before * h


def featured_cdf(
    banner: BannerConfig, current_pity: int, guaranteed: bool, max_pulls: int
) -> np.ndarray:
    """Peluang kumulatif sudah dapat S RATE-UP dalam 1..max_pulls pull ke depan.

    Dihitung dengan iterasi rantai Markov (tanpa simulasi, hasilnya eksak).
    """
    _check_pity(banner, current_pity, minimum=0, maximum=banner.hard_pity - 1)
    if max_pulls < 1:
        raise ValueError("max_pulls minimal 1.")
    h = hazard(banner)
    hp = banner.hard_pity
    w = banner.featured_rate
    # dist[g, k] = peluang berada di state (pity_sebelumnya=k, guaranteed=g)
    dist = np.zeros((2, hp))
    dist[int(guaranteed), current_pity] = 1.0
    done = 0.0
    cdf = np.empty(max_pulls)
    for t in range(max_pulls):
        new = np.zeros_like(dist)
        s_prob = dist * h  # peluang dapat S di pull ini dari tiap state
        # tidak dapat S -> pity naik 1 (hazard[hp-1]=1 jadi tidak pernah lewat batas)
        new[:, 1:] += (dist * (1.0 - h))[:, :-1]
        # dapat S
        done += s_prob[1].sum() + w * s_prob[0].sum()
        new[1, 0] += (1.0 - w) * s_prob[0].sum()
        dist = new
        cdf[t] = done
    return np.minimum(cdf, 1.0)


def worst_case_pulls_for_featured(banner: BannerConfig, current_pity: int, guaranteed: bool) -> int:
    """Jumlah pull maksimum sampai S rate-up pasti didapat."""
    _check_pity(banner, current_pity, minimum=0, maximum=banner.hard_pity - 1)
    first = banner.hard_pity - current_pity
    return first if guaranteed else first + banner.hard_pity


def expected_pulls_for_featured(banner: BannerConfig, current_pity: int, guaranteed: bool) -> float:
    horizon = worst_case_pulls_for_featured(banner, current_pity, guaranteed)
    cdf = featured_cdf(banner, current_pity, guaranteed, horizon)
    # E[N] = sum_{n>=0} P(N > n)
    return float(1.0 + np.sum(1.0 - cdf[:-1]))


def pulls_for_confidence(
    banner: BannerConfig, current_pity: int, guaranteed: bool, confidence: float
) -> int:
    """Jumlah pull minimum supaya peluang dapat S rate-up >= ``confidence``."""
    if not 0 < confidence <= 1:
        raise ValueError("confidence harus di antara 0 dan 1.")
    horizon = worst_case_pulls_for_featured(banner, current_pity, guaranteed)
    cdf = featured_cdf(banner, current_pity, guaranteed, horizon)
    idx = int(np.searchsorted(cdf, confidence - 1e-12))
    return min(idx + 1, horizon)


def polychrome_to_pulls(polychrome: int, tapes: int = 0) -> int:
    if polychrome < 0 or tapes < 0:
        raise ValueError("Jumlah Polychrome dan tape tidak boleh negatif.")
    return int(tapes) + int(polychrome) // POLYCHROME_PER_PULL


def _check_pity(banner: BannerConfig, pity: int, minimum: int, maximum: int | None = None) -> None:
    maximum = banner.hard_pity if maximum is None else maximum
    if isinstance(pity, bool) or not isinstance(pity, (int, np.integer)):
        raise TypeError("pity harus bilangan bulat.")
    if not minimum <= pity <= maximum:
        raise ValueError(f"pity untuk {banner.label} harus di antara {minimum} dan {maximum}.")
