# Panduan Pengumpulan UTS & UAS: Kelompok 6 (A11.4502)

Disusun dari kontrak perkuliahan Bapak Ardytha Luthfiarta, M.Kom, MCS.

## Isi folder ini

| File | Untuk | Keterangan |
|---|---|---|
| `UTS_Proposal_Kelompok6_A11.4502.docx` | **UTS** | Proposal Proyek Akhir (Bab I–III, jadwal, pustaka) |
| `UTS_Slide_Kelompok6_A11.4502.pptx` | **UTS** | 18 slide + catatan pembicara (±25 menit) |
| `UAS_Laporan_Akhir_Kelompok6_A11.4502.docx` | **UAS** | Laporan Akhir (Bab I–V, pustaka, lampiran) |
| `UAS_Slide_Kelompok6_A11.4502.pptx` | **UAS** | 26 slide + catatan pembicara (±38 menit) |
| `sumber/` | (tidak dikumpulkan) | Kode pembuat keempat file di atas. Lihat `sumber/README.md` |

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
| Latar belakang, alasan memakai data mining, masalah (UTS: + batasan & tujuan) | 3–6 | 3–5 | 5 menit |
| Aturan banner & landasan teori | 7–10 | 6–9 | 6 menit |
| Metodologi & data | 11–14 | 10–12 | 5 menit |
| Aplikasi (demo langsung) | 15 | 13–14 | 3 menit |
| Hasil & pembahasan (UAS: termasuk grid search, uji signifikansi, dan pola soft pity) | 16 | 15–24 | 2 (UTS) / 15 (UAS) menit |
| Jadwal / kesimpulan & penutup | 17–18 | 25–26 | 2 menit |
| **Total** | | | **±25 menit (UTS) / ±38 menit (UAS)** |

Tips rekaman:
- Rekam layar dengan OBS Studio (gratis) atau Zoom (record to computer), kamera di pojok.
- Saat bagian aplikasi, **demo langsung** di https://project-data-mining-zzz.streamlit.app
  (Import Data → Pakai data contoh → Kalkulator → Perbandingan Algoritma).
- Karena setiap anggota mengunggah ke YouTube masing-masing, video yang sama boleh
  diunggah ulang oleh tiap anggota. Pastikan dulu ke dosen kalau ragu.

## Pertanyaan yang mungkin ditanyakan dosen (dan jawabannya)

Pertanyaan yang paling mungkin menjebak ditaruh paling atas.

**Kalau peluangnya sudah ada rumusnya, kenapa perlu machine learning?**
Rumus resminya tidak lengkap. HoYoverse hanya mengumumkan rate dasar, rate gabungan, hard pity,
dan peluang rate-up; **soft pity tidak diumumkan** (kapan mulai dan seberapa cepat peluang naik),
dan perkiraan komunitas pun berbeda-beda. Pola itu hanya bisa digali dari data riwayat pemain.
Buktinya: di data asli, laju S Agent hampir nol sampai pull ke-73 lalu melonjak jadi 14% mulai
pull ke-74, dan Decision Tree yang dilatih **hanya dengan data asli** memisahkan data di pity ±65
tanpa pernah diberi tahu soal soft pity. Masalah ini termasuk klasifikasi + estimasi peluang
(supervised learning, label: dapat S atau tidak).

**Data latihnya kan simulasi dari rumus kalian sendiri? Berarti model cuma belajar ulang rumus?**
Benar, dan itu ditulis terbuka di bagian keterbatasan. Karena itu ada dua hal yang memakai data
asli saja: (1) keenam algoritma dilatih dan diuji hanya dengan data asli (1.425 baris), dan
(2) pola soft pity dihitung langsung dari data asli. Hasil keduanya konsisten dengan model.

**Kenapa akurasi di data asli (±92%) lebih tinggi daripada di simulasi (±91%)?**
Kelas positif di data asli lebih sedikit (13,5% vs 16,6%), jadi lebih mudah ditebak. Baseline-nya
juga naik (86,5% vs 83,4%). Kalau dibandingkan dengan baseline, keunggulan model terbaik
7,7 poin di simulasi dan 6,0 poin di data asli. Akurasi dari dua data yang proporsi kelasnya berbeda
tidak bisa dibandingkan langsung.

**Jadi algoritma mana yang paling bagus di data asli?**
Di eksperimen data asli, Random Forest (92,35%) dan Decision Tree (92,29%) tertinggi, tetapi
**uji t berpasangan terkoreksi** menunjukkan selisih Random Forest dengan kelima algoritma lain tidak signifikan
(p = 0,19–0,80). Di simulasi, Decision Tree, Random Forest, XGBoost, dan KNN juga tidak berbeda
nyata. Jadi jawabannya: model pohon (dan KNN) **setara terbaik**, jangan bilang satu algoritma "jauh
lebih baik". Kelebihan Decision Tree: aturannya paling mudah dibaca.

**Apa itu uji signifikansi, dan kenapa pakai versi "terkoreksi"?**
Uji signifikansi memeriksa apakah selisih akurasi dua model nyata atau hanya kebetulan. Kami
membandingkan akurasi setiap model di kelima fold dengan model terbaik. Uji t biasa terlalu mudah
menyatakan "berbeda" pada cross-validation karena data latih antar-fold saling tumpang tindih,
sehingga dipakai koreksi Nadeau & Bengio (2003) yang memperbesar varians. Hasilnya: di simulasi,
Naive Bayes dan Logistic Regression **nyata lebih rendah** (p < 0,001); di data asli, hanya baseline
yang nyata lebih rendah (p = 0,003), karena datanya baru 25 siklus pity.

**Kenapa tidak memakai SMOTE atau oversampling untuk data tidak seimbang?**
Yang dicari adalah angka peluang yang tepat. Menambah data buatan kelas minoritas akan menggeser
peluang tersebut (model jadi terlalu optimis). Ketidakseimbangan kami tangani dengan memilih
metrik yang tepat: Balanced Accuracy, F1, ROC-AUC, Log Loss, dan Brier Score.

**Datanya cuma 3 akun, cukup?**
Jumlah barisnya sudah memenuhi syarat (1.751 pull, 1.425 baris setelah dibersihkan), tetapi
isinya baru 28 S-Rank dan 25 siklus pity, dan baris dalam satu siklus saling berkaitan. Karena
itu simpangan bakunya masih ±1,0–10,2%, dan uji signifikansi di data asli belum bisa membedakan
antaralgoritma. Ini keterbatasan yang kami tulis; solusinya menambah akun (minimal 5, idealnya 10+).

**Hyperparameter-nya dipilih bagaimana?**
Dengan **grid search** (`GridSearchCV`): setiap algoritma diberi beberapa pilihan nilai (misalnya
k = 5, 15, 31, 51, 101, 201 untuk KNN), lalu dipilih yang akurasinya tertinggi. Supaya tidak bocor,
grid search memakai **100 akun simulasi tambahan** yang tidak dipakai untuk evaluasi. Di eksperimen
data asli, grid search diulang **di dalam data latih setiap fold** (*nested cross-validation*), jadi
data uji tidak pernah ikut memilih pengaturan. Hasilnya: Naive Bayes paling terbantu, model pohon
hampir tidak berubah, dan di data asli yang kecil hasilnya bisa naik atau turun karena pengaturan
terbaik di data latih belum tentu terbaik di data uji.

**Apakah aplikasi ini bisa meramal kapan dapat S? Apakah tidak mendorong orang berjudi?**
Tidak meramal hasil, karena setiap pull tetap acak; aplikasi hanya memperkirakan **peluang**.
Justru membantu pemain merencanakan pengeluaran secara realistis, misalnya mengetahui rata-rata
dan kemungkinan terburuk jumlah pull sebelum menghabiskan mata uang permainan.

**`pity_ratio` kan turunan dari `pity`, kenapa dipakai dua-duanya?**
`pity_ratio` membuat dua banner sebanding (hard pity 90 vs 80). Model pohon cukup memilih salah
satu. Untuk Naive Bayes, dua fitur yang saling berkaitan memang melanggar asumsi "saling bebas",
dan itu salah satu alasan Naive Bayes tertinggal dari model pohon.

**Datasetnya berapa baris? (syarat: tabel minimal 500–1.000 baris)**
Data asli 1.751 pull (±1.400 baris setelah dibersihkan) dari 3 akun, ditambah data simulasi
±314.000 baris. Keenam algoritma juga sudah dilatih dan diuji **hanya dengan data asli**
(1.425 baris, 5-fold per siklus pity): Random Forest tertinggi (±92,4%), tetapi selisihnya
dengan algoritma lain belum signifikan.

**Kenapa KNN dan XGBoost anjlok di salah satu fold data asli?**
Di fold itu, data latih hanya memuat **satu** siklus Agent berstatus guaranteed, dan siklus itu
kebetulan dapat S cepat (pull ke-38). KNN dan XGBoost belajar pola keliru "kalau guaranteed, S
segera keluar", lalu salah menebak "dapat S" di dua siklus guaranteed lain yang ternyata panjang
(S baru keluar di pull ke-76 dan ke-78). Decision Tree dan Random Forest tidak terpengaruh karena
aturan daun minimal (min_samples_leaf) mencegah cabang yang hanya didukung sedikit data. Ini contoh
overfitting pada fitur yang tidak relevan ketika data sedikit; menurut aturan game, guaranteed hanya
menentukan S mana yang keluar, bukan kapan.

**Kenapa memakai data simulasi?**
Satu akun asli hanya punya ratusan pull dan beberapa S-Rank, terlalu sedikit untuk melatih.
Simulasi dibangkitkan dari aturan resmi ditambah estimasi soft pity, lalu model diuji di data asli
dan hasilnya konsisten. Lihat juga pertanyaan "data latihnya kan simulasi" di atas.

**Kenapa akurasinya sama semua di tugas A?**
S-Rank hanya ±1,7%, sehingga tebakan "selalu tidak S" pun benar 98%. Ini contoh jebakan akurasi
pada data tidak seimbang. Karena itu kami memakai Balanced Accuracy, F1, ROC-AUC, dan Log Loss,
serta tugas B yang lebih seimbang.

**Algoritma mana yang terbaik?**
Decision Tree, Random Forest, XGBoost, dan KNN setara dan tidak berbeda nyata (±91% simulasi,
±92% data asli). Decision Tree sedikit unggul di ROC-AUC dan Log Loss, dan aturannya
paling mudah dijelaskan.

**Kenapa Naive Bayes dan Logistic Regression lebih rendah?**
Keduanya nyata lebih rendah di simulasi (p < 0,001) walaupun hyperparameter-nya sudah dipilih dengan
grid search. Logistic Regression hanya bisa membentuk kurva sigmoid yang halus, sehingga tidak bisa
meniru lonjakan tajam setelah soft pity. Naive Bayes mengasumsikan fitur saling bebas dan berdistribusi normal. Padahal `pity` dan
`pity_ratio` sangat berkaitan, dan peluang S melonjak tajam setelah soft pity (tidak berbentuk lonceng).

**Apakah script PowerShell aman?**
Script hanya membaca file cache game, tidak mengubah apa pun dan tidak mengirim data.
authkey hanya bisa membaca riwayat gacha, kedaluwarsa ±24 jam, dan tidak disimpan aplikasi.
