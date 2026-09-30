import streamlit as st

from zzzgacha.config import BANNERS
from zzzgacha.demo import demo_items
from zzzgacha.fetcher import FetchError, fetch_history
from zzzgacha.importers import anonymize, parse_json_bytes, to_uigf
from zzzgacha.records import RecordError, annotate, current_states, to_dataframe
from zzzgacha.ui import clear_records, get_manual, get_records, set_manual, set_records

st.title("📥 Import Data")
st.write("Pilih salah satu cara memasukkan data. Semua data hanya disimpan selama tab browser ini terbuka.")


def _load(items: list[dict], source: str) -> None:
    """Validasi lalu simpan riwayat ke sesi."""
    df = to_dataframe(items)
    if df.empty:
        st.warning(
            "Tidak ada pull dari banner Agent/W-Engine terbatas di data ini. "
            "Pastikan riwayat Signal Search sudah pernah dibuka di game."
        )
        return
    annotate(df)  # memicu RecordError kalau riwayat tidak masuk akal
    set_records(df)
    st.success(f"Berhasil memuat {len(df):,} pull ({source}).")


tab_url, tab_file, tab_manual = st.tabs(["🔗 URL (PC)", "📁 Upload File", "✍️ Input Manual"])

with tab_url:
    st.markdown(
        "1. Buka **Signal Search → History** di game (PC).\n"
        "2. Jalankan script PowerShell (lihat **Panduan & FAQ**).\n"
        "3. Tempel URL yang sudah tersalin otomatis ke kotak di bawah."
    )
    st.page_link("app_pages/panduan.py", label="Lihat panduan PowerShell", icon="📖")
    with st.form("url_form", clear_on_submit=True):
        url_text = st.text_area(
            "URL riwayat gacha",
            placeholder="https://public-operation-nap-sg.hoyoverse.com/common/gacha_record/api/getGachaLog?authkey=...",
            height=100,
        )
        submitted = st.form_submit_button("Ambil riwayat", type="primary", width="stretch")
    if submitted:
        try:
            with st.status("Mengambil riwayat dari server HoYoverse ...", expanded=True) as status:
                line = st.empty()
                items = fetch_history(url_text, progress=lambda msg: line.write(msg))
                status.update(label="Selesai mengambil data.", state="complete")
            _load(items, "dari server HoYoverse")
        except (FetchError, RecordError) as exc:
            st.error(str(exc))
        except Exception:
            # Jangan tampilkan detail teknis: bisa memuat URL beserta authkey.
            st.error("Terjadi kesalahan tak terduga saat mengambil data. Coba lagi beberapa saat lagi.")
    st.caption("🔒 URL/authkey hanya dipakai sekali untuk mengambil data, tidak disimpan di mana pun.")

with tab_file:
    st.write(
        "Upload file **UIGF v4 (.json)** Zenless Zone Zero: hasil ekspor dari aplikasi ini "
        "atau dari aplikasi tracker lain yang mendukung UIGF."
    )
    uploaded = st.file_uploader("File riwayat", type=["json"])
    if uploaded is not None and st.button("Muat file", type="primary", width="stretch"):
        try:
            _load(parse_json_bytes(uploaded.getvalue()), f"dari file {uploaded.name}")
        except RecordError as exc:
            st.error(str(exc))
    st.divider()
    st.write("Belum punya data? Coba dengan **data contoh** (buatan, bukan akun asli).")
    if st.button("Pakai data contoh", width="stretch"):
        _load(demo_items(), "data contoh")

with tab_manual:
    st.write("Cocok untuk pemain HP/tablet: cukup isi pity yang terlihat di game.")
    for key, banner in BANNERS.items():
        current = get_manual(key)
        with st.container(border=True):
            st.markdown(f"**{banner.label}**")
            pity = st.number_input(
                "Pity sekarang (pull sejak S terakhir)",
                min_value=0,
                max_value=banner.hard_pity - 1,
                value=int(current["pity"]),
                step=1,
                key=f"manual_pity_{key}",
            )
            guaranteed = st.checkbox(
                "S berikutnya pasti rate-up (kalah 50/50 sebelumnya)"
                if key == "agent"
                else "S berikutnya pasti rate-up (kalah 75/25 sebelumnya)",
                value=bool(current["guaranteed"]),
                key=f"manual_guar_{key}",
            )
            set_manual(key, pity, guaranteed)
    st.success("Tersimpan otomatis. Buka **Kalkulator Peluang** untuk melihat hasilnya.")

df = get_records()
if df is not None:
    st.divider()
    st.subheader("Riwayat yang dimuat")
    for state in current_states(annotate(df)):
        banner = BANNERS[state.banner]
        st.write(
            f"- **{banner.label}** (tipe {state.gacha_type}): {state.total_pulls} pull, "
            f"{state.s_count} S, pity sekarang **{state.pity}**"
            + (", S berikutnya **pasti rate-up**" if state.guaranteed else "")
        )
    c1, c2 = st.columns(2)
    with c1:
        st.download_button(
            "Ekspor UIGF (.json)",
            data=to_uigf(df),
            file_name="zzz_riwayat_uigf.json",
            mime="application/json",
            help="Simpan lalu upload di HP supaya tidak perlu PowerShell lagi.",
            width="stretch",
        )
    with c2:
        st.download_button(
            "Dataset anonim (.csv)",
            data=anonymize(annotate(df)).to_csv(index=False).encode("utf-8"),
            file_name="zzz_dataset_anonim.csv",
            mime="text/csv",
            help="Tanpa UID, nama item, dan waktu. Untuk dikumpulkan ke kelompok sebagai data latih.",
            width="stretch",
        )
    if st.button("Hapus riwayat dari sesi ini", width="stretch"):
        clear_records()
        st.rerun()
