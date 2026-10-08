// node gen.js proposal|laporan <output.docx>
const fs = require("fs");
const L = require("./lib");
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
const cover = [
  Center(PROP ? "**PROPOSAL PROYEK AKHIR**" : "**LAPORAN AKHIR PROYEK**", { size: 32, before: 600 }),
  Center(`**${JUDUL}**`, { size: 28, before: 360, after: 240 }),
  // logo Udinus ±4 cm, tanpa keterangan gambar
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new ImageRun({ type: "png", data: fs.readFileSync(`${process.env.FIG}/logo_udinus.png`), transformation: { width: 150, height: 150 }, altText: { title: "Logo Universitas Dian Nuswantoro", description: "Logo Universitas Dian Nuswantoro", name: "logo_udinus" } })] }),
  Center(v("Disusun untuk memenuhi Ujian Tengah Semester (UTS)", "Disusun untuk memenuhi Ujian Akhir Semester (UAS)")),
  Center("mata kuliah **Penambangan Data**", { after: 360 }),
  Center("Kelas **A11.4502** · Kelompok **6**", { after: 240 }),
  TableX(["NIM", "Nama", "Peran"], TEAM, [26, 32, 42], { width: 7600, leftAll: true, size: 22 }),
  Center("Dosen Pengampu:", { before: 480, after: 0 }),
  Center("**Ardytha Luthfiarta, M.Kom, MCS**", { after: 720 }),
  Center("**PROGRAM STUDI TEKNIK INFORMATIKA – S1**", { after: 0 }),
  Center("**FAKULTAS ILMU KOMPUTER**", { after: 0 }),
  Center("**UNIVERSITAS DIAN NUSWANTORO**", { after: 0 }),
  Center("**SEMARANG**", { after: 0 }),
  Center("**2026**", { after: 0 }),
];

// ---------- KATA PENGANTAR ----------
const kata = [
  H1plain("Kata Pengantar"),
  P(`Puji syukur kami panjatkan kepada Tuhan Yang Maha Esa karena atas rahmat-Nya kami dapat menyelesaikan ${v("proposal proyek akhir", "laporan akhir proyek")} berjudul "${JUDUL.charAt(0) + JUDUL.slice(1).toLowerCase().replace("zenless zone zero", "Zenless Zone Zero").replace("s-rank", "S-Rank")}". Dokumen ini disusun untuk memenuhi ${v("Ujian Tengah Semester", "Ujian Akhir Semester")} mata kuliah Penambangan Data.`),
  P("Kami mengucapkan terima kasih kepada Bapak Ardytha Luthfiarta, M.Kom, MCS selaku dosen pengampu yang telah memberikan materi dan arahan, serta kepada teman-teman pemain Zenless Zone Zero yang bersedia menyumbangkan riwayat gacha mereka secara anonim sebagai data uji."),
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
  H2("1.2 Rumusan Masalah"),
  ...Numbered([
    "Bagaimana menghitung peluang pemain mendapatkan S-Rank dan S-Rank *rate-up* dalam N pull berdasarkan pity dan status *guaranteed* pada banner terbatas Zenless Zone Zero?",
    "Algoritma klasifikasi manakah di antara Naive Bayes, KNN, Logistic Regression, Decision Tree, Random Forest, dan XGBoost yang paling akurat memprediksi keluarnya S-Rank?",
    "Bagaimana mengevaluasi model secara tepat pada data yang sangat tidak seimbang?",
    "Bagaimana menyajikan hasil tersebut dalam aplikasi web yang mudah diakses pengguna ponsel maupun komputer?",
  ]),
  H2("1.3 Batasan Masalah"),
  ...Bullets([
    "Banner yang diteliti hanya **banner Agent terbatas** (*Exclusive Channel*) dan **banner W-Engine terbatas** (*W-Engine Channel*). Banner standar dan Bangboo tidak dibahas.",
    "Yang diprediksi adalah keluarnya item **S-Rank**; item A-Rank dan B-Rank tidak dimodelkan.",
    "Parameter resmi (rate dasar, rate gabungan, hard pity, peluang *rate-up*) diambil dari detail banner di dalam permainan. Titik mulai *soft pity* memakai estimasi komunitas karena tidak diumumkan resmi.",
    "Data asli berasal dari riwayat akun anggota kelompok dan teman yang bersedia, dalam bentuk anonim.",
    "Aplikasi dibangun dengan Python dan Streamlit, dan pengambilan riwayat otomatis hanya tersedia untuk permainan versi PC (Windows).",
  ]),
  H2("1.4 Tujuan"),
  ...Numbered([
    "Membangun model Markov Chain untuk menghitung peluang mendapatkan S-Rank dan S-Rank *rate-up* secara eksak.",
    "Membandingkan kinerja enam algoritma klasifikasi dalam memprediksi keluarnya S-Rank.",
    "Menerapkan metrik evaluasi yang sesuai untuk data tidak seimbang, yaitu Accuracy, Balanced Accuracy, Precision, Recall, F1-score, ROC-AUC, dan Log Loss.",
    "Menyajikan seluruh hasil dalam aplikasi web yang dapat diakses dari ponsel, tablet, maupun komputer.",
  ]),
  H2("1.5 Manfaat"),
  ...Bullets([
    "**Bagi pemain:** mendapat gambaran peluang yang jelas untuk merencanakan penggunaan mata uang permainan.",
    "**Bagi mahasiswa:** menerapkan tahapan penambangan data (CRISP-DM), algoritma klasifikasi, evaluasi dengan *confusion matrix*, dan *deployment* dengan Streamlit sesuai materi perkuliahan.",
    "**Bagi keilmuan:** memberikan contoh nyata bahaya memakai akurasi sebagai satu-satunya metrik pada data tidak seimbang.",
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
  P("Klasifikasi adalah tugas *supervised learning* untuk memetakan sekumpulan fitur ke salah satu label kelas berdasarkan contoh data berlabel. Pada proyek ini, label berupa dua kelas (klasifikasi biner): **mendapat S-Rank** atau **tidak mendapat S-Rank**. Selain label, sebagian besar algoritma juga menghasilkan **peluang** masuk ke tiap kelas, yang penting untuk kasus gacha."),
  H2("2.3 Sistem Gacha dan Pity pada Zenless Zone Zero"),
  P("Fitur gacha pada Zenless Zone Zero disebut *Signal Search*. Setiap pull memiliki peluang tertentu menghasilkan item S-Rank. Parameter banner terbatas yang dipakai dalam proyek ini ditunjukkan pada Tabel 2.1."),
  TCap("Parameter banner terbatas Zenless Zone Zero"),
  TableX(["Parameter", "Agent Terbatas", "W-Engine Terbatas", "Sumber"], [
    ["Rate dasar S-Rank", "0,6%", "1,0%", "Detail banner resmi"],
    ["Rate gabungan (termasuk pity)", "1,6%", "2,0%", "Detail banner resmi"],
    ["Hard pity", "90", "80", "Detail banner resmi"],
    ["Peluang S-Rank rate-up", "50%", "75%", "Detail banner resmi"],
    ["Soft pity mulai", "pull ke-74", "pull ke-65", "Estimasi komunitas"],
  ], [34, 20, 22, 24]),
  Space(),
  P("Jika pemain mendapatkan S-Rank yang bukan *rate-up* (disebut kalah 50/50), maka S-Rank berikutnya **pasti** *rate-up*. Status ini disebut *guaranteed*. Riwayat gacha dapat diambil dari server resmi melalui URL yang memuat kunci akses sementara (*authkey*), dan dapat dipertukarkan antaraplikasi dengan format standar **UIGF** (*Uniformed Interchangeable GachaLog Format*) versi 4 (UIGF Organization, 2024)."),
  H2("2.4 Markov Chain"),
  P("Markov Chain adalah proses stokastik ketika peluang berpindah ke keadaan (*state*) berikutnya hanya bergantung pada keadaan saat ini (Norris, 1997). Sistem pity cocok dimodelkan dengan Markov Chain karena peluang mendapatkan S-Rank pada suatu pull hanya bergantung pada jumlah pull sejak S-Rank terakhir (pity) dan status *guaranteed*."),
  P("Peluang mendapatkan S-Rank pada pull ke-n, dengan syarat belum mendapat S-Rank sebelumnya, disebut *hazard* h(n):"),
  Eq("h(n) = p                                untuk n < s"),
  Eq("h(n) = min(1, p + k·(n − s + 1))   untuk n ≥ s"),
  Eq("h(hard pity) = 1"),
  P("dengan p = rate dasar, s = titik mulai soft pity, dan k = kenaikan peluang per pull. Karena nilai k tidak diumumkan, k dicari dengan **metode biseksi** sehingga rata-rata jumlah pull per S-Rank sama dengan kebalikan rate gabungan resmi (62,5 pull untuk Agent dan 50 pull untuk W-Engine). Hasilnya k ≈ 5,30% untuk Agent dan k ≈ 5,52% untuk W-Engine."),
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
  ], [28, 72], { leftAll: true }),
  Space(),
  P("Pada data tidak seimbang, akurasi dapat tinggi walaupun model tidak pernah menebak kelas minoritas (He & Garcia, 2009). Karena itu metrik seperti Balanced Accuracy, F1-score, dan ROC-AUC perlu digunakan sebagai pendamping (Saito & Rehmsmeier, 2015). Log Loss dan Brier Score (Brier, 1950) dipakai untuk menilai seberapa tepat peluang yang dihasilkan."),
  H2("2.7 Streamlit"),
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
    "**Data understanding:** mempelajari struktur riwayat gacha (id, jenis banner, nama item, rank, waktu) dan aturan banner.",
    "**Data preparation:** membersihkan data, menghitung pity dan status guaranteed, membuang data yang tidak lengkap, dan membentuk fitur.",
    "**Modeling:** melatih enam algoritma klasifikasi dan menyusun model Markov Chain sebagai acuan teori.",
    "**Evaluation:** membandingkan model dengan cross-validation dan menguji pada data pemain asli.",
    "**Deployment:** menerapkan model ke aplikasi web Streamlit.",
  ]),
  H2("3.2 Sumber Data"),
  TCap("Sumber data penelitian"),
  TableX(["Sumber", "Keterangan", "Kegunaan"], [
    ["Simulasi Monte Carlo", "400 akun virtual, 80–700 pull per banner, dibangkitkan dari model hazard (seed 42); ±314 ribu pull", "Data latih dan uji utama"],
    ["Data asli pemain", "2 akun (anggota kelompok dan teman), 1.441 pull, 22 S-Rank; anonim tanpa UID, nama item, dan waktu", "Uji model simulasi, dan eksperimen latih–uji dengan data asli saja"],
  ], [24, 52, 24], { leftAll: true }),
  Space(),
  P("Simulasi dipakai karena riwayat satu akun hanya berisi ratusan pull dengan sedikit S-Rank, sehingga tidak cukup untuk melatih model. Data asli dipakai untuk menguji apakah model yang dilatih dari simulasi tetap berlaku untuk pemain sungguhan."),
  P(`Selain itu, sebagai eksperimen kedua, keenam algoritma ${v("juga akan dilatih", "juga dilatih")} dan diuji **hanya dengan data asli** (1.209 baris setelah pembersihan). Eksperimen ini memastikan bahwa hasil perbandingan tidak bergantung pada data simulasi, dan jumlah barisnya sudah memenuhi ketentuan dataset tabel minimal 500–1.000 baris.`),
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
  TCap("Algoritma dan pengaturan utama"),
  TableX(["Algoritma", "Pengaturan utama"], [
    ["Naive Bayes", "Gaussian Naive Bayes"],
    ["KNN", "normalisasi StandardScaler, k = 101 tetangga"],
    ["Logistic Regression", "normalisasi StandardScaler, max_iter 2000"],
    ["Decision Tree", "max_depth 6, min_samples_leaf 50"],
    ["Random Forest", "150 pohon, max_depth 8, min_samples_leaf 20"],
    ["XGBoost", "300 pohon, max_depth 4, learning rate 0,05, subsample 0,8"],
    ["Pembanding: Baseline", "selalu menebak \"tidak dapat S-Rank\" (DummyClassifier)"],
    ["Pembanding: Markov Chain", "peluang teoretis dari model hazard (Subbab 2.4)"],
  ], [32, 68], { leftAll: true }),
  Space(),
  H2("3.6 Skenario Evaluasi"),
  ...Bullets([
    "Data dibagi **per akun**, bukan per pull, karena pull berurutan dari akun yang sama saling berkaitan. Pembagian per pull akan membocorkan informasi antara data latih dan data uji.",
    "**GroupKFold 5-fold cross-validation** dipakai untuk membandingkan model secara stabil (rata-rata ± simpangan baku).",
    "**GroupShuffleSplit 80/20** dipakai untuk model akhir yang disimpan ke aplikasi.",
    "Model akhir diuji ulang pada **data asli 2 akun** yang tidak pernah dipakai saat pelatihan.",
    "**Eksperimen kedua:** keenam algoritma dilatih dan diuji hanya dengan data asli (±1.200 baris) memakai GroupKFold 5-fold yang dibagi per **siklus pity** (20 siklus). Pembagian per siklus dipakai karena data asli hanya berasal dari 2 akun, dan siklus pity saling bebas karena peluang selalu kembali ke awal setelah mendapat S-Rank.",
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
    ["Perbandingan Algoritma", "tabel metrik, cross-validation, kurva peluang, confusion matrix, feature importance"],
    ["Panduan & FAQ", "cara menjalankan skrip PowerShell dan tanya jawab"],
  ], [28, 72], { leftAll: true }),
  Space(),
  H2("3.8 Alat dan Bahan"),
  ...Bullets([
    "Bahasa pemrograman Python 3.12 dengan pustaka pandas, NumPy, scikit-learn 1.9, XGBoost 3.2, dan Plotly.",
    "Streamlit 1.64 dan Streamlit Community Cloud untuk *deployment*.",
    "Pytest dan GitHub Actions untuk pengujian otomatis (87 kasus uji).",
    "Windows PowerShell untuk skrip pengambil URL riwayat.",
    "GitHub untuk penyimpanan kode sumber.",
  ]),
  ...(PROP
    ? [
        H2("3.9 Hasil Awal (Prototipe)"),
        P(`Prototipe aplikasi telah berjalan dan dapat diakses di ${APP}. Riwayat dua akun asli berhasil diambil, dan pity serta status guaranteed yang dihitung aplikasi telah dicocokkan dengan tampilan di dalam permainan dan hasilnya sama. Pada uji awal tugas B, model berbasis pohon dan KNN mencapai akurasi ±91% pada data simulasi dan ±93% pada data asli. Eksperimen latih dan uji dengan data asli saja (1.209 baris) juga memberikan hasil serupa, dengan Decision Tree sebagai yang tertinggi (±93,1%).`),
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
const bab4 = () => [
  ...BAB("IV", "Hasil dan Pembahasan"),
  H2("4.1 Implementasi Aplikasi"),
  P(`Aplikasi berhasil dipublikasikan dan dapat diakses di **${APP}**. Kode sumber tersedia di ${REPO}. Gambar 4.1 sampai Gambar 4.4 menampilkan beberapa halaman aplikasi.`),
  ...Img("app_import.png", "Halaman Import Data dengan tiga cara input", 400),
  ...Img("app_kalkulator.png", "Halaman Kalkulator Peluang", 380),
  ...Img("app_riwayat.png", "Halaman Statistik Riwayat", 400),
  ...Img("app_perb_test.png", "Halaman Perbandingan Algoritma", 360),
  H2("4.2 Validasi Pengolahan Data"),
  P("Riwayat dua akun asli diambil melalui skrip PowerShell dari permainan versi Steam. Pada saat pengecekan, pity yang dihitung aplikasi untuk akun pertama, yaitu 70/90 pada banner Agent dan 46/80 dengan status guaranteed pada banner W-Engine, **sama persis** dengan yang tampil di dalam permainan. Hal ini menunjukkan bahwa pengambilan data, perhitungan pity, dan deteksi 50/50 sudah benar."),
  TCap("Ringkasan data"),
  TableX(["Keterangan", "Simulasi", "Data asli"], [
    ["Jumlah akun", "400", "2"],
    ["Baris tugas A (pull berikutnya)", "314.159", "1.245"],
    ["Baris tugas B (10 pull)", "306.959", "1.209"],
    ["Proporsi kelas positif tugas A", "1,7%", "1,4%"],
    ["Proporsi kelas positif tugas B", "16,6%", "13,4%"],
    ["Data latih / uji (tugas B)", "242.723 / 64.236", "– / 1.209"],
    ["Eksperimen latih–uji data asli (tugas B)", "–", "1.209 baris, 20 siklus, 5-fold"],
  ], [46, 27, 27]),
  Space(),
  H2("4.3 Hasil Tugas A: S-Rank di Pull Berikutnya"),
  TCap("Hasil cross-validation 5-fold tugas A (rata-rata)"),
  TableX(["Model", "Accuracy", "Bal. Acc.", "F1", "ROC-AUC", "Log Loss"], [
    ["Baseline (selalu \"tidak S\")", "0,9828", "0,5000", "0,0000", "0,5000", "0,2768"],
    ["Markov Chain (teori)", "0,9830", "0,5184", "0,0699", "0,7890", "0,0662"],
    ["Naive Bayes", "0,9829", "0,5007", "0,0030", "0,7563", "0,0792"],
    ["KNN", "0,9829", "0,5150", "0,0574", "0,7728", "0,0985"],
    ["Logistic Regression", "0,9828", "0,5000", "0,0000", "0,7578", "0,0776"],
    ["Decision Tree", "0,9830", "0,5136", "0,0526", "0,7889", "0,0663"],
    ["Random Forest", "0,9830", "0,5151", "0,0579", "0,7877", "0,0663"],
    ["XGBoost", "0,9829", "0,5162", "0,0618", "0,7862", "0,0664"],
  ], [32, 13, 13, 13, 14, 15]),
  Space(),
  P("Semua model, termasuk baseline yang selalu menebak \"tidak dapat S-Rank\", memperoleh akurasi sekitar **98,3%**. Hal ini terjadi karena S-Rank sangat jarang (±1,7%). Dengan demikian, pada tugas A akurasi **tidak dapat membedakan** model yang baik dan model yang tidak berguna. Perbedaan baru terlihat pada ROC-AUC dan Log Loss, di mana model berbasis pohon paling dekat dengan Markov Chain."),
  H2("4.4 Hasil Tugas B: S-Rank dalam 10 Pull"),
  TCap("Hasil cross-validation 5-fold tugas B (rata-rata) dan uji data asli"),
  TableX(["Model", "Acc. simulasi", "F1 simulasi", "Log Loss simulasi", "Acc. data asli", "F1 data asli"], [
    ["Baseline (selalu \"tidak S\")", "0,8337", "0,0000", "2,6804", "0,8660", "0,0000"],
    ["Markov Chain (teori)", "0,9108", "0,6658", "0,2811", "0,9355", "0,7023"],
    ["Naive Bayes", "0,8572", "0,5855", "0,3844", "0,8751", "0,5908"],
    ["KNN", "0,9107", "0,6654", "0,2866", "**0,9347**", "**0,6973**"],
    ["Logistic Regression", "0,8888", "0,5010", "0,3625", "0,9115", "0,5114"],
    ["Decision Tree", "**0,9108**", "**0,6671**", "**0,2814**", "0,9330", "0,6873"],
    ["Random Forest", "**0,9108**", "0,6669", "0,2816", "0,9330", "0,6897"],
    ["XGBoost", "**0,9108**", "0,6661", "0,2816", "0,9338", "0,6923"],
  ], [30, 14, 13, 15, 14, 14], { size: 19 }),
  Space(),
  ...Img("fig_akurasi.png", "Perbandingan akurasi tugas B pada data simulasi dan data asli", 560),
  ...Img("fig_metrik.png", "Accuracy, Balanced Accuracy, dan F1-score tugas B (cross-validation)", 560),
  ...Img("fig_cm.png", "Confusion matrix tugas B pada data uji simulasi", 560),
  H2("4.5 Hasil Latih dan Uji dengan Data Asli Saja"),
  P("Pada eksperimen kedua, keenam algoritma dilatih dan diuji **hanya dengan data asli** (2 akun, 1.209 baris, 162 kelas positif pada tugas B). Data dibagi per siklus pity menjadi 5 bagian (GroupKFold 5-fold, 20 siklus), sehingga pull dari satu siklus tidak pernah berada di data latih dan data uji sekaligus. Hasilnya ditunjukkan pada Tabel 4.4 dan Gambar 4.8."),
  TCap("Hasil latih–uji dengan data asli saja, tugas B (rata-rata 5-fold)"),
  TableX(["Model", "Accuracy", "Bal. Acc.", "F1", "ROC-AUC", "Log Loss"], [
    ["Baseline (selalu \"tidak S\")", "0,8657 ± 0,0289", "0,5000", "0,0000", "0,5000", "2,1651"],
    ["Markov Chain (teori)", "0,9368 ± 0,0318", "0,7854", "0,6964", "0,8205", "0,2281"],
    ["Naive Bayes", "0,8788 ± 0,0299", "**0,8317**", "0,6178", "0,8964", "0,3690"],
    ["KNN", "0,8742 ± 0,0224", "0,5250", "0,0800", "0,8609", "0,4975"],
    ["Logistic Regression", "0,9069 ± 0,0429", "0,7348", "0,5335", "0,8998", "0,2879"],
    ["Decision Tree", "**0,9310 ± 0,0291**", "0,7835", "**0,6819**", "0,9021", "0,3521"],
    ["Random Forest", "0,9299 ± 0,0264", "0,7696", "0,6720", "**0,9258**", "**0,2321**"],
    ["XGBoost", "0,9222 ± 0,0348", "0,7678", "0,6370", "0,9257", "0,2495"],
  ], [30, 20, 12, 12, 13, 13], { size: 19 }),
  Space(),
  ...Img("fig_real_cv.png", "Akurasi enam algoritma yang dilatih dan diuji dengan data asli saja", 560),
  ...Bullets([
    "**Decision Tree** mencapai akurasi tertinggi (93,10%), diikuti Random Forest (92,99%) dan XGBoost (92,22%). Urutan ini sama dengan hasil pada data simulasi, dan selisih Decision Tree dengan batas teori Markov Chain (93,68%) kurang dari 1%.",
    "**Logistic Regression** mencapai 90,69%, tetap di bawah model berbasis pohon.",
    "**Naive Bayes** hanya 87,88%, tetapi Balanced Accuracy-nya tertinggi (0,8317) karena lebih sering menebak \"dapat S-Rank\" (recall ±0,76). Ini menunjukkan *trade-off* antara akurasi dan kemampuan menangkap kelas minoritas.",
    "**KNN** turun menjadi 87,42%, hampir sama dengan baseline. Nilai k = 101 tetangga terlalu besar untuk data latih ±970 baris yang hanya memuat ±130 kelas positif, sehingga tetangga terdekat hampir selalu didominasi kelas mayoritas. Hal ini menunjukkan bahwa *hyperparameter* perlu disesuaikan dengan ukuran data.",
    "Simpangan baku (±2–4%) lebih besar daripada pada data simulasi (±0,2%) karena jumlah data asli jauh lebih sedikit.",
  ]),
  H2("4.6 Pembahasan"),
  ...Numbered([
    "**Jebakan akurasi.** Pada tugas A, baseline sudah mencapai akurasi 98,28%. Akurasi saja tidak dapat dipakai untuk menilai model pada data yang sangat tidak seimbang, sehingga diperlukan Balanced Accuracy, F1-score, ROC-AUC, dan Log Loss.",
    "**Algoritma terbaik.** Pada tugas B, Decision Tree, Random Forest, XGBoost, dan KNN mencapai akurasi ±91,1% di simulasi dan ±93,3–93,5% di data asli. Nilai ini setara dengan batas teori Markov Chain, sehingga keempat algoritma tersebut sudah bekerja maksimal.",
    "**Model pohon menemukan soft pity sendiri.** Aturan Decision Tree memisahkan data di sekitar pity_ratio 0,71–0,74, yaitu sekitar 10 pull sebelum soft pity, tepat saat jendela 10 pull ke depan mulai menyentuh soft pity. Model tidak pernah diberi tahu tentang soft pity (Gambar 4.9).",
    "**Logistic Regression dan Naive Bayes kalah.** Logistic Regression hanya dapat membentuk kurva sigmoid yang halus sehingga tidak bisa meniru lonjakan tajam setelah soft pity. Naive Bayes mengasumsikan fitur saling bebas dan berdistribusi normal, padahal pity dan pity_ratio sangat berkaitan; akibatnya Log Loss-nya paling besar.",
    "**KNN setara model pohon** karena fiturnya sedikit dan nilainya berulang, sehingga tetangga terdekat praktis adalah pull dengan pity yang sama. Kelemahannya, KNN menyimpan seluruh data latih dan paling lambat saat prediksi.",
    "**Fitur guaranteed hampir tidak berpengaruh** (Gambar 4.10). Hal ini sesuai aturan permainan: guaranteed hanya menentukan S-Rank mana yang keluar, bukan kapan S-Rank keluar.",
    "**Konsisten pada data asli.** Urutan kinerja algoritma pada data asli sama dengan pada simulasi. Artinya, asumsi soft pity yang dipakai simulasi sesuai dengan perilaku gacha sungguhan.",
    "**Tidak bergantung pada simulasi.** Ketika dilatih dan diuji dengan data asli saja (1.209 baris), model berbasis pohon tetap terbaik (±92,2–93,1%). Kesimpulan penelitian tidak berubah walaupun data simulasi tidak dipakai sama sekali.",
  ]),
  ...Img("fig_kurva.png", "Kurva peluang mendapat S-Rank dalam 10 pull menurut setiap model", 560),
  ...Img("fig_importance.png", "Feature importance model berbasis pohon (tugas B)", 500),
];

// ---------- BAB V (laporan) ----------
const bab5 = () => [
  ...BAB("V", "Penutup"),
  H2("5.1 Kesimpulan"),
  ...Numbered([
    "Sistem pity Zenless Zone Zero dapat dimodelkan secara eksak dengan Markov Chain. Aplikasi memakainya untuk menghitung peluang mendapat S-Rank dan S-Rank rate-up dalam N pull.",
    "Untuk memprediksi S-Rank dalam 10 pull berikutnya, Decision Tree, Random Forest, XGBoost, dan KNN memberikan akurasi tertinggi (±91,1% pada simulasi, ±93,3–93,5% pada data asli), hampir menyamai batas teori. Logistic Regression (±88,9%) dan Naive Bayes (±85,7%) lebih rendah. Saat dilatih dan diuji hanya dengan data asli (1.209 baris), Decision Tree tetap tertinggi (93,10%), diikuti Random Forest dan XGBoost.",
    "Pada data yang sangat tidak seimbang, akurasi saja tidak cukup; Balanced Accuracy, F1-score, ROC-AUC, dan Log Loss diperlukan.",
    `Aplikasi web berhasil dibangun dengan Streamlit dan dapat diakses dari ponsel maupun komputer di ${APP}.`,
  ]),
  H2("5.2 Saran"),
  ...Bullets([
    "Menambah jumlah akun data asli agar eksperimen latih–uji dengan data asli lebih stabil (simpangan baku saat ini masih ±2–4%).",
    "Menyesuaikan *hyperparameter* (misalnya nilai k pada KNN) dengan ukuran data menggunakan *grid search*.",
    "Mengestimasi titik soft pity langsung dari data asli dalam jumlah besar sebagai pengganti estimasi komunitas.",
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
    "Norris, J. R. (1997). *Markov chains*. Cambridge University Press.",
    "Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., … Duchesnay, É. (2011). Scikit-learn: Machine learning in Python. *Journal of Machine Learning Research, 12*, 2825–2830.",
    "Quinlan, J. R. (1986). Induction of decision trees. *Machine Learning, 1*(1), 81–106.",
    "Saito, T., & Rehmsmeier, M. (2015). The precision-recall plot is more informative than the ROC plot when evaluating binary classifiers on imbalanced datasets. *PLOS ONE, 10*(3), e0118432.",
    "Streamlit Inc. (2024). *Streamlit documentation*. https://docs.streamlit.io",
    "UIGF Organization. (2024). *Uniformed Interchangeable GachaLog Format standard v4*. https://uigf.org",
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
