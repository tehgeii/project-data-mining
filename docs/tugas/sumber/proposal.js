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
  coverText("Kelompok 6 – Kelas A11.4502", 24, { bold: false }),
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
  P("Zenless Zone Zero adalah permainan *free-to-play* dari HoYoverse yang memakai mekanisme *gacha*, yaitu undian berhadiah acak. Hadiah paling langka, item S-Rank, hanya memiliki peluang dasar 0,6% untuk karakter (*Agent*) dan 1,0% untuk senjata (*W-Engine*). Peluang tersebut naik setelah sejumlah pull tertentu (*soft pity*), dan S-Rank pasti didapat pada pull ke-90 atau ke-80 (*hard pity*). Pengembang tidak mengumumkan kapan *soft pity* dimulai dan seberapa cepat peluangnya naik, sehingga pemain sulit memperkirakan peluangnya sendiri. Padahal, riwayat gacha setiap pemain tersimpan di server dan dapat diambil sebagai data."),
  P(`Penelitian ini bertujuan membandingkan enam algoritma klasifikasi, yaitu Naive Bayes, K-Nearest Neighbor, Logistic Regression, Decision Tree, Random Forest, dan XGBoost, untuk memprediksi keluarnya S-Rank berdasarkan pity, status *guaranteed*, dan jenis banner. Model Markov Chain yang disusun dari parameter resmi dipakai sebagai acuan teori. Penelitian mengikuti tahapan CRISP-DM dengan data simulasi Monte Carlo ${X.int(X.B.dataset.sim_accounts)} akun dan riwayat gacha asli ${X.RD.accounts} akun (${X.int(X.RD.pulls)} pull, ${X.RD.s_rank} S-Rank). Hyperparameter dipilih dengan *grid search*, model dievaluasi dengan *cross-validation* yang dibagi per akun, dan selisih akurasi antaralgoritma diuji dengan uji t berpasangan terkoreksi. Karena S-Rank hanya sekitar ${X.pct(X.A.dataset.sim_positive_rate)} dari seluruh pull, evaluasi tidak hanya memakai Accuracy, tetapi juga Balanced Accuracy, F1-score, ROC-AUC, dan Log Loss.`),
  P(`Luaran yang ditargetkan adalah perbandingan kinerja keenam algoritma beserta uji signifikansinya, temuan pola *soft pity* langsung dari data pemain asli, aplikasi web berbasis Streamlit yang dapat diakses dari ponsel maupun komputer, serta laporan akhir. Prototipe aplikasi sudah dapat diakses di ${APP}. Hasil penelitian diharapkan membantu pemain merencanakan penggunaan mata uang permainan dan menjadi contoh penerapan penambangan data untuk menggali aturan yang tidak diumumkan dari data.`),
  H1("KATA KUNCI", { before: 120 }),
  P("Data Mining; Klasifikasi; Gacha; Soft Pity; Markov Chain; Zenless Zone Zero", { noIndent: true }),
];

// ---------- BAB I ----------
setBab(1);
const bab1 = [
  H1("BAB I PENDAHULUAN", { before: 240 }),
  H2("1.1 Latar Belakang"),
  P(`*Gacha* adalah mekanisme undian berhadiah di dalam permainan digital. Pemain menukarkan mata uang permainan untuk satu kali undian (*pull*) dan memperoleh item secara acak sesuai peluang yang ditetapkan pengembang. Mekanisme ini serupa dengan *loot box* yang banyak diteliti karena kemiripannya dengan perjudian; survei terhadap 7.422 pemain menemukan bahwa besarnya pengeluaran untuk *loot box* berkaitan dengan tingkat masalah judi ${c("zendle2018")}. Karena itu, beberapa negara mewajibkan pengembang mengumumkan peluang hadiah, walaupun kepatuhan dan cara penyajiannya masih beragam ${c("xiao2024")}. Di Indonesia, permainan gacha HoYoverse juga banyak dimainkan dan sudah diteliti dari sisi perilaku konsumtif pemainnya ${c("dahlan2023")}.`),
  P(`Salah satu permainan gacha tersebut adalah Zenless Zone Zero (ZZZ) yang dirilis HoYoverse pada tahun 2024 ${c("hoyo")}. Hadiah paling langka di ZZZ adalah item **S-Rank**, baik karakter (*Agent*) maupun senjata (*W-Engine*), dengan peluang dasar 0,6% untuk Agent dan 1,0% untuk W-Engine pada banner terbatas. Permainan ini memakai sistem **pity**: semakin lama pemain tidak mendapatkan S-Rank, peluangnya meningkat (*soft pity*) hingga S-Rank pasti didapat pada batas tertentu (*hard pity*, pull ke-90 untuk Agent dan ke-80 untuk W-Engine). Selain itu, aturan 50/50 (Agent) dan 75/25 (W-Engine) menentukan apakah S-Rank yang keluar adalah item yang sedang dipromosikan (*rate-up*). Jika kalah, S-Rank berikutnya pasti *rate-up* (status *guaranteed*).`),
  P("Detail banner di dalam permainan hanya mengumumkan rate dasar, rate gabungan (1,6% dan 2,0%), hard pity, dan peluang rate-up. Kapan *soft pity* dimulai dan seberapa cepat peluangnya naik **tidak diumumkan**, sehingga pemain sulit menjawab pertanyaan seperti \"jika pity saya sekarang 70, berapa peluang mendapatkan S-Rank dalam 10 pull berikutnya?\". Masalah ini cocok diselesaikan dengan penambangan data karena tidak ada atribut yang langsung menentukan hasil (setiap pull tetap acak) dan tidak ada rumus resmi yang lengkap. Bagian aturan yang tidak diumumkan hanya dapat diketahui dari data riwayat gacha pemain, yang tersimpan di server dan dapat diambil oleh pemain sendiri."),
  P(`Karena setiap pull memiliki label yang jelas (mendapat S-Rank atau tidak), masalah ini termasuk klasifikasi biner dalam *supervised learning*, sekaligus estimasi peluang. Pendekatan ini sejalan dengan model *hazard* waktu diskrit, yaitu peluang terjadinya suatu kejadian pada setiap periode dengan syarat kejadian itu belum terjadi sebelumnya ${c("singer1993")}. Tantangannya, data sangat tidak seimbang: kelas "mendapat S-Rank" hanya sekitar ${X.pct(X.A.dataset.sim_positive_rate)} dari seluruh pull. Pada data seperti ini, akurasi dapat tinggi walaupun model tidak pernah menebak kelas minoritas ${c("he2009", "chicco2020")}, sehingga diperlukan metrik pendamping.`),
  P(`Penambangan data menyediakan banyak algoritma klasifikasi dengan asumsi dan cara belajar yang berbeda. Hasil perbandingan algoritma pada penelitian sebelumnya juga berbeda-beda bergantung pada datanya ${c("maulidah2023", "rahmat2023")}, sehingga kinerjanya perlu dibandingkan langsung pada kasus yang sama. Berdasarkan hal tersebut, penelitian ini membandingkan enam algoritma klasifikasi untuk memprediksi keluarnya S-Rank pada Zenless Zone Zero, dengan model Markov Chain sebagai acuan teori, lalu menerapkan hasilnya dalam aplikasi berbasis web.`),
  H2("1.2 Rumusan Masalah"),
  ...List([
    "Bagaimana menghitung peluang pemain mendapatkan S-Rank dan S-Rank *rate-up* dalam N pull berdasarkan pity dan status *guaranteed* pada banner terbatas Zenless Zone Zero?",
    "Apakah pola kenaikan peluang (*soft pity*) yang tidak diumumkan resmi dapat ditemukan dari data riwayat gacha pemain?",
    "Algoritma klasifikasi manakah di antara Naive Bayes, KNN, Logistic Regression, Decision Tree, Random Forest, dan XGBoost yang paling akurat memprediksi keluarnya S-Rank?",
    "Bagaimana mengevaluasi model secara tepat pada data yang sangat tidak seimbang?",
    "Bagaimana menyajikan hasil tersebut dalam aplikasi web yang mudah diakses pengguna ponsel maupun komputer?",
  ]),
  H2("1.3 Pendekatan Pemecahan Masalah"),
  P(`Penelitian ini mengikuti kerangka CRISP-DM yang terdiri atas *business understanding*, *data understanding*, *data preparation*, *modeling*, *evaluation*, dan *deployment* ${c("chapman2000")}. Masalah dirumuskan sebagai dua tugas klasifikasi biner. **Tugas A** memprediksi apakah pull berikutnya menghasilkan S-Rank (kelas positif ±${X.pct(X.A.dataset.sim_positive_rate)}), sedangkan **tugas B** memprediksi apakah pemain mendapat minimal satu S-Rank dalam 10 pull berikutnya atau satu kali *ten-pull* (kelas positif ±${X.pct(X.B.dataset.sim_positive_rate)}). Tugas B dijadikan tugas utama karena kelasnya lebih seimbang dan lebih dekat dengan keputusan pemain.`),
  P(`Data diambil dari dua sumber. Riwayat gacha asli diambil dengan tiga cara yang disediakan aplikasi, yaitu skrip PowerShell yang membaca URL riwayat dari *cache* permainan di PC, unggah berkas berformat UIGF ${c("uigf")}, dan input manual. Karena riwayat satu akun hanya berisi ratusan pull dengan sedikit S-Rank, data asli dilengkapi dengan simulasi Monte Carlo. Setelah dibersihkan, setiap pull diubah menjadi satu baris berisi fitur pity, rasio pity, status *guaranteed*, dan jenis banner. Semua fitur sudah diketahui **sebelum** pull dilakukan, sehingga tidak ada informasi masa depan yang bocor ke model.`),
  P("Model Markov Chain disusun dari parameter resmi ditambah estimasi *soft pity* dan dipakai sebagai acuan teori. Keenam algoritma klasifikasi tidak diberi tahu tentang *soft pity*, sehingga dapat diuji apakah mampu menemukan pola tersebut sendiri dari data. Hyperparameter setiap algoritma dipilih dengan *grid search* tanpa memakai data uji, lalu kinerjanya dibandingkan dengan *cross-validation* yang dibagi per akun dan diuji signifikansinya. Model juga diuji pada data pemain asli, dan laju S-Rank per rentang pity pada data asli dibandingkan dengan model Markov untuk memeriksa pola *soft pity*."),
  P(`Penelitian dibatasi pada banner Agent terbatas (*Exclusive Channel*) dan banner W-Engine terbatas (*W-Engine Channel*), dan yang diprediksi hanya keluarnya item S-Rank. Data asli berasal dari akun anggota kelompok dan teman yang bersedia, dan disimpan dalam bentuk anonim tanpa UID, nama item, maupun waktu. Hasil akhirnya diterapkan dalam aplikasi web Streamlit ${c("streamlit")} yang dapat dibuka dari ponsel maupun komputer; pengambilan riwayat otomatis hanya tersedia untuk permainan versi PC (Windows).`),
  H2("1.4 Pembaruan"),
  P(`Penelitian tentang gacha dan *loot box* sejauh ini banyak membahas sisi perilaku dan regulasi ${c("zendle2018", "xiao2024", "dahlan2023")}, sedangkan penelitian yang memodelkan gacha secara matematis berangkat dari sudut pandang desain dan pendapatan pengembang ${c("chen2023")}. Di sisi lain, penelitian perbandingan algoritma klasifikasi di Indonesia umumnya memakai dataset publik, seperti data pemasaran bank atau kepuasan penumpang pesawat ${c("maulidah2023", "rahmat2023")}. Penelitian ini memakai data riwayat gacha pemain untuk memperkirakan aturan yang tidak diumumkan pengembang, dari sudut pandang pemain.`),
  P(`Kebaruan lainnya terletak pada cara evaluasi. Pull yang berurutan dari akun yang sama saling berkaitan, sehingga data dibagi per akun atau per siklus pity, bukan per baris. Hyperparameter dipilih tanpa menyentuh data uji, dan selisih akurasi antaralgoritma diuji dengan uji t terkoreksi yang memperhitungkan tumpang tindih data latih antarfold ${c("nadeau2003")}. Setiap algoritma juga dibandingkan dengan acuan teori Markov Chain, sehingga terlihat seberapa dekat kinerjanya dengan batas yang dapat dicapai. Secara ringkas, kebaruan penelitian ini adalah:`),
  ...List([
    "Menggali pola *soft pity* yang tidak diumumkan resmi langsung dari data riwayat gacha pemain asli.",
    "Membandingkan enam algoritma klasifikasi terhadap acuan teori Markov Chain, bukan hanya terhadap sesama algoritma.",
    "Menerapkan evaluasi yang sesuai untuk data berurutan dan tidak seimbang: pembagian per akun atau siklus pity, *nested cross-validation*, uji t terkoreksi, dan metrik pendamping selain akurasi.",
    "Menerapkan hasilnya dalam aplikasi web yang dapat mengambil riwayat gacha pemain sendiri dan langsung menghitung peluangnya.",
  ]),
  H2("1.5 Peta Jalan Penelitian"),
  P("Peta jalan penelitian ini dibagi menjadi tiga tahap yang disesuaikan dengan periode perkuliahan selama 14 minggu, seperti pada Gambar 1.1. Tahap pertama adalah penelitian rintisan pada minggu 1–3, berupa pembentukan kelompok, pemilihan topik, studi literatur tentang gacha dan algoritma klasifikasi, serta mempelajari aturan banner Zenless Zone Zero. Tahap kedua adalah penelitian fundamental pada minggu 4–7, berupa pengambilan riwayat gacha pemain asli, pembuatan data simulasi, pra-pemrosesan, pembentukan fitur, dan penyusunan proposal. Tahap ketiga adalah penelitian terapan pada minggu 8–14, berupa *grid search* dan pelatihan enam algoritma, evaluasi dan uji signifikansi, analisis pola *soft pity*, pembuatan aplikasi Streamlit, serta penyusunan laporan akhir dan presentasi."),
  ...Img("fig_petajalan.png", "Peta jalan penelitian selama 14 minggu", 520),
];

// ---------- BAB II ----------
setBab(2);
const related = [
  ["Zendle dan Cairns (2018) " + c("zendle2018"), "Survei 7.422 pemain", "Pengeluaran untuk *loot box* berkaitan dengan tingkat masalah judi"],
  ["Xiao dkk. (2024) " + c("xiao2024"), "100 game iPhone terlaris di Tiongkok; kepatuhan pengungkapan peluang", "*Loot box* ada pada 91 dari 100 game; hanya 5,5% yang menampilkan peluang langsung di halaman pembelian"],
  ["Dahlan dan Noorrizki (2023) " + c("dahlan2023"), "Survei 19 pemain Genshin Impact (HoYoverse)", "Responden cenderung tidak konsumtif, tetapi tetap ada yang membeli *top-up* untuk karakter atau senjata"],
  ["Chen dan Fang (2023) " + c("chen2023"), "Model matematis gacha; keputusan pemain sebagai *Markov Decision Process*", "Desain gacha, termasuk sistem pity, dapat dianalisis secara matematis dari sisi pendapatan pengembang"],
  ["Maulidah (2023) " + c("maulidah2023"), "Nasabah deposito berjangka (UCI); KNN, Decision Tree, Random Forest, XGBoost", "XGBoost memperoleh akurasi tertinggi, 92,36%"],
  ["Rahmat dkk. (2023) " + c("rahmat2023"), "Kepuasan penumpang maskapai (Kaggle); Decision Tree, Random Forest, Naive Bayes", "Random Forest 95%, Decision Tree 93%, Naive Bayes 82%"],
  ["Grinsztajn dkk. (2022) " + c("grinsztajn2022"), "45 dataset tabular; model berbasis pohon dan *deep learning*", "Model berbasis pohon seperti XGBoost dan Random Forest tetap unggul pada data tabular berukuran menengah"],
  ["Chicco dan Jurman (2020) " + c("chicco2020"), "Metrik evaluasi klasifikasi biner", "Accuracy dan F1-score dapat terlalu optimistis pada data tidak seimbang"],
  ["Niculescu-Mizil dan Caruana (2005) " + c("niculescu2005"), "Ketepatan peluang berbagai algoritma", "Naive Bayes mendorong peluang ke 0 atau 1, *boosting* mendistorsi peluang, sedangkan *bagged trees* relatif terkalibrasi baik"],
];
const bab2 = [
  H1("BAB II METODE PENELITIAN", { newPage: true }),
  H2("2.1 Telaah Studi Pustaka"),
  P("Telaah pustaka dilakukan terhadap penelitian tentang mekanisme gacha dan *loot box*, perbandingan algoritma klasifikasi, serta evaluasi model pada data tidak seimbang. Ringkasan penelitian terdahulu yang paling berkaitan ditunjukkan pada Tabel 2.1."),
  TCap("Ringkasan penelitian terdahulu"),
  TableX(["Peneliti", "Objek dan metode", "Hasil utama"], related, [26, 34, 40], { width: W, leftAll: true, size: 19 }),
  Gap(),
  P(`Penelitian Chen dan Fang ${c("chen2023")} serta Xiao dkk. ${c("xiao2024")} menunjukkan bahwa peluang pada gacha dirancang oleh pengembang dan tidak selalu disajikan dengan jelas kepada pemain. Penelitian Zendle dan Cairns ${c("zendle2018")} serta Dahlan dan Noorrizki ${c("dahlan2023")} menunjukkan bahwa keputusan berbelanja pada gacha berdampak nyata bagi pemain, sehingga informasi peluang yang akurat bermanfaat. Namun, penelitian-penelitian tersebut tidak memperkirakan peluang dari data riwayat gacha pemain.`),
  P(`Dari sisi algoritma, hasil perbandingan berbeda-beda bergantung pada data: XGBoost unggul pada data deposito bank ${c("maulidah2023")}, sedangkan Random Forest unggul pada data kepuasan penumpang ${c("rahmat2023")}. Secara umum, model berbasis pohon cenderung unggul pada data tabular berukuran menengah ${c("grinsztajn2022")}. Karena pemain membutuhkan angka peluang, bukan hanya tebakan ya atau tidak, ketepatan peluang juga perlu dinilai ${c("niculescu2005")}, dan karena kelas S-Rank sangat jarang, akurasi perlu didampingi metrik lain ${c("chicco2020")}. Oleh karena itu, penelitian ini membandingkan enam algoritma dari keluarga yang berbeda (probabilistik, berbasis jarak, linear, dan berbasis pohon) dan menilai ketepatan peluangnya dengan Log Loss dan Brier Score ${c("brier1950")}.`),
  H2("2.2 Metode yang Diusulkan"),
  P("Alur metode yang diusulkan ditunjukkan pada Gambar 2.1. Proses dimulai dari pengambilan riwayat gacha asli dan pembuatan data simulasi, dilanjutkan pra-pemrosesan, pembentukan fitur dan target, pemilihan hyperparameter dan pelatihan enam algoritma, evaluasi, lalu *deployment* ke aplikasi web."),
  ...Img("fig_metode.png", "Alur metode yang diusulkan", 560),
  P(`Sebagai acuan teori, sistem pity dimodelkan dengan Markov Chain, yaitu proses stokastik ketika peluang keadaan berikutnya hanya bergantung pada keadaan saat ini ${c("norris1997")}. Peluang mendapatkan S-Rank pada pull ke-n, dengan syarat belum mendapat S-Rank sebelumnya, disebut *hazard* h(n):`),
  Eq("h(n) = p untuk n < s;   h(n) = min(1, p + k·(n − s + 1)) untuk n ≥ s;   h(hard pity) = 1"),
  P("dengan p = rate dasar, s = titik mulai *soft pity*, dan k = kenaikan peluang per pull. Nilai k dicari dengan metode biseksi sehingga rata-rata jumlah pull per S-Rank sama dengan kebalikan rate gabungan resmi, yaitu k ≈ 5,30% untuk Agent (s = 74) dan k ≈ 5,52% untuk W-Engine (s = 65). Nilai s merupakan estimasi komunitas yang akan diperiksa dengan data asli.", { noIndent: true }),
  P("Keenam algoritma yang dibandingkan beserta ruang pencarian *grid search*-nya ditunjukkan pada Tabel 2.2. Nilai pertama pada setiap ruang pencarian adalah pengaturan awal sebelum *grid search*, sehingga pengaturan awal dipertahankan jika beberapa kombinasi memperoleh skor yang sama persis."),
  TCap("Algoritma yang dibandingkan dan ruang pencarian grid search"),
  TableX(["Algoritma", "Prinsip kerja dan pengaturan tetap", "Ruang pencarian grid search"], [
    ["Naive Bayes", "Teorema Bayes dengan asumsi fitur saling bebas (Gaussian)", X.grid("Naive Bayes")],
    [`KNN ${c("cover1967")}`, "mayoritas label k data latih terdekat; jarak Euclidean, fitur dinormalisasi", X.grid("KNN")],
    [`Logistic Regression ${c("hosmer2013")}`, "fungsi sigmoid dari kombinasi linear fitur; fitur dinormalisasi", X.grid("Logistic Regression")],
    [`Decision Tree ${c("quinlan1986")}`, "aturan jika–maka hasil pembagian data (indeks Gini)", X.grid("Decision Tree")],
    [`Random Forest ${c("breiman2001")}`, "gabungan 150 pohon dari sampel acak (*bagging*)", X.grid("Random Forest")],
    [`XGBoost ${c("chen2016")}`, "300 pohon berurutan yang saling memperbaiki (*gradient boosting*), subsample 0,8", X.grid("XGBoost")],
    ["Pembanding: Baseline", "selalu menebak \"tidak dapat S-Rank\"", "–"],
    ["Pembanding: Markov Chain", "peluang teoretis dari model hazard di atas", "–"],
  ], [24, 40, 36], { width: W, leftAll: true, size: 19 }),
  Gap(),
  P(`Evaluasi memakai *confusion matrix* dengan metrik Accuracy, Balanced Accuracy, Precision, Recall, F1-score, ROC-AUC, Log Loss, dan Brier Score. Accuracy dipakai sebagai metrik utama, sedangkan metrik lain dipakai sebagai pendamping karena data tidak seimbang. Jika data terbatas, hyperparameter dipilih dengan *nested cross-validation*, yaitu *grid search* dijalankan hanya di dalam data latih setiap fold ${c("varma2006")}. Selisih akurasi dua algoritma pada k fold diuji dengan uji t berpasangan terkoreksi ${c("nadeau2003")}:`),
  Eq("t = d̄ / √( (1/k + n_uji / n_latih) · s²_d )"),
  P("dengan d̄ dan s²_d adalah rata-rata dan varians selisih akurasi pada setiap fold, sedangkan n_uji/n_latih adalah perbandingan ukuran data uji dan data latih. Nilai t dibandingkan dengan distribusi t berderajat bebas k − 1, dan selisih dinyatakan signifikan jika p-value kurang dari 0,05. Uji ini dipakai karena uji t biasa terlalu mudah menyatakan dua model berbeda ketika data latih antarfold saling tumpang tindih.", { noIndent: true }),
  H2("2.3 Dataset yang Digunakan"),
  P("Penelitian ini memakai dua jenis data, yaitu riwayat gacha asli pemain dan data simulasi, seperti pada Tabel 2.3."),
  TCap("Sumber data penelitian"),
  TableX(["Sumber", "Keterangan", "Kegunaan"], [
    ["Data asli pemain", `${X.RD.accounts} akun (anggota kelompok dan teman), ${X.int(X.RD.pulls)} pull, ${X.RD.s_rank} S-Rank; anonim tanpa UID, nama item, dan waktu`, "Uji model simulasi, eksperimen latih–uji dengan data asli saja, dan analisis *soft pity*"],
    ["Simulasi Monte Carlo", `${X.int(X.B.dataset.sim_accounts)} akun virtual, 80–700 pull per banner, dibangkitkan dari model hazard (seed 42); ±${Math.round(X.A.dataset.sim_rows / 1000)} ribu pull`, "Data latih dan uji utama"],
    ["Simulasi untuk grid search", `${X.B.tuning.accounts} akun virtual tambahan (seed ${X.B.tuning.seed}); ±${Math.round(X.B.tuning.rows / 1000)} ribu baris`, "Pemilihan hyperparameter, tidak dipakai untuk evaluasi"],
  ], [22, 48, 30], { width: W, leftAll: true, size: 19 }),
  Gap(),
  P(`Simulasi dipakai karena riwayat satu akun hanya berisi ratusan pull dengan sedikit S-Rank. Namun, simulasi dibangkitkan dari model Markov yang memuat estimasi *soft pity*, sehingga model yang dilatih dengan simulasi pada dasarnya mempelajari ulang asumsi tersebut. Karena itu data asli berperan penting untuk menguji apakah hasilnya berlaku bagi pemain sungguhan dan untuk memeriksa pola *soft pity* langsung dari data. Data asli juga dipakai pada eksperimen kedua, yaitu melatih dan menguji keenam algoritma hanya dengan data asli (${X.int(rcv.rows)} baris tugas B), yang sudah memenuhi ketentuan dataset tabel minimal 500–1.000 baris. Fitur dan target yang dipakai ditunjukkan pada Tabel 2.4.`),
  TCap("Fitur dan target"),
  TableX(["Kolom", "Keterangan"], [
    ["pity", "jumlah pull sejak S-Rank terakhir (0 sampai hard pity − 1)"],
    ["pity_ratio", "pity dibagi hard pity, agar kedua banner sebanding"],
    ["guaranteed", "1 jika S-Rank berikutnya pasti rate-up, 0 jika tidak"],
    ["is_wengine", "1 untuk banner W-Engine, 0 untuk banner Agent"],
    ["Target tugas A", "1 jika pull berikutnya menghasilkan S-Rank"],
    ["Target tugas B", "1 jika ada minimal satu S-Rank dalam 10 pull berikutnya"],
  ], [24, 76], { width: W, leftAll: true, size: 19 }),
  Gap(),
  P("Tahap pra-pemrosesan meliputi:", { noIndent: true }),
  ...List([
    "Mengambil hanya pull dari banner Agent dan W-Engine terbatas, membuang data duplikat berdasarkan kolom id, lalu mengurutkan data secara kronologis per akun dan per banner.",
    "Menghitung ulang pity dan status *guaranteed* dari urutan pull; kalah 50/50 ditentukan dari daftar S-Rank standar.",
    "Membuang segmen pertama (pull sebelum S-Rank pertama yang tercatat), karena server hanya menyimpan riwayat beberapa bulan terakhir sehingga pity pada segmen ini bisa tidak lengkap.",
    "Menolak riwayat yang melebihi hard pity tanpa S-Rank karena tidak masuk akal.",
  ], "bullet"),
  P("Skrip pengambil riwayat hanya membaca berkas di komputer pemain dan tidak mengirim data ke mana pun. Kunci akses sementara (*authkey*) hanya dipakai untuk mengambil riwayat dan tidak disimpan."),
  H2("2.4 Eksperimen"),
  P(`Eksperimen memakai ${X.int(X.B.dataset.sim_rows)} baris data simulasi tugas B dari ${X.int(X.B.dataset.sim_accounts)} akun, ${X.int(X.B.tuning.rows)} baris dari ${X.B.tuning.accounts} akun simulasi tambahan untuk *grid search*, dan ${X.int(X.B.dataset.real_rows)} baris data asli. Eksperimen dijalankan dengan bahasa pemrograman Python 3.12 dan pustaka pandas, NumPy, SciPy, scikit-learn ${c("pedregosa2011")}, XGBoost, dan Plotly. Aplikasi dibangun dengan Streamlit dan dipublikasikan melalui Streamlit Community Cloud, sedangkan kode sumber disimpan di GitHub dan diperiksa otomatis dengan 106 kasus uji (pytest dan GitHub Actions). Skenario eksperimen adalah sebagai berikut:`),
  ...List([
    `**Grid search:** hyperparameter dipilih memakai ${X.B.tuning.accounts} akun simulasi tambahan dengan GroupKFold ${X.B.tuning.n_splits}-fold per akun dan metrik accuracy. Pengaturan terpilih dipakai untuk evaluasi simulasi dan model di aplikasi.`,
    "**Cross-validation:** GroupKFold 5-fold yang dibagi per akun, karena pull berurutan dari akun yang sama saling berkaitan. Pembagian per baris akan membocorkan informasi antara data latih dan data uji.",
    "**Uji signifikansi:** akurasi setiap algoritma pada kelima fold dibandingkan dengan algoritma berakurasi tertinggi memakai uji t berpasangan terkoreksi (α = 0,05).",
    `**Uji data asli:** model akhir dilatih dengan pembagian 80/20 per akun (GroupShuffleSplit), lalu diuji pada data asli ${X.RD.accounts} akun yang tidak pernah dipakai saat pelatihan.`,
    `**Eksperimen kedua:** keenam algoritma dilatih dan diuji hanya dengan data asli memakai GroupKFold 5-fold yang dibagi per siklus pity (${rcv.groups} siklus), dengan hyperparameter dipilih ulang di dalam data latih setiap fold (*nested cross-validation*).`,
    "**Analisis soft pity:** laju S-Rank per rentang pity pada data asli dibandingkan dengan peluang model Markov.",
    "Prediksi kelas memakai ambang peluang 0,5. *Oversampling* seperti SMOTE tidak dipakai karena tujuan utamanya adalah angka peluang yang tepat, sedangkan data buatan untuk kelas minoritas akan menggeser peluang tersebut.",
  ], "bullet"),
  P(`Uji awal pada tugas B menunjukkan bahwa model berbasis pohon dan KNN mencapai akurasi ±${X.pct(accCV("XGBoost"), 0)} pada data simulasi dan ±${X.pct(rB.XGBoost.accuracy, 0)} pada data asli, mendekati acuan Markov Chain, sedangkan baseline hanya ±${X.pct(accCV(X.BASELINE), 0)}. *Grid search* menaikkan akurasi Naive Bayes dari ${X.pct(nb.manual_score)} menjadi ${X.pct(nb.best_score)} pada data *grid search*. Pada data asli, laju S-Rank banner Agent naik dari ${X.pct(softA.pre.rate)} menjadi ${X.pct(firstSoftA.rate)} mulai pull ke-${softA.start}, sesuai dengan estimasi *soft pity*. Hasil lengkap akan disajikan pada laporan akhir.`),
  H2("2.5 Hasil yang Diharapkan"),
  P(`Penelitian ini diharapkan menghasilkan perbandingan kinerja enam algoritma klasifikasi yang adil dan teruji secara statistik dalam memprediksi keluarnya S-Rank, sehingga dapat diketahui algoritma mana yang paling sesuai untuk data gacha. Model terbaik diharapkan mengungguli baseline pada Balanced Accuracy, F1-score, dan ROC-AUC, serta mendekati acuan teori Markov Chain. Penelitian ini juga diharapkan dapat memastikan apakah titik *soft pity* hasil estimasi komunitas (pull ke-${softA.start} untuk Agent dan ke-${softW.start} untuk W-Engine) sesuai dengan data pemain asli.`),
  P("Bagi pemain, hasil penelitian memberikan gambaran peluang yang jelas untuk merencanakan penggunaan mata uang permainan. Bagi mahasiswa, penelitian ini menerapkan tahapan CRISP-DM, algoritma klasifikasi, evaluasi, dan *deployment* sesuai materi perkuliahan. Bagi keilmuan, penelitian ini memberikan contoh penerapan penambangan data untuk menggali aturan yang tidak diumumkan, sekaligus contoh nyata bahaya memakai akurasi sebagai satu-satunya metrik pada data tidak seimbang."),
  H2("2.6 Target Capaian"),
  P("Target capaian dari penelitian ini adalah:", { noIndent: true }),
  ...List([
    "Model klasifikasi tugas A dan tugas B dari keenam algoritma, dengan hyperparameter hasil *grid search*, yang tersimpan dan dapat dipakai ulang oleh aplikasi.",
    "Tabel perbandingan kinerja dengan delapan metrik evaluasi beserta hasil uji signifikansi, baik pada data simulasi maupun data asli.",
    "Analisis pola *soft pity* dari data asli yang dibandingkan dengan model Markov Chain.",
    `Aplikasi web Streamlit yang dapat diakses publik dari ponsel maupun komputer, dengan halaman Import Data, Kalkulator Peluang, Statistik Riwayat, Perbandingan Algoritma, serta Panduan dan FAQ. Prototipe sudah berjalan di ${APP} (Gambar 2.2).`,
    `Kode sumber terbuka di ${REPO}, laporan akhir, dan video presentasi.`,
  ]),
  ...Img("app_kalkulator_top.png", "Prototipe halaman Kalkulator Peluang", 250),
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
