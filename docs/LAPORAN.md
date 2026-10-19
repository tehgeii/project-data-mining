# Bahan Laporan: Perbandingan Algoritma Klasifikasi untuk Memprediksi S-Rank pada Sistem Gacha Zenless Zone Zero

Dokumen ini berisi bahan yang bisa langsung dipakai untuk menyusun laporan dan
slide presentasi. Angka hasil diambil dari `models/report.json`
(seed 42, 400 akun simulasi + 100 akun simulasi untuk grid search, 3 akun asli). Kalau model dilatih ulang, angka di aplikasi
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

### 1.1 Kenapa perlu data mining, bukan rumus saja?

*Machine learning* tidak diperlukan kalau (1) ada atribut yang langsung
menentukan hasil, atau (2) sudah ada pengetahuan/rumus yang pasti dan lengkap.
Pada gacha ZZZ keduanya **tidak terpenuhi**:

| Kondisi | Pada gacha ZZZ | Terpenuhi? |
|---|---|---|
| Ada atribut yang langsung menentukan hasil | Tidak ada. Pity hanya mengubah peluang; hasil tiap pull tetap acak. Kepastian hanya di hard pity. | Tidak |
| Ada rumus pasti dan lengkap | Hanya sebagian. Rate dasar, rate gabungan, hard pity, dan rate-up resmi, tetapi **soft pity tidak diumumkan** (kapan mulai dan seberapa cepat naik). Perkiraan komunitas pun berbeda-beda. | Tidak |

Bagian yang tidak diumumkan itu hanya bisa diketahui dari **data riwayat
pemain**. Masalahnya termasuk **klasifikasi + estimasi peluang** (*supervised
learning*, label: dapat S atau tidak). Markov Chain dipakai sebagai pembanding
teori, sedangkan algoritma **tidak diberi tahu** soft pity dan diuji apakah bisa
menemukannya sendiri (hasilnya: bisa, lihat bagian "Pola soft pity pada data asli").

## 2. Rumusan masalah

1. Berapa peluang pemain mendapatkan S / S rate-up dalam N pull, dilihat dari
   pity dan status guaranteed-nya?
2. Apakah pola soft pity yang tidak diumumkan resmi dapat ditemukan dari data
   riwayat gacha pemain?
3. Dari Naive Bayes, KNN, Logistic Regression, Decision Tree, Random Forest, dan XGBoost,
   algoritma mana yang paling akurat memprediksi keluarnya S?
4. Bagaimana mengevaluasi model secara tepat pada data yang sangat tidak seimbang?
5. Bagaimana menyajikannya dalam aplikasi web yang nyaman di HP maupun PC?

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
diperoleh peluang yang **eksak terhadap model** (bukan perkiraan simulasi; soft pity tetap estimasi) untuk "dapat S rate-up
dalam N pull". Hasilnya diverifikasi dengan simulasi Monte Carlo 400.000 pull
(lihat `tests/test_probability.py`).

### 4.3 Dataset

| Sumber | Keterangan |
|---|---|
| **Simulasi Monte Carlo** | 400 akun virtual, masing-masing 80–700 pull per banner, dibangkitkan dari model 4.1 (seed 42). Total ±314.000 pull. |
| **Simulasi untuk grid search** | 100 akun virtual tambahan (seed 43), ±77.000 baris. Hanya untuk memilih hyperparameter, **tidak dipakai untuk evaluasi**. |
| **Data asli** | 3 akun pemain (anggota kelompok dan teman), dalam bentuk anonim (tanpa UID, nama item, dan waktu): 1.751 pull, 28 S. Setelah segmen pertama dibuang: ±1.400 titik keputusan. Dipakai untuk **menguji** model simulasi, dan pada eksperimen kedua untuk **melatih dan menguji** hanya dengan data asli. |

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

### 4.5 Algoritma dan grid search

| Algoritma | Pengaturan tetap | Ruang pencarian grid search | Alasan dipilih |
|---|---|---|---|
| Naive Bayes | GaussianNB | var_smoothing ∈ {1e-9; 1e-6; 1e-3; 0,01; 0,1; 1} | materi kuliah; model probabilistik paling sederhana |
| KNN | StandardScaler, jarak Euclidean | k ∈ {101; 5; 15; 31; 51; 201} | materi kuliah; menebak dari pull lain yang mirip |
| Logistic Regression | StandardScaler, max_iter 2000 | C ∈ {1; 0,01; 0,1; 10} | model linear sederhana, pembanding dasar |
| Decision Tree | indeks Gini | max_depth ∈ {6; 3; 4; 8}; min_samples_leaf ∈ {50; 20; 100} | mudah dijelaskan, aturannya bisa dibaca |
| Random Forest | 150 pohon | max_depth ∈ {8; 6; 12}; min_samples_leaf ∈ {20; 10; 50} | ensemble bagging, lebih stabil dari satu pohon |
| XGBoost | 300 pohon, subsample 0,8 | max_depth ∈ {4; 3; 6}; learning_rate ∈ {0,05; 0,1} | ensemble boosting, umumnya kuat di data tabular |
| *Baseline: selalu tebak "tidak S"* | DummyClassifier | – | membuktikan jebakan akurasi |
| *Markov Chain (teori)* | rumus 4.1 | – | acuan teori; di data simulasi menjadi batas atas karena data dibangkitkan dari rumus yang sama |

Nilai pertama di setiap ruang pencarian adalah pengaturan awal (sebelum grid
search). Kalau beberapa kombinasi skornya sama persis, pengaturan awal dipertahankan.

**Grid search** memakai **100 akun simulasi tambahan** (seed 43,
77.156 baris tugas B) yang **tidak dipakai untuk evaluasi**, dengan
GroupKFold 4-fold per akun dan metrik accuracy. Pengaturan terpilih dipakai untuk
semua hasil simulasi dan model di aplikasi.

### 4.6 Evaluasi

- **Pembagian data per akun** (GroupShuffleSplit 80/20 dan GroupKFold 5-fold):
  pull dari akun yang sama tidak boleh ada di train sekaligus test, karena
  pull berurutan saling berkaitan.
- **Uji signifikansi:** akurasi setiap model di kelima fold dibandingkan dengan
  algoritma berakurasi tertinggi memakai **uji t berpasangan terkoreksi**
  (Nadeau & Bengio, 2003), α = 0,05. Uji t biasa terlalu mudah "signifikan"
  pada cross-validation karena data latih antar-fold saling tumpang tindih.
  Koreksinya: `t = mean(d) / sqrt((1/k + n_uji/n_latih) · var(d))`, derajat bebas k − 1.
- Metrik:
  - **Accuracy**: proporsi tebakan benar (metrik utama sesuai arahan dosen);
  - **Balanced Accuracy**: rata-rata recall kedua kelas, tidak tertipu kelas mayoritas;
  - **Precision / Recall / F1**: kualitas tebakan pada kelas "dapat S";
  - **ROC-AUC**: kemampuan membedakan kelas di semua threshold;
  - **Log Loss** dan **Brier Score**: seberapa tepat *angka peluang* yang dihasilkan.
- Prediksi kelas memakai ambang peluang 0,5. **Tidak memakai oversampling**
  (mis. SMOTE): yang dicari adalah angka peluang yang tepat, dan data buatan untuk
  kelas minoritas akan menggeser peluang itu. Ketidakseimbangan ditangani lewat
  pilihan metrik.
- **Analisis pola soft pity:** laju S per rentang pull di data asli dibandingkan
  dengan peluang model Markov, dan aturan Decision Tree yang dilatih hanya dengan
  data asli diperiksa.

## 5. Hasil (cross-validation 5-fold, rata-rata)

Angka **tebal** = terbaik di antara keenam algoritma.

### Hasil grid search

| Algoritma | Terpilih (tugas A) | Terpilih (tugas B) | Accuracy tugas B: awal → terpilih |
|---|---|---|---|
| Naive Bayes | var_smoothing = 1e-9 | var_smoothing = 1e-3 | 0,8543 → 0,8897 |
| KNN | k = 101 | k = 51 | 0,9069 → 0,9070 |
| Logistic Regression | C = 1 | C = 10 | 0,8843 → 0,8853 |
| Decision Tree | max_depth = 4, min_samples_leaf = 20 | max_depth = 6, min_samples_leaf = 100 | 0,9068 → 0,9070 |
| Random Forest | max_depth = 6, min_samples_leaf = 10 | max_depth = 8, min_samples_leaf = 50 | 0,9068 → 0,9070 |
| XGBoost | learning_rate = 0,05, max_depth = 3 | learning_rate = 0,05, max_depth = 3 | 0,9068 → 0,9069 |

Naive Bayes paling terbantu (var_smoothing lebih besar → peluang tidak terlalu
ekstrem). Algoritma lain hampir tidak berubah: pengaturan awalnya sudah cocok
untuk data simulasi yang besar.

### Tugas A: S di pull berikutnya

| Model | Accuracy | Balanced Acc. | F1 | ROC-AUC | Log Loss |
|---|---|---|---|---|---|
| Baseline: selalu "tidak S" | 0,9828 | 0,5000 | 0,0000 | 0,5000 | 0,2768 |
| Markov Chain (teori) | 0,9830 | 0,5184 | 0,0699 | 0,7890 | 0,0662 |
| Naive Bayes | 0,9829 | 0,5007 | 0,0030 | 0,7563 | 0,0792 |
| KNN | 0,9829 | **0,5150** | **0,0574** | 0,7728 | 0,0985 |
| Logistic Regression | 0,9828 | 0,5000 | 0,0000 | 0,7578 | 0,0776 |
| Decision Tree | **0,9830** | 0,5128 | 0,0498 | 0,7888 | **0,0662** |
| Random Forest | 0,9829 | 0,5141 | 0,0543 | **0,7890** | 0,0663 |
| XGBoost | **0,9830** | 0,5138 | 0,0533 | 0,7878 | 0,0663 |

### Tugas B: S dalam 10 pull berikutnya

| Model | Accuracy | Balanced Acc. | F1 | ROC-AUC | Log Loss |
|---|---|---|---|---|---|
| Baseline: selalu "tidak S" | 0,8337 | 0,5000 | 0,0000 | 0,5000 | 2,6804 |
| Markov Chain (teori) | 0,9108 | 0,7601 | 0,6658 | 0,8110 | 0,2811 |
| Naive Bayes | 0,8920 | 0,7099 | 0,5736 | 0,7746 | 0,3488 |
| KNN | 0,9105 | **0,7628** | **0,6680** | 0,8020 | 0,3033 |
| Logistic Regression | 0,8888 | 0,6675 | 0,5010 | 0,7896 | 0,3625 |
| Decision Tree | **0,9108** | 0,7614 | 0,6671 | **0,8117** | **0,2814** |
| Random Forest | **0,9108** | 0,7612 | 0,6669 | 0,8102 | 0,2816 |
| XGBoost | **0,9108** | 0,7604 | 0,6661 | 0,8104 | 0,2815 |

### Uji di data asli pemain (3 akun, model dilatih hanya dengan data simulasi)

Pengujian ini menjawab pertanyaan: *apakah model yang dilatih dari simulasi
tetap akurat untuk pemain sungguhan?*

| Model | Tugas A Accuracy | Tugas B Accuracy | Tugas B Balanced Acc. | Tugas B F1 | Tugas B Log Loss |
|---|---|---|---|---|---|
| Baseline: selalu "tidak S" | 0,9851 | 0,8646 | 0,5000 | 0,0000 | 2,1830 |
| Markov Chain (teori) | 0,9858 | 0,9263 | 0,7455 | 0,6465 | 0,2528 |
| Naive Bayes | 0,9851 | 0,9074 | 0,7170 | 0,5714 | 0,2837 |
| KNN | **0,9858** | 0,9228 | 0,7325 | 0,6233 | 0,2694 |
| Logistic Regression | 0,9851 | 0,9032 | 0,6447 | 0,4480 | 0,2866 |
| Decision Tree | **0,9858** | 0,9242 | 0,7377 | 0,6327 | 0,2531 |
| Random Forest | **0,9858** | 0,9242 | 0,7399 | 0,6351 | 0,2531 |
| XGBoost | **0,9858** | **0,9249** | **0,7403** | **0,6373** | **0,2525** |

Data asli: Tugas A 1.479 baris (22 S), Tugas B 1.425 baris (193 positif).

### Eksperimen kedua: latih DAN uji hanya dengan data asli

Untuk memastikan hasil tidak bergantung pada data simulasi, keenam algoritma
juga dilatih dan diuji **hanya dengan data asli** (Tugas B: 1.425 baris, 193
positif; sudah memenuhi ketentuan dataset tabel minimal 500–1.000 baris).
Karena data asli hanya dari 3 akun, data dibagi per **siklus pity** (25 siklus,
GroupKFold 5-fold): siklus pity saling bebas karena peluang selalu kembali ke
awal setelah dapat S. Hyperparameter dipilih ulang dengan grid search **di dalam
data latih setiap fold** (*nested cross-validation*, GroupKFold 4-fold per siklus),
sehingga data uji tidak pernah ikut memilih pengaturan.

| Model | Accuracy | Balanced Acc. | F1 | ROC-AUC | Log Loss |
|---|---|---|---|---|---|
| Baseline: selalu "tidak S" | 0,8645 ± 0,0119 | 0,5000 | 0,0000 | 0,5000 | 2,1835 |
| Markov Chain (teori) | 0,9264 ± 0,0149 | 0,7470 | 0,6389 | 0,7825 | 0,2527 |
| Naive Bayes | 0,9073 ± 0,0101 | 0,6765 | 0,5108 | 0,8455 | **0,2847** |
| KNN | 0,8529 ± 0,1024 | 0,6476 | 0,4412 | 0,7757 | 0,7433 |
| Logistic Regression | 0,9138 ± 0,0154 | 0,7105 | 0,5591 | 0,8391 | 0,2966 |
| Decision Tree | 0,9229 ± 0,0110 | **0,7559** | **0,6440** | **0,8505** | 0,4477 |
| Random Forest | **0,9235 ± 0,0109** | 0,7438 | 0,6309 | 0,8323 | 0,3904 |
| XGBoost | 0,8970 ± 0,0656 | 0,7395 | 0,5958 | 0,7900 | 0,3969 |

Pengaruh grid search (accuracy rata-rata 5-fold):

| Algoritma | Pengaturan awal | Nested grid search | Terpilih di setiap fold |
|---|---|---|---|
| Naive Bayes | 0,8654 | 0,9073 | var_smoothing = 0,1 (4×); var_smoothing = 1e-3 (1×) |
| KNN | 0,8837 | 0,8529 | k = 51 (4×); k = 15 (1×) |
| Logistic Regression | 0,9201 | 0,9138 | C = 0,1 (3×); C = 10 (1×); C = 1 (1×) |
| Decision Tree | 0,9229 | 0,9229 | max_depth = 6, min_samples_leaf = 50 (5×) |
| Random Forest | 0,9221 | 0,9235 | max_depth = 8, min_samples_leaf = 20 (2×); max_depth = 12, min_samples_leaf = 10 (1×); max_depth = 6, min_samples_leaf = 10 (1×); max_depth = 8, min_samples_leaf = 10 (1×) |
| XGBoost | 0,8970 | 0,8970 | learning_rate = 0,1, max_depth = 6 (3×); learning_rate = 0,1, max_depth = 4 (1×); learning_rate = 0,05, max_depth = 3 (1×) |

- Random Forest dan Decision Tree teratas (92,35% dan 92,29%); teori Markov 92,64%.
- Grid search tidak selalu membantu: Naive Bayes 86,54% → 90,73%; KNN 88,37% → 85,29%; Logistic Regression 92,01% → 91,38%.
  Pengaturan dipilih hanya dari data latih tiap fold; dengan data sekecil ini, yang terbaik di
  data latih belum tentu terbaik di data uji.
- **KNN dan XGBoost tidak stabil.** Pada fold ke-4 akurasinya hanya KNN 64,9%, XGBoost 77,1% (Decision Tree dan Random Forest 92,1%). Data latih fold itu
  hanya memuat satu siklus Agent berstatus guaranteed, yang kebetulan dapat S di pull ke-38. Dari
  satu siklus itu KNN dan XGBoost belajar pola keliru "guaranteed → S segera keluar", lalu salah menebak
  di dua siklus guaranteed lain yang ternyata panjang. Pohon dengan min_samples_leaf besar tidak
  terpengaruh. Ini contoh overfitting pada fitur yang tidak relevan ketika data sedikit.
- Akurasi Naive Bayes naik, tetapi recall-nya turun (0,65 → 0,36) karena
  grid search mengoptimalkan accuracy. Kalau yang diutamakan menangkap kelas
  minoritas, metrik pemilihannya perlu diganti (mis. Balanced Accuracy).
- Simpangan baku ±1,0–10,2% (simulasi ±0,1–0,2%) karena datanya jauh lebih sedikit.

### Uji signifikansi (tugas B)

Selisih akurasi terhadap model acuan dalam poin persen (negatif = lebih rendah);
p-value **tebal** = signifikan (p < 0,05). Acuan = algoritma berakurasi rata-rata
tertinggi sebelum dibulatkan.

| Model | Selisih dari XGBoost (simulasi) | p | Selisih dari Random Forest (data asli) | p |
|---|---|---|---|---|
| Baseline: selalu "tidak S" | −7,71 | **< 0,001** | −5,90 | **0,003** |
| Markov Chain (teori) | 0,00 | 0,541 | +0,28 | 0,541 |
| Naive Bayes | −1,88 | **< 0,001** | −1,62 | 0,297 |
| KNN | −0,03 | 0,572 | −7,06 | 0,409 |
| Logistic Regression | −2,20 | **< 0,001** | −0,98 | 0,193 |
| Decision Tree | 0,00 | 0,890 | −0,07 | 0,802 |
| Random Forest | 0,00 | 0,735 | acuan | – |
| XGBoost | acuan | – | −2,66 | 0,601 |

- **Simulasi:** Decision Tree, Random Forest, dan KNN **tidak berbeda nyata** dari
  XGBoost; Naive Bayes dan Logistic Regression **nyata lebih rendah** (p < 0,001).
- **Data asli:** hanya baseline yang nyata lebih rendah dari Random Forest
  (p = 0,003). Selisih antaralgoritma (0,07–7,06 poin) **belum signifikan**
  (p = 0,19–0,80): dengan 25 siklus pity, data asli belum cukup untuk
  membuktikan satu algoritma lebih unggul. Yang pasti, model terbaik nyata di atas baseline.

### Pola soft pity pada data asli

Laju S per pull di data asli (Tugas A, 1.479 baris) per rentang "pull ke-n sejak
S terakhir", dibandingkan rata-rata peluang model Markov (dibuat ulang dengan
`docs/tugas/sumber/figs.py`):

| Banner | Pull ke- | Jumlah pull | S | Laju data asli | Model Markov |
|---|---|---|---|---|---|
| Agent | 1–60 | 916 | 5 | 0,5% | 0,6% |
| Agent | 61–73 | 119 | 2 | 1,7% | 0,6% |
| Agent | 74–78 | 35 | 5 | **14,3%** | 15,3% |
| Agent | 79–90 | 8 | 3 | **37,5%** | 39,7% |
| W-Engine | 1–55 | 354 | 3 | 0,8% | 1,0% |
| W-Engine | 56–64 | 36 | 0 | 0,0% | 1,0% |
| W-Engine | 65–80 | 11 | 4 | **36,4%** | 12,0% |

- **Agent:** 0,7% sampai pull ke-73 (7 S dari 1.035 pull), lalu melonjak menjadi
  14,3% di pull ke-74–78 dan 37,5% di pull ke-79–90, sangat dekat dengan model
  (estimasi soft pity pull ke-74).
- **W-Engine:** sebelum pull ke-65 hanya 3 S dari 390 pull, lalu 4 dari 11 pull
  setelahnya dapat S (36,4%), lebih tinggi dari model (12,0%). Mungkin peluang
  W-Engine naik lebih cepat dari asumsi, tetapi datanya masih terlalu sedikit.
- Decision Tree yang dilatih **hanya dengan data asli** (Tugas B) memisah pertama
  kali di `pity_ratio <= 0,724` (pity ±65 Agent, ±58 W-Engine), sekitar 8–10 pull
  sebelum soft pity, sama seperti pohon yang dilatih di simulasi (0,71–0,74).

Jadi lonjakan peluang yang tidak diumumkan resmi **bisa ditemukan dari data asli**.

## 6. Pembahasan

1. **Jebakan akurasi (Tugas A).** Model yang selalu menebak "tidak dapat S"
   sudah mendapat akurasi 98,28% karena S sangat jarang. Semua model punya
   akurasi hampir sama (±98,3%), jadi akurasi saja **tidak bisa** membedakan
   model yang bagus dan yang tidak berguna. Balanced Accuracy, F1, ROC-AUC,
   dan Log Loss memperlihatkan perbedaannya.
2. **Tugas B lebih bermakna.** Ketika kelasnya lebih seimbang (±16,6% positif),
   perbedaan antar-algoritma terlihat jelas: model berbasis pohon (Decision
   Tree, Random Forest, XGBoost) dan KNN mencapai akurasi ±91,1%, di atas
   Naive Bayes (±89,2%), Logistic Regression (±88,9%), dan baseline (±83,4%).
   Menurut uji t berpasangan terkoreksi, keempat model teratas **tidak berbeda
   nyata**, sedangkan Naive Bayes dan Logistic Regression **nyata lebih rendah**
   (p < 0,001) walaupun hyperparameter-nya sudah dipilih dengan grid search.
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
   peluang S tidak berbentuk lonceng. Log Loss keduanya paling besar di antara
   keenam algoritma.
5. **KNN setara model pohon di data simulasi.** Karena fiturnya sedikit dan berulang
   (pity hanya 0–89), tetangga terdekat praktis adalah pull lain dengan pity yang
   sama, sehingga KNN meniru peluang empiris per pity. Kelemahannya: model
   menyimpan seluruh data latih, prediksinya paling lambat, dan pada data asli
   yang kecil KNN tidak stabil (lihat eksperimen kedua).
6. **Fitur `guaranteed` hampir tidak berpengaruh** pada model yang dilatih di
   simulasi (feature importance ≈ 0). Ini benar secara aturan game: guaranteed hanya
   menentukan *S mana* yang keluar, bukan *kapan* S keluar. Namun di data asli yang
   kecil, fitur ini justru bisa menyesatkan KNN dan XGBoost ketika siklus guaranteed
   di data latih hanya sedikit.
7. **Terbukti di data asli.** Urutan hasil di data 3 akun asli sama dengan
   di simulasi: model pohon ±92,4–92,5% dan KNN ±92,3%, Naive Bayes ±90,7%,
   Logistic Regression ±90,3%, baseline ±86,5%, dan Markov (teori) ±92,6%. Akurasinya
   lebih tinggi daripada simulasi karena kelas positif di data asli lebih sedikit
   (13,5% vs 16,6%), sehingga baseline juga naik (86,5% vs 83,4%); keunggulan di
   atas baseline 7,7 poin (simulasi) dan 6,0 poin (data asli). Artinya asumsi soft pity yang dipakai
   simulasi tidak bertentangan dengan perilaku gacha sungguhan (dengan catatan data asli
   baru 3 akun). Selain itu, pity dan status guaranteed yang dihitung aplikasi untuk
   akun asli **sama persis** dengan yang tampil di game.
8. **Tidak bergantung pada simulasi.** Saat dilatih dan diuji hanya dengan
   data asli (1.425 baris), Random Forest (92,35%) dan Decision Tree (92,29%)
   tetap tertinggi, walaupun selisihnya dengan algoritma lain belum signifikan karena
   data asli baru 25 siklus pity.
9. **Pengaruh grid search.** Grid search paling berpengaruh pada Naive Bayes, yang
   pengaturan awalnya tidak cocok dengan data. Di data asli yang kecil, grid search
   di dalam setiap fold tidak selalu memilih pengaturan yang lebih baik (KNN dan
   Logistic Regression sedikit turun), jadi hasilnya perlu dibaca bersama simpangan
   bakunya. Kesimpulan tentang algoritma terbaik tidak berubah.
10. **Batas atas.** Tidak ada model yang bisa jauh melampaui Markov Chain
   (teori), karena hasil gacha memang acak. Model terbaik adalah yang paling
   mendekati peluang sebenarnya.
11. **Nilai tambah data mining.** Rumus resmi tidak memuat soft pity, sedangkan
    algoritma yang hanya diberi data mampu mendekati acuan teori dan menemukan
    titik lonjakannya sendiri. Ini yang tidak didapat dari rumus resmi saja.

## 7. Keterbatasan

- Titik mulai soft pity adalah estimasi komunitas, bukan angka resmi.
- Data latih utama berasal dari simulasi berdasarkan model 4.1, sehingga model
  ML "belajar ulang" asumsi tersebut. Data asli pemain dipakai untuk menguji
  apakah asumsi itu cocok dengan kenyataan, dan hasilnya tidak bertentangan.
- Data asli baru 3 akun (22 S pada Tugas A, 25 siklus pity). Baris dalam satu
  siklus saling berkaitan, jadi informasinya lebih sedikit daripada jumlah baris,
  dan angka uji data asli masih bisa bergeser kalau datanya ditambah (simpangan
  baku eksperimen latih di data asli ±1,0–10,2%). Akibatnya uji signifikansi di
  data asli punya daya uji rendah: selisih kecil antaralgoritma sulit dibuktikan.
  Makin banyak akun (minimal 5, idealnya 10 atau lebih), makin kuat kesimpulannya.
- Siklus berstatus guaranteed di data asli masih sangat sedikit, sehingga
  algoritma yang fleksibel (KNN, XGBoost) bisa mempelajari pola keliru dari fitur
  `guaranteed`.
- Grid search hanya mencoba ruang pencarian yang terbatas dan memakai accuracy
  sebagai metrik pemilihan, jadi pengaturan terpilih belum tentu terbaik untuk
  metrik lain seperti Balanced Accuracy.
- Penentuan menang/kalah 50/50 memakai daftar S standar di `config.py`. Daftar
  ini harus diperbarui kalau HoYoverse menambah isi banner standar.
- Riwayat resmi hanya tersimpan beberapa bulan terakhir.

## 8. Kesimpulan (draf)

- Sistem pity ZZZ dapat dimodelkan dengan Markov Chain; aplikasi memakainya untuk
  menghitung peluang dapat S/S rate-up dalam N pull (titik soft pity masih estimasi).
- Pola soft pity yang tidak diumumkan resmi **dapat ditemukan dari data asli**:
  laju S Agent melonjak mulai pull ke-74 dan W-Engine sekitar pull ke-65, dan
  Decision Tree yang dilatih hanya dengan data asli menemukan titik pemisah yang
  sesuai tanpa diberi tahu.
- Untuk memprediksi keluarnya S, **Decision Tree, Random Forest, XGBoost, dan
  KNN** memberikan akurasi tertinggi dan tidak berbeda nyata satu sama lain
  (±91,1% pada tugas 10 pull di simulasi, ±92,3–92,5% di data asli), hampir sama
  dengan batas teoretis. Naive Bayes dan Logistic Regression nyata lebih rendah
  di simulasi walaupun hyperparameter-nya sudah dipilih dengan grid search. Saat
  dilatih dan diuji hanya dengan data asli (1.425 baris), Random Forest tertinggi
  (92,35%), tetapi selisihnya dengan algoritma lain belum signifikan.
- Grid search terutama memperbaiki Naive Bayes. Di data asli yang kecil hasilnya
  tidak selalu lebih baik, dan KNN serta XGBoost tidak stabil karena mempelajari
  pola keliru dari fitur `guaranteed`; kesimpulan tentang algoritma terbaik tidak berubah.
- **Accuracy tidak cukup** untuk data tidak seimbang; perlu metrik pendukung
  seperti Balanced Accuracy, F1, ROC-AUC, dan Log Loss.

## 9. Anggota kelompok

| NIM | Nama | Peran |
|---|---|---|
| A11.2024.16004 | Syafiq Yahya | Ketua kelompok, mempresentasikan hasil proyek |
| A11.2024.15851 | Dafi Hauzan A.H ([@tehgeii](https://github.com/tehgeii)) | Pengembang aplikasi, pengumpulan dan pengujian data asli |
| A11.2024.15842 | Gastiadirrijal Rafi M | Penyusun slide presentasi |
| A11.2024.15826 | Zabrina Miftah Z | Penyusun proposal dan laporan |
| A11.2024.15804 | Rayya Hasya Tamimi | Penyusun proposal dan laporan |
