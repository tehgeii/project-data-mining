"""Struktur data riwayat gacha dan perhitungan pity dari riwayat."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from .config import BANNERS, RANK_S, STANDARD_S_ITEMS, banner_for_gacha_type, normalize_gacha_type

RECORD_COLUMNS = ["id", "uid", "gacha_type", "banner", "name", "item_type", "rank_type", "time"]


class RecordError(ValueError):
    """Data riwayat tidak valid (pesan aman ditampilkan ke pengguna)."""


def to_dataframe(items: list[dict]) -> pd.DataFrame:
    """Ubah daftar item mentah (format API / UIGF) menjadi DataFrame bersih.

    - Hanya banner Agent & W-Engine terbatas yang disimpan.
    - Duplikat (id sama) dibuang.
    - Diurutkan dari pull paling lama ke paling baru (id makin besar = makin baru).
    """
    rows = []
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            raise RecordError(f"Item ke-{i + 1} bukan objek JSON.")
        try:
            gacha_type = normalize_gacha_type(item["gacha_type"])
            record_id = int(str(item["id"]).strip())
            rank_type = int(item["rank_type"])
        except (KeyError, TypeError, ValueError) as exc:
            raise RecordError(
                f"Item ke-{i + 1} tidak punya kolom id/gacha_type/rank_type yang valid."
            ) from exc
        banner = banner_for_gacha_type(gacha_type)
        if banner is None:
            continue
        if rank_type not in (2, 3, 4):
            raise RecordError(f"rank_type item ke-{i + 1} tidak dikenal: {rank_type}.")
        rows.append(
            {
                "id": record_id,
                "uid": str(item.get("uid", "")),
                "gacha_type": gacha_type,
                "banner": banner.key,
                "name": str(item.get("name", "")).strip(),
                "item_type": str(item.get("item_type", "")).strip(),
                "rank_type": rank_type,
                "time": str(item.get("time", "")),
            }
        )
    df = pd.DataFrame(rows, columns=RECORD_COLUMNS)
    if df.empty:
        return df
    df = df.drop_duplicates(subset="id").sort_values("id", kind="stable").reset_index(drop=True)
    return df


@dataclass
class PityState:
    banner: str
    gacha_type: int
    pity: int  # pull yang sudah dilakukan sejak S terakhir
    guaranteed: bool  # S berikutnya pasti rate-up
    total_pulls: int
    s_count: int

    @property
    def may_be_incomplete(self) -> bool:
        """True kalau belum ada S di riwayat, jadi pity asli bisa lebih besar."""
        return self.s_count == 0


def annotate(df: pd.DataFrame) -> pd.DataFrame:
    """Tambah kolom pity, status guaranteed, dan hasil 50/50 ke tiap pull.

    Pity dihitung terpisah untuk setiap (uid, gacha_type) karena tiap banner
    punya pity sendiri.

    Kolom baru:
    - pity       : urutan pull sejak S terakhir, termasuk pull ini (1..hard_pity)
    - guaranteed : 1 kalau sebelum pull ini S berikutnya sudah pasti rate-up
    - is_s       : 1 kalau pull ini dapat S
    - featured   : 1 kalau S rate-up, 0 kalau S standar, kosong kalau bukan S
    - first_segment : 1 untuk pull sampai S pertama yang tercatat. Riwayat resmi
      hanya menyimpan data beberapa bulan terakhir, jadi pity dan status
      guaranteed di segmen ini bisa tidak lengkap. Untuk dataset ML segmen ini
      dibuang.
    """
    if df.empty:
        return df.assign(pity=[], guaranteed=[], is_s=[], featured=[], first_segment=[])
    out = []
    for _, group in df.groupby(["uid", "gacha_type"], sort=False):
        group = group.sort_values("id", kind="stable").copy()
        banner = BANNERS[group["banner"].iloc[0]]
        pity = 0
        guaranteed = False
        seen_s = False
        pities, guars, featured, first_seg = [], [], [], []
        for name, rank in zip(group["name"], group["rank_type"]):
            pity += 1
            first_seg.append(int(not seen_s))
            if pity > banner.hard_pity:
                raise RecordError(
                    f"Ditemukan {pity} pull tanpa S di {banner.label}, melebihi hard pity "
                    f"{banner.hard_pity}. Kemungkinan ada riwayat yang hilang atau salah banner."
                )
            pities.append(pity)
            guars.append(int(guaranteed))
            if rank == RANK_S:
                is_featured = name not in STANDARD_S_ITEMS
                featured.append(float(is_featured))
                guaranteed = not is_featured
                pity = 0
                seen_s = True
            else:
                featured.append(float("nan"))
        group["pity"] = pities
        group["guaranteed"] = guars
        group["is_s"] = (group["rank_type"] == RANK_S).astype(int)
        group["featured"] = featured
        group["first_segment"] = first_seg
        out.append(group)
    return pd.concat(out).sort_values("id", kind="stable").reset_index(drop=True)


def current_states(annotated: pd.DataFrame) -> list[PityState]:
    """Status pity terakhir per (uid, gacha_type)."""
    states = []
    if annotated.empty:
        return states
    for (_, gacha_type), group in annotated.groupby(["uid", "gacha_type"], sort=True):
        last = group.iloc[-1]
        if last["is_s"] == 1:
            pity = 0
            guaranteed = last["featured"] == 0
        else:
            pity = int(last["pity"])
            guaranteed = bool(last["guaranteed"])
        states.append(
            PityState(
                banner=str(last["banner"]),
                gacha_type=int(gacha_type),
                pity=pity,
                guaranteed=bool(guaranteed),
                total_pulls=len(group),
                s_count=int(group["is_s"].sum()),
            )
        )
    return states


def s_history(annotated: pd.DataFrame) -> pd.DataFrame:
    """Daftar S yang didapat beserta pity-nya."""
    if annotated.empty:
        return annotated
    s = annotated[annotated["is_s"] == 1].copy()
    s["hasil"] = s["featured"].map({1.0: "Rate-up", 0.0: "Standar (kalah 50/50)"})
    return s[["time", "banner", "name", "pity", "hasil"]].reset_index(drop=True)
