"""Data riwayat contoh (buatan) supaya aplikasi bisa dicoba tanpa punya game."""

from __future__ import annotations

from datetime import datetime, timedelta

import numpy as np

from .config import AGENT, WENGINE, BannerConfig
from .simulate import simulate_banner

DEMO_UID = "1000000000"
_STANDARD = {
    AGENT.key: ["Grace", "Rina", "Koleda", "Nekomata", "Soldier 11", "Lycaon"],
    WENGINE.key: ["Fusion Compiler", "Weeping Cradle", "Hellfire Gears", "Steel Cushion", "The Brimstone", "The Restrained"],
}
_FEATURED = {AGENT.key: "Agent Rate-up (Demo)", WENGINE.key: "W-Engine Rate-up (Demo)"}
_ITEM_TYPE = {AGENT.key: "Agents", WENGINE.key: "W-Engines"}


def demo_items(seed: int = 7, pulls: tuple[int, int] = (260, 140)) -> list[dict]:
    """Riwayat buatan dalam format yang sama dengan respons API."""
    rng = np.random.default_rng(seed)
    items: list[dict] = []
    next_id = 1_700_000_000_000_000_000
    start = datetime(2026, 1, 1, 12, 0, 0)
    for banner, n in zip((AGENT, WENGINE), pulls):
        sim = simulate_banner(banner, n, rng)
        for i in range(n):
            items.append(_item(banner, sim, i, rng, next_id, start + timedelta(minutes=i)))
            next_id += 1
    return items


def _item(banner: BannerConfig, sim, i, rng, item_id, when) -> dict:
    if sim["is_s"][i]:
        name = _FEATURED[banner.key] if sim["featured"][i] == 1 else str(rng.choice(_STANDARD[banner.key]))
        rank = 4
        item_type = _ITEM_TYPE[banner.key]
    elif rng.random() < 0.14:
        name, rank, item_type = "Item A (Demo)", 3, _ITEM_TYPE[banner.key]
    else:
        name, rank, item_type = "Item B (Demo)", 2, "W-Engines"
    return {
        "uid": DEMO_UID,
        "id": str(item_id),
        "gacha_type": str(banner.real_gacha_types[0]),
        "name": name,
        "item_type": item_type,
        "rank_type": str(rank),
        "time": when.strftime("%Y-%m-%d %H:%M:%S"),
    }
