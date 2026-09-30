"""Membaca dan menulis file riwayat gacha (format UIGF v4 dan variasinya)."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

import pandas as pd

from .records import RecordError

MAX_FILE_BYTES = 20 * 1024 * 1024
MAX_ITEMS = 200_000


def parse_json_bytes(raw: bytes) -> list[dict]:
    """Ambil daftar item gacha ZZZ dari isi file JSON.

    Format yang didukung:
    - UIGF v4: {"info": {...}, "nap": [{"uid": ..., "list": [...]}]}
    - Respons API: {"data": {"list": [...]}}
    - Objek dengan kunci "list": {"uid": ..., "list": [...]}
    - Array item langsung: [{...}, {...}]
    """
    if len(raw) > MAX_FILE_BYTES:
        raise RecordError("File terlalu besar (maksimal 20 MB).")
    try:
        data = json.loads(raw.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise RecordError("File bukan JSON yang valid.") from exc

    items: list[dict] = []
    if isinstance(data, dict) and "nap" in data:
        accounts = data["nap"]
        if not isinstance(accounts, list):
            raise RecordError('Bagian "nap" di file UIGF harus berupa daftar akun.')
        for account in accounts:
            if not isinstance(account, dict) or not isinstance(account.get("list"), list):
                raise RecordError('Setiap akun di bagian "nap" harus punya "list".')
            uid = str(account.get("uid", ""))
            for item in account["list"]:
                if isinstance(item, dict):
                    items.append({"uid": uid, **item})
                else:
                    items.append(item)
    elif isinstance(data, dict) and isinstance(data.get("data"), dict):
        items = _as_list(data["data"].get("list"))
    elif isinstance(data, dict) and "list" in data:
        uid = str(data.get("uid", ""))
        items = [{"uid": uid, **i} if isinstance(i, dict) else i for i in _as_list(data["list"])]
    elif isinstance(data, list):
        items = data
    elif isinstance(data, dict) and any(k in data for k in ("hk4e", "hkrpg")):
        raise RecordError("File ini berisi data Genshin/Star Rail, bukan Zenless Zone Zero.")
    else:
        raise RecordError("Format file tidak dikenali. Gunakan file UIGF v4 (Zenless Zone Zero).")

    if len(items) > MAX_ITEMS:
        raise RecordError(f"Jumlah data terlalu banyak (maksimal {MAX_ITEMS:,} pull).")
    return items


def _as_list(value) -> list:
    if not isinstance(value, list):
        raise RecordError('Kolom "list" harus berupa daftar.')
    return value


def to_uigf(df: pd.DataFrame, lang: str = "en-us") -> bytes:
    """Ekspor riwayat ke UIGF v4 supaya bisa di-upload lagi (misalnya dari HP)."""
    accounts = []
    for uid, group in df.groupby("uid", sort=True):
        accounts.append(
            {
                "uid": uid,
                "timezone": 8,
                "lang": lang,
                "list": [
                    {
                        "id": str(r.id),
                        "gacha_type": str(r.gacha_type),
                        "name": r.name,
                        "item_type": r.item_type,
                        "rank_type": str(r.rank_type),
                        "time": r.time,
                        "count": "1",
                    }
                    for r in group.itertuples()
                ],
            }
        )
    payload = {
        "info": {
            "export_timestamp": int(datetime.now(timezone.utc).timestamp()),
            "export_app": "zzz-gacha-predictor",
            "export_app_version": "1.0.0",
            "version": "v4.0",
        },
        "nap": accounts,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")


def anonymize(annotated: pd.DataFrame, salt: str = "zzz-data-mining") -> pd.DataFrame:
    """Dataset anonim untuk dikumpulkan kelompok: tanpa UID asli, nama, dan waktu.

    UID diganti hash pendek supaya pull dari akun yang sama tetap bisa
    dikelompokkan (penting untuk pembagian train/test per akun).
    """
    cols = ["account", "banner", "gacha_type", "pity", "guaranteed", "is_s", "featured", "first_segment"]
    if annotated.empty:
        return pd.DataFrame(columns=cols)
    out = annotated.copy()
    out["account"] = out["uid"].map(
        lambda u: hashlib.sha256(f"{salt}:{u}".encode()).hexdigest()[:12]
    )
    return out[cols].reset_index(drop=True)
