from pathlib import Path

import streamlit as st

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "get_zzz_url.ps1"
RAW_URL = "https://raw.githubusercontent.com/tehgeii/project-data-mining/main/scripts/get_zzz_url.ps1"

st.title("📖 Panduan & FAQ")

st.header("Mengambil URL riwayat (PC Windows)")
st.markdown(
    """
1. Buka **Zenless Zone Zero** di PC.
2. Buka **Signal Search → History**, pilih banner apa saja, tunggu sampai riwayat tampil.
3. Download script di bawah ini (`get_zzz_url.ps1`).
4. Buka folder tempat file tersimpan, klik kanan di area kosong → **Open in Terminal**
   (atau buka **PowerShell** lalu `cd` ke folder itu).
5. Jalankan perintah:
"""
)
st.code("powershell -ExecutionPolicy Bypass -File .\\get_zzz_url.ps1", language="powershell")
st.markdown(
    """
6. Kalau muncul **BERHASIL**, URL sudah tersalin. Buka **Import Data → URL (PC)**,
   tempel (Ctrl+V), lalu klik **Ambil riwayat**.
"""
)

script_text = SCRIPT_PATH.read_text(encoding="utf-8") if SCRIPT_PATH.exists() else ""
if script_text:
    st.download_button(
        "Download get_zzz_url.ps1", data=script_text.encode("utf-8"), file_name="get_zzz_url.ps1",
        mime="text/plain", type="primary", width="stretch",
    )
    with st.expander("Lihat isi script (disarankan dibaca dulu)"):
        st.code(script_text, language="powershell")

with st.expander("Cara cepat satu baris (tanpa download)"):
    st.write("Hanya jalan kalau repository GitHub proyek ini bersifat publik.")
    st.code(f"iwr -useb {RAW_URL} | iex", language="powershell")

st.header("Pemain HP / tablet")
st.markdown(
    """
- **Paling mudah:** pakai **Input Manual**. Lihat angka pity di game, lalu isi di aplikasi.
- **Punya PC juga?** Ambil riwayat sekali di PC, klik **Ekspor UIGF (.json)**, kirim file
  itu ke HP (WhatsApp/Drive), lalu upload di tab **Upload File**.
- **Pakai aplikasi tracker lain** yang bisa ekspor **UIGF v4**? File-nya bisa langsung di-upload.
"""
)

st.header("FAQ")
with st.expander("Apakah aman? Bisa kena ban?"):
    st.markdown(
        """
- Script hanya **membaca** file cache yang dibuat game sendiri, lalu menyalin URL ke clipboard.
  Tidak mengubah file game, tidak menyuntik apa pun, tidak mengirim data.
- Cara ini sama dengan yang dipakai banyak situs tracker gacha HoYoverse sejak lama.
- **authkey** di URL hanya bisa dipakai untuk *melihat riwayat gacha*, bukan login ke akun,
  dan kedaluwarsa sekitar 24 jam. Tetap jangan dibagikan ke orang lain.
- Aplikasi ini tidak menyimpan URL/authkey. Riwayat hanya disimpan di sesi browser kamu
  dan hilang ketika tab ditutup.
"""
    )
with st.expander("Muncul 'authkey sudah kedaluwarsa'"):
    st.write("Buka lagi Signal Search → History di game, lalu jalankan ulang script untuk mendapatkan URL baru.")
with st.expander("Muncul 'Folder game tidak ditemukan'"):
    st.write("Jalankan game minimal sekali, atau isi lokasi folder secara manual:")
    st.code(
        "powershell -ExecutionPolicy Bypass -File .\\get_zzz_url.ps1 "
        "-GameDataPath 'D:\\Games\\ZenlessZoneZero Game\\ZenlessZoneZero_Data'",
        language="powershell",
    )
with st.expander("Kenapa pity di aplikasi beda dengan di game?"):
    st.write(
        "Server hanya menyimpan riwayat beberapa bulan terakhir. Kalau S terakhirmu lebih lama dari itu, "
        "pull sebelum riwayat yang tersimpan tidak ikut terhitung. Gunakan Input Manual untuk angka yang pasti."
    )
with st.expander("Kenapa akurasi semua model hampir sama?"):
    st.write(
        "Gacha memang acak. Untuk tugas 'dapat S di pull berikutnya', S sangat jarang (±1,7%), jadi model yang "
        "selalu menebak 'tidak S' pun akurasinya ±98%. Karena itu aplikasi juga menampilkan Balanced Accuracy, "
        "F1, ROC-AUC, Log Loss, dan Brier Score, serta tugas kedua (S dalam 10 pull) yang lebih seimbang."
    )
