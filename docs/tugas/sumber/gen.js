// node gen.js proposal|laporan <output.docx>
const fs = require("fs");
const L = require("./lib");
const X = require("./rep"); // angka hasil pelatihan dari models/report.json
const { d, P, Center, Eq, BAB, H1plain, H2, H3, Bullets, Numbered, TableX, TCap, Img, Space, Break, setBab } = L;
const { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, NumberFormat } = d;

const MODE = process.argv[2];
const OUT = process.argv[3];
const PROP = MODE === "proposal";
const JUDUL = "PERBANDINGAN ALGORITMA KLASIFIKASI UNTUK MEMPREDIKSI PELUANG MENDAPATKAN S-RANK PADA SISTEM GACHA ZENLESS ZONE ZERO BERBASIS WEB";
const APP = "https://project-data-mining-zzz.streamlit.app";
const REPO = "https://github.com/tehgeii/project-data-mining";
const TEAM = [
  ["A11.2024.16004", "Syafiq Yahya", "Ketua kelompok, presentasi hasil"],
  ["A11.2024.15851", "Dafi Hauzan A.H", "Pengembang aplikasi, pengumpulan dan pengujian data"],
  ["A11.2024.15842", "Gastiadirrijal Rafi M", "Penyusun slide presentasi"],
  ["A11.2024.15826", "Zabrina Miftah Z", "Penyusun proposal dan laporan"],
  ["A11.2024.15804", "Rayya Hasya Tamimi", "Penyusun proposal dan laporan"],
];
// kata kerja yang berbeda antara proposal (rencana) dan laporan (sudah dilakukan)
const v = (rencana, selesai) => (PROP ? rencana : selesai);

// ---------- SAMPUL ----------
// Spasi 1,15 dan jarak antarblok dibuat hemat supaya sampul tetap muat satu halaman
// walaupun dibuka di aplikasi lain (Word, WPS, Google Docs) yang jarak barisnya sedikit berbeda.
const C = (text, o = {}) => Center(text, { line: 276, ...o });
const cover = [
  C(PROP ? "**PROPOSAL PROYEK AKHIR**" : "**LAPORAN AKHIR PROYEK**", { size: 32 }),
  C(`**${JUDUL}**`, { size: 28, before: 240, after: 240 }),
  // logo Udinus ±3,5 cm, tanpa keterangan gambar
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new ImageRun({ type: "png", data: fs.readFileSync(`${process.env.FIG}/logo_udinus.png`), transformation: { width: 135, height: 135 }, altText: { title: "Logo Universitas Dian Nuswantoro", description: "Logo Universitas Dian Nuswantoro", name: "logo_udinus" } })] }),
  C(v("Disusun untuk memenuhi Ujian Tengah Semester (UTS)", "Disusun untuk memenuhi Ujian Akhir Semester (UAS)"), { after: 0 }),
  C("mata kuliah **Penambangan Data**", { after: 240 }),
  C("Kelas **A11.4502** · Kelompok **6**", { after: 160 }),
  TableX(["NIM", "Nama", "Peran"], TEAM, [26, 32, 42], { width: 7600, leftAll: true, size: 22 }),
  C("Dosen Pengampu:", { before: 360, after: 0 }),
  C("**Ardytha Luthfiarta, M.Kom, MCS**", { after: 480 }),
  C("**PROGRAM STUDI TEKNIK INFORMATIKA – S1**", { after: 0 }),
  C("**FAKULTAS ILMU KOMPUTER**", { after: 0 }),
  C("**UNIVERSITAS DIAN NUSWANTORO**", { after: 0 }),
  C("**SEMARANG**", { after: 0 }),
  C("**2026**", { after: 0 }),
];

// ---------- KATA PENGANTAR ----------
const kata = [
  H1plain("Kata Pengantar"),
  P(`Puji syukur kami panjatkan kepada Tuhan Yang Maha Esa karena atas rahmat-Nya kami dapat menyelesaikan ${v("proposal proyek akhir", "laporan akhir proyek")} berjudul "${JUDUL.charAt(0) + JUDUL.slice(1).toLowerCase().replace("zenless zone zero", "Zenless Zone Zero").replace("s-rank", "S-Rank")}". Dokumen ini disusun untuk memenuhi ${v("Ujian Tengah Semester", "Ujian Akhir Semester")} mata kuliah Penambangan Data.`),
  P("Kami mengucapkan terima kasih kepada Bapak Ardytha Luthfiarta, M.Kom, MCS selaku dosen pengampu yang telah memberikan materi dan arahan, serta kepada teman-teman pemain Zenless Zone Zero yang bersedia menyumbangkan riwayat gacha mereka secara anonim sebagai data penelitian."),
  P("Kami menyadari dokumen ini masih memiliki kekurangan. Oleh karena itu, kritik dan saran yang membangun sangat kami harapkan. Semoga dokumen ini bermanfaat bagi pembaca."),
  new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 360 }, children: [new TextRun("Semarang, Oktober 2026")] }),
  new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun("Kelompok 6")] }),
];

// ---------- BAB I ----------
setBab(1);
const bab1 = [
  ...BAB("I", "Pendahuluan", true), // awal section baru, tidak perlu page break lagi
  H2("1.1 Latar Belakang"),
  P("*Gacha* adalah mekanisme undian berhadiah di dalam permainan digital. Pemain menukarkan mata uang permainan untuk satu kali undian (*pull*) dan mendapatkan item secara acak sesuai peluang yang ditetapkan pengembang. Mekanisme ini banyak dipakai pada permainan *free-to-play* modern, salah satunya **Zenless Zone Zero** (ZZZ) yang dirilis HoYoverse pada tahun 2024."),
  P("Pada ZZZ, hadiah paling langka adalah item **S-Rank**, baik karakter (*Agent*) maupun senjata (*W-Engine*). Peluang dasarnya kecil, yaitu 0,6% untuk Agent dan 1,0% untuk W-Engine pada banner terbatas. Untuk mencegah pemain terlalu lama tidak beruntung, permainan memakai sistem **pity**: semakin lama pemain tidak mendapatkan S-Rank, peluangnya meningkat (*soft pity*) hingga pada batas tertentu S-Rank pasti didapat (*hard pity*, pull ke-90 untuk Agent dan ke-80 untuk W-Engine). Selain itu terdapat aturan 50/50 (Agent) dan 75/25 (W-Engine) yang menentukan apakah S-Rank yang keluar adalah item yang sedang dipromosikan (*rate-up*)."),
  P("Kombinasi aturan tersebut membuat pemain sulit memperkirakan sendiri peluang mendapatkan S-Rank, misalnya pertanyaan \"jika pity saya sekarang 70, berapa peluang saya mendapatkan S-Rank dalam 10 pull berikutnya?\". Padahal, riwayat gacha setiap pemain tersimpan di server dan dapat diambil sebagai data. Data riwayat ini berpotensi diolah dengan teknik penambangan data untuk menjawab pertanyaan tersebut secara kuantitatif."),
  P("Penambangan data menyediakan banyak algoritma klasifikasi, di antaranya Naive Bayes, K-Nearest Neighbor (KNN), Logistic Regression, Decision Tree, Random Forest, dan XGBoost. Masing-masing memiliki asumsi dan cara belajar yang berbeda, sehingga kinerjanya perlu dibandingkan pada kasus yang sama. Kasus gacha juga memiliki tantangan khusus, yaitu **data yang sangat tidak seimbang**: kelas \"mendapat S-Rank\" hanya sekitar 1,7% dari seluruh pull, sehingga metrik akurasi saja dapat menyesatkan."),
  P(`Berdasarkan hal tersebut, proyek ini ${v("akan membangun", "membangun")} aplikasi berbasis web yang dapat diakses dari ponsel maupun komputer untuk menghitung peluang mendapatkan S-Rank dengan model Markov Chain, sekaligus membandingkan kinerja enam algoritma klasifikasi dalam memprediksi keluarnya S-Rank.`),
  H2("1.2 Alasan Menggunakan Penambangan Data"),
  P("Sebelum memilih algoritma, perlu dipastikan bahwa kasus ini memang membutuhkan penambangan data. *Machine learning* tidak diperlukan apabila (1) hasil dapat ditentukan langsung oleh suatu atribut, atau (2) sudah tersedia pengetahuan atau rumus yang pasti dan lengkap. Tabel 1.1 menunjukkan bahwa kedua kondisi tersebut tidak terpenuhi pada sistem gacha Zenless Zone Zero."),
  TCap("Pemeriksaan perlu tidaknya machine learning"),
  TableX(["Kondisi", "Pada gacha Zenless Zone Zero", "Terpenuhi?"], [
    ["Ada atribut yang langsung menentukan hasil", "Tidak ada. Pity hanya mengubah peluang; hasil setiap pull tetap acak. Kepastian hanya terjadi di hard pity.", "Tidak"],
    ["Ada rumus yang pasti dan lengkap", "Hanya sebagian. Rate dasar, rate gabungan, hard pity, dan peluang rate-up diumumkan resmi, tetapi kapan soft pity dimulai dan seberapa cepat peluang naik tidak diumumkan. Perkiraan komunitas pun berbeda-beda.", "Tidak"],
  ], [27, 56, 17], { leftAll: true }),
  Space(),
  P(`Bagian aturan yang tidak diumumkan tersebut hanya dapat diketahui dari data riwayat gacha pemain. Karena setiap pull memiliki label yang jelas (mendapat S-Rank atau tidak), masalah ini termasuk **klasifikasi** sekaligus **estimasi** peluang dalam *supervised learning*. Model Markov Chain tetap ${v("akan dipakai", "dipakai")}, tetapi sebagai **pembanding teori** yang dibangun dari parameter resmi ditambah estimasi soft pity. Algoritma klasifikasi tidak diberi tahu tentang soft pity, sehingga dapat diuji apakah mampu menemukan pola tersebut sendiri dari data.`),
  H2("1.3 Rumusan Masalah"),
  ...Numbered([
    "Bagaimana menghitung peluang pemain mendapatkan S-Rank dan S-Rank *rate-up* dalam N pull berdasarkan pity dan status *guaranteed* pada banner terbatas Zenless Zone Zero?",
    "Apakah pola kenaikan peluang (*soft pity*) yang tidak diumumkan resmi dapat ditemukan dari data riwayat gacha pemain?",
    "Algoritma klasifikasi manakah di antara Naive Bayes, KNN, Logistic Regression, Decision Tree, Random Forest, dan XGBoost yang paling akurat memprediksi keluarnya S-Rank?",
    "Bagaimana mengevaluasi model secara tepat pada data yang sangat tidak seimbang?",
    "Bagaimana menyajikan hasil tersebut dalam aplikasi web yang mudah diakses pengguna ponsel maupun komputer?",
  ]),
  H2("1.4 Batasan Masalah"),
  ...Bullets([
    "Banner yang diteliti hanya **banner Agent terbatas** (*Exclusive Channel*) dan **banner W-Engine terbatas** (*W-Engine Channel*). Banner standar dan Bangboo tidak dibahas.",
    "Yang diprediksi adalah keluarnya item **S-Rank**; item A-Rank dan B-Rank tidak dimodelkan.",
    "Parameter resmi (rate dasar, rate gabungan, hard pity, peluang *rate-up*) diambil dari detail banner di dalam permainan. Titik mulai *soft pity* tidak diumumkan resmi, sehingga model Markov memakai estimasi komunitas yang kemudian diperiksa dengan data asli.",
    "Data asli berasal dari riwayat akun anggota kelompok dan teman yang bersedia, dalam bentuk anonim.",
    "Aplikasi dibangun dengan Python dan Streamlit, dan pengambilan riwayat otomatis hanya tersedia untuk permainan versi PC (Windows).",
  ]),
  H2("1.5 Tujuan"),
  ...Numbered([
    "Membangun model Markov Chain untuk menghitung peluang mendapatkan S-Rank dan S-Rank *rate-up* berdasarkan parameter banner.",
    "Menggali pola *soft pity* yang tidak diumumkan resmi dari data riwayat gacha pemain.",
    "Membandingkan kinerja enam algoritma klasifikasi dalam memprediksi keluarnya S-Rank, dengan hyperparameter yang dipilih melalui *grid search* dan perbedaan kinerja yang diuji signifikansinya secara statistik.",
    "Menerapkan metrik evaluasi yang sesuai untuk data tidak seimbang, yaitu Accuracy, Balanced Accuracy, Precision, Recall, F1-score, ROC-AUC, Log Loss, dan Brier Score.",
    "Menyajikan seluruh hasil dalam aplikasi web yang dapat diakses dari ponsel, tablet, maupun komputer.",
  ]),
  H2("1.6 Manfaat"),
  ...Bullets([
    "**Bagi pemain:** mendapat gambaran peluang yang jelas untuk merencanakan penggunaan mata uang permainan.",
    "**Bagi mahasiswa:** menerapkan tahapan penambangan data (CRISP-DM), algoritma klasifikasi, evaluasi dengan *confusion matrix*, dan *deployment* dengan Streamlit sesuai materi perkuliahan.",
    "**Bagi keilmuan:** memberikan contoh penerapan penambangan data untuk menggali aturan yang tidak diumumkan (soft pity) dari data, sekaligus contoh nyata bahaya memakai akurasi sebagai satu-satunya metrik pada data tidak seimbang.",
  ]),
];

// ---------- BAB II ----------
const bab2Start = () => setBab(2);
const bab2 = () => [
  ...BAB("II", "Tinjauan Pustaka"),
  H2("2.1 Penambangan Data dan CRISP-DM"),
  P("Penambangan data (*data mining*) adalah proses menemukan pola, pengetahuan, dan informasi yang berguna dari kumpulan data berukuran besar (Han, Kamber, & Pei, 2012). Proses ini mengubah **data** mentah menjadi **informasi**, lalu menjadi **pengetahuan** yang dapat dipakai untuk mengambil keputusan."),
  P("Proyek ini mengikuti kerangka **CRISP-DM** (*Cross-Industry Standard Process for Data Mining*) yang terdiri atas enam tahap: *business understanding*, *data understanding*, *data preparation*, *modeling*, *evaluation*, dan *deployment* (Chapman et al., 2000)."),
  H2("2.2 Klasifikasi (Supervised Learning)"),
  P("Klasifikasi adalah tugas *supervised learning* untuk memetakan sekumpulan fitur ke salah satu label kelas berdasarkan contoh data berlabel. Pada proyek ini, label berupa dua kelas (klasifikasi biner): **mendapat S-Rank** atau **tidak mendapat S-Rank**. Selain label, sebagian besar algoritma juga menghasilkan **peluang** masuk ke tiap kelas. Peluang inilah yang membuat klasifikasi juga berperan sebagai **estimasi**, karena pemain tidak hanya membutuhkan tebakan ya atau tidak, tetapi juga seberapa besar peluangnya."),
  H2("2.3 Sistem Gacha dan Pity pada Zenless Zone Zero"),
  P("Fitur gacha pada Zenless Zone Zero disebut *Signal Search*. Setiap pull memiliki peluang tertentu menghasilkan item S-Rank. Parameter banner terbatas yang dipakai dalam proyek ini ditunjukkan pada Tabel 2.1. Angka resmi diambil dari menu detail *Signal Search* di dalam permainan (HoYoverse, 2024)."),
  TCap("Parameter banner terbatas Zenless Zone Zero"),
  TableX(["Parameter", "Agent Terbatas", "W-Engine Terbatas", "Sumber"], [
    ["Rate dasar S-Rank", "0,6%", "1,0%", "Resmi (detail banner)"],
    ["Rate gabungan (termasuk pity)", "1,6%", "2,0%", "Resmi (detail banner)"],
    ["Hard pity", "90", "80", "Resmi (detail banner)"],
    ["Peluang S-Rank rate-up", "50%", "75%", "Resmi (detail banner)"],
    ["Soft pity mulai", "pull ke-74", "pull ke-65", "Estimasi komunitas (tidak resmi)"],
  ], [34, 20, 22, 24]),
  Space(),
  P("Jika pemain mendapatkan S-Rank yang bukan *rate-up* (disebut kalah 50/50), maka S-Rank berikutnya **pasti** *rate-up*. Status ini disebut *guaranteed*. Riwayat gacha dapat diambil dari server resmi melalui URL yang memuat kunci akses sementara (*authkey*), dan dapat dipertukarkan antaraplikasi dengan format standar **UIGF** (*Uniformed Interchangeable GachaLog Format*) versi 4 (UIGF Organization, 2024)."),
  H2("2.4 Markov Chain"),
  P("Markov Chain adalah proses stokastik ketika peluang berpindah ke keadaan (*state*) berikutnya hanya bergantung pada keadaan saat ini (Norris, 1997). Sistem pity cocok dimodelkan dengan Markov Chain karena peluang mendapatkan S-Rank pada suatu pull hanya bergantung pada jumlah pull sejak S-Rank terakhir (pity) dan status *guaranteed*."),
  P("Peluang mendapatkan S-Rank pada pull ke-n, dengan syarat belum mendapat S-Rank sebelumnya, disebut *hazard* h(n):"),
  Eq("h(n) = p                                untuk n < s"),
  Eq("h(n) = min(1, p + k·(n − s + 1))   untuk n ≥ s"),
  Eq("h(hard pity) = 1"),
  P("dengan p = rate dasar, s = titik mulai soft pity, dan k = kenaikan peluang per pull. Karena nilai k tidak diumumkan, k dicari dengan **metode biseksi** sehingga rata-rata jumlah pull per S-Rank sama dengan kebalikan rate gabungan resmi (62,5 pull untuk Agent dan 50 pull untuk W-Engine). Hasilnya k ≈ 5,30% untuk Agent dan k ≈ 5,52% untuk W-Engine. Nilai s (pull ke-74 dan ke-65) juga bukan angka resmi, melainkan estimasi komunitas yang diperiksa dengan data asli dalam penelitian ini."),
  ...Img("fig_hazard.png", "Peluang S-Rank per pull (hazard) untuk kedua banner", 540),
  ...Img("fig_markov.png", "Ilustrasi rantai Markov sistem pity", 540),
  H2("2.5 Algoritma Klasifikasi"),
  H3("2.5.1 Naive Bayes"),
  P("Naive Bayes adalah pengklasifikasi probabilistik berdasarkan Teorema Bayes dengan asumsi bahwa setiap fitur saling bebas jika kelasnya diketahui. Varian Gaussian Naive Bayes mengasumsikan setiap fitur numerik berdistribusi normal di dalam setiap kelas. Algoritma ini sangat cepat, namun asumsinya sering tidak terpenuhi pada data nyata."),
  H3("2.5.2 K-Nearest Neighbor (KNN)"),
  P("KNN mengklasifikasikan data baru berdasarkan mayoritas label dari k data latih terdekat menurut jarak tertentu, umumnya jarak Euclidean (Cover & Hart, 1967). KNN tidak membangun model eksplisit (*lazy learner*), sehingga fitur perlu dinormalisasi agar tidak ada fitur yang mendominasi perhitungan jarak."),
  H3("2.5.3 Logistic Regression"),
  P("Logistic Regression memodelkan peluang kelas positif dengan fungsi sigmoid dari kombinasi linear fitur: P(y = 1) = 1 / (1 + e^−(β₀ + β₁x₁ + … + βₙxₙ)) (Hosmer, Lemeshow, & Sturdivant, 2013). Model ini mudah ditafsirkan, tetapi hanya mampu membentuk batas keputusan yang linear terhadap fitur."),
  H3("2.5.4 Decision Tree"),
  P("Decision Tree membagi data secara bertahap berdasarkan nilai fitur sehingga membentuk struktur pohon aturan *jika–maka* (Quinlan, 1986). Pembagian dipilih untuk memaksimalkan kemurnian kelas, misalnya dengan indeks Gini. Kelebihannya, aturan yang dihasilkan mudah dibaca manusia."),
  H3("2.5.5 Random Forest"),
  P("Random Forest adalah gabungan (*ensemble*) banyak Decision Tree yang masing-masing dilatih pada sampel acak data dan subset fitur acak, lalu hasilnya dirata-ratakan (*bagging*) (Breiman, 2001). Teknik ini mengurangi *overfitting* dibandingkan satu pohon."),
  H3("2.5.6 XGBoost"),
  P("XGBoost (*Extreme Gradient Boosting*) membangun pohon secara berurutan, di mana setiap pohon baru memperbaiki kesalahan pohon sebelumnya dengan optimasi gradien dan regularisasi (Chen & Guestrin, 2016). Algoritma ini dikenal kuat pada data tabular."),
  H2("2.6 Evaluasi Model"),
  P("Evaluasi klasifikasi biner didasarkan pada **confusion matrix** yang berisi True Positive (TP), True Negative (TN), False Positive (FP), dan False Negative (FN). Metrik yang dipakai dalam proyek ini ditunjukkan pada Tabel 2.2."),
  TCap("Metrik evaluasi yang digunakan"),
  TableX(["Metrik", "Rumus / pengertian"], [
    ["Accuracy", "(TP + TN) / (TP + TN + FP + FN)"],
    ["Precision", "TP / (TP + FP)"],
    ["Recall", "TP / (TP + FN)"],
    ["F1-score", "2 × Precision × Recall / (Precision + Recall)"],
    ["Balanced Accuracy", "rata-rata recall kelas positif dan kelas negatif"],
    ["ROC-AUC", "luas di bawah kurva ROC; kemampuan membedakan kelas di semua ambang"],
    ["Log Loss", "−rata-rata [y·log(p) + (1−y)·log(1−p)]; menilai ketepatan angka peluang"],
    ["Brier Score", "rata-rata (p − y)²; makin kecil, makin tepat angka peluangnya"],
  ], [28, 72], { leftAll: true }),
  Space(),
  P("Pada data tidak seimbang, akurasi dapat tinggi walaupun model tidak pernah menebak kelas minoritas (He & Garcia, 2009). Karena itu metrik seperti Balanced Accuracy, F1-score, dan ROC-AUC perlu digunakan sebagai pendamping (Saito & Rehmsmeier, 2015). Log Loss dan Brier Score (Brier, 1950) dipakai untuk menilai seberapa tepat peluang yang dihasilkan."),
  H2("2.7 Pemilihan Hyperparameter dan Uji Signifikansi"),
  P("*Hyperparameter* adalah pengaturan algoritma yang tidak dipelajari dari data, misalnya jumlah tetangga k pada KNN atau kedalaman maksimum pohon. *Grid search* mencoba setiap kombinasi nilai dari ruang pencarian yang ditentukan, lalu memilih kombinasi dengan skor cross-validation terbaik (Pedregosa et al., 2011). Data yang dipakai untuk memilih hyperparameter tidak boleh sama dengan data yang dipakai untuk menilai model akhir, karena skornya akan terlihat lebih baik daripada kenyataan. Jika data terbatas, dipakai *nested cross-validation*: grid search dijalankan hanya di dalam data latih setiap fold, sedangkan data uji fold tersebut hanya dipakai untuk penilaian (Varma & Simon, 2006)."),
  P("Selisih akurasi antar-model juga perlu diuji, apakah bermakna secara statistik atau hanya kebetulan. Uji t berpasangan biasa pada hasil setiap fold terlalu mudah menyatakan dua model berbeda, karena data latih antarfold saling tumpang tindih sehingga hasilnya tidak saling bebas. Nadeau dan Bengio (2003) mengusulkan **uji t berpasangan terkoreksi** (*corrected resampled t-test*) yang memperbesar varians dengan faktor koreksi:"),
  Eq("t = d̄ / √( (1/k + n_uji / n_latih) · s²_d )"),
  P("dengan d̄ dan s²_d adalah rata-rata dan varians selisih akurasi dua model pada k fold, sedangkan n_uji/n_latih adalah perbandingan ukuran data uji dan data latih. Nilai t dibandingkan dengan distribusi t berderajat bebas k − 1. Jika p-value kurang dari 0,05, selisih kedua model dinyatakan **signifikan**."),
  H2("2.8 Streamlit"),
  P("Streamlit adalah pustaka Python sumber terbuka untuk membangun aplikasi web interaktif bagi analisis data dan *machine learning* tanpa perlu menulis HTML, CSS, atau JavaScript (Streamlit Inc., 2024). Aplikasi Streamlit dapat dipublikasikan gratis melalui Streamlit Community Cloud sehingga dapat dibuka dari peramban ponsel maupun komputer."),
];

// ---------- BAB III ----------
const bab3 = () => [
  ...BAB("III", PROP ? "Metode Penelitian" : "Metodologi"),
  H2("3.1 Alur Penelitian"),
  P(`Penelitian ${v("akan dilaksanakan", "dilaksanakan")} mengikuti tahapan CRISP-DM seperti pada Gambar 3.1.`),
  ...Img("fig_alur.png", "Alur penelitian berdasarkan CRISP-DM", 560),
  ...Numbered([
    "**Business understanding:** merumuskan kebutuhan pemain, yaitu mengetahui peluang mendapatkan S-Rank dari pity saat ini.",
    "**Data understanding:** mempelajari struktur riwayat gacha (id, jenis banner, nama item, rank, waktu), aturan banner, dan pola laju S-Rank per pity pada data asli.",
    "**Data preparation:** membersihkan data, menghitung pity dan status guaranteed, membuang data yang tidak lengkap, dan membentuk fitur.",
    "**Modeling:** memilih hyperparameter dengan grid search, melatih enam algoritma klasifikasi, dan menyusun model Markov Chain sebagai acuan teori.",
    "**Evaluation:** membandingkan model dengan cross-validation dan uji signifikansi, lalu menguji pada data pemain asli.",
    "**Deployment:** menerapkan model ke aplikasi web Streamlit.",
  ]),
  H2("3.2 Sumber Data"),
  TCap("Sumber data penelitian"),
  TableX(["Sumber", "Keterangan", "Kegunaan"], [
    ["Simulasi Monte Carlo", "400 akun virtual, 80–700 pull per banner, dibangkitkan dari model hazard (seed 42); ±314 ribu pull", "Data latih dan uji utama"],
    ["Simulasi untuk grid search", `${X.B.tuning.accounts} akun virtual tambahan (seed ${X.B.tuning.seed}); ±${Math.round(X.B.tuning.rows / 1000)} ribu baris`, "Pemilihan hyperparameter, tidak dipakai untuk evaluasi"],
    ["Data asli pemain", `${X.RD.accounts} akun (anggota kelompok dan teman), ${X.int(X.RD.pulls)} pull, ${X.RD.s_rank} S-Rank; anonim tanpa UID, nama item, dan waktu`, "Uji model simulasi, dan eksperimen latih–uji dengan data asli saja"],
  ], [24, 52, 24], { leftAll: true }),
  Space(),
  P("Simulasi dipakai karena riwayat satu akun hanya berisi ratusan pull dengan sedikit S-Rank, sehingga tidak cukup untuk melatih model. Namun, simulasi dibangkitkan dari model Markov yang memuat estimasi soft pity, sehingga model yang dilatih dengan simulasi pada dasarnya mempelajari ulang asumsi tersebut. Karena itu data asli memegang peran penting: menguji apakah model dari simulasi berlaku untuk pemain sungguhan, sekaligus memeriksa pola soft pity langsung dari data."),
  P(`Selain itu, sebagai eksperimen kedua, keenam algoritma ${v("juga akan dilatih", "juga dilatih")} dan diuji **hanya dengan data asli** (${X.int(X.B.real_cv.rows)} baris setelah pembersihan). Eksperimen ini memastikan bahwa hasil perbandingan tidak bergantung pada data simulasi, dan jumlah barisnya sudah memenuhi ketentuan dataset tabel minimal 500–1.000 baris.`),
  P("Riwayat asli diambil dengan tiga cara yang disediakan aplikasi: (1) skrip PowerShell yang membaca URL riwayat dari *cache* permainan di PC, (2) unggah berkas UIGF, dan (3) input manual. Skrip hanya membaca berkas di komputer pemain dan tidak mengirim data ke mana pun; *authkey* hanya dipakai sekali dan tidak disimpan."),
  H2("3.3 Pra-pemrosesan Data"),
  ...Bullets([
    "Hanya pull dari banner Agent dan W-Engine terbatas yang diambil.",
    "Data duplikat berdasarkan kolom id dibuang, lalu data diurutkan kronologis per akun dan per banner.",
    "Pity dan status guaranteed dihitung ulang dari urutan pull. Kalah 50/50 ditentukan dari daftar S-Rank standar.",
    "**Segmen pertama** (pull sebelum S-Rank pertama yang tercatat) dibuang, karena server hanya menyimpan riwayat beberapa bulan terakhir sehingga pity pada segmen ini bisa tidak lengkap.",
    "Riwayat yang melebihi hard pity tanpa S-Rank ditolak karena tidak masuk akal.",
  ]),
  H2("3.4 Fitur dan Target"),
  P("Setiap baris data adalah satu titik keputusan **sebelum** sebuah pull, sehingga tidak ada informasi masa depan yang bocor ke model."),
  TCap("Fitur yang digunakan"),
  TableX(["Fitur", "Keterangan"], [
    ["pity", "jumlah pull sejak S-Rank terakhir (0 sampai hard pity − 1)"],
    ["pity_ratio", "pity dibagi hard pity, agar dua banner sebanding"],
    ["guaranteed", "1 jika S-Rank berikutnya pasti rate-up, 0 jika tidak"],
    ["is_wengine", "1 untuk banner W-Engine, 0 untuk banner Agent"],
  ], [25, 75], { leftAll: true }),
  Space(),
  P("Dua tugas klasifikasi biner didefinisikan:"),
  ...Bullets([
    "**Tugas A:** apakah pull berikutnya menghasilkan S-Rank? (kelas positif ±1,7%)",
    "**Tugas B:** apakah pemain mendapat minimal satu S-Rank dalam 10 pull berikutnya (satu kali *ten-pull*)? (kelas positif ±16,6%)",
  ]),
  H2("3.5 Pemodelan"),
  P(`Setiap algoritma memiliki pengaturan tetap dan beberapa *hyperparameter* yang ${v("akan dipilih", "dipilih")} dengan *grid search* (Tabel 3.3). Nilai pertama pada setiap ruang pencarian adalah pengaturan awal sebelum grid search, sehingga jika beberapa kombinasi memperoleh skor yang sama persis, pengaturan awal dipertahankan.`),
  TCap("Algoritma, pengaturan tetap, dan ruang pencarian grid search"),
  TableX(["Algoritma", "Pengaturan tetap", "Ruang pencarian grid search"], [
    ["Naive Bayes", "Gaussian Naive Bayes", X.grid("Naive Bayes")],
    ["KNN", "normalisasi StandardScaler, jarak Euclidean", X.grid("KNN")],
    ["Logistic Regression", "normalisasi StandardScaler, max_iter 2000", X.grid("Logistic Regression")],
    ["Decision Tree", "indeks Gini", X.grid("Decision Tree")],
    ["Random Forest", "150 pohon", X.grid("Random Forest")],
    ["XGBoost", "300 pohon, subsample 0,8", X.grid("XGBoost")],
    ["Pembanding: Baseline", "selalu menebak \"tidak dapat S-Rank\" (DummyClassifier)", "–"],
    ["Pembanding: Markov Chain", "peluang teoretis dari model hazard (Subbab 2.4); pada data simulasi menjadi batas atas akurasi karena data dibangkitkan dari model yang sama", "–"],
  ], [24, 38, 38], { leftAll: true, size: 19 }),
  Space(),
  H2("3.6 Skenario Evaluasi"),
  ...Bullets([
    "Data dibagi **per akun**, bukan per pull, karena pull berurutan dari akun yang sama saling berkaitan. Pembagian per pull akan membocorkan informasi antara data latih dan data uji.",
    `**Grid search** pada data simulasi: hyperparameter ${v("akan dipilih", "dipilih")} memakai ${X.B.tuning.accounts} akun simulasi tambahan (seed ${X.B.tuning.seed}) yang tidak dipakai untuk evaluasi, dengan GroupKFold ${X.B.tuning.n_splits}-fold per akun dan metrik accuracy. Pengaturan terpilih lalu dipakai untuk semua evaluasi simulasi dan model di aplikasi.`,
    "**GroupKFold 5-fold cross-validation** dipakai untuk membandingkan model secara stabil (rata-rata ± simpangan baku).",
    "**Uji signifikansi:** akurasi setiap algoritma pada kelima fold dibandingkan dengan algoritma berakurasi tertinggi memakai uji t berpasangan terkoreksi (Subbab 2.7, α = 0,05).",
    "**GroupShuffleSplit 80/20** dipakai untuk model akhir yang disimpan ke aplikasi.",
    `Model akhir diuji ulang pada **data asli ${X.RD.accounts} akun** yang tidak pernah dipakai saat pelatihan.`,
    `**Eksperimen kedua:** keenam algoritma dilatih dan diuji hanya dengan data asli (${X.int(X.B.real_cv.rows)} baris) memakai GroupKFold 5-fold yang dibagi per **siklus pity** (${X.B.real_cv.groups} siklus). Pembagian per siklus dipakai karena data asli hanya berasal dari ${X.RD.accounts} akun, dan siklus pity saling bebas karena peluang selalu kembali ke awal setelah mendapat S-Rank. Hyperparameter pada eksperimen ini dipilih dengan *nested cross-validation*: grid search dijalankan ulang di dalam data latih setiap fold (GroupKFold 4-fold per siklus), sehingga data uji tidak pernah ikut memilih pengaturan.`,
    "**Analisis pola soft pity:** laju S-Rank per rentang pull pada data asli dibandingkan dengan peluang model Markov, dan aturan Decision Tree yang dilatih dengan data asli diperiksa untuk melihat di pity berapa model memisahkan data.",
    "Prediksi kelas memakai ambang peluang 0,5. *Oversampling* (misalnya SMOTE) tidak dipakai karena tujuan utamanya adalah angka peluang yang tepat, sedangkan menambah data buatan untuk kelas minoritas akan menggeser peluang tersebut. Ketidakseimbangan kelas ditangani dengan memilih metrik yang sesuai.",
    "Metrik: Accuracy (metrik utama), Balanced Accuracy, Precision, Recall, F1-score, ROC-AUC, Log Loss, dan Brier Score.",
  ]),
  H2("3.7 Rancangan Aplikasi"),
  P("Aplikasi web dibangun dengan Streamlit, menggunakan tema gelap, dan dapat diakses dari ponsel maupun komputer. Halaman yang tersedia ditunjukkan pada Tabel 3.4."),
  TCap("Halaman aplikasi"),
  TableX(["Halaman", "Fungsi"], [
    ["Beranda", "penjelasan aplikasi dan aturan banner"],
    ["Import Data", "tiga cara input: URL dari PowerShell, unggah UIGF, input manual; tersedia data contoh"],
    ["Kalkulator Peluang", "peluang S-Rank dan S-Rank rate-up dalam N pull (Markov Chain) dan prediksi 6 algoritma"],
    ["Statistik Riwayat", "pity setiap S-Rank, rata-rata pity, menang/kalah 50/50, pity saat ini"],
    ["Perbandingan Algoritma", "tabel metrik, cross-validation, uji signifikansi, hasil grid search, latih–uji data asli, pola soft pity, kurva peluang, confusion matrix, feature importance"],
    ["Panduan & FAQ", "cara menjalankan skrip PowerShell dan tanya jawab"],
  ], [28, 72], { leftAll: true }),
  Space(),
  H2("3.8 Alat dan Bahan"),
  ...Bullets([
    "Bahasa pemrograman Python 3.12 dengan pustaka pandas, NumPy, SciPy, scikit-learn 1.9, XGBoost 3.2, dan Plotly.",
    "Streamlit 1.64 dan Streamlit Community Cloud untuk *deployment*.",
    "Pytest dan GitHub Actions untuk pengujian otomatis (106 kasus uji).",
    "Windows PowerShell untuk skrip pengambil URL riwayat.",
    "GitHub untuk penyimpanan kode sumber.",
  ]),
  ...(PROP
    ? [
        H2("3.9 Hasil Awal (Prototipe)"),
        P(`Prototipe aplikasi telah berjalan dan dapat diakses di ${APP}. Riwayat ${X.kata(X.RD.accounts)} akun asli berhasil diambil, dan pity serta status guaranteed yang dihitung aplikasi telah dicocokkan dengan tampilan di dalam permainan dan hasilnya sama. Pada uji awal tugas B, model berbasis pohon dan KNN mencapai akurasi ±${X.pct(X.val(X.B.cross_validation.scores, "XGBoost", "accuracy"), 0)} pada data simulasi dan ±${X.pct(X.B.real.XGBoost.accuracy, 0)} pada data asli. Eksperimen latih dan uji dengan data asli saja (${X.int(X.B.real_cv.rows)} baris) juga memberikan hasil serupa, dengan ${X.B.real_cv.significance.best} sebagai yang tertinggi (±${X.pct(X.val(X.B.real_cv.scores, X.B.real_cv.significance.best, "accuracy"))}). Uji coba grid search menunjukkan bahwa Naive Bayes membaik cukup besar setelah hyperparameter-nya disesuaikan, sedangkan uji signifikansi awal menunjukkan bahwa selisih antaralgoritma pada data asli yang masih sedikit belum bermakna secara statistik. Analisis awal data asli juga memperlihatkan lonjakan laju S-Rank mulai pull ke-74 pada banner Agent (dari di bawah 1% menjadi ${X.pct(X.R.softpity.ranges.find((r) => r.banner === "agent" && r.lo === 74).rate)}) dan sekitar pull ke-65 pada banner W-Engine, sesuai dengan estimasi soft pity yang dipakai.`),
        ...Img("app_kalkulator.png", "Prototipe halaman Kalkulator Peluang", 380),
        H2("3.10 Jadwal Kegiatan"),
        TCap("Jadwal kegiatan proyek"),
        TableX(["Kegiatan", "Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"], [
          ["Studi literatur dan pemahaman aturan gacha", "✓", "", "", ""],
          ["Pengumpulan data dan pembuatan simulasi", "✓", "✓", "", ""],
          ["Pra-pemrosesan dan pembentukan fitur", "", "✓", "", ""],
          ["Pemodelan 6 algoritma dan Markov Chain", "", "✓", "✓", ""],
          ["Evaluasi dan uji data asli", "", "", "✓", ""],
          ["Deployment aplikasi Streamlit", "", "", "✓", "✓"],
          ["Penyusunan laporan dan presentasi", "", "", "", "✓"],
        ], [52, 12, 12, 12, 12]),
        Space(),
        H2("3.11 Pembagian Tugas"),
        TCap("Pembagian tugas anggota kelompok"),
        TableX(["NIM", "Nama", "Tugas"], TEAM, [24, 30, 46], { leftAll: true }),
      ]
    : []),
];

// ---------- BAB IV (laporan) ----------
// Semua angka hasil diambil dari models/report.json (lihat rep.js).
const cvA = X.A.cross_validation.scores, cvB = X.B.cross_validation.scores;
const rB = X.B.real, rcv = X.B.real_cv, man = rcv.manual;
const sigS = X.B.cross_validation.significance, sigR = rcv.significance;
const sp = X.R.softpity, root = sp.tree_root;
const acc = (sc, n, d = 2) => X.pct(X.val(sc, n, "accuracy"), d);
const tuneB = X.B.tuning.models;
const pRange = (names, sig) => names.map((n) => sig.rows[n].p);
const range = (vals, f) => `${f(Math.min(...vals))}–${f(Math.max(...vals))}`;
// pengaturan yang terpilih di setiap fold nested CV, dikelompokkan
function chosen(list) {
  const groups = [];
  list.forEach((p) => {
    const g = groups.find((x) => JSON.stringify(x.p) === JSON.stringify(p));
    g ? g.c++ : groups.push({ p, c: 1 });
  });
  return groups.sort((a, b) => b.c - a.c).map((g) => `${X.params(g.p)} (${g.c} fold)`).join("; ");
}
const others = (best) => X.ML.filter((n) => n !== best);
const and = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} dan ${xs[xs.length - 1]}`);

const bab4 = () => {
  const gain = (n) => tuneB[n].best_score - tuneB[n].manual_score;
  const softA = sp.ranges.filter((r) => r.banner === "agent");
  const softW = sp.ranges.filter((r) => r.banner === "wengine");
  const before = (rs) => rs.filter((r) => r.hi < r.soft_pity_start);
  const after = (rs) => rs.filter((r) => r.lo >= r.soft_pity_start);
  const sum = (rs, k) => rs.reduce((a, r) => a + r[k], 0);
  const nsS = others(sigS.best).filter((n) => !sigS.rows[n].significant);
  const yesS = others(sigS.best).filter((n) => sigS.rows[n].significant);
  const nsR = others(sigR.best).filter((n) => !sigR.rows[n].significant);
  // data asli: dua algoritma teratas, efek grid search, dan algoritma yang anjlok di satu fold
  const top = X.ML.slice().sort((p, q) => X.val(rcv.scores, q, "accuracy") - X.val(rcv.scores, p, "accuracy"));
  const gainReal = (n) => X.val(rcv.scores, n, "accuracy") - X.val(man, n, "accuracy");
  const gsUp = X.ML.filter((n) => gainReal(n) > 0.005), gsDown = X.ML.filter((n) => gainReal(n) < -0.005);
  const unstable = X.ML.filter((n) => Math.min(...rcv.folds[n]) < 0.85);
  const badFold = unstable.length ? rcv.folds[unstable[0]].indexOf(Math.min(...rcv.folds[unstable[0]])) : -1;
  return [
  ...BAB("IV", "Hasil dan Pembahasan"),
  H2("4.1 Implementasi Aplikasi"),
  P(`Aplikasi berhasil dipublikasikan dan dapat diakses di **${APP}**. Kode sumber tersedia di ${REPO}. Gambar 4.1 sampai Gambar 4.4 menampilkan beberapa halaman aplikasi.`),
  ...Img("app_import.png", "Halaman Import Data dengan tiga cara input", 400),
  ...Img("app_kalkulator.png", "Halaman Kalkulator Peluang", 380),
  ...Img("app_riwayat.png", "Halaman Statistik Riwayat", 400),
  ...Img("app_perb_test.png", "Halaman Perbandingan Algoritma", 360),
  H2("4.2 Validasi Pengolahan Data"),
  P(`Riwayat ${X.kata(X.RD.accounts)} akun asli diambil melalui skrip PowerShell. Pada saat pengecekan, pity yang dihitung aplikasi untuk akun pertama (permainan versi Steam), yaitu 70/90 pada banner Agent dan 46/80 dengan status guaranteed pada banner W-Engine, **sama persis** dengan yang tampil di dalam permainan. Hal ini menunjukkan bahwa pengambilan data, perhitungan pity, dan deteksi 50/50 sudah benar. Ringkasan data yang dipakai ditunjukkan pada Tabel 4.1.`),
  TCap("Ringkasan data"),
  TableX(["Keterangan", "Simulasi", "Data asli"], [
    ["Jumlah akun", X.int(X.B.dataset.sim_accounts), X.int(X.B.dataset.real_accounts)],
    ["Baris tugas A (pull berikutnya)", X.int(X.A.dataset.sim_rows), X.int(X.A.dataset.real_rows)],
    ["Baris tugas B (10 pull)", X.int(X.B.dataset.sim_rows), X.int(X.B.dataset.real_rows)],
    ["Proporsi kelas positif tugas A", X.pct(X.A.dataset.sim_positive_rate), X.pct(X.A.dataset.real_positive / X.A.dataset.real_rows)],
    ["Proporsi kelas positif tugas B", X.pct(X.B.dataset.sim_positive_rate), X.pct(X.B.dataset.real_positive / X.B.dataset.real_rows)],
    ["Data latih / uji (tugas B)", `${X.int(X.B.dataset.train_rows)} / ${X.int(X.B.dataset.test_rows)}`, `– / ${X.int(X.B.dataset.real_rows)}`],
    ["Data grid search (tugas B)", `${X.B.tuning.accounts} akun tambahan, ${X.int(X.B.tuning.rows)} baris`, "dipilih ulang di setiap fold"],
    ["Eksperimen latih–uji data asli (tugas B)", "–", `${X.int(rcv.rows)} baris, ${rcv.groups} siklus, ${rcv.n_splits}-fold`],
  ], [46, 27, 27]),
  Space(),
  H2("4.3 Hasil Grid Search"),
  P(`Grid search dijalankan pada ${X.B.tuning.accounts} akun simulasi tambahan (${X.int(X.A.tuning.rows)} baris tugas A dan ${X.int(X.B.tuning.rows)} baris tugas B) yang tidak dipakai untuk evaluasi. Hyperparameter yang terpilih ditunjukkan pada Tabel 4.2.`),
  TCap("Hyperparameter hasil grid search pada data simulasi"),
  TableX(["Algoritma", "Terpilih untuk tugas A", "Terpilih untuk tugas B", "Accuracy tugas B: awal → terpilih"],
    X.ML.map((n) => [n, X.params(X.A.tuning.models[n].best_params), X.params(tuneB[n].best_params),
      `${X.num(tuneB[n].manual_score)} → ${X.bold(X.num(tuneB[n].best_score), gain(n) > 0.01)}`]),
    [22, 27, 27, 24], { size: 19 }),
  Space(),
  ...Bullets([
    `**Naive Bayes paling diuntungkan.** Pada tugas B, ${X.params(tuneB["Naive Bayes"].best_params)} menaikkan akurasi grid search dari ${X.num(tuneB["Naive Bayes"].manual_score)} menjadi ${X.num(tuneB["Naive Bayes"].best_score)}. Nilai ini menambah varians setiap fitur sehingga peluang yang dihasilkan tidak terlalu ekstrem.`,
    `**Algoritma lain hampir tidak berubah** (kenaikan paling besar ${X.num(Math.max(...others("Naive Bayes").map(gain)) * 100, 1)} poin). Pengaturan awal KNN, Logistic Regression, Decision Tree, Random Forest, dan XGBoost sudah mendekati yang terbaik untuk data simulasi yang besar.`,
    "Pada tugas A, perbedaan akurasi antarpengaturan hanya terlihat pada desimal keempat (±98,3%), sehingga pemilihan hyperparameter hampir tidak berpengaruh.",
    "Pengaturan terpilih dipakai untuk semua hasil simulasi pada Subbab 4.4 dan 4.5 serta untuk model di aplikasi. Pada eksperimen data asli (Subbab 4.6), hyperparameter dipilih ulang di dalam setiap fold.",
  ]),
  H2("4.4 Hasil Tugas A: S-Rank di Pull Berikutnya"),
  TCap("Hasil cross-validation 5-fold tugas A (rata-rata)"),
  TableX(["Model", "Accuracy", "Bal. Acc.", "F1", "ROC-AUC", "Log Loss"],
    X.rows(["accuracy", "balanced_accuracy", "f1", "roc_auc", "log_loss"].map((key) => ({ scores: cvA, key, plain: true }))),
    [32, 13, 13, 13, 14, 15]),
  Space(),
  P(`Semua model, termasuk baseline yang selalu menebak "tidak dapat S-Rank", memperoleh akurasi sekitar **${X.pct(X.val(cvA, X.BASELINE, "accuracy"))}**. Hal ini terjadi karena S-Rank sangat jarang (±${X.pct(X.A.dataset.sim_positive_rate)}). Dengan demikian, pada tugas A akurasi **tidak dapat membedakan** model yang baik dan model yang tidak berguna. Perbedaan baru terlihat pada ROC-AUC dan Log Loss, di mana model berbasis pohon paling dekat dengan Markov Chain.`),
  H2("4.5 Hasil Tugas B: S-Rank dalam 10 Pull"),
  TCap("Hasil cross-validation 5-fold tugas B (rata-rata) dan uji data asli"),
  TableX(["Model", "Acc. simulasi", "F1 simulasi", "Log Loss simulasi", "Acc. data asli", "F1 data asli"], X.rows([
    { scores: cvB, key: "accuracy" }, { scores: cvB, key: "f1" }, { scores: cvB, key: "log_loss", lower: true },
    { scores: rB, key: "accuracy" }, { scores: rB, key: "f1" },
  ]), [30, 14, 13, 15, 14, 14], { size: 19 }),
  Space(),
  P(`Angka tebal adalah nilai terbaik di antara keenam algoritma. Pada data simulasi, Decision Tree, Random Forest, dan XGBoost memperoleh akurasi ${X.num(X.val(cvB, "Decision Tree", "accuracy"))}, diikuti KNN (${X.num(X.val(cvB, "KNN", "accuracy"))}). Menurut uji signifikansi (Subbab 4.7), keempatnya tidak berbeda nyata, sedangkan Naive Bayes (${X.num(X.val(cvB, "Naive Bayes", "accuracy"))}) dan Logistic Regression (${X.num(X.val(cvB, "Logistic Regression", "accuracy"))}) nyata lebih rendah. Akurasi pada data asli terlihat lebih tinggi (±${X.pct(rB.XGBoost.accuracy, 0)}) karena proporsi kelas positifnya lebih kecil (${X.pct(X.B.dataset.real_positive / X.B.dataset.real_rows)} dibanding ${X.pct(X.B.dataset.sim_positive_rate)}), sehingga baseline pun naik dari ${acc(cvB, X.BASELINE, 1)} menjadi ${acc(rB, X.BASELINE, 1)}. Dibandingkan dengan baseline masing-masing, keunggulan model terbaik adalah ${X.num((X.val(cvB, "XGBoost", "accuracy") - X.val(cvB, X.BASELINE, "accuracy")) * 100, 1)} poin di simulasi dan ${X.num((Math.max(...X.ML.map((n) => rB[n].accuracy)) - rB[X.BASELINE].accuracy) * 100, 1)} poin di data asli.`),
  ...Img("fig_akurasi.png", "Perbandingan akurasi tugas B pada data simulasi dan data asli", 560),
  ...Img("fig_metrik.png", "Accuracy, Balanced Accuracy, dan F1-score tugas B (cross-validation)", 560),
  ...Img("fig_cm.png", "Confusion matrix tugas B pada data uji simulasi", 560),
  H2("4.6 Hasil Latih dan Uji dengan Data Asli Saja"),
  P(`Pada eksperimen kedua, keenam algoritma dilatih dan diuji **hanya dengan data asli** (${rcv.accounts} akun, ${X.int(rcv.rows)} baris, ${rcv.positives} kelas positif pada tugas B). Data dibagi per siklus pity menjadi ${rcv.n_splits} bagian (GroupKFold ${rcv.n_splits}-fold, ${rcv.groups} siklus), sehingga pull dari satu siklus tidak pernah berada di data latih dan data uji sekaligus. Hyperparameter dipilih ulang dengan grid search di dalam data latih setiap fold (*nested cross-validation*). Hasilnya ditunjukkan pada Tabel 4.5, Tabel 4.6, dan Gambar 4.8.`),
  TCap("Hasil latih–uji dengan data asli saja, tugas B (rata-rata 5-fold, nested grid search)"),
  TableX(["Model", "Accuracy", "Bal. Acc.", "F1", "ROC-AUC", "Log Loss"], X.rows([
    { scores: rcv.scores, key: "accuracy", std: true }, { scores: rcv.scores, key: "balanced_accuracy" }, { scores: rcv.scores, key: "f1" },
    { scores: rcv.scores, key: "roc_auc" }, { scores: rcv.scores, key: "log_loss", lower: true },
  ]), [30, 20, 12, 12, 13, 13], { size: 19 }),
  Space(),
  TCap("Pengaruh grid search pada eksperimen data asli (accuracy rata-rata 5-fold)"),
  TableX(["Algoritma", "Pengaturan awal", "Nested grid search", "Pengaturan terpilih di setiap fold"],
    X.ML.map((n) => [n, X.num(X.val(man, n, "accuracy")), X.num(X.val(rcv.scores, n, "accuracy")), chosen(rcv.params[n])]),
    [22, 15, 15, 48], { size: 18 }),
  Space(),
  ...Img("fig_real_cv.png", "Akurasi enam algoritma yang dilatih dan diuji dengan data asli saja", 560),
  ...Bullets([
    `**${top[0]} dan ${top[1]} teratas:** ${top[0]} ${acc(rcv.scores, top[0])} dan ${top[1]} ${acc(rcv.scores, top[1])}. Selisih ${top[0]} dengan acuan teori Markov Chain (${acc(rcv.scores, X.MARKOV)}) hanya ${X.num((X.val(rcv.scores, X.MARKOV, "accuracy") - X.val(rcv.scores, top[0], "accuracy")) * 100, 2)} poin.`,
    `**Grid search tidak selalu membantu.** ${and(gsUp.map((n) => `${n} naik dari ${acc(man, n)} menjadi ${acc(rcv.scores, n)}`))}${gsDown.length ? `, tetapi ${and(gsDown.map((n) => `${n} turun dari ${acc(man, n)} menjadi ${acc(rcv.scores, n)}`))}` : ""}. Pengaturan dipilih hanya dari data latih setiap fold; dengan data sekecil ini, pengaturan yang terbaik di data latih belum tentu terbaik di data uji.`,
    ...(unstable.length ? [`**${and(unstable)} tidak stabil.** Pada fold ke-${badFold + 1}, akurasi ${and(unstable.map((n) => `${n} hanya ${X.pct(rcv.folds[n][badFold])}`))}, sedangkan Decision Tree dan Random Forest pada fold yang sama ${X.pct(rcv.folds["Decision Tree"][badFold])} dan ${X.pct(rcv.folds["Random Forest"][badFold])}. Data latih fold tersebut hanya memuat satu siklus Agent berstatus *guaranteed*, yaitu siklus yang kebetulan mendapat S-Rank di pull ke-38. Dari satu siklus itu, ${and(unstable)} mempelajari pola keliru "guaranteed berarti S-Rank segera keluar", lalu salah menebak "dapat S-Rank" pada dua siklus guaranteed lain di data uji yang ternyata panjang. Decision Tree dan Random Forest tidak terpengaruh karena aturan min_samples_leaf mencegah cabang yang hanya didukung sedikit data. Ini contoh *overfitting* pada fitur yang tidak relevan ketika data sedikit.`] : []),
    `**Model pohon hampir tidak berubah.** Pengaturan awal Decision Tree terpilih di ${rcv.params["Decision Tree"].filter((p) => JSON.stringify(p) === JSON.stringify(rcv.params["Decision Tree"][0]) && p.max_depth === X.B.tuning.grids["Decision Tree"].max_depth[0] && p.min_samples_leaf === X.B.tuning.grids["Decision Tree"].min_samples_leaf[0]).length} dari ${rcv.n_splits} fold, dan akurasi Random Forest serta XGBoost berubah paling banyak ${X.num(Math.max(...["Random Forest", "XGBoost"].map((n) => Math.abs(X.val(rcv.scores, n, "accuracy") - X.val(man, n, "accuracy")))) * 100, 2)} poin.`,
    `**Akurasi naik, recall turun pada Naive Bayes.** Grid search memilih var_smoothing yang besar sehingga Naive Bayes lebih jarang menebak "dapat S-Rank": akurasinya naik, tetapi recall turun dari ${X.num(X.val(man, "Naive Bayes", "recall"), 2)} menjadi ${X.num(X.val(rcv.scores, "Naive Bayes", "recall"), 2)} dan Balanced Accuracy dari ${X.num(X.val(man, "Naive Bayes", "balanced_accuracy"))} menjadi ${X.num(X.val(rcv.scores, "Naive Bayes", "balanced_accuracy"))}. Hal ini terjadi karena grid search mengoptimalkan accuracy. Jika yang diutamakan adalah menangkap kelas minoritas, metrik pemilihan perlu diganti, misalnya dengan Balanced Accuracy.`,
    `Simpangan baku (±${range(X.ML.map((n) => rcv.scores[n].accuracy.std * 100), (v) => X.num(v, 1))}%) jauh lebih besar daripada pada data simulasi (±0,1–0,2%) karena jumlah data asli jauh lebih sedikit.`,
  ]),
  H2("4.7 Uji Signifikansi Antar-Model"),
  P(`Tabel 4.7 menunjukkan hasil uji t berpasangan terkoreksi (Subbab 2.7) pada tugas B. Setiap model dibandingkan dengan algoritma berakurasi rata-rata tertinggi sebelum dibulatkan, yaitu ${sigS.best} pada data simulasi dan ${sigR.best} pada data asli. Selisih bernilai negatif berarti model tersebut lebih rendah daripada acuan, dan p-value bercetak tebal menandakan selisih yang signifikan (p < 0,05).`),
  TCap("Uji t berpasangan terkoreksi tugas B (5-fold)"),
  TableX(["Model", `Selisih dari ${sigS.best} (simulasi)`, "p-value", `Selisih dari ${sigR.best} (data asli)`, "p-value"],
    X.ALL.map((n) => {
      const cell = (sig) => (n === sig.best ? ["acuan", "–"] : [`${X.pts(-sig.rows[n].diff)} poin`, X.bold(X.pnum(sig.rows[n].p), sig.rows[n].significant)]);
      return [X.label(n), ...cell(sigS), ...cell(sigR)];
    }), [30, 20, 13, 22, 15], { size: 19 }),
  Space(),
  ...Bullets([
    `**Data simulasi:** ${and(nsS)} tidak berbeda nyata dari ${sigS.best} (p ≥ ${X.num(Math.min(...pRange(nsS, sigS)), 2)}), begitu pula acuan teori Markov Chain (p = ${X.pnum(sigS.rows[X.MARKOV].p)}). ${and(yesS)} nyata lebih rendah (p ${X.pnum(Math.max(...pRange(yesS, sigS)))}). Jadi pada data yang besar, keunggulan model berbasis pohon dan KNN atas Naive Bayes dan Logistic Regression bukan kebetulan.`,
    `**Data asli:** hanya baseline yang nyata lebih rendah daripada ${sigR.best} (p = ${X.pnum(sigR.rows[X.BASELINE].p)}). Selisih ${sigR.best} dengan kelima algoritma lain (${range(nsR.map((n) => sigR.rows[n].diff * 100), (v) => X.num(v, 2))} poin) tidak signifikan (p = ${range(pRange(nsR, sigR), (v) => X.num(v, 2))}).`,
    `Dengan ${rcv.groups} siklus pity yang dibagi menjadi ${rcv.n_splits} fold, data asli belum cukup untuk membuktikan bahwa satu algoritma benar-benar lebih unggul daripada yang lain. Yang dapat disimpulkan dengan yakin adalah ${sigR.best} lebih baik daripada baseline, sedangkan urutan keenam algoritma pada data asli masih mungkin berubah jika data bertambah.`,
  ]),
  H2("4.8 Pola Soft Pity pada Data Asli"),
  P("Untuk menjawab rumusan masalah kedua, laju S-Rank per pull pada data asli dihitung untuk setiap rentang pull sejak S-Rank terakhir, lalu dibandingkan dengan rata-rata peluang model Markov pada rentang yang sama. Hasilnya ditunjukkan pada Tabel 4.8 dan Gambar 4.9."),
  TCap("Laju S-Rank per rentang pull: data asli dan model Markov"),
  TableX(["Banner", "Pull ke-", "Jumlah pull", "S-Rank", "Laju data asli", "Model Markov"],
    sp.ranges.map((r) => [r.banner === "agent" ? "Agent" : "W-Engine", `${r.lo}–${r.hi}`, X.int(r.pulls), r.s,
      X.bold(X.pct(r.rate), r.lo >= r.soft_pity_start), X.pct(r.model)]),
    [18, 14, 16, 13, 20, 19]),
  Space(),
  ...Img("fig_softpity.png", "Pola soft pity pada data asli dibandingkan model Markov", 560),
  ...Bullets([
    `**Agent:** laju S-Rank hampir nol sampai pull ke-${softA[0].soft_pity_start - 1} (${sum(before(softA), "s")} S-Rank dari ${X.int(sum(before(softA), "pulls"))} pull), lalu melonjak menjadi ${after(softA).map((r) => `${X.pct(r.rate)} pada pull ke-${r.lo}–${r.hi}`).join(" dan ")}. Pola ini sangat dekat dengan model Markov yang memakai estimasi soft pity pull ke-${softA[0].soft_pity_start}.`,
    (() => {
      const w = X.soft("wengine");
      const note = w.vs === "lebih tinggi daripada"
        ? "Hal ini mengisyaratkan bahwa peluang W-Engine setelah soft pity mungkin naik lebih cepat daripada asumsi, tetapi datanya masih terlalu sedikit untuk disimpulkan."
        : w.vs === "lebih rendah daripada"
          ? "Hal ini mengisyaratkan bahwa peluang W-Engine setelah soft pity mungkin naik lebih lambat daripada asumsi, tetapi datanya masih terlalu sedikit untuk disimpulkan."
          : "Pola ini sesuai dengan estimasi soft pity W-Engine yang dipakai, walaupun jumlah pull di rentang ini masih sedikit.";
      return `**W-Engine:** sebelum pull ke-${w.start} hanya ${w.pre.s} S-Rank dari ${X.int(w.pre.pulls)} pull (${X.pct(w.pre.rate)}), lalu ${w.post.s} dari ${w.post.pulls} pull pada pull ke-${w.start} ke atas menghasilkan S-Rank (${X.pct(w.post.rate)}), ${w.vs} model (${X.pct(w.post.model)}). ${note}`;
    })(),
    `Decision Tree yang dilatih **hanya dengan data asli** (max_depth ${root.params.max_depth}, min_samples_leaf ${root.params.min_samples_leaf}, pengaturan yang terpilih di setiap fold nested CV) memisahkan data pertama kali (akar pohon) pada ${root.feature} ${X.num(root.threshold, 3)}, yaitu pity ±${Math.round(root.agent_pity)} untuk Agent dan ±${Math.round(root.wengine_pity)} untuk W-Engine. Titik ini sekitar 8–10 pull sebelum soft pity, sama seperti Decision Tree yang dilatih dengan data simulasi (pity_ratio 0,71–0,74).`,
    "Dengan demikian, lonjakan peluang yang tidak diumumkan resmi **dapat ditemukan dari data asli**, baik melalui analisis laju S-Rank maupun oleh algoritma klasifikasi yang tidak diberi tahu tentang soft pity.",
  ]),
  H2("4.9 Pembahasan"),
  ...Numbered([
    `**Jebakan akurasi.** Pada tugas A, baseline sudah mencapai akurasi ${X.pct(X.val(cvA, X.BASELINE, "accuracy"), 2)}. Akurasi saja tidak dapat dipakai untuk menilai model pada data yang sangat tidak seimbang, sehingga diperlukan Balanced Accuracy, F1-score, ROC-AUC, dan Log Loss.`,
    `**Algoritma terbaik.** Pada tugas B, Decision Tree, Random Forest, XGBoost, dan KNN mencapai akurasi ±${acc(cvB, "XGBoost", 1)} di simulasi dan ±${range(["KNN", "Decision Tree", "Random Forest", "XGBoost"].map((n) => rB[n].accuracy * 100), (v) => X.num(v, 1))}% di data asli. Pada data simulasi, nilai ini sama dengan batas atas teori (Markov Chain) dan perbedaan di antara keempatnya tidak signifikan, sehingga keempat algoritma tersebut sudah bekerja maksimal.`,
    `**Model pohon menemukan soft pity sendiri.** Aturan Decision Tree memisahkan data di sekitar pity_ratio 0,71–0,74 pada data simulasi dan ${X.num(root.threshold, 3)} pada data asli, yaitu sekitar 10 pull sebelum soft pity, tepat saat jendela 10 pull ke depan mulai menyentuh soft pity. Model tidak pernah diberi tahu tentang soft pity (Gambar 4.10).`,
    "**Logistic Regression dan Naive Bayes kalah**, dan selisihnya signifikan pada data simulasi walaupun hyperparameter keduanya sudah dipilih dengan grid search. Logistic Regression hanya dapat membentuk kurva sigmoid yang halus sehingga tidak bisa meniru lonjakan tajam setelah soft pity. Naive Bayes mengasumsikan fitur saling bebas dan berdistribusi normal, padahal pity dan pity_ratio sangat berkaitan. Log Loss keduanya paling besar di antara keenam algoritma.",
    `**KNN setara model pohon pada data simulasi** karena fiturnya sedikit dan nilainya berulang, sehingga tetangga terdekat praktis adalah pull dengan pity yang sama. Kelemahannya, KNN menyimpan seluruh data latih, paling lambat saat prediksi, dan ${unstable.includes("KNN") ? "tidak stabil pada data asli yang kecil (Subbab 4.6)" : "nilai k harus disesuaikan dengan ukuran data (Subbab 4.6)"}.`,
    `**Fitur guaranteed hampir tidak berpengaruh** pada model yang dilatih dengan data simulasi (Gambar 4.11). Hal ini sesuai aturan permainan: guaranteed hanya menentukan S-Rank mana yang keluar, bukan kapan S-Rank keluar.${unstable.length ? ` Namun pada data asli yang kecil, fitur ini justru dapat menyesatkan ${and(unstable)} ketika siklus guaranteed di data latih hanya sedikit (Subbab 4.6).` : ""}`,
    `**Konsisten pada data asli.** Urutan kinerja algoritma pada data asli sama dengan pada simulasi, dan laju S-Rank per pull pada data asli mengikuti model Markov (Subbab 4.8). Artinya, asumsi soft pity yang dipakai simulasi tidak bertentangan dengan perilaku gacha sungguhan, dengan catatan data asli baru berasal dari ${X.RD.accounts} akun.`,
    `**Tidak bergantung pada simulasi.** Ketika dilatih dan diuji dengan data asli saja (${X.int(rcv.rows)} baris), ${top[0]} dan ${top[1]} tetap tertinggi (${range(top.slice(0, 2).map((n) => rcv.scores[n].accuracy.mean * 100), (v) => X.num(v, 1))}%), walaupun selisihnya dengan algoritma lain belum signifikan. Kesimpulan penelitian tidak berubah walaupun data simulasi tidak dipakai sama sekali.`,
    "**Pengaruh grid search.** Grid search paling berpengaruh pada Naive Bayes, yang pengaturan awalnya tidak cocok dengan data, sedangkan model berbasis pohon hampir tidak berubah. Pada data asli yang kecil, grid search di dalam setiap fold tidak selalu memilih pengaturan yang lebih baik, sehingga hasilnya perlu dibaca bersama simpangan bakunya. Kesimpulan tentang algoritma terbaik tidak berubah setelah grid search.",
    "**Nilai tambah penambangan data.** Rumus resmi tidak memuat soft pity, sedangkan algoritma klasifikasi yang hanya diberi data mampu mencapai akurasi yang mendekati acuan teori dan menemukan titik lonjakannya sendiri. Hal inilah yang tidak dapat diperoleh dari rumus resmi saja.",
  ]),
  ...Img("fig_kurva.png", "Kurva peluang mendapat S-Rank dalam 10 pull menurut setiap model", 560),
  ...Img("fig_importance.png", "Feature importance model berbasis pohon (tugas B)", 500),
  ];
};

// ---------- BAB V (laporan) ----------
const bab5 = () => [
  ...BAB("V", "Penutup"),
  H2("5.1 Kesimpulan"),
  ...Numbered([
    "Sistem pity Zenless Zone Zero dapat dimodelkan dengan Markov Chain. Dari parameter banner, aplikasi menghitung peluang mendapat S-Rank dan S-Rank rate-up dalam N pull secara langsung, dengan catatan titik soft pity masih berupa estimasi.",
    `Pola soft pity yang tidak diumumkan resmi dapat ditemukan dari data asli. Laju S-Rank Agent melonjak mulai pull ke-74 (dari di bawah 1% menjadi ${X.pct(sp.ranges.find((r) => r.banner === "agent" && r.lo === 74).rate)}) dan W-Engine sekitar pull ke-65, dan Decision Tree yang dilatih hanya dengan data asli menemukan titik pemisah yang sesuai tanpa diberi tahu.`,
    `Untuk memprediksi S-Rank dalam 10 pull berikutnya, Decision Tree, Random Forest, XGBoost, dan KNN memberikan akurasi tertinggi dan tidak berbeda nyata satu sama lain (±${acc(cvB, "XGBoost", 1)} pada simulasi, ±${range(["KNN", "Decision Tree", "Random Forest", "XGBoost"].map((n) => rB[n].accuracy * 100), (v) => X.num(v, 1))}% pada data asli), hampir menyamai acuan teori. Naive Bayes (${acc(cvB, "Naive Bayes", 1)}) dan Logistic Regression (${acc(cvB, "Logistic Regression", 1)}) nyata lebih rendah pada data simulasi walaupun hyperparameter-nya sudah dipilih dengan grid search. Saat dilatih dan diuji hanya dengan data asli (${X.int(rcv.rows)} baris), ${sigR.best} memperoleh akurasi tertinggi (${acc(rcv.scores, sigR.best)}), tetapi selisihnya dengan kelima algoritma lain belum signifikan karena data asli baru ${rcv.groups} siklus pity.`,
    "Grid search terutama memperbaiki Naive Bayes. Pada data asli yang kecil, hasil grid search tidak selalu lebih baik, dan algoritma yang fleksibel seperti KNN dapat mempelajari pola keliru dari fitur guaranteed; kesimpulan tentang algoritma terbaik tidak berubah.",
    "Pada data yang sangat tidak seimbang, akurasi saja tidak cukup; Balanced Accuracy, F1-score, ROC-AUC, dan Log Loss diperlukan.",
    `Aplikasi web berhasil dibangun dengan Streamlit dan dapat diakses dari ponsel maupun komputer di ${APP}.`,
  ]),
  H2("5.2 Keterbatasan"),
  ...Bullets([
    "Data latih utama berasal dari simulasi yang dibangkitkan dari estimasi soft pity, sehingga model yang dilatih dengan simulasi mempelajari ulang asumsi tersebut. Keterbatasan ini dikurangi dengan eksperimen dan analisis yang hanya memakai data asli.",
    `Data asli baru berasal dari ${X.RD.accounts} akun (${X.RD.s_rank} S-Rank, ${rcv.groups} siklus pity). Baris-baris dalam satu siklus saling berkaitan, sehingga informasi yang sebenarnya lebih sedikit daripada jumlah baris, dan simpangan baku hasilnya masih ±${range(X.ML.map((n) => rcv.scores[n].accuracy.std * 100), (v) => X.num(v, 1))}%. Akibatnya, uji signifikansi pada data asli memiliki daya uji yang rendah: selisih kecil antaralgoritma sulit dibuktikan walaupun mungkin ada.`,
    "Siklus berstatus guaranteed pada data asli masih sangat sedikit, sehingga algoritma yang fleksibel seperti KNN dan XGBoost dapat mempelajari pola keliru dari fitur guaranteed (Subbab 4.6).",
    "Grid search hanya mencoba ruang pencarian yang terbatas (Tabel 3.3) dan memakai accuracy sebagai metrik pemilihan, sehingga pengaturan yang terpilih belum tentu terbaik untuk metrik lain seperti Balanced Accuracy.",
    "Penentuan menang/kalah 50/50 bergantung pada daftar S-Rank standar yang harus diperbarui jika isi banner standar berubah, dan server hanya menyimpan riwayat beberapa bulan terakhir.",
  ]),
  H2("5.3 Saran"),
  ...Bullets([
    "Menambah jumlah akun data asli (minimal 5 akun, idealnya 10 akun atau lebih) agar eksperimen latih–uji dengan data asli lebih stabil dan uji signifikansi memiliki daya uji yang cukup.",
    "Memilih hyperparameter dengan metrik lain (misalnya Balanced Accuracy atau Log Loss) sesuai kebutuhan, lalu membandingkan hasilnya.",
    "Mengestimasi titik dan kenaikan soft pity, khususnya pada banner W-Engine, dari data asli yang lebih banyak sebagai pengganti estimasi komunitas.",
    "Memperluas cakupan ke banner standar, banner Bangboo, dan item A-Rank.",
    "Menyediakan cara impor riwayat langsung dari ponsel Android.",
  ]),
];

// ---------- DAFTAR PUSTAKA ----------
const pustaka = () => [
  H1plain("Daftar Pustaka"),
  ...[
    "Breiman, L. (2001). Random forests. *Machine Learning, 45*(1), 5–32.",
    "Brier, G. W. (1950). Verification of forecasts expressed in terms of probability. *Monthly Weather Review, 78*(1), 1–3.",
    "Chapman, P., Clinton, J., Kerber, R., Khabaza, T., Reinartz, T., Shearer, C., & Wirth, R. (2000). *CRISP-DM 1.0: Step-by-step data mining guide*. SPSS Inc.",
    "Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. In *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (pp. 785–794).",
    "Cover, T., & Hart, P. (1967). Nearest neighbor pattern classification. *IEEE Transactions on Information Theory, 13*(1), 21–27.",
    "Han, J., Kamber, M., & Pei, J. (2012). *Data mining: Concepts and techniques* (3rd ed.). Morgan Kaufmann.",
    "He, H., & Garcia, E. A. (2009). Learning from imbalanced data. *IEEE Transactions on Knowledge and Data Engineering, 21*(9), 1263–1284.",
    "Hosmer, D. W., Lemeshow, S., & Sturdivant, R. X. (2013). *Applied logistic regression* (3rd ed.). Wiley.",
    "HoYoverse. (2024). *Zenless Zone Zero* [Permainan video]. Menu detail Signal Search: peluang dan aturan banner.",
    "Nadeau, C., & Bengio, Y. (2003). Inference for the generalization error. *Machine Learning, 52*(3), 239–281.",
    "Norris, J. R. (1997). *Markov chains*. Cambridge University Press.",
    "Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., … Duchesnay, É. (2011). Scikit-learn: Machine learning in Python. *Journal of Machine Learning Research, 12*, 2825–2830.",
    "Quinlan, J. R. (1986). Induction of decision trees. *Machine Learning, 1*(1), 81–106.",
    "Saito, T., & Rehmsmeier, M. (2015). The precision-recall plot is more informative than the ROC plot when evaluating binary classifiers on imbalanced datasets. *PLOS ONE, 10*(3), e0118432.",
    "Streamlit Inc. (2024). *Streamlit documentation*. https://docs.streamlit.io",
    "UIGF Organization. (2024). *Uniformed Interchangeable GachaLog Format standard v4*. https://uigf.org",
    "Varma, S., & Simon, R. (2006). Bias in error estimation when using cross-validation for model selection. *BMC Bioinformatics, 7*, 91.",
  ].map((t) => new Paragraph({ children: L.runs(t), alignment: AlignmentType.JUSTIFIED, indent: { left: 709, hanging: 709 }, spacing: { line: 360, after: 120 } })),
];

const lampiran = () => [
  H1plain("Lampiran"),
  P(`**Tautan aplikasi:** ${APP}`, { noIndent: true }),
  P(`**Kode sumber:** ${REPO}`, { noIndent: true }),
  P("**Video presentasi (YouTube):** [isi tautan video masing-masing anggota]", { noIndent: true }),
  P("**Cara menjalankan secara lokal:** pasang Python 3.12, lalu jalankan perintah pip install -r requirements-dev.txt, lalu streamlit run streamlit_app.py; pengujian dijalankan dengan python -m pytest -q.", { noIndent: true }),
].filter(Boolean);

// ---------- SUSUN ----------
setBab(0);
const children = [...bab1];
bab2Start();
children.push(...bab2());
setBab(3);
children.push(...bab3());
if (!PROP) {
  setBab(4); children.push(...bab4());
  setBab(5); children.push(...bab5());
}
children.push(...pustaka());
if (!PROP) children.push(...lampiran());

// Halaman depan dibuat terakhir: Daftar Tabel/Gambar butuh semua keterangan di isi dokumen.
const front = [...cover, ...kata, ...L.TOC(), ...L.LIST("tab"), ...L.LIST("fig")];

const doc = new Document({
  creator: "Kelompok 6 A11.4502",
  lastModifiedBy: "Kelompok 6 A11.4502",
  title: JUDUL,
  features: { updateFields: true },
  styles: L.styles,
  numbering: L.numbering,
  sections: [
    // halaman depan: angka romawi, sampul tanpa nomor (tetap dihitung sebagai i)
    { properties: { titlePage: true, page: { ...L.page, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } },
      footers: { default: L.mkFooter(), first: L.blankFooter() }, children: front },
    // isi: BAB I mulai dari halaman 1
    { properties: { page: { ...L.page, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      footers: { default: L.mkFooter() }, children },
  ],
});
Packer.toBuffer(doc).then((b) => {
  fs.writeFileSync(OUT, b);
  fs.writeFileSync(OUT + ".headings.json", JSON.stringify({ headings: L.HEADINGS, captions: L.CAPTIONS }));
  console.log("wrote", OUT, b.length);
});
