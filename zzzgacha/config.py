"""Parameter banner Zenless Zone Zero yang dipakai di seluruh proyek.

Sumber angka:
- Rate dasar, rate gabungan (consolidated), hard pity, dan peluang rate-up
  diambil dari detail banner resmi di dalam game (tombol "Details").
- Titik mulai soft pity TIDAK diumumkan resmi. Angka di bawah adalah estimasi
  komunitas. Besar kenaikan peluang per pull setelah soft pity dihitung
  otomatis (lihat ``probability.calibrate_step``) supaya rate gabungannya
  sama persis dengan angka resmi.

Kalau HoYoverse mengubah aturan gacha, cukup ubah file ini.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class BannerConfig:
    key: str
    label: str
    base_rate: float  # peluang S per pull sebelum soft pity
    consolidated_rate: float  # rate gabungan resmi (termasuk pity)
    hard_pity: int  # pull ke-berapa S pasti keluar
    soft_pity_start: int  # pull pertama yang peluangnya mulai naik (estimasi)
    featured_rate: float  # peluang S yang keluar adalah S rate-up
    real_gacha_types: tuple[int, ...]  # nilai real_gacha_type di API


AGENT = BannerConfig(
    key="agent",
    label="Agent Terbatas (Exclusive Channel)",
    base_rate=0.006,
    consolidated_rate=0.016,
    hard_pity=90,
    soft_pity_start=74,
    featured_rate=0.5,
    # 2 = Exclusive Channel, 102 = Exclusive Rescreening (banner rerun)
    real_gacha_types=(2, 102),
)

WENGINE = BannerConfig(
    key="wengine",
    label="W-Engine Terbatas (W-Engine Channel)",
    base_rate=0.010,
    consolidated_rate=0.020,
    hard_pity=80,
    soft_pity_start=65,
    featured_rate=0.75,
    # 3 = W-Engine Channel, 103 = W-Engine Reverberation (banner rerun)
    real_gacha_types=(3, 103),
)

BANNERS: dict[str, BannerConfig] = {AGENT.key: AGENT, WENGINE.key: WENGINE}

# rank_type di data ZZZ: 4 = S, 3 = A, 2 = B
RANK_S = 4

# 1 Encrypted Master Tape / Master Tape = 160 Polychrome
POLYCHROME_PER_PULL = 160

# Karakter dan W-Engine S "standar" (bukan rate-up). Kalau S yang didapat ada di
# daftar ini, berarti pemain kalah 50/50 (atau 75/25). Nama memakai bahasa
# Inggris karena fetcher selalu meminta data dengan lang=en-us.
# PERBARUI daftar ini kalau HoYoverse menambah isi banner standar.
STANDARD_S_AGENTS = frozenset(
    {"Grace", "Rina", "Koleda", "Nekomata", "Soldier 11", "Lycaon"}
)
STANDARD_S_WENGINES = frozenset(
    {
        "Fusion Compiler",
        "Weeping Cradle",
        "Hellfire Gears",
        "Steel Cushion",
        "The Brimstone",
        "The Restrained",
    }
)
STANDARD_S_ITEMS = STANDARD_S_AGENTS | STANDARD_S_WENGINES


def banner_for_gacha_type(gacha_type: int) -> BannerConfig | None:
    """Petakan real_gacha_type (atau gacha_type 4 digit seperti 2001) ke banner.

    Mengembalikan None untuk banner yang di luar cakupan (standar, Bangboo).
    """
    gacha_type = normalize_gacha_type(gacha_type)
    for banner in BANNERS.values():
        if gacha_type in banner.real_gacha_types:
            return banner
    return None


def normalize_gacha_type(gacha_type: int) -> int:
    """Samakan format gacha_type.

    API/ekspor ZZZ kadang memakai 4 digit (1001, 2001, 3001, 5001) dan kadang
    memakai real_gacha_type (1, 2, 3, 5, 102, 103). Keduanya dipetakan ke
    real_gacha_type.
    """
    gacha_type = int(gacha_type)
    if gacha_type >= 1000:
        return gacha_type // 1000
    return gacha_type
