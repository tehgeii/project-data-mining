# Sumber file tugas (proposal, laporan, slide)

File `.docx` dan `.pptx` di `docs/tugas/` **dibuat dari kode** di folder ini, jadi
isinya bisa diubah dan dibuat ulang tanpa merusak format (daftar isi, nomor halaman,
penomoran tabel/gambar).

| File | Isi |
|---|---|
| `gen.js` | Isi proposal UTS dan laporan akhir UAS (satu file, dua mode) |
| `slides.js` | Isi slide UTS dan UAS beserta catatan pembicara |
| `lib.js` | Format dokumen: Times New Roman 12, spasi 1,5, A4, margin kiri 4 cm dan sisi lain 3 cm |
| `pages.py` | Menghitung nomor halaman untuk Daftar Isi, Daftar Tabel, dan Daftar Gambar |
| `fig/` | Grafik, tangkapan layar aplikasi, dan logo Udinus |

## Membuat ulang

Butuh Node.js, LibreOffice, dan poppler-utils (`pdfinfo`, `pdftotext`).

```bash
cd docs/tugas/sumber
bash build.sh             # keempat file
bash build.sh proposal    # hanya proposal UTS (pilihan lain: laporan, slide)
```

Contoh perubahan yang sering dibutuhkan:

- **Link YouTube:** cari `isi tautan video` di `gen.js` (bagian Lampiran).
- **Nama, NIM, peran anggota:** konstanta `TEAM` di `gen.js` dan `slides.js`.
- **Tanggal kata pengantar:** cari `Semarang, Oktober 2026` di `gen.js`.
