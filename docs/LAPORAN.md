# Bahan Laporan: Perbandingan Algoritma Klasifikasi untuk Memprediksi S-Rank pada Sistem Gacha Zenless Zone Zero

Dokumen ini berisi bahan yang bisa langsung dipakai untuk menyusun laporan dan
slide presentasi. Angka hasil diambil dari `models/report.json`
(seed 42, 400 akun simulasi, 2 akun asli). Kalau model dilatih ulang, angka di aplikasi
(halaman **Perbandingan Algoritma**) selalu yang terbaru.

---

## 1. Latar belakang

*Gacha* adalah mekanisme undian berhadiah di dalam game. Di Zenless Zone Zero
(ZZZ), pemain melakukan *pull* (undian) untuk mendapatkan karakter (Agent) dan
senjata (W-Engine). Hadiah paling langka adalah **S-Rank**. Peluangnya kecil,
tetapi ada sistem **pity**: makin lama tidak mendapat S, peluangnya makin besar,
dan pada batas tertentu (**hard pity**) S pasti didapat.

Pemain sering bertanya: *"Aku sudah di pity sekian, berapa peluangku dapat S?"*
Proyek ini menjawab pertanyaan itu dengan dua pendekatan:

1. **Model probabilistik (Markov Chain)** berdasarkan aturan resmi.
2. **Algoritma data mining** yang belajar dari data pull, lalu dibandingkan
   akurasinya.

## 2. Rumusan masalah

1. Berapa peluang pemain mendapatkan S / S rate-up dalam N pull, dilihat dari
   pity dan status guaranteed-nya?
2. Dari Naive Bayes, KNN, Logistic Regression, Decision Tree, Random Forest, dan XGBoost,
   algoritma mana yang paling akurat memprediksi keluarnya S?
3. Apakah algoritma data mining mampu "menemukan" mekanisme soft pity dari data?

## 3. Aturan banner

| Parameter | Agent Terbatas | W-Engine Terbatas | Sumber |
|---|---|---|---|
| Rate dasar S | 0,6% | 1,0% | detail banner resmi |
| Rate gabungan (termasuk pity) | 1,6% | 2,0% | detail banner resmi |
| Hard pity | 90 | 80 | detail banner resmi |
| Peluang S rate-up | 50% | 75% | detail banner resmi |
| Soft pity mulai | pull ke-74 | pull ke-65 | **estimasi komunitas** |
| Kenaikan per pull setelah soft pity | ±5,30% | ±5,52% | **dikalibrasi** (lihat 4.1) |

Kalau kalah 50/50 (atau 75/25), S berikutnya **pasti** rate-up (guaranteed).

## 4. Metodologi

### 4.1 Model peluang per pull (hazard)

Misalkan `n` adalah nomor pull sejak S terakhir (1..hard pity). Peluang S pada
pull ke-`n` (dengan syarat belum dapat S sebelumnya):

```
h(n) = p                          jika n < soft
h(n) = p + step * (n - soft + 1)  jika n >= soft   (maksimal 1)
h(hard) = 1
```

Nilai `step` tidak diumumkan resmi, jadi dicari dengan **metode biseksi**
supaya rata-rata pull per S = 1 / rate gabungan resmi (62,5 pull untuk Agent,
50 pull untuk W-Engine). Dengan cara ini model konsisten dengan angka resmi.

### 4.2 Markov Chain

State = (pity, guaranteed). Dari setiap state:
- dengan peluang `h(pity+1)` keluar S:
  - guaranteed → dapat S rate-up (selesai)
  - tidak guaranteed → rate-up dengan peluang 50%/75%, atau kalah → state (0, guaranteed)
- selain itu → state (pity+1, guaranteed sama)

Distribusi peluang di tiap state dihitung maju pull demi pull, sehingga
diperoleh peluang **eksak** (bukan perkiraan simulasi) untuk "dapat S rate-up
dalam N pull". Hasilnya diverifikasi dengan simulasi Monte Carlo 400.000 pull
(lihat `tests/test_probability.py`).

### 4.3 Dataset

| Sumber | Keterangan |
|---|---|
| **Simulasi Monte Carlo** | 400 akun virtual, masing-masing 80–700 pull per banner, dibangkitkan dari model 4.1 (seed 42). Total ±314.000 pull. |
| **Data asli** | 2 akun pemain (anggota kelompok dan teman), dalam bentuk anonim (tanpa UID, nama item, dan waktu): 1.441 pull, 22 S. Setelah segmen pertama dibuang: ±1.200 titik keputusan. **Tidak dipakai untuk melatih**, hanya untuk menguji. |

Alasan memakai simulasi: satu akun asli hanya punya ratusan pull dengan
beberapa S saja, terlalu sedikit untuk melatih model. Keterbatasan ini ditulis
terbuka di bagian 7.

**Pembersihan data asli:**
- hanya banner Agent dan W-Engine terbatas (standar dan Bangboo dibuang);
- duplikat berdasarkan `id` dibuang, lalu data diurutkan kronologis;
- **segmen pertama** (pull sebelum S pertama yang tercatat) dibuang karena
  server hanya menyimpan riwayat beberapa bulan terakhir, jadi pity-nya bisa
  tidak lengkap;
- riwayat yang melebihi hard pity tanpa S ditolak karena tidak masuk akal.

### 4.4 Fitur dan target

Setiap baris = satu titik keputusan **sebelum** sebuah pull (tidak ada
informasi masa depan yang bocor).

| Fitur | Arti |
|---|---|
| `pity` | pity yang terlihat di game (0..hard pity − 1) |
| `pity_ratio` | pity / hard pity, supaya dua banner sebanding |
| `guaranteed` | 1 kalau S berikutnya pasti rate-up |
| `is_wengine` | 1 = banner W-Engine, 0 = banner Agent |

Dua tugas klasifikasi biner:
- **Tugas A (`next_pull`)**: apakah pull berikutnya menghasilkan S? (kelas positif ±1,7%)
- **Tugas B (`next_10`)**: apakah dapat minimal satu S dalam 10 pull berikutnya? (kelas positif ±16,6%)

### 4.5 Algoritma

| Algoritma | Pengaturan utama | Alasan dipilih |
|---|---|---|
| Naive Bayes | GaussianNB | materi kuliah; model probabilistik paling sederhana |
| KNN | StandardScaler + k = 101 tetangga | materi kuliah; menebak dari pull lain yang mirip |
| Logistic Regression | StandardScaler + LR | model linear sederhana, pembanding dasar |
| Decision Tree | max_depth 6, min_samples_leaf 50 | mudah dijelaskan, aturannya bisa dibaca |
| Random Forest | 150 pohon, max_depth 8 | ensemble bagging, lebih stabil dari satu pohon |
| XGBoost | 300 pohon, max_depth 4, learning rate 0,05 | ensemble boosting, umumnya kuat di data tabular |
| *Baseline: selalu tebak "tidak S"* | DummyClassifier | membuktikan jebakan akurasi |
| *Markov Chain (teori)* | rumus 4.1 | batas atas: peluang sebenarnya |

### 4.6 Evaluasi

- **Pembagian data per akun** (GroupShuffleSplit 80/20 dan GroupKFold 5-fold):
  pull dari akun yang sama tidak boleh ada di train sekaligus test, karena
  pull berurutan saling berkaitan.
- Metrik:
  - **Accuracy**: proporsi tebakan benar (metrik utama sesuai arahan dosen);
  - **Balanced Accuracy**: rata-rata recall kedua kelas, tidak tertipu kelas mayoritas;
  - **Precision / Recall / F1**: kualitas tebakan pada kelas "dapat S";
  - **ROC-AUC**: kemampuan membedakan kelas di semua threshold;
  - **Log Loss** dan **Brier Score**: seberapa tepat *angka peluang* yang dihasilkan.

## 5. Hasil (cross-validation 5-fold, rata-rata)

### Tugas A: S di pull berikutnya

| Model | Accuracy | Balanced Acc. | F1 | ROC-AUC | Log Loss |
|---|---|---|---|---|---|
| Baseline: selalu "tidak S" | 0,9828 | 0,5000 | 0,0000 | 0,5000 | 0,2768 |
| Markov Chain (teori) | 0,9830 | 0,5184 | 0,0699 | 0,7890 | 0,0662 |
| Naive Bayes | 0,9829 | 0,5007 | 0,0030 | 0,7563 | 0,0792 |
| KNN | 0,9829 | 0,5150 | 0,0574 | 0,7728 | 0,0985 |
| Logistic Regression | 0,9828 | 0,5000 | 0,0000 | 0,7578 | 0,0776 |
| Decision Tree | **0,9830** | 0,5136 | 0,0526 | **0,7889** | **0,0663** |
| Random Forest | **0,9830** | 0,5151 | 0,0579 | 0,7877 | **0,0663** |
| XGBoost | 0,9829 | **0,5162** | **0,0618** | 0,7862 | 0,0664 |

### Tugas B: S dalam 10 pull berikutnya

| Model | Accuracy | Balanced Acc. | F1 | ROC-AUC | Log Loss |
|---|---|---|---|---|---|
| Baseline: selalu "tidak S" | 0,8337 | 0,5000 | 0,0000 | 0,5000 | 2,6804 |
| Markov Chain (teori) | 0,9108 | 0,7601 | 0,6658 | 0,8110 | 0,2811 |
| Naive Bayes | 0,8572 | 0,7569 | 0,5855 | 0,7810 | 0,3844 |
| KNN | 0,9107 | 0,7598 | 0,6654 | 0,8072 | 0,2866 |
| Logistic Regression | 0,8888 | 0,6675 | 0,5010 | 0,7895 | 0,3625 |
| Decision Tree | **0,9108** | **0,7614** | **0,6671** | **0,8117** | **0,2814** |
| Random Forest | **0,9108** | 0,7612 | 0,6669 | 0,8102 | 0,2816 |
| XGBoost | **0,9108** | 0,7604 | 0,6661 | 0,8098 | 0,2816 |

### Uji di data asli pemain (2 akun, model dilatih hanya dengan data simulasi)

Pengujian ini menjawab pertanyaan: *apakah model yang dilatih dari simulasi
tetap akurat untuk pemain sungguhan?*

| Model | Tugas A Accuracy | Tugas B Accuracy | Tugas B Balanced Acc. | Tugas B F1 | Tugas B Log Loss |
|---|---|---|---|---|---|
| Baseline: selalu "tidak S" | 0,9855 | 0,8660 | 0,5000 | 0,0000 | 2,1597 |
| Markov Chain (teori) | 0,9863 | 0,9355 | 0,7801 | 0,7023 | 0,2312 |
| Naive Bayes | 0,9855 | 0,8751 | **0,7896** | 0,5908 | 0,2821 |
| KNN | **0,9863** | **0,9347** | 0,7770 | **0,6973** | **0,2287** |
| Logistic Regression | 0,9855 | 0,9115 | 0,6724 | 0,5114 | 0,2733 |
| Decision Tree | **0,9863** | 0,9330 | 0,7709 | 0,6873 | 0,2316 |
| Random Forest | **0,9863** | 0,9330 | 0,7735 | 0,6897 | 0,2317 |
| XGBoost | **0,9863** | 0,9338 | 0,7740 | 0,6923 | 0,2316 |

Data asli: Tugas A 1.245 baris (18 S), Tugas B 1.209 baris (162 positif).

### Eksperimen kedua: latih DAN uji hanya dengan data asli

Untuk memastikan hasil tidak bergantung pada data simulasi, keenam algoritma
juga dilatih dan diuji **hanya dengan data asli** (Tugas B: 1.209 baris, 162
positif; sudah memenuhi ketentuan dataset tabel minimal 500–1.000 baris).
Karena data asli hanya dari 2 akun, data dibagi per **siklus pity** (20 siklus,
GroupKFold 5-fold): siklus pity saling bebas karena peluang selalu kembali ke
awal setelah dapat S.

| Model | Accuracy | Balanced Acc. | F1 | ROC-AUC | Log Loss |
|---|---|---|---|---|---|
| Baseline: selalu "tidak S" | 0,8657 ± 0,0289 | 0,5000 | 0,0000 | 0,5000 | 2,1651 |
| Markov Chain (teori) | 0,9368 ± 0,0318 | 0,7854 | 0,6964 | 0,8205 | 0,2281 |
| Naive Bayes | 0,8788 ± 0,0299 | **0,8317** | 0,6178 | 0,8964 | 0,3690 |
| KNN | 0,8742 ± 0,0224 | 0,5250 | 0,0800 | 0,8609 | 0,4975 |
| Logistic Regression | 0,9069 ± 0,0429 | 0,7348 | 0,5335 | 0,8998 | 0,2879 |
| Decision Tree | **0,9310 ± 0,0291** | 0,7835 | **0,6819** | 0,9021 | 0,3521 |
| Random Forest | 0,9299 ± 0,0264 | 0,7696 | 0,6720 | **0,9258** | **0,2321** |
| XGBoost | 0,9222 ± 0,0348 | 0,7678 | 0,6370 | 0,9257 | 0,2495 |

- Decision Tree tetap tertinggi, urutan model pohon sama seperti di simulasi.
- Naive Bayes akurasinya rendah tetapi Balanced Accuracy tertinggi (recall ±0,76).
- KNN turun hampir ke baseline karena k = 101 terlalu besar untuk ±970 baris latih.
- Simpangan baku ±2–4% (simulasi ±0,2%) karena datanya jauh lebih sedikit.

## 6. Pembahasan

1. **Jebakan akurasi (Tugas A).** Model yang selalu menebak "tidak dapat S"
   sudah mendapat akurasi 98,28% karena S sangat jarang. Semua model punya
   akurasi hampir sama (±98,3%), jadi akurasi saja **tidak bisa** membedakan
   model yang bagus dan yang tidak berguna. Balanced Accuracy, F1, ROC-AUC,
   dan Log Loss memperlihatkan perbedaannya.
2. **Tugas B lebih bermakna.** Ketika kelasnya lebih seimbang (±16,6% positif),
   perbedaan antar-algoritma terlihat jelas: model berbasis pohon (Decision
   Tree, Random Forest, XGBoost) dan KNN mencapai akurasi ±91,1%, di atas
   Logistic Regression (±88,9%), Naive Bayes (±85,7%), dan baseline (±83,4%).
3. **Model pohon menemukan soft pity sendiri.** Pada Tugas B, aturan Decision
   Tree memisahkan data di sekitar `pity_ratio ≈ 0,71–0,74` (pity ±64 untuk
   Agent, ±57 untuk W-Engine). Titik ini kira-kira 10 pull sebelum soft pity,
   tepat saat jendela "10 pull ke depan" mulai menyentuh soft pity. Model ini
   tidak pernah diberi tahu soal soft pity. Kurva peluangnya (halaman
   Perbandingan → Kurva peluang) juga menempel pada kurva teori Markov.
4. **Logistic Regression dan Naive Bayes kalah.** Logistic Regression hanya
   bisa membentuk kurva sigmoid yang halus, sehingga tidak bisa meniru lonjakan
   tajam setelah soft pity. Naive Bayes menganggap tiap fitur saling bebas dan
   berdistribusi normal, padahal `pity` dan `pity_ratio` sangat berkaitan dan
   peluang S tidak berbentuk lonceng, sehingga angka peluangnya paling meleset
   (Log Loss terbesar).
5. **KNN setara model pohon.** Karena fiturnya sedikit dan berulang (pity
   hanya 0–89), tetangga terdekat praktis adalah pull lain dengan pity yang
   sama, sehingga KNN meniru peluang empiris per pity. Kelemahannya: model
   menyimpan seluruh data latih dan prediksinya paling lambat.
6. **Fitur `guaranteed` hampir tidak berpengaruh** (feature importance ≈ 0).
   Ini benar secara aturan game: guaranteed hanya menentukan *S mana* yang
   keluar, bukan *kapan* S keluar.
7. **Terbukti di data asli.** Urutan hasil di data 2 akun asli sama dengan
   di simulasi: KNN ±93,5% dan model pohon ±93,3%, Logistic Regression ±91,1%,
   Naive Bayes ±87,5%, baseline ±86,6%, dan Markov (teori) ±93,5%. Artinya asumsi soft pity yang dipakai
   simulasi cocok dengan perilaku gacha sungguhan. Selain itu, pity dan status
   guaranteed yang dihitung aplikasi untuk akun asli **sama persis** dengan
   yang tampil di game.
8. **Tidak bergantung pada simulasi.** Saat dilatih dan diuji hanya dengan
   data asli (1.209 baris), Decision Tree (93,10%), Random Forest (92,99%), dan
   XGBoost (92,22%) tetap terbaik. KNN turun (87,42%) karena k = 101 terlalu
   besar untuk data kecil: hyperparameter harus disesuaikan dengan ukuran data.
9. **Batas atas.** Tidak ada model yang bisa jauh melampaui Markov Chain
   (teori), karena hasil gacha memang acak. Model terbaik adalah yang paling
   mendekati peluang sebenarnya.

## 7. Keterbatasan

- Titik mulai soft pity adalah estimasi komunitas, bukan angka resmi.
- Data latih utama berasal dari simulasi berdasarkan model 4.1, sehingga model
  ML "belajar ulang" asumsi tersebut. Data asli pemain dipakai untuk menguji
  apakah asumsi itu cocok dengan kenyataan, dan hasilnya cocok.
- Data asli baru 2 akun (18 S pada Tugas A), sehingga angka uji data asli
  masih bisa bergeser kalau datanya ditambah (simpangan baku eksperimen latih
  di data asli ±2–4%). Makin banyak akun, makin kuat
  kesimpulannya.
- Penentuan menang/kalah 50/50 memakai daftar S standar di `config.py`. Daftar
  ini harus diperbarui kalau HoYoverse menambah isi banner standar.
- Riwayat resmi hanya tersimpan beberapa bulan terakhir.

## 8. Kesimpulan (draf)

- Sistem pity ZZZ dapat dimodelkan secara eksak dengan Markov Chain; aplikasi
  memakainya untuk menghitung peluang dapat S/S rate-up dalam N pull.
- Untuk memprediksi keluarnya S, **Decision Tree, Random Forest, XGBoost, dan
  KNN** memberikan akurasi tertinggi (±91,1% pada tugas 10 pull di simulasi,
  ±93,3–93,5% di data asli) dan hampir sama dengan batas teoretis, sedangkan
  Naive Bayes dan Logistic Regression paling rendah. Saat dilatih dan diuji
  hanya dengan data asli (1.209 baris), Decision Tree tetap tertinggi (93,10%).
- **Accuracy tidak cukup** untuk data tidak seimbang; perlu metrik pendukung
  seperti Balanced Accuracy, F1, ROC-AUC, dan Log Loss.

## 9. Anggota kelompok

| NIM | Nama | Peran |
|---|---|---|
| A11.2024.16004 | Syafiq Yahya | Ketua kelompok, mempresentasikan hasil proyek |
| A11.2024.15851 | Dafi Hauzan A.H ([@tehgeii](https://github.com/tehgeii)) | Pengembang aplikasi, pengumpulan dan pengujian data asli |
| A11.2024.15842 | Gastiadirrijal Rafi M | Penyusun slide presentasi |
| A11.2024.15826 | Zabrina Miftah Z | Penyusun proposal proyek |
| A11.2024.15804 | Rayya Hasya Tamimi | Penyusun proposal proyek |
