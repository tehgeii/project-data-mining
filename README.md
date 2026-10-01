# 🎰 ZZZ Gacha Predictor

Aplikasi web (Streamlit) untuk menghitung dan memprediksi peluang mendapatkan
**S-Rank Agent** dan **S-Rank W-Engine** di banner terbatas *Zenless Zone Zero*,
sekaligus **membandingkan algoritma data mining**: Logistic Regression,
Decision Tree, Random Forest, dan XGBoost, dengan Markov Chain sebagai acuan teori.

> Proyek mata kuliah Penambangan Data. Tidak berafiliasi dengan HoYoverse.

🌐 **Coba langsung:** <https://project-data-mining-zzz.streamlit.app/> (bisa dibuka di HP, tablet, dan laptop)

## Tim

| Nama | Peran |
|---|---|
| [TGI / Dafi (@tehgeii)](https://github.com/tehgeii) | Pengujian dengan data game asli (Steam), deploy aplikasi |
| _(anggota 2)_ | |
| _(anggota 3)_ | |
| _(anggota 4)_ | |
| _(anggota 5)_ | |

Dibantu oleh Claude (Anthropic) dalam penulisan kode.

## Fitur

| Halaman | Isi |
|---|---|
| 📥 Import Data | 3 cara: **URL dari PowerShell** (PC), **upload file UIGF** (HP/PC), **input manual** (HP). Ada juga **data contoh** untuk yang tidak punya game. |
| 🎲 Kalkulator Peluang | Peluang dapat S / S rate-up dalam N pull (Markov Chain, hasil eksak), konversi Polychrome, dan prediksi dari 4 model ML. |
| 📊 Statistik Riwayat | Pity tiap S, rata-rata pity, menang/kalah 50/50, pity sekarang. |
| 🤖 Perbandingan Algoritma | Tabel Accuracy, Balanced Accuracy, Precision, Recall, F1, ROC-AUC, Log Loss, Brier; cross-validation; kurva peluang; confusion matrix; feature importance. |
| 📖 Panduan & FAQ | Cara menjalankan script PowerShell dan menjawab pertanyaan umum. |

## Menjalankan di laptop

Butuh Python 3.10 atau lebih baru.

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate    |  Mac/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt

streamlit run streamlit_app.py          # buka http://localhost:8501
python -m pytest -q                     # jalankan semua test
python scripts/train_models.py          # latih ulang model (±1-2 menit)
```

## Deploy ke Streamlit Community Cloud (gratis, bisa dibuka di HP)

1. Pastikan kode sudah ada di GitHub (branch `main`).
2. Buka <https://share.streamlit.io>, login dengan akun GitHub.
3. **Create app** → pilih repository ini, branch `main`, main file `streamlit_app.py`.
4. Di **Advanced settings**, pilih Python **3.12**.
5. **Deploy**. Link `https://<nama-app>.streamlit.app` bisa dibuka dari HP, tablet, maupun laptop.

Model yang sudah dilatih (`models/models.joblib`) ikut di-commit, jadi server tidak
perlu melatih ulang. Versi library di `requirements.txt` sengaja dikunci supaya
file model pasti bisa dimuat.

## Struktur proyek

```
streamlit_app.py          # titik masuk aplikasi + navigasi
app_pages/                # satu file per halaman
zzzgacha/
  config.py               # aturan banner (rate, pity, 50/50, daftar S standar)
  probability.py          # Markov Chain: peluang eksak
  records.py              # olah riwayat: pity, status guaranteed, 50/50
  importers.py            # baca/tulis UIGF v4, dataset anonim
  fetcher.py              # ambil riwayat dari API resmi (aman, host dibatasi)
  simulate.py             # simulasi Monte Carlo -> dataset sintetis
  dataset.py              # muat data asli dari data/real/
  models.py               # 4 algoritma + baseline, fitur, metrik evaluasi
  demo.py                 # data contoh
scripts/
  get_zzz_url.ps1         # script PowerShell pengambil URL riwayat (Windows)
  train_models.py         # latih & evaluasi semua model -> models/
models/                   # model terlatih + report.json (dibaca aplikasi)
data/real/                # tempat dataset asli anonim (.csv)
tests/                    # 86+ test otomatis (pytest)
docs/                     # bahan laporan
```

## Metodologi singkat

- **Dua tugas klasifikasi** dengan fitur yang diketahui *sebelum* pull
  (`pity`, `pity_ratio`, `guaranteed`, `is_wengine`):
  1. `next_pull`: apakah pull berikutnya S?
  2. `next_10`: apakah dapat S dalam 10 pull berikutnya (satu kali ten-pull)?
- **Data:** simulasi Monte Carlo 400 akun dari parameter resmi, ditambah data
  asli pemain (anonim) untuk pengujian. Pembagian train/test **per akun**
  (GroupShuffleSplit & GroupKFold) supaya tidak ada kebocoran data.
- **Pembanding:** baseline "selalu tebak tidak S" (membuktikan jebakan akurasi)
  dan Markov Chain (peluang teoretis).

Penjelasan lengkap untuk laporan ada di [`docs/LAPORAN.md`](docs/LAPORAN.md).

## Menambah data asli

1. Pemain membuka aplikasi → Import Data → ambil riwayat.
2. Klik **Dataset anonim (.csv)**. File ini tanpa UID, nama item, dan waktu.
3. Simpan file ke `data/real/`, lalu jalankan `python scripts/train_models.py`.
4. Commit `data/real/*.csv` dan folder `models/`.

## Kalau aturan gacha berubah

Semua angka ada di `zzzgacha/config.py`: rate, hard pity, soft pity, peluang
rate-up, dan daftar S standar. Setelah mengubahnya, latih ulang model dengan
`python scripts/train_models.py` dan jalankan `python -m pytest -q`.
