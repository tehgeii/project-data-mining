"""Mengambil riwayat Signal Search dari API resmi HoYoverse.

Keamanan:
- Request HANYA dikirim ke host resmi (daftar ``ALLOWED_API_HOSTS``). Host dari
  URL yang ditempel pengguna tidak pernah dipakai langsung, jadi URL palsu
  tidak bisa membuat server mengakses alamat lain.
- ``authkey`` tidak pernah disimpan, dicetak, atau dimasukkan ke pesan error.
"""

from __future__ import annotations

import re
import time
from collections.abc import Callable
from urllib.parse import parse_qsl, urlencode, urlsplit

import requests

from .config import BANNERS

API_PATH = "/common/gacha_record/api/getGachaLog"
API_HOST_GLOBAL = "public-operation-nap-sg.hoyoverse.com"
API_HOST_CN = "public-operation-nap.mihoyo.com"
ALLOWED_API_HOSTS = (API_HOST_GLOBAL, API_HOST_CN)
TRUSTED_DOMAINS = ("hoyoverse.com", "mihoyo.com")

PAGE_SIZE = 20
MAX_PAGES_PER_TYPE = 1500  # 30.000 pull per banner, jauh di atas wajar
REQUEST_TIMEOUT = 15
MAX_RETRIES = 3

# Parameter yang diatur ulang oleh fetcher (tidak diambil dari URL pengguna).
_OVERRIDDEN = {"real_gacha_type", "gacha_type", "end_id", "size", "page", "lang"}

_URL_RE = re.compile(r"https://[^\s\"'<>]+")


class FetchError(RuntimeError):
    """Kesalahan saat mengambil data (pesan aman ditampilkan ke pengguna)."""


def parse_gacha_url(text: str) -> tuple[str, dict[str, str]]:
    """Validasi URL yang ditempel pengguna dan kembalikan (host API, parameter).

    Menerima URL API (``.../getGachaLog?authkey=...``) maupun URL halaman
    riwayat di dalam game (``...?authkey=...#/...``).
    """
    if not text or not text.strip():
        raise FetchError("URL masih kosong.")
    match = _URL_RE.search(text.strip())
    if not match:
        raise FetchError("Tidak ditemukan URL https:// di teks yang ditempel.")
    url = match.group(0)
    try:
        parts = urlsplit(url)
        host = (parts.hostname or "").lower()
    except ValueError as exc:
        raise FetchError("URL tidak valid.") from exc
    if parts.scheme != "https" or not any(
        host == d or host.endswith("." + d) for d in TRUSTED_DOMAINS
    ):
        raise FetchError("URL harus berasal dari domain resmi hoyoverse.com atau mihoyo.com.")

    # Parameter bisa ada di query biasa atau setelah '#' (halaman web game).
    query = parts.query
    if not query and "?" in parts.fragment:
        query = parts.fragment.split("?", 1)[1]
    params = dict(parse_qsl(query, keep_blank_values=True))
    if not params.get("authkey"):
        raise FetchError("URL tidak berisi authkey. Buka lagi riwayat Signal Search di game.")

    game_biz = params.get("game_biz", "")
    if game_biz and not game_biz.startswith("nap_"):
        raise FetchError("URL ini bukan milik Zenless Zone Zero.")
    api_host = API_HOST_CN if game_biz == "nap_cn" or host.endswith("mihoyo.com") else API_HOST_GLOBAL
    clean = {k: v for k, v in params.items() if k not in _OVERRIDDEN}
    return api_host, clean


def build_api_url(api_host: str, params: dict[str, str], real_gacha_type: int, end_id: str) -> str:
    if api_host not in ALLOWED_API_HOSTS:
        raise FetchError("Host API tidak diizinkan.")
    query = {
        **params,
        "real_gacha_type": str(real_gacha_type),
        "size": str(PAGE_SIZE),
        "end_id": end_id,
        "lang": "en-us",
    }
    return f"https://{api_host}{API_PATH}?{urlencode(query)}"


def _get_json(session: requests.Session, url: str, sleep: Callable[[float], None]) -> dict:
    last_error = "tidak diketahui"
    for attempt in range(MAX_RETRIES):
        try:
            resp = session.get(url, timeout=REQUEST_TIMEOUT)
            if resp.status_code >= 500 or resp.status_code == 429:
                last_error = f"server membalas HTTP {resp.status_code}"
            elif resp.status_code != 200:
                raise FetchError(f"Server membalas HTTP {resp.status_code}.")
            else:
                return resp.json()
        except FetchError:
            raise
        except ValueError:
            last_error = "respons bukan JSON"
        except requests.RequestException as exc:
            # Jangan sertakan str(exc): isinya memuat URL lengkap beserta authkey.
            last_error = type(exc).__name__
        sleep(1.0 * (2**attempt))
    raise FetchError(f"Gagal menghubungi server HoYoverse ({last_error}). Coba lagi nanti.")


def _check_retcode(payload: dict) -> list[dict]:
    if not isinstance(payload, dict):
        raise FetchError("Respons server tidak dikenali.")
    retcode = payload.get("retcode")
    if retcode == -101:
        raise FetchError("authkey sudah kedaluwarsa. Buka lagi riwayat Signal Search di game lalu ambil URL baru.")
    if retcode == -100:
        raise FetchError("authkey tidak valid. Pastikan URL disalin utuh.")
    if retcode == -110:
        raise FetchError("Terlalu sering meminta data. Tunggu sebentar lalu coba lagi.")
    if retcode != 0:
        raise FetchError(f"Server menolak permintaan (retcode {retcode}).")
    data = payload.get("data") or {}
    items = data.get("list")
    if items is None:
        return []
    if not isinstance(items, list):
        raise FetchError("Respons server tidak dikenali.")
    return items


def fetch_history(
    url_text: str,
    session: requests.Session | None = None,
    progress: Callable[[str], None] | None = None,
    sleep: Callable[[float], None] = time.sleep,
    page_delay: float = 0.3,
) -> list[dict]:
    """Ambil seluruh riwayat banner Agent & W-Engine terbatas."""
    api_host, params = parse_gacha_url(url_text)
    session = session or requests.Session()
    progress = progress or (lambda _msg: None)
    items: list[dict] = []
    for banner in BANNERS.values():
        for index, real_type in enumerate(banner.real_gacha_types):
            is_main = index == 0
            try:
                items.extend(_fetch_type(session, api_host, params, real_type, banner.label, progress, sleep, page_delay))
            except FetchError as exc:
                # Banner rerun (Rescreening/Reverberation) tidak ada di semua
                # server/versi. Kalau gagal, lewati saja; banner utama wajib berhasil.
                if is_main:
                    raise
                progress(f"Lewati banner rerun {real_type}: {exc}")
    return items


def _fetch_type(session, api_host, params, real_type, label, progress, sleep, page_delay) -> list[dict]:
    end_id = "0"
    items: list[dict] = []
    for page in range(1, MAX_PAGES_PER_TYPE + 1):
        progress(f"{label}: halaman {page} ({len(items)} pull)")
        payload = _get_json(session, build_api_url(api_host, params, real_type, end_id), sleep)
        batch = _check_retcode(payload)
        if not batch:
            return items
        for item in batch:
            if isinstance(item, dict):
                # Pakai tipe banner yang diminta: gacha_type bawaan API bisa
                # berformat lain (mis. 2001) dan tidak membedakan banner rerun.
                item["raw_gacha_type"] = item.get("gacha_type")
                item["gacha_type"] = str(real_type)
        items.extend(batch)
        new_end = str(batch[-1].get("id", "")) if isinstance(batch[-1], dict) else ""
        if not new_end or new_end == end_id:
            return items
        end_id = new_end
        if len(batch) < PAGE_SIZE:
            return items
        sleep(page_delay)
    raise FetchError("Jumlah halaman melebihi batas wajar. Proses dihentikan.")
