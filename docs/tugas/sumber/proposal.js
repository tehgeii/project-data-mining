// node proposal.js <output.docx>
// Proposal UTS mengikuti struktur dan format contoh proposal dari dosen:
// kertas Letter, margin 3 cm, Times New Roman 12, spasi 1,15; Ringkasan, BAB I, BAB II, Daftar Pustaka.
const fs = require("fs");
const L = require("./lib");
const X = require("./rep"); // angka hasil pelatihan dari models/report.json
const { d, runs, TableX, TCap, Img, setBab } = L;
const { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, VerticalAlign, Footer, PageNumber } = d;

const OUT = process.argv[2];
const JUDUL = "Perbandingan Algoritma Klasifikasi untuk Memprediksi Peluang Mendapatkan S-Rank pada Sistem Gacha Zenless Zone Zero Berbasis Web";
const APP = "https://project-data-mining-zzz.streamlit.app";
const REPO = "https://github.com/tehgeii/project-data-mining";
const TEAM = [
  ["Syafiq Yahya", "A11.2024.16004"],
  ["Dafi Hauzan A.H", "A11.2024.15851"],
  ["Gastiadirrijal Rafi M", "A11.2024.15842"],
  ["Zabrina Miftah Z", "A11.2024.15826"],
  ["Rayya Hasya Tamimi", "A11.2024.15804"],
];
// pembagian tugas per tahapan (Subbab 2.7); sesuaikan bila pembagian kelompok berubah
const [SYAFIQ, DAFI, GASTI, ZABRINA, RAYYA] = TEAM.map(([n]) => n);
const TUGAS = [
  ["Telaah dan studi pustaka", [ZABRINA, RAYYA]],
  ["Menyusun proposal", [ZABRINA, RAYYA, SYAFIQ]],
  ["Submit proposal", [SYAFIQ]],
  ["Mengumpulkan dataset", [DAFI]],
  ["Eksperimen (grid search, pelatihan, evaluasi)", [DAFI]],
  ["Analisa hasil eksperimen", [DAFI, ZABRINA, RAYYA]],
  ["Pembuatan aplikasi Streamlit", [DAFI]],
  ["Menyusun slide dan presentasi", [GASTI, SYAFIQ]],
  ["Menyusun laporan akhir", [ZABRINA, RAYYA]],
];
// jadwal 14 minggu: [kegiatan, minggu mulai, minggu selesai]
const JADWAL = [
  ["Pembentukan kelompok dan penentuan topik", 1, 2],
  ["Studi literatur dan aturan gacha", 2, 3],
  ["Pengumpulan data asli dan simulasi", 4, 5],
  ["Pra-pemrosesan dan pembentukan fitur", 5, 6],
  ["Penyusunan proposal", 6, 7],
  ["Grid search dan pemodelan 6 algoritma", 8, 9],
  ["Evaluasi, uji signifikansi, uji data asli", 10, 11],
  ["Pembuatan aplikasi Streamlit", 9, 12],
  ["Penyusunan laporan akhir dan presentasi", 13, 14],
];

// ---------- format (mengikuti contoh dosen) ----------
const CM = 567; // 1 cm dalam DXA
const PAGE = { size: { width: 12240, height: 15840 }, margin: { top: 3 * CM, right: 3 * CM, bottom: 3 * CM, left: 3 * CM } };
const W = 12240 - 6 * CM; // lebar isi
const LINE = 276; // spasi 1,15
const P = (text, o = {}) => new Paragraph({
  children: runs(text), alignment: o.align ?? AlignmentType.JUSTIFIED,
  indent: o.noIndent ? undefined : { firstLine: 720 }, spacing: { line: LINE, after: o.after ?? 0 },
});
const H1 = (text, o = {}) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: o.newPage, keepNext: true, spacing: { before: o.before ?? 0, after: 0, line: LINE }, children: [new TextRun(text)] });
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 120, after: 0, line: LINE }, children: [new TextRun(text)] });
let listNo = 0;
const List = (items, ref = "num") => {
  const instance = ++listNo;
  return items.map((t) => new Paragraph({ numbering: { reference: ref, level: 0, instance }, children: runs(t), alignment: AlignmentType.JUSTIFIED, spacing: { line: LINE, after: 0 } }));
};
const Eq = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60, line: LINE }, children: [new TextRun({ text, italics: true })] });
const Gap = () => new Paragraph({ spacing: { line: LINE, after: 0 }, children: [] });
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
const line = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const lines = { top: line, bottom: line, left: line, right: line };

// ---------- sitasi bernomor [n] sesuai urutan kemunculan ----------
const REFS = {
  zendle2018: "D. Zendle and P. Cairns, \"Video game loot boxes are linked to problem gambling: Results of a large-scale survey,\" *PLoS ONE*, vol. 13, no. 11, Art. no. e0206767, 2018, doi: 10.1371/journal.pone.0206767.",
  xiao2024: "L. Y. Xiao, L. L. Henderson, Y. Yang, and P. W. S. Newall, \"Gaming the system: Suboptimal compliance with loot box probability disclosure regulations in China,\" *Behavioural Public Policy*, vol. 8, no. 3, pp. 590–616, 2024, doi: 10.1017/bpp.2021.23.",
  dahlan2023: "A. I. Dahlan and R. D. Noorrizki, \"Perilaku konsumtif dalam komunitas game Genshin Impact,\" *Flourishing Journal*, vol. 3, no. 12, pp. 518–525, 2023, doi: 10.17977/um070v3i122023p518-525.",
  hoyo: "HoYoverse, *Zenless Zone Zero* [Permainan video], 2024. Menu detail Signal Search: peluang dan aturan banner.",
  singer1993: "J. D. Singer and J. B. Willett, \"It's about time: Using discrete-time survival analysis to study duration and the timing of events,\" *Journal of Educational Statistics*, vol. 18, no. 2, pp. 155–195, 1993, doi: 10.3102/10769986018002155.",
  he2009: "H. He and E. A. Garcia, \"Learning from imbalanced data,\" *IEEE Transactions on Knowledge and Data Engineering*, vol. 21, no. 9, pp. 1263–1284, 2009.",
  chicco2020: "D. Chicco and G. Jurman, \"The advantages of the Matthews correlation coefficient (MCC) over F1 score and accuracy in binary classification evaluation,\" *BMC Genomics*, vol. 21, Art. no. 6, 2020, doi: 10.1186/s12864-019-6413-7.",
  maulidah2023: "N. Maulidah, \"Prediksi peningkatan jumlah nasabah deposito berjangka menggunakan algoritma KNN, Decision Tree, Random Forest dan XGBoost,\" *InComTech: Jurnal Telekomunikasi dan Komputer*, vol. 13, no. 2, 2023, doi: 10.22441/incomtech.v13i2.16921.",
  rahmat2023: "W. A. Rahmat, S. M. Ladjamuddin, and D. T. Awaludin, \"Perbandingan algoritma Decision Tree, Random Forest dan Naive Bayes pada prediksi penilaian kepuasan penumpang maskapai pesawat menggunakan dataset Kaggle,\" *Jurnal Rekayasa Informasi*, vol. 12, no. 2, 2023.",
  chapman2000: "P. Chapman, J. Clinton, R. Kerber, T. Khabaza, T. Reinartz, C. Shearer, and R. Wirth, *CRISP-DM 1.0: Step-by-Step Data Mining Guide*. SPSS Inc., 2000.",
  uigf: "UIGF Organization, \"Uniformed Interchangeable GachaLog Format standard v4,\" 2024. [Online]. Tersedia: https://uigf.org",
  streamlit: "Streamlit Inc., \"Streamlit documentation,\" 2024. [Online]. Tersedia: https://docs.streamlit.io",
  chen2023: "C. Chen and Z. Fang, \"Gacha game analysis and design,\" *Proceedings of the ACM on Measurement and Analysis of Computing Systems*, vol. 7, no. 1, Art. no. 6, pp. 1–45, 2023, doi: 10.1145/3579438.",
  nadeau2003: "C. Nadeau and Y. Bengio, \"Inference for the generalization error,\" *Machine Learning*, vol. 52, no. 3, pp. 239–281, 2003.",
  grinsztajn2022: "L. Grinsztajn, E. Oyallon, and G. Varoquaux, \"Why do tree-based models still outperform deep learning on typical tabular data?,\" in *Advances in Neural Information Processing Systems*, vol. 35, 2022.",
  niculescu2005: "A. Niculescu-Mizil and R. Caruana, \"Predicting good probabilities with supervised learning,\" in *Proceedings of the 22nd International Conference on Machine Learning*, 2005, pp. 625–632.",
  brier1950: "G. W. Brier, \"Verification of forecasts expressed in terms of probability,\" *Monthly Weather Review*, vol. 78, no. 1, pp. 1–3, 1950.",
  norris1997: "J. R. Norris, *Markov Chains*. Cambridge: Cambridge University Press, 1997.",
  cover1967: "T. Cover and P. Hart, \"Nearest neighbor pattern classification,\" *IEEE Transactions on Information Theory*, vol. 13, no. 1, pp. 21–27, 1967.",
  hosmer2013: "D. W. Hosmer, S. Lemeshow, and R. X. Sturdivant, *Applied Logistic Regression*, 3rd ed. Hoboken: Wiley, 2013.",
  quinlan1986: "J. R. Quinlan, \"Induction of decision trees,\" *Machine Learning*, vol. 1, no. 1, pp. 81–106, 1986.",
  breiman2001: "L. Breiman, \"Random forests,\" *Machine Learning*, vol. 45, no. 1, pp. 5–32, 2001.",
  chen2016: "T. Chen and C. Guestrin, \"XGBoost: A scalable tree boosting system,\" in *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 2016, pp. 785–794.",
  varma2006: "S. Varma and R. Simon, \"Bias in error estimation when using cross-validation for model selection,\" *BMC Bioinformatics*, vol. 7, Art. no. 91, 2006.",
  pedregosa2011: "F. Pedregosa *et al.*, \"Scikit-learn: Machine learning in Python,\" *Journal of Machine Learning Research*, vol. 12, pp. 2825–2830, 2011.",
};
const ORDER = [];
const c = (...keys) => keys.map((k) => {
  if (!REFS[k]) throw new Error(`referensi tidak dikenal: ${k}`);
  if (!ORDER.includes(k)) ORDER.push(k);
  return `[${ORDER.indexOf(k) + 1}]`;
}).join(", ");

// ---------- angka dari report ----------
const cvB = X.B.cross_validation.scores, rB = X.B.real, rcv = X.B.real_cv, tuneB = X.B.tuning.models;
const accCV = (n) => X.val(cvB, n, "accuracy");
const nb = tuneB["Naive Bayes"];
const softA = X.soft("agent"), softW = X.soft("wengine");
const firstSoftA = softA.after[0];
const posA = X.pct(X.A.dataset.sim_positive_rate), posB = X.pct(X.B.dataset.sim_positive_rate);

// ---------- SAMPUL ----------
// lineRule "auto" dan ukuran huruf tanda paragraf ditulis eksplisit; tanpa itu LibreOffice
// menghitung spasi 1,15 dari huruf 12 pt sehingga baris judul 16 pt saling menimpa
const coverText = (text, size, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, run: { size, bold: o.bold ?? true }, spacing: { line: LINE, lineRule: d.LineRuleType.AUTO, after: 0, before: o.before ?? 0 }, children: [new TextRun({ text, bold: o.bold ?? true, size })] });
const coverTeam = new Table({
  width: { size: 7134, type: WidthType.DXA }, columnWidths: [734, 4105, 2295], indent: { size: 1129, type: WidthType.DXA }, borders: noBorders,
  rows: TEAM.map(([name, nim], i) => new TableRow({ children: [`${i + 1}.`, name, nim].map((t, k) => new TableCell({
    borders: noBorders, width: { size: [734, 4105, 2295][k], type: WidthType.DXA },
    children: [new Paragraph({ spacing: { line: LINE, after: 0 }, children: [new TextRun({ text: t, size: 28 })] })],
  })) })),
});
const cover = [
  coverText(JUDUL, 32),
  Gap(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 240 }, children: [new ImageRun({ type: "png", data: fs.readFileSync(`${process.env.FIG}/logo_udinus_round.png`), transformation: { width: 340, height: 340 }, altText: { title: "Logo Universitas Dian Nuswantoro", description: "Logo Universitas Dian Nuswantoro", name: "logo_udinus" } })] }),
  coverText("PENYUSUN :", 28),
  coverText("Kelompok 6, Kelas A11.4502", 24, { bold: false }),
  Gap(),
  coverTeam,
  Gap(),
  Gap(),
  coverText("UNIVERSITAS DIAN NUSWANTORO SEMARANG", 32),
  coverText("2026", 32, { before: 240 }),
];

// ---------- RINGKASAN ----------
const ringkasan = [
  H1("RINGKASAN"),
  P("Zenless Zone Zero merupakan game *free-to-play* buatan HoYoverse yang menggunakan sistem *gacha*, yaitu undian berhadiah secara acak. Item paling langka dalam game ini adalah item S-Rank dengan peluang dasar hanya 0,6% untuk karakter (*Agent*) dan 1,0% untuk senjata (*W-Engine*). Peluang tersebut akan naik setelah pemain melakukan sejumlah pull tertentu (*soft pity*), dan S-Rank pasti didapatkan pada pull ke-90 atau ke-80 (*hard pity*). Namun, pengembang tidak menjelaskan kapan *soft pity* mulai berlaku dan seberapa besar kenaikannya, sehingga pemain kesulitan memperkirakan peluangnya sendiri."),
  P(`Tujuan dari penelitian ini adalah membandingkan enam algoritma klasifikasi, yaitu Naive Bayes, K-Nearest Neighbor, Logistic Regression, Decision Tree, Random Forest, dan XGBoost dalam memprediksi keluarnya S-Rank berdasarkan nilai pity, status *guaranteed*, dan jenis banner. Sebagai pembanding digunakan model Markov Chain yang disusun dari aturan resmi game. Metode penelitian mengikuti tahapan CRISP-DM dengan data riwayat gacha asli dari ${X.RD.accounts} akun (${X.int(X.RD.pulls)} pull) dan data simulasi dari ${X.int(X.B.dataset.sim_accounts)} akun. Karena S-Rank hanya muncul sekitar ${posA} dari seluruh pull, model tidak hanya dinilai dengan akurasi, tetapi juga dengan Balanced Accuracy, F1-score, ROC-AUC, dan Log Loss.`),
  P("Luaran yang ditargetkan dari penelitian ini adalah hasil perbandingan keenam algoritma, analisis pola *soft pity* dari data pemain asli, prototipe aplikasi web berbasis Streamlit, dan laporan akhir. Hasil penelitian diharapkan dapat membantu pemain dalam merencanakan penggunaan mata uang di dalam game."),
  H1("KATA KUNCI", { before: 120 }),
  P("Data Mining; Klasifikasi; Gacha; Soft Pity; Markov Chain; Zenless Zone Zero", { noIndent: true }),
];

// ---------- BAB I ----------
setBab(1);
const bab1 = [
  H1("BAB I PENDAHULUAN", { before: 240 }),
  H2("1.1 Latar Belakang"),
  P(`*Gacha* merupakan sistem undian berhadiah yang banyak digunakan pada game digital. Pemain menukarkan mata uang di dalam game untuk melakukan satu kali undian atau *pull*, lalu mendapatkan item secara acak sesuai peluang yang sudah ditentukan oleh pengembang. Sistem ini mirip dengan *loot box* yang sering dikaitkan dengan perjudian. Survei terhadap 7.422 pemain menunjukkan bahwa semakin besar pengeluaran untuk *loot box*, semakin tinggi pula tingkat masalah judi pemainnya ${c("zendle2018")}. Beberapa negara kemudian mewajibkan pengembang untuk mengumumkan peluang hadiah, meskipun penerapannya masih belum seragam ${c("xiao2024")}. Di Indonesia sendiri, game gacha buatan HoYoverse cukup banyak dimainkan dan sudah pernah diteliti dari sisi perilaku konsumtif pemainnya ${c("dahlan2023")}.`),
  P(`Salah satu game gacha yang populer adalah Zenless Zone Zero (ZZZ) yang dirilis oleh HoYoverse pada tahun 2024 ${c("hoyo")}. Item paling langka dalam ZZZ adalah S-Rank, baik berupa karakter (*Agent*) maupun senjata (*W-Engine*). Peluang dasar untuk mendapatkan S-Rank pada banner terbatas hanya 0,6% untuk Agent dan 1,0% untuk W-Engine. Game ini menggunakan sistem pity, yaitu semakin lama pemain tidak mendapatkan S-Rank maka peluangnya akan semakin besar (*soft pity*), sampai akhirnya S-Rank pasti didapatkan pada pull ke-90 untuk Agent dan pull ke-80 untuk W-Engine (*hard pity*). Selain itu, ada aturan 50/50 pada banner Agent dan 75/25 pada banner W-Engine yang menentukan apakah S-Rank yang didapat merupakan item yang sedang dipromosikan (*rate-up*). Jika pemain kalah, S-Rank berikutnya dijamin *rate-up*, atau disebut status *guaranteed*.`),
  P("Informasi yang diberikan di dalam game hanya berupa peluang dasar, peluang gabungan (1,6% dan 2,0%), batas hard pity, dan peluang rate-up. Kapan *soft pity* mulai berlaku dan seberapa cepat peluangnya naik tidak pernah diumumkan secara resmi. Akibatnya, pemain sulit menjawab pertanyaan sederhana seperti \"kalau pity saya sekarang 70, berapa peluang saya mendapatkan S-Rank dalam 10 pull ke depan?\". Hasil setiap pull tetap acak dan tidak ada rumus resmi yang lengkap, sehingga pola tersebut hanya bisa dicari dari data riwayat gacha pemain. Data ini tersimpan di server game dan dapat diambil oleh pemain itu sendiri, sehingga dapat diolah menggunakan teknik penambangan data."),
  P(`Setiap pull memiliki hasil yang jelas, yaitu mendapatkan S-Rank atau tidak, sehingga permasalahan ini termasuk klasifikasi biner pada *supervised learning*. Cara ini juga sesuai dengan model *hazard* waktu diskrit, yaitu peluang terjadinya suatu kejadian pada setiap periode dengan syarat kejadian tersebut belum terjadi sebelumnya ${c("singer1993")}. Kendala utama dari data gacha adalah datanya sangat tidak seimbang, karena kelas "mendapat S-Rank" hanya sekitar ${posA} dari seluruh pull. Pada data seperti ini, nilai akurasi bisa terlihat tinggi walaupun model tidak pernah menebak kelas minoritas ${c("he2009", "chicco2020")}, sehingga perlu digunakan metrik evaluasi lain.`),
  P(`Algoritma klasifikasi yang tersedia cukup banyak dan masing-masing memiliki cara kerja yang berbeda. Hasil perbandingan algoritma pada penelitian sebelumnya juga berbeda-beda tergantung data yang digunakan ${c("maulidah2023", "rahmat2023")}. Oleh karena itu, penelitian ini membandingkan enam algoritma klasifikasi untuk memprediksi keluarnya S-Rank pada Zenless Zone Zero, dengan model Markov Chain sebagai acuan teori. Hasil penelitian kemudian diterapkan dalam bentuk aplikasi berbasis web agar dapat digunakan oleh pemain.`),
  H2("1.2 Rumusan Masalah"),
  ...List([
    "Bagaimana menghitung peluang pemain mendapatkan S-Rank dan S-Rank *rate-up* dalam N pull berdasarkan pity dan status *guaranteed* pada banner terbatas Zenless Zone Zero?",
    "Apakah pola kenaikan peluang (*soft pity*) yang tidak diumumkan secara resmi dapat ditemukan dari data riwayat gacha pemain?",
    "Algoritma klasifikasi manakah di antara Naive Bayes, KNN, Logistic Regression, Decision Tree, Random Forest, dan XGBoost yang paling akurat dalam memprediksi keluarnya S-Rank?",
    "Bagaimana cara mengevaluasi model dengan tepat pada data yang sangat tidak seimbang?",
    "Bagaimana menyajikan hasil penelitian dalam aplikasi web yang mudah diakses melalui HP maupun komputer?",
  ]),
  H2("1.3 Pendekatan Pemecahan Masalah"),
  P(`Penelitian ini menggunakan tahapan CRISP-DM yang terdiri dari *business understanding*, *data understanding*, *data preparation*, *modeling*, *evaluation*, dan *deployment* ${c("chapman2000")}. Permasalahan dibagi menjadi dua tugas klasifikasi. Tugas A memprediksi apakah pull berikutnya menghasilkan S-Rank, dengan kelas positif sekitar ${posA}. Tugas B memprediksi apakah pemain mendapatkan minimal satu S-Rank dalam 10 pull berikutnya, dengan kelas positif sekitar ${posB}. Tugas B dijadikan tugas utama karena kelasnya lebih seimbang dan lebih sesuai dengan kebiasaan pemain yang sering melakukan 10 pull sekaligus.`),
  P(`Data riwayat gacha asli diambil melalui aplikasi dengan tiga cara, yaitu menggunakan skrip PowerShell yang membaca URL riwayat dari *cache* game di PC, mengunggah file berformat UIGF ${c("uigf")}, atau mengisi data secara manual. Riwayat dari satu akun biasanya hanya berisi ratusan pull dengan sedikit S-Rank, sehingga data asli ditambah dengan data simulasi Monte Carlo. Setelah dibersihkan, setiap pull diubah menjadi satu baris data yang berisi nilai pity, rasio pity, status *guaranteed*, dan jenis banner. Semua fitur tersebut sudah diketahui sebelum pull dilakukan, sehingga tidak ada informasi dari masa depan yang ikut masuk ke model.`),
  P("Model Markov Chain disusun dari aturan resmi game ditambah perkiraan titik *soft pity* dari komunitas pemain, lalu digunakan sebagai acuan teori. Keenam algoritma klasifikasi tidak diberi informasi mengenai *soft pity*, sehingga dapat dilihat apakah algoritma mampu menemukan pola tersebut sendiri dari data. Hyperparameter setiap algoritma dipilih menggunakan *grid search*, kemudian kinerjanya dibandingkan menggunakan *cross-validation* dan diuji signifikansinya. Model juga diuji menggunakan data pemain asli untuk melihat apakah hasilnya tetap baik di luar data simulasi."),
  P(`Ruang lingkup penelitian dibatasi pada banner Agent terbatas (*Exclusive Channel*) dan banner W-Engine terbatas (*W-Engine Channel*), dan yang diprediksi hanya item S-Rank. Data asli berasal dari akun anggota kelompok dan teman yang bersedia, dan disimpan tanpa UID, nama item, maupun waktu. Hasil akhirnya diterapkan dalam aplikasi web menggunakan Streamlit ${c("streamlit")} yang dapat dibuka melalui HP maupun komputer, sedangkan fitur pengambilan riwayat otomatis hanya tersedia untuk game versi PC (Windows).`),
  H2("1.4 Pembaruan"),
  P(`Penelitian mengenai gacha dan *loot box* sejauh ini lebih banyak membahas perilaku pemain dan regulasi ${c("zendle2018", "xiao2024", "dahlan2023")}. Penelitian yang membahas gacha secara matematis pun lebih banyak melihat dari sisi desain dan pendapatan pengembang ${c("chen2023")}. Sementara itu, penelitian perbandingan algoritma klasifikasi di Indonesia umumnya menggunakan dataset publik seperti data pemasaran bank atau data kepuasan penumpang pesawat ${c("maulidah2023", "rahmat2023")}. Pada penelitian ini, data yang digunakan adalah riwayat gacha pemain, dengan tujuan memperkirakan aturan yang tidak diumumkan oleh pengembang.`),
  P(`Selain dari sisi data, penelitian ini juga memperhatikan cara evaluasi. Pull yang berurutan dari akun yang sama saling berkaitan, sehingga data dibagi berdasarkan akun atau siklus pity, bukan per baris. Hyperparameter dipilih tanpa menggunakan data uji, dan perbedaan akurasi antaralgoritma diuji menggunakan uji t terkoreksi ${c("nadeau2003")}. Kebaruan dari penelitian ini dapat dirangkum sebagai berikut.`),
  ...List([
    "Menggali pola *soft pity* yang tidak diumumkan secara resmi langsung dari data riwayat gacha pemain.",
    "Membandingkan enam algoritma klasifikasi dengan acuan teori Markov Chain.",
    "Menggunakan cara evaluasi yang sesuai untuk data yang berurutan dan tidak seimbang.",
    "Menerapkan hasil penelitian dalam aplikasi web yang dapat membaca riwayat gacha pemain dan menghitung peluangnya secara langsung.",
  ]),
  H2("1.5 Peta Jalan Penelitian"),
  P("Peta jalan penelitian dibagi menjadi tiga tahap yang disesuaikan dengan masa perkuliahan selama 14 minggu, seperti yang terlihat pada Gambar 1.1. Tahap pertama adalah penelitian rintisan pada minggu 1-3, yang berisi pembentukan kelompok, pemilihan topik, studi literatur, dan mempelajari aturan banner Zenless Zone Zero. Tahap kedua adalah penelitian fundamental pada minggu 4-7, yang berisi pengambilan data riwayat gacha, pembuatan data simulasi, pra-pemrosesan data, dan penyusunan proposal. Tahap ketiga adalah penelitian terapan pada minggu 8-14, yang berisi *grid search*, pelatihan model, evaluasi, analisis pola *soft pity*, pembuatan aplikasi Streamlit, serta penyusunan laporan akhir dan presentasi."),
  ...Img("fig_petajalan.png", "Peta jalan penelitian", 540),
];

// ---------- BAB II ----------
setBab(2);
const T = (headers, rows, widths) => TableX(headers, rows, widths, { width: W, leftAll: true, size: 20, mono: true });
const bab2 = [
  H1("BAB II METODE PENELITIAN", { newPage: true }),
  H2("2.1 Telaah Studi Pustaka"),
  P("Telaah pustaka dilakukan dengan menelusuri penelitian yang berkaitan dengan sistem gacha dan *loot box*, perbandingan algoritma klasifikasi, serta evaluasi model pada data yang tidak seimbang."),
  P(`Zendle dan Cairns ${c("zendle2018")} melakukan survei terhadap 7.422 pemain dan menemukan bahwa pengeluaran untuk *loot box* berkaitan dengan tingkat masalah judi. Xiao dkk. ${c("xiao2024")} meneliti 100 game iPhone terlaris di Tiongkok dan menemukan *loot box* pada 91 game, tetapi hanya 5,5% game yang menampilkan peluangnya langsung di halaman pembelian. Di Indonesia, Dahlan dan Noorrizki ${c("dahlan2023")} meneliti 19 pemain Genshin Impact dan menemukan bahwa responden cenderung tidak konsumtif, walaupun tetap ada yang melakukan *top-up* untuk mendapatkan karakter atau senjata tertentu. Chen dan Fang ${c("chen2023")} memodelkan game gacha secara matematis, termasuk sistem pity, dengan memandang keputusan pemain sebagai *Markov Decision Process* dan menganalisisnya dari sisi pendapatan pengembang. Dari penelitian-penelitian tersebut, belum ada yang memperkirakan peluang gacha dari data riwayat pemain.`),
  P(`Dari sisi algoritma, Maulidah ${c("maulidah2023")} membandingkan KNN, Decision Tree, Random Forest, dan XGBoost untuk memprediksi nasabah deposito berjangka, dan XGBoost memperoleh akurasi tertinggi sebesar 92,36%. Rahmat dkk. ${c("rahmat2023")} membandingkan Decision Tree, Random Forest, dan Naive Bayes pada data kepuasan penumpang maskapai, dengan hasil akurasi Random Forest 95%, Decision Tree 93%, dan Naive Bayes 82%. Grinsztajn dkk. ${c("grinsztajn2022")} menguji 45 dataset tabular dan menunjukkan bahwa model berbasis pohon seperti XGBoost dan Random Forest masih unggul pada data tabular berukuran menengah. Hasil-hasil tersebut menunjukkan bahwa algoritma terbaik bisa berbeda tergantung datanya, sehingga perlu diuji langsung pada data gacha.`),
  P(`Untuk evaluasi model, Chicco dan Jurman ${c("chicco2020")} menjelaskan bahwa Accuracy dan F1-score bisa memberikan hasil yang terlalu optimis pada data tidak seimbang. Niculescu-Mizil dan Caruana ${c("niculescu2005")} menemukan bahwa Naive Bayes cenderung menghasilkan peluang yang terlalu ekstrem mendekati 0 atau 1, sedangkan *bagged trees* menghasilkan peluang yang lebih baik. Karena pemain membutuhkan angka peluang dan bukan hanya tebakan ya atau tidak, penelitian ini juga menilai ketepatan peluang menggunakan Log Loss dan Brier Score ${c("brier1950")}.`),
  H2("2.2 Metode yang Diusulkan"),
  P("Alur metode yang diusulkan dapat dilihat pada Gambar 2.1. Penelitian dimulai dari pengambilan data riwayat gacha asli dan pembuatan data simulasi. Data kemudian melalui tahap pra-pemrosesan dan pembentukan fitur, lalu digunakan untuk melatih enam algoritma klasifikasi. Hasil dari setiap algoritma dievaluasi dan dibandingkan dengan model Markov Chain, kemudian model terbaik diterapkan ke dalam aplikasi web."),
  ...Img("fig_metode.png", "Alur metode yang diusulkan", 500),
  P(`Markov Chain adalah proses acak di mana peluang keadaan berikutnya hanya bergantung pada keadaan saat ini ${c("norris1997")}. Pada sistem pity, peluang mendapatkan S-Rank pada pull ke-n dengan syarat belum mendapat S-Rank sebelumnya disebut *hazard* h(n), yang dihitung dengan rumus berikut.`),
  Eq("h(n) = p,  untuk n < s"),
  Eq("h(n) = min(1, p + k(n − s + 1)),  untuk n ≥ s"),
  Eq("h(hard pity) = 1"),
  P("Keterangan: p adalah peluang dasar, s adalah titik mulai *soft pity*, dan k adalah kenaikan peluang setiap pull. Nilai k dicari menggunakan metode biseksi agar rata-rata jumlah pull untuk mendapatkan S-Rank sama dengan kebalikan dari peluang gabungan resmi. Hasilnya, k sekitar 5,30% untuk Agent dengan s = 74 dan sekitar 5,52% untuk W-Engine dengan s = 65. Nilai s ini merupakan perkiraan dari komunitas pemain dan akan diperiksa kembali menggunakan data asli."),
  P("Algoritma yang dibandingkan beserta pengaturan yang dicoba pada *grid search* dapat dilihat pada Tabel 2.1."),
  TCap("Algoritma yang dibandingkan"),
  T(["Algoritma", "Cara kerja", "Pengaturan yang dicoba"], [
    ["Naive Bayes", "menghitung peluang dengan Teorema Bayes, dengan asumsi setiap fitur saling bebas", X.grid("Naive Bayes")],
    [`KNN ${c("cover1967")}`, "mengikuti label mayoritas dari k data latih terdekat", X.grid("KNN")],
    [`Logistic Regression ${c("hosmer2013")}`, "fungsi sigmoid dari kombinasi linear fitur", X.grid("Logistic Regression")],
    [`Decision Tree ${c("quinlan1986")}`, "aturan jika-maka dari hasil pembagian data", X.grid("Decision Tree")],
    [`Random Forest ${c("breiman2001")}`, "gabungan 150 pohon keputusan dari sampel acak", X.grid("Random Forest")],
    [`XGBoost ${c("chen2016")}`, "gabungan 300 pohon yang dibangun berurutan untuk memperbaiki kesalahan pohon sebelumnya", X.grid("XGBoost")],
    ["Baseline (pembanding)", "selalu menebak \"tidak dapat S-Rank\"", "-"],
    ["Markov Chain (pembanding)", "peluang teori dari rumus hazard", "-"],
  ], [24, 42, 34]),
  Gap(),
  P(`Model dievaluasi menggunakan *confusion matrix* dengan metrik Accuracy, Balanced Accuracy, Precision, Recall, F1-score, ROC-AUC, Log Loss, dan Brier Score. Accuracy digunakan sebagai metrik utama, sedangkan metrik lainnya digunakan sebagai pendamping karena data tidak seimbang. Untuk data asli yang jumlahnya terbatas, *grid search* hanya dijalankan di dalam data latih pada setiap fold (*nested cross-validation*) agar data uji tidak ikut memengaruhi pemilihan hyperparameter ${c("varma2006")}. Perbedaan akurasi antara dua algoritma diuji menggunakan uji t berpasangan terkoreksi ${c("nadeau2003")} dengan rumus berikut.`),
  Eq("t = d̄ / √((1/k + n_uji / n_latih) × s²)"),
  P("Keterangan: d̄ adalah rata-rata selisih akurasi, s² adalah varians selisih akurasi, k adalah jumlah fold, sedangkan n_uji dan n_latih adalah jumlah data uji dan data latih. Perbedaan dinyatakan signifikan jika nilai p kurang dari 0,05. Uji ini digunakan karena data latih pada setiap fold saling tumpang tindih, sehingga uji t biasa akan terlalu mudah menyatakan bahwa dua model berbeda."),
  H2("2.3 Dataset yang Digunakan"),
  P("Penelitian ini menggunakan dua jenis data, yaitu data riwayat gacha asli dan data simulasi. Keterangan setiap data dapat dilihat pada Tabel 2.2."),
  TCap("Sumber data penelitian"),
  T(["Sumber data", "Keterangan", "Kegunaan"], [
    ["Data asli pemain", `${X.RD.accounts} akun milik anggota kelompok dan teman, ${X.int(X.RD.pulls)} pull, ${X.RD.s_rank} S-Rank, tanpa UID, nama item, dan waktu`, "pengujian model, eksperimen dengan data asli, dan analisis soft pity"],
    ["Simulasi Monte Carlo", `${X.int(X.B.dataset.sim_accounts)} akun, 80-700 pull per banner, sekitar ${Math.round(X.A.dataset.sim_rows / 1000)} ribu pull`, "data latih dan data uji utama"],
    ["Simulasi tambahan", `${X.B.tuning.accounts} akun, sekitar ${Math.round(X.B.tuning.rows / 1000)} ribu baris`, "pemilihan hyperparameter (grid search)"],
  ], [22, 46, 32]),
  Gap(),
  P(`Data simulasi digunakan karena riwayat dari satu akun hanya berisi ratusan pull dengan sedikit S-Rank. Namun, data simulasi dibuat dari model Markov yang sudah memuat perkiraan *soft pity*, sehingga model yang dilatih dengan data simulasi pada dasarnya hanya mempelajari ulang perkiraan tersebut. Oleh karena itu, data asli tetap penting untuk menguji apakah hasilnya juga berlaku pada pemain sungguhan. Data asli juga digunakan pada eksperimen kedua, yaitu melatih dan menguji keenam algoritma hanya dengan data asli sebanyak ${X.int(rcv.rows)} baris, yang sudah memenuhi ketentuan dataset minimal 500-1.000 baris. Fitur dan target yang digunakan dapat dilihat pada Tabel 2.3.`),
  TCap("Fitur dan target"),
  T(["Nama kolom", "Keterangan"], [
    ["pity", "jumlah pull sejak S-Rank terakhir"],
    ["pity_ratio", "pity dibagi hard pity, agar kedua banner bisa dibandingkan"],
    ["guaranteed", "1 jika S-Rank berikutnya pasti rate-up, 0 jika tidak"],
    ["is_wengine", "1 untuk banner W-Engine, 0 untuk banner Agent"],
    ["target tugas A", "1 jika pull berikutnya menghasilkan S-Rank"],
    ["target tugas B", "1 jika ada minimal satu S-Rank dalam 10 pull berikutnya"],
  ], [26, 74]),
  Gap(),
  P("Sebelum digunakan, data asli melalui tahap pra-pemrosesan. Data yang diambil hanya pull dari banner Agent dan W-Engine terbatas. Data yang duplikat berdasarkan kolom id dihapus, lalu data diurutkan berdasarkan waktu untuk setiap akun dan banner. Nilai pity dan status *guaranteed* kemudian dihitung ulang dari urutan pull. Pull sebelum S-Rank pertama yang tercatat juga dibuang, karena server hanya menyimpan riwayat beberapa bulan terakhir sehingga nilai pity pada bagian ini bisa tidak lengkap. Skrip pengambil riwayat hanya membaca file di komputer pemain dan tidak mengirim data ke mana pun, sedangkan kunci akses (*authkey*) hanya dipakai untuk mengambil riwayat dan tidak disimpan."),
  H2("2.4 Eksperimen"),
  P(`Eksperimen dilakukan menggunakan ${X.int(X.B.dataset.sim_rows)} baris data simulasi dari ${X.int(X.B.dataset.sim_accounts)} akun, ${X.int(X.B.tuning.rows)} baris data simulasi tambahan dari ${X.B.tuning.accounts} akun untuk *grid search*, dan ${X.int(X.B.dataset.real_rows)} baris data asli. Program dibuat menggunakan bahasa Python 3.12 dengan library pandas, NumPy, SciPy, scikit-learn ${c("pedregosa2011")}, XGBoost, dan Plotly. Aplikasi dibuat menggunakan Streamlit dan dipublikasikan melalui Streamlit Community Cloud, sedangkan kode programnya disimpan di GitHub.`),
  P(`Hyperparameter setiap algoritma dipilih menggunakan *grid search* pada data simulasi tambahan dengan GroupKFold ${X.B.tuning.n_splits}-fold. Setelah itu, model dibandingkan menggunakan GroupKFold 5-fold yang dibagi per akun, karena pull yang berurutan dari akun yang sama saling berkaitan. Akurasi setiap algoritma pada kelima fold dibandingkan dengan algoritma yang akurasinya paling tinggi menggunakan uji t terkoreksi. Model akhir dilatih dengan pembagian data 80:20 per akun, kemudian diuji pada data asli dari ${X.RD.accounts} akun yang tidak pernah digunakan saat pelatihan.`),
  P(`Pada eksperimen kedua, keenam algoritma dilatih dan diuji hanya dengan data asli menggunakan GroupKFold 5-fold yang dibagi per siklus pity (${rcv.groups} siklus), dan hyperparameter dipilih ulang pada setiap fold. Selain itu, laju S-Rank pada setiap rentang pity di data asli dibandingkan dengan peluang dari model Markov untuk melihat pola *soft pity*. Prediksi kelas menggunakan batas peluang 0,5, dan teknik *oversampling* seperti SMOTE tidak digunakan karena dapat menggeser angka peluang yang dihasilkan model.`),
  P(`Uji awal pada tugas B menunjukkan bahwa model berbasis pohon dan KNN mencapai akurasi sekitar ${X.pct(accCV("XGBoost"), 0)} pada data simulasi dan sekitar ${X.pct(rB.XGBoost.accuracy, 0)} pada data asli. Angka ini mendekati model Markov Chain, sedangkan baseline yang selalu menebak "tidak dapat S-Rank" hanya mencapai sekitar ${X.pct(accCV(X.BASELINE), 0)}. *Grid search* juga menaikkan akurasi Naive Bayes dari ${X.pct(nb.manual_score)} menjadi ${X.pct(nb.best_score)}. Pada data asli, laju S-Rank banner Agent naik dari ${X.pct(softA.pre.rate)} menjadi ${X.pct(firstSoftA.rate)} mulai pull ke-${softA.start}, sesuai dengan perkiraan *soft pity* dari komunitas. Hasil lengkapnya akan dibahas pada laporan akhir.`),
  H2("2.5 Hasil yang Diharapkan"),
  P(`Penelitian ini diharapkan dapat menghasilkan perbandingan kinerja enam algoritma klasifikasi dalam memprediksi keluarnya S-Rank, sehingga dapat diketahui algoritma yang paling sesuai untuk data gacha. Model terbaik diharapkan lebih baik daripada baseline pada Balanced Accuracy, F1-score, dan ROC-AUC, serta mendekati hasil model Markov Chain. Penelitian ini juga diharapkan dapat membuktikan apakah titik *soft pity* yang diperkirakan komunitas, yaitu pull ke-${softA.start} untuk Agent dan pull ke-${softW.start} untuk W-Engine, sesuai dengan data pemain asli.`),
  P("Bagi pemain, hasil penelitian ini dapat membantu memperkirakan peluang mendapatkan S-Rank sehingga penggunaan mata uang di dalam game dapat direncanakan dengan lebih baik. Bagi mahasiswa, penelitian ini menjadi sarana untuk menerapkan materi perkuliahan, mulai dari tahapan CRISP-DM, algoritma klasifikasi, evaluasi model, sampai *deployment* aplikasi."),
  H2("2.6 Target Capaian"),
  P(`Target capaian dari penelitian ini adalah tersusunnya model klasifikasi dari keenam algoritma untuk tugas A dan tugas B, beserta perbandingan kinerjanya pada data simulasi maupun data asli. Selain itu, penelitian ini menargetkan hasil analisis pola *soft pity* dari data pemain asli yang dibandingkan dengan model Markov Chain. Hasil penelitian akan diterapkan dalam aplikasi web Streamlit yang dapat diakses melalui HP maupun komputer, dengan fitur impor riwayat gacha, kalkulator peluang, statistik riwayat, dan perbandingan algoritma. Prototipe aplikasi sudah dapat diakses di ${APP}, dan kode programnya tersedia di ${REPO}. Luaran lainnya berupa laporan akhir dan video presentasi.`),
  H2("2.7 Anggota Tim yang Terlibat"),
  P("Anggota tim yang bertanggung jawab pada setiap tahapan penelitian sebagai berikut:", { noIndent: true }),
];

// tabel tanpa garis: a. | tugas | : | nama-nama (seperti contoh dosen)
const TW = [500, 4000, 300, W - 4800];
const tugasTable = new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: TW, borders: noBorders,
  rows: TUGAS.map(([task, names], i) => new TableRow({ cantSplit: true, children: [
    [`${String.fromCharCode(97 + i)}.`], [task], [":"], names,
  ].map((ps, k) => new TableCell({
    borders: noBorders, width: { size: TW[k], type: WidthType.DXA },
    children: ps.map((t) => new Paragraph({ spacing: { line: LINE, after: 0 }, children: [new TextRun(t)] })),
  })) })),
});

// Gantt 14 minggu
const GW = [450, 3300, ...Array(14).fill(Math.floor((W - 3750) / 14))];
GW[GW.length - 1] += W - GW.reduce((a, b) => a + b, 0);
const gCell = (text, k, o = {}) => new TableCell({
  borders: lines, width: { size: GW[k], type: WidthType.DXA }, columnSpan: o.span, rowSpan: o.rows,
  verticalAlign: VerticalAlign.CENTER, shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
  margins: { left: 40, right: 40 },
  children: [new Paragraph({ alignment: o.left ? AlignmentType.LEFT : AlignmentType.CENTER, spacing: { line: 240, after: 0 }, children: [new TextRun({ text, size: 20, bold: o.bold })] })],
});
const weeks = Array.from({ length: 14 }, (_, i) => i + 1);
const gantt = new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: GW,
  rows: [
    new TableRow({ tableHeader: true, children: [gCell("No", 0, { rows: 2, bold: true }), gCell("Nama Kegiatan", 1, { rows: 2, bold: true }), gCell("Minggu ke-", 2, { span: 14, bold: true })] }),
    new TableRow({ tableHeader: true, children: weeks.map((w) => gCell(String(w), w + 1, { bold: true })) }),
    ...JADWAL.map(([task, a, b], i) => new TableRow({ cantSplit: true, children: [
      gCell(String(i + 1), 0), gCell(task, 1, { left: true }),
      ...weeks.map((w) => gCell("", w + 1, { fill: w >= a && w <= b ? "7F7F7F" : undefined })),
    ] })),
  ],
});
const jadwal = [
  tugasTable,
  new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 240, after: 120, line: LINE }, children: [new TextRun("Jadwal Penelitian")] }),
  gantt,
];

// ---------- DAFTAR PUSTAKA ----------
const pustaka = [
  new Paragraph({ alignment: AlignmentType.CENTER, pageBreakBefore: true, spacing: { after: 240, line: LINE }, children: [new TextRun({ text: "DAFTAR PUSTAKA", bold: true, size: 28 })] }),
  ...ORDER.map((k, i) => new Paragraph({
    alignment: AlignmentType.LEFT, indent: { left: 640, hanging: 640 }, spacing: { line: LINE, after: 60 },
    children: [new TextRun(`[${i + 1}]\t`), ...runs(REFS[k])], tabStops: [{ type: d.TabStopType.LEFT, position: 640 }],
  })),
];
const unused = Object.keys(REFS).filter((k) => !ORDER.includes(k));
if (unused.length) throw new Error(`referensi tidak dikutip: ${unused.join(", ")}`);

const styles = {
  default: { document: { run: { font: "Times New Roman", size: 24 } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Times New Roman" }, paragraph: { spacing: { before: 0, after: 0 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Times New Roman" }, paragraph: { spacing: { before: 0, after: 0 }, outlineLevel: 1 } },
  ],
};
const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT] })] })] });

const doc = new Document({
  creator: "Kelompok 6 A11.4502",
  lastModifiedBy: "Kelompok 6 A11.4502",
  title: JUDUL,
  styles,
  numbering: L.numbering,
  sections: [
    { properties: { page: PAGE }, children: cover },
    { properties: { page: { ...PAGE, pageNumbers: { start: 1 } } }, footers: { default: footer }, children: [...ringkasan, ...bab1, ...bab2, ...jadwal, ...pustaka] },
  ],
});
Packer.toBuffer(doc).then((b) => {
  fs.writeFileSync(OUT, b);
  console.log("wrote", OUT, b.length, `| ${ORDER.length} pustaka`);
});
