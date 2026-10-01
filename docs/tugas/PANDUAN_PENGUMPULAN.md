# Panduan Pengumpulan UTS & UAS: Kelompok 6 (A11.4502)

Disusun dari kontrak perkuliahan Bapak Ardytha Luthfiarta, M.Kom, MCS.

## Isi folder ini

| File | Untuk | Keterangan |
|---|---|---|
| `UTS_Proposal_Kelompok6_A11.4502.docx` | **UTS** | Proposal Proyek Akhir (Bab I–III, jadwal, pustaka) |
| `UTS_Slide_Kelompok6_A11.4502.pptx` | **UTS** | 17 slide + catatan pembicara (±20 menit) |
| `UAS_Laporan_Akhir_Kelompok6_A11.4502.docx` | **UAS** | Laporan Akhir (Bab I–V, pustaka, lampiran) |
| `UAS_Slide_Kelompok6_A11.4502.pptx` | **UAS** | 21 slide + catatan pembicara (±25 menit) |

> Proposal UTS sudah memuat "Hasil Awal (Prototipe)" karena aplikasinya sudah jadi.
> Sebelum dikumpulkan, baca sekali lagi dan sesuaikan kalimat yang kurang pas.

## Data wajib di Google Form (harus sama persis untuk SEMUA anggota)

| Isian | Nilai |
|---|---|
| Mata kuliah | Penambangan Data |
| Kode kelas | **A11.4502** |
| Nama ketua kelompok | **Syafiq Yahya** (salin-tempel, jangan diketik ulang) |
| Nomor urut kelompok | **6** (angka saja, bukan 06 atau "Kel. 6") |
| Jenis unggahan | UTS → **Proposal (UTS)** · UAS → **Laporan Akhir (UAS)** |
| NIM & nama lengkap | milik masing-masing, cek tidak ada salah ketik |

Link form: https://bit.ly/ProyekAkhirGanjil26-27

## Langkah untuk SETIAP anggota (pengumpulan individu)

1. Upload file `.docx` dan `.pptx` ke **Google Drive akun sendiri**.
2. Klik kanan file → **Share** → **General access: Anyone with the link (Viewer)**.
   Kalau mau dibatasi, tambahkan email `Ardytha.Luthfiarta@dsn.dinus.ac.id`.
3. Salin link **file**, bukan link folder.
4. Upload video presentasi ke **YouTube akun sendiri**, visibilitas **Unlisted/Public** (bukan Private),
   durasi **minimal 15 menit**.
5. Isi Google Form dengan akun sendiri: link docx, link pptx, link YouTube.
6. Setelah submit, cek email konfirmasi (aktifkan *auto response* kalau ada pilihan).
7. **Deadline: H-1 jadwal UTS/UAS di Siadin**, paling lambat sebelum tanda tangan berita acara.

## Syarat lain dari kontrak

- Kehadiran minimal 75%, wajib hadir dan tanda tangan berita acara UTS/UAS (toleransi telat 30 menit).
- Semua tugas wajib dikumpulkan.
- Wajib menyelesaikan Coursera *IBM Machine Learning* sampai dapat sertifikat Completion.

## Naskah video (minimal 15 menit)

Catatan pembicara untuk setiap slide sudah ada di file `.pptx`
(PowerPoint → **View → Notes**). Pembagian waktu yang disarankan:

| Bagian | Slide UTS | Slide UAS | Durasi |
|---|---|---|---|
| Pembukaan & tim | 1–2 | 1–2 | 2 menit |
| Latar belakang, masalah, batasan, tujuan | 3–5 | 3–4 | 4 menit |
| Aturan banner & landasan teori | 6–9 | 5–8 | 6 menit |
| Metodologi & data | 10–13 | 9–11 | 5 menit |
| Aplikasi (demo langsung) | 14 | 12–13 | 3 menit |
| Hasil & pembahasan | 15 | 14–19 | 2 (UTS) / 8 (UAS) menit |
| Jadwal / kesimpulan & penutup | 16–17 | 20–21 | 2 menit |
| **Total** | | | **±24 menit (UTS) / ±30 menit (UAS)** |

Tips rekaman:
- Rekam layar dengan OBS Studio (gratis) atau Zoom (record to computer), kamera di pojok.
- Saat bagian aplikasi, **demo langsung** di https://project-data-mining-zzz.streamlit.app
  (Import Data → Pakai data contoh → Kalkulator → Perbandingan Algoritma).
- Karena setiap anggota mengunggah ke YouTube masing-masing, video yang sama boleh
  diunggah ulang oleh tiap anggota. Pastikan dulu ke dosen kalau ragu.

## Pertanyaan yang mungkin ditanyakan dosen (dan jawabannya)

**Kenapa memakai data simulasi?**
Satu akun asli hanya punya ratusan pull dan beberapa S-Rank, terlalu sedikit untuk melatih.
Simulasi dibangkitkan dari aturan resmi, lalu model diuji di data asli dan hasilnya konsisten.

**Kenapa akurasinya sama semua di tugas A?**
S-Rank hanya ±1,7%, sehingga tebakan "selalu tidak S" pun benar 98%. Ini contoh jebakan akurasi
pada data tidak seimbang. Karena itu kami memakai Balanced Accuracy, F1, ROC-AUC, dan Log Loss,
serta tugas B yang lebih seimbang.

**Algoritma mana yang terbaik?**
Decision Tree, Random Forest, XGBoost, dan KNN setara (±91% simulasi, ±93% data asli).
Decision Tree sedikit unggul di F1 dan Log Loss, dan aturannya paling mudah dijelaskan.

**Kenapa Naive Bayes paling rendah?**
Naive Bayes mengasumsikan fitur saling bebas dan berdistribusi normal. Padahal `pity` dan
`pity_ratio` sangat berkaitan, dan peluang S melonjak tajam setelah soft pity (tidak berbentuk lonceng).

**Apakah script PowerShell aman?**
Script hanya membaca file cache game, tidak mengubah apa pun dan tidak mengirim data.
authkey hanya bisa membaca riwayat gacha, kedaluwarsa ±24 jam, dan tidak disimpan aplikasi.
