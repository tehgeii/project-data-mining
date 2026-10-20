# Sumber file tugas (proposal, laporan, slide)

File `.docx` dan `.pptx` di `docs/tugas/` **dibuat dari kode** di folder ini, jadi
isinya bisa diubah dan dibuat ulang tanpa merusak format (daftar isi, nomor halaman,
penomoran tabel/gambar).

| File | Isi |
|---|---|
| `gen.js` | Isi proposal UTS dan laporan akhir UAS (satu file, dua mode) |
| `slides.js` | Isi slide UTS dan UAS beserta catatan pembicara |
| `rep.js` | Membaca `models/report.json` dan memformat angka gaya Indonesia (0,9108 · 1.209) untuk tabel dan teks hasil |
| `lib.js` | Format dokumen: Times New Roman 12, spasi 1,5, A4, margin kiri 4 cm dan sisi lain 3 cm |
| `pages.py` | Menghitung nomor halaman untuk Daftar Isi, Daftar Tabel, dan Daftar Gambar |
| `figs.py` | Membuat ulang semua grafik hasil model (akurasi, data asli, metrik, confusion matrix, kurva, feature importance, soft pity) dari `models/report.json` |
| `fig/` | Grafik, tangkapan layar aplikasi, dan logo Udinus |

## Membuat ulang

Butuh Node.js, LibreOffice, dan poppler-utils (`pdfinfo`, `pdftotext`).

```bash
cd docs/tugas/sumber
bash build.sh             # proposal & laporan (.docx + .pdf) dan kedua slide
bash build.sh proposal    # hanya proposal UTS (pilihan lain: laporan, slide)
```

Kalau **data asli bertambah** (file baru di `data/real/`):

1. `python scripts/train_models.py` (dari folder utama proyek).
2. `python3 docs/tugas/sumber/figs.py` untuk memperbarui grafik.
3. Ambil ulang tangkapan layar `fig/app_perb_test.png` (halaman Perbandingan Algoritma, tugas 10 pull)
   dan `fig/app_kalkulator.png` (tabel prediksi model ikut berubah).
4. `bash build.sh`. Tabel dan angka hasil di `gen.js` dan `slides.js` dibaca otomatis dari
   `models/report.json` lewat `rep.js`, jadi tidak perlu disalin manual. Tetap baca ulang
   kalimat pembahasan: kalau urutan algoritma berubah, kalimatnya mungkin perlu disesuaikan.

Contoh perubahan yang sering dibutuhkan:

- **Link YouTube:** cari `isi tautan video` di `gen.js` (bagian Lampiran).
- **Nama, NIM, peran anggota:** konstanta `TEAM` di `gen.js` dan `slides.js`.
- **Tanggal kata pengantar:** cari `Semarang, Oktober 2026` di `gen.js`.
