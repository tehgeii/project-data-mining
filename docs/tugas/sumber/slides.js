// node slides.js uts|uas <out.pptx>
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const X = require("./rep"); // angka hasil pelatihan dari models/report.json
const MODE = process.argv[2], OUT = process.argv[3];
const FIG = process.env.FIG;
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.title = "ZZZ Gacha Predictor";
pres.author = "Kelompok 6 A11.4502";
pres.company = "Universitas Dian Nuswantoro";
pres.subject = "Penambangan Data";

const C = { bg: "0E1117", bg2: "161B22", card: "1C2230", line: "30363D", txt: "E6EDF3", mut: "A9B4C2", dim: "8B949E", acc: "F5A623", blue: "58A6FF", green: "3FB950", red: "F85149", purple: "BC8CFF", pink: "FF7EB6" };
const HF = "Cambria", BF = "Calibri";
const W = 13.33, M = 0.6;
let n = 0;
const T = (s, text, o) => s.addText(text, { isTextBox: true, fontFace: BF, color: C.txt, margin: 0, ...o });

function base(title, eyebrow, bg = C.bg) {
  const s = pres.addSlide(); n++;
  s.background = { color: bg };
  if (eyebrow) T(s, eyebrow.toUpperCase(), { x: M, y: 0.45, w: 10, h: 0.3, fontSize: 12, bold: true, color: C.acc, charSpacing: 3 });
  if (title) T(s, title, { x: M, y: 0.75, w: W - 2 * M, h: 0.8, fontSize: 32, bold: true, fontFace: HF });
  T(s, `ZZZ Gacha Predictor · Kelompok 6 · A11.4502`, { x: M, y: 7.0, w: 8, h: 0.25, fontSize: 10, color: C.dim });
  T(s, String(n), { x: W - M - 1, y: 7.0, w: 1, h: 0.25, fontSize: 10, color: C.dim, align: "right" });
  return s;
}
function card(s, x, y, w, h, title, body, accent = C.acc, o = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.card }, line: { color: C.line, width: 0.75 }, rectRadius: 0.08 });
  let ty = y + 0.25;
  if (o.icon) { s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.25, w: 0.5, h: 0.5, fill: { color: accent } }); T(s, o.icon, { x: x + 0.25, y: y + 0.25, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: C.bg, align: "center", valign: "middle" }); ty = y + 0.9; }
  const th = o.icon ? 0.8 : 0.45;
  T(s, title, { x: x + 0.25, y: ty, w: w - 0.5, h: th, fontSize: o.tsize ?? 18, bold: true, color: o.icon ? C.txt : accent, fontFace: HF, valign: "top" });
  if (body) T(s, body, { x: x + 0.25, y: ty + th + 0.05, w: w - 0.5, h: h - (ty - y) - th - 0.25, fontSize: o.bsize ?? 14, color: C.mut, valign: "top", paraSpaceAfter: 4 });
}
function bullets(s, items, x, y, w, h, size = 16) {
  T(s, items.map((t, i) => ({ text: t, options: { bullet: { indent: 18 }, breakLine: i < items.length - 1 } })), { x, y, w, h, fontSize: size, color: C.txt, valign: "top", paraSpaceAfter: 10 });
}
function stat(s, x, y, w, big, label, color = C.acc) {
  T(s, big, { x, y, w, h: 1.0, fontSize: 54, bold: true, color, fontFace: HF });
  T(s, label, { x, y: y + 1.05, w, h: 0.7, fontSize: 14, color: C.mut, valign: "top" });
}
function img(s, file, x, y, w, h, white = true) {
  const buf = fs.readFileSync(`${FIG}/${file}`); const iw = buf.readUInt32BE(16), ih = buf.readUInt32BE(20);
  const r = Math.min(w / iw, h / ih); const ww = iw * r, hh = ih * r; const xx = x + (w - ww) / 2, yy = y + (h - hh) / 2;
  if (white) s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: xx - 0.12, y: yy - 0.12, w: ww + 0.24, h: hh + 0.24, fill: { color: "FFFFFF" }, line: { color: C.line }, rectRadius: 0.06 });
  s.addImage({ path: `${FIG}/${file}`, x: xx, y: yy, w: ww, h: hh, altText: file });
}
function table(s, rows, x, y, w, colW, o = {}) {
  const fs_ = o.size ?? 12;
  const data = rows.map((r, ri) => r.map((c, ci) => ({ text: String(c), options: {
    bold: ri === 0 || (o.boldRows || []).includes(ri), color: ri === 0 ? C.acc : C.txt, fontSize: fs_, fontFace: BF,
    fill: { color: ri === 0 ? C.bg2 : (o.hlRows || []).includes(ri) ? "2A2414" : ri % 2 ? C.card : C.bg },
    align: ci === 0 || o.left ? "left" : "center", valign: "middle", margin: [3, 6, 3, 6],
  } })));
  s.addTable(data, { x, y, w, colW, border: { type: "solid", pt: 0.5, color: C.line }, rowH: o.rowH ?? 0.36 });
}
function chartBars(s, names, series, x, y, w, h, o = {}) {
  s.addChart(pres.charts.BAR, series.map((sr) => ({ name: sr.name, labels: names, values: sr.values })), {
    x, y, w, h, barDir: "col", barGrouping: "clustered", chartColors: series.map((sr) => sr.color),
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 9, dataLabelColor: C.txt, dataLabelFormatCode: o.fmt ?? "0.0",
    catAxisLabelColor: C.mut, valAxisLabelColor: C.mut, catAxisLabelFontSize: 10, valAxisLabelFontSize: 10,
    valAxisMinVal: o.min ?? 0, valAxisMaxVal: o.max ?? 100, valGridLine: { color: C.line, size: 0.5 }, catGridLine: { style: "none" },
    showLegend: series.length > 1, legendPos: "t", legendColor: C.txt, legendFontSize: 11,
    showTitle: !!o.title, title: o.title, titleColor: C.txt, titleFontSize: 14,
    plotArea: { fill: { color: C.bg } }, chartArea: { fill: { color: C.bg } },
  });
}

const NAMES = ["Baseline", "Markov (teori)", "Naive Bayes", "KNN", "Log. Regression", "Decision Tree", "Random Forest", "XGBoost"];
const SHORT = { [X.BASELINE]: "Baseline", [X.MARKOV]: "Markov (teori)" };
const short = (n) => SHORT[n] ?? n;
const cvA = X.A.cross_validation.scores, cvB = X.B.cross_validation.scores, rB = X.B.real, rcv = X.B.real_cv;
const sigS = X.B.cross_validation.significance, sigR = rcv.significance;
const pc = (v, d = 1) => Math.round(v * 10 ** (d + 2)) / 10 ** d; // 0.91084 -> 91.1
const accOf = (sc) => X.ALL.map((n) => pc(X.val(sc, n, "accuracy")));
const ACC_SIM = accOf(cvB);
const ACC_REAL = accOf(rB);
const ACC_REAL_CV = accOf(rcv.scores);
const P = (sc, n, d = 1) => X.pct(X.val(sc, n, "accuracy"), d); // "93,1%"
// baris tabel slide: nama pendek + angka 4 desimal
const srows = (cols) => X.ALL.map((n) => [short(n), ...cols.map(([sc, key]) => X.num(X.val(sc, n, key)))]);
const kReal = [...new Set(rcv.params.KNN.map((q) => q.kneighborsclassifier__n_neighbors))].sort((a, b) => a - b);
const TEAM = [["NIM", "Nama", "Peran"],
  ["A11.2024.16004", "Syafiq Yahya", "Ketua kelompok, presentasi hasil"],
  ["A11.2024.15851", "Dafi Hauzan A.H", "Pengembang aplikasi, pengumpulan & pengujian data"],
  ["A11.2024.15842", "Gastiadirrijal Rafi M", "Penyusun slide presentasi"],
  ["A11.2024.15826", "Zabrina Miftah Z", "Penyusun proposal & laporan"],
  ["A11.2024.15804", "Rayya Hasya Tamimi", "Penyusun proposal & laporan"]];
const APP = "project-data-mining-zzz.streamlit.app";

// ===== slide bersama =====
function cover(kind) {
  const s = pres.addSlide(); n++;
  s.background = { color: C.bg };
  s.addShape(pres.shapes.OVAL, { x: 9.3, y: 1.2, w: 5.2, h: 5.2, fill: { color: C.acc, transparency: 88 }, line: { color: C.acc, transparency: 60, width: 1 } });
  s.addShape(pres.shapes.OVAL, { x: 10.3, y: 2.2, w: 3.2, h: 3.2, fill: { color: C.blue, transparency: 85 }, line: { color: C.blue, transparency: 60, width: 1 } });
  T(s, "S", { x: 10.3, y: 2.2, w: 3.2, h: 3.2, fontSize: 120, bold: true, color: C.acc, align: "center", valign: "middle", fontFace: HF });
  // logo Udinus (versi bulat transparan supaya menyatu dengan latar gelap)
  s.addImage({ path: `${FIG}/logo_udinus_round.png`, x: M, y: 0.4, w: 1.0, h: 1.0, altText: "Logo Universitas Dian Nuswantoro" });
  T(s, kind, { x: M + 1.2, y: 0.7, w: 7.4, h: 0.4, fontSize: 14, bold: true, color: C.acc, charSpacing: 3 });
  T(s, "ZZZ Gacha Predictor", { x: M, y: 1.5, w: 8.6, h: 1.1, fontSize: 48, bold: true, fontFace: HF });
  T(s, "Perbandingan Algoritma Klasifikasi untuk Memprediksi Peluang Mendapatkan S-Rank pada Sistem Gacha Zenless Zone Zero Berbasis Web", { x: M, y: 2.7, w: 8.4, h: 1.3, fontSize: 18, color: C.mut, valign: "top" });
  T(s, [
    { text: "Kelompok 6 · Kelas A11.4502", options: { bold: true, breakLine: true } },
    { text: "Mata kuliah Penambangan Data", options: { breakLine: true } },
    { text: "Dosen: Ardytha Luthfiarta, M.Kom, MCS", options: { breakLine: true } },
    { text: "Universitas Dian Nuswantoro · 2026", options: {} },
  ], { x: M, y: 4.5, w: 8, h: 1.4, fontSize: 15, color: C.txt, valign: "top", paraSpaceAfter: 4 });
  T(s, APP, { x: M, y: 6.3, w: 8, h: 0.4, fontSize: 14, color: C.blue });
  s.addNotes(`Pembukaan (±1 menit). Salam, perkenalkan Kelompok 6 kelas A11.4502, mata kuliah Penambangan Data dengan dosen Bapak Ardytha Luthfiarta. Sebutkan judul: ${kind === "PROPOSAL PROYEK AKHIR · UTS" ? "ini adalah presentasi proposal proyek akhir" : "ini adalah presentasi laporan akhir proyek"} tentang memprediksi peluang S-Rank di gacha Zenless Zone Zero. Sampaikan bahwa aplikasinya bisa dibuka di HP lewat link di layar.`);
}
function team() {
  const s = base("Anggota Kelompok 6", "Tim");
  table(s, TEAM, M, 1.8, 12.1, [2.4, 3.4, 6.3], { size: 15, rowH: 0.62, left: true });
  s.addNotes("Perkenalan anggota (±1 menit). Bacakan nama dan peran setiap anggota. Ketua: Syafiq Yahya. Pengembang aplikasi: Dafi. Slide: Gastiadirrijal. Proposal dan laporan: Zabrina dan Rayya.");
}
function latar() {
  const s = base("“Pity-ku 70. Berapa peluang dapat S?”", "Latar belakang");
  T(s, "Gacha di Zenless Zone Zero memakai sistem pity: makin lama tidak dapat S-Rank, peluangnya makin besar sampai pasti dapat. Pemain sering hanya menebak-nebak. Riwayat gacha tersimpan di server, sehingga bisa diolah dengan penambangan data.", { x: M, y: 1.75, w: 12, h: 1.1, fontSize: 17, color: C.mut, valign: "top" });
  stat(s, M, 3.3, 3.8, "0,6%", "peluang dasar S-Rank Agent per pull (W-Engine 1,0%)");
  stat(s, 4.75, 3.3, 3.8, "90", "hard pity Agent: S-Rank pasti didapat (W-Engine 80)", C.blue);
  stat(s, 8.9, 3.3, 3.8, "±1,7%", "pull yang benar-benar menghasilkan S-Rank → data sangat tidak seimbang", C.green);
  s.addNotes("Latar belakang (±1,5 menit). Jelaskan apa itu gacha dan pull. S-Rank sangat langka: 0,6 persen untuk Agent. Ada sistem pity: kalau lama tidak dapat, peluang naik, dan di pull ke-90 pasti dapat. Pemain bingung menghitung peluangnya sendiri. Riwayat gacha bisa diambil dari server, jadi bisa diolah dengan data mining. Tekankan angka 1,7 persen: datanya sangat tidak seimbang, ini akan penting nanti.");
}
function alasan() {
  const s = base("Kenapa perlu data mining, bukan rumus saja?", "Alasan");
  T(s, "Machine learning tidak diperlukan jika ada atribut yang langsung menentukan hasil, atau sudah ada rumus yang pasti dan lengkap. Bagaimana dengan gacha ZZZ?", { x: M, y: 1.65, w: 12.1, h: 0.75, fontSize: 16, color: C.mut, valign: "top" });
  card(s, M, 2.55, 5.95, 1.8, "Ada atribut penentu hasil? Tidak", "Pity hanya mengubah peluang; hasil setiap pull tetap acak. Kepastian hanya terjadi di hard pity.", C.red, { bsize: 15 });
  card(s, 6.75, 2.55, 5.95, 1.8, "Ada rumus pasti & lengkap? Tidak", "Rate dasar & hard pity resmi, tetapi soft pity (kapan & seberapa cepat peluang naik) TIDAK diumumkan. Perkiraan komunitas pun berbeda-beda.", C.red, { bsize: 15 });
  card(s, M, 4.6, 12.1, 1.85, "→ Pola soft pity harus digali dari data riwayat pemain", "Termasuk klasifikasi + estimasi peluang (supervised learning; label: dapat S-Rank atau tidak). Markov Chain menjadi pembanding teori, sedangkan algoritma tidak diberi tahu soft pity lalu diuji apakah bisa menemukannya sendiri.", C.green, { bsize: 15 });
  s.addNotes("Alasan memakai data mining (±1,5 menit). Sebelum memilih algoritma, kami memeriksa dulu apakah kasus ini memang butuh machine learning. Machine learning tidak perlu kalau ada atribut yang langsung menentukan hasil, atau kalau rumusnya sudah pasti. Di gacha, pity hanya mengubah peluang, hasilnya tetap acak. Rumus resminya juga tidak lengkap: rate dasar dan hard pity diumumkan, tetapi soft pity tidak, dan perkiraan komunitas berbeda-beda. Karena itu pola soft pity harus digali dari data riwayat pemain. Masalah ini termasuk klasifikasi dan estimasi peluang, yaitu supervised learning dengan label dapat S atau tidak. Markov Chain kami pakai sebagai pembanding teori, sedangkan algoritma tidak diberi tahu soal soft pity.");
}
function rumusan() {
  const s = base("Rumusan masalah", "Masalah");
  const items = [
    ["1", "Menghitung peluang", "Berapa peluang dapat S-Rank / S-Rank rate-up dalam N pull dari pity dan status guaranteed?"],
    ["2", "Pola soft pity", "Bisakah soft pity yang tidak diumumkan resmi ditemukan dari data riwayat pemain?"],
    ["3", "Algoritma terbaik", "Dari Naive Bayes, KNN, Logistic Regression, Decision Tree, Random Forest, dan XGBoost, mana yang paling akurat?"],
    ["4", "Evaluasi yang tepat", "Bagaimana menilai model pada data yang sangat tidak seimbang?"],
    ["5", "Mudah diakses", "Bagaimana menyajikannya dalam web yang nyaman di HP dan PC?"],
  ];
  items.forEach(([i, t, b], k) => card(s, M + k * 2.45, 1.9, 2.3, 4.6, t, b, [C.acc, C.pink, C.blue, C.green, C.purple][k], { icon: i, tsize: 17 }));
  s.addNotes("Rumusan masalah (±1,5 menit). Bacakan lima rumusan masalah. Rumusan kedua menjawab alasan memakai data mining: soft pity tidak diumumkan, jadi harus dicari dari data. Rumusan ketiga adalah inti tugas: membandingkan enam algoritma. Naive Bayes, KNN, dan Decision Tree sesuai materi kuliah; Logistic Regression, Random Forest, dan XGBoost sebagai pembanding tambahan.");
}
function aturan() {
  const s = base("Aturan dua banner terbatas", "Objek penelitian");
  table(s, [["Parameter", "Agent Terbatas", "W-Engine Terbatas", "Sumber"],
    ["Rate dasar S-Rank", "0,6%", "1,0%", "Resmi"],
    ["Rate gabungan", "1,6%", "2,0%", "Resmi"],
    ["Hard pity", "90", "80", "Resmi"],
    ["Peluang rate-up", "50% (50/50)", "75% (75/25)", "Resmi"],
    ["Soft pity mulai", "± pull 74", "± pull 65", "Estimasi"]], M, 1.8, 7.4, [2.4, 1.8, 1.9, 1.3], { size: 13, rowH: 0.5 });
  card(s, 8.4, 1.8, 4.3, 3.0, "Guaranteed", "Kalah 50/50 (dapat S standar) → S-Rank berikutnya pasti rate-up.", C.blue, { bsize: 15 });
  card(s, 8.4, 5.0, 4.3, 1.6, "Batasan", "Banner standar & Bangboo tidak dibahas.", C.dim, { bsize: 14 });
  s.addNotes("Aturan banner (±1 menit). Fokus hanya dua banner terbatas. Angka rate dan hard pity dari detail banner resmi di game. Titik soft pity tidak diumumkan resmi, jadi memakai estimasi komunitas. Jelaskan aturan guaranteed setelah kalah 50/50.");
}
function markov() {
  const s = base("Markov Chain: peluang dari aturan banner", "Landasan teori");
  img(s, "fig_markov.png", M, 1.75, 6.0, 2.3);
  img(s, "fig_hazard.png", M, 4.3, 6.0, 2.5);
  T(s, [
    { text: "Peluang S di pull ke-n hanya bergantung pada pity → cocok dimodelkan Markov Chain.", options: { bullet: { indent: 18 }, breakLine: true } },
    { text: "h(n) = rate dasar, lalu naik k per pull setelah soft pity, dan = 1 di hard pity.", options: { bullet: { indent: 18 }, breakLine: true } },
    { text: "k dicari dengan metode biseksi supaya rata-rata = rate gabungan resmi (k ≈ 5,3% Agent, 5,5% W-Engine).", options: { bullet: { indent: 18 }, breakLine: true } },
    { text: "Hasil: peluang dapat S / S rate-up dalam N pull dihitung langsung, tanpa simulasi.", options: { bullet: { indent: 18 }, breakLine: true } },
    { text: "Catatan: titik soft pity bukan angka resmi → diperiksa dengan data asli.", options: { bullet: { indent: 18 } } },
  ], { x: 7.1, y: 1.9, w: 5.6, h: 4.8, fontSize: 16, valign: "top", paraSpaceAfter: 12 });
  s.addNotes("Markov Chain (±1,5 menit). State adalah pity saat ini. Setiap pull, dengan peluang h kita dapat S dan kembali ke pity 0; jika tidak, pity naik satu. Grafik bawah menunjukkan peluang per pull: datar 0,6 persen lalu melonjak setelah soft pity sampai 100 persen di hard pity. Kenaikan per pull dicari dengan metode biseksi agar rata-ratanya sama dengan rate gabungan resmi. Markov Chain ini dipakai di kalkulator dan sebagai acuan teori pembanding algoritma. Titik soft pity-nya masih estimasi, dan nanti kami periksa dengan data asli.");
}
function algoritma() {
  const s = base("Enam algoritma klasifikasi yang dibandingkan", "Landasan teori");
  const a = [
    ["Naive Bayes", "Probabilistik, asumsi fitur saling bebas & berdistribusi normal.", C.purple],
    ["KNN", "Menebak dari k data latih terdekat (fitur dinormalisasi).", C.pink],
    ["Logistic Regression", "Kurva sigmoid dari kombinasi linear fitur.", C.blue],
    ["Decision Tree", "Aturan jika–maka yang mudah dibaca manusia.", C.acc],
    ["Random Forest", "150 pohon acak, hasil dirata-rata (bagging).", C.red],
    ["XGBoost", "300 pohon berurutan memperbaiki kesalahan (boosting).", C.green],
  ];
  a.forEach(([t, b, c], k) => card(s, M + (k % 3) * 4.1, 1.7 + Math.floor(k / 3) * 2.2, 3.9, 2.0, t, b, c, { tsize: 20, bsize: 15 }));
  T(s, "Hyperparameter (k, var_smoothing, C, kedalaman pohon, learning rate) dipilih dengan grid search, bukan ditebak.", { x: M, y: 6.2, w: 12.1, h: 0.5, fontSize: 15, color: C.mut });
  s.addNotes("Algoritma (±2 menit). Jelaskan singkat keenam algoritma. Naive Bayes, KNN, dan Decision Tree adalah materi kuliah. Logistic Regression sebagai model linear sederhana. Random Forest dan XGBoost adalah ensemble pohon. Ditambah dua pembanding: baseline yang selalu menebak tidak dapat S, dan Markov Chain sebagai acuan teori. Tekankan bahwa pengaturan setiap algoritma, misalnya jumlah tetangga k pada KNN, tidak ditebak, tetapi dipilih dengan grid search.");
}
function metrik() {
  const s = base("Evaluasi: akurasi saja tidak cukup", "Landasan teori");
  table(s, [["Metrik", "Arti"],
    ["Accuracy", "(TP + TN) / semua data"],
    ["Precision / Recall", "kualitas tebakan pada kelas \"dapat S\""],
    ["F1-score", "rata-rata harmonik precision & recall"],
    ["Balanced Accuracy", "rata-rata recall dua kelas"],
    ["ROC-AUC", "kemampuan membedakan kelas"],
    ["Log Loss", "ketepatan angka peluang (kecil = baik)"]], M, 1.8, 7.0, [2.4, 4.6], { size: 14, rowH: 0.55 });
  card(s, 8.0, 1.8, 4.7, 4.5, "Kenapa?", "Kalau S-Rank hanya ±1,7%, model yang SELALU menebak \"tidak dapat S\" sudah benar 98% dari waktu. Akurasinya tinggi, tetapi tidak berguna. Karena itu metrik lain wajib ditampilkan, dan semuanya dihitung dari confusion matrix.", C.acc, { bsize: 16 });
  s.addNotes("Metrik evaluasi (±1,5 menit). Semua metrik dihitung dari confusion matrix: TP, TN, FP, FN. Dosen menilai akurasi, dan akurasi tetap kami laporkan sebagai metrik utama. Namun karena datanya tidak seimbang, kami tambah balanced accuracy, F1, ROC-AUC, dan log loss supaya penilaian adil.");
}
function crisp() {
  const s = base("Metodologi: CRISP-DM", "Metode");
  const st = [["Business\nUnderstanding", "Kebutuhan pemain"], ["Data\nUnderstanding", "Struktur riwayat gacha"], ["Data\nPreparation", "Pity, guaranteed, fitur"], ["Modeling", "6 algoritma + Markov"], ["Evaluation", "5-fold CV + data asli"], ["Deployment", "Web Streamlit"]];
  st.forEach(([t, b], k) => {
    const x = M + k * 2.05;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.3, w: 1.8, h: 1.6, fill: { color: C.card }, line: { color: k === 3 ? C.acc : C.line, width: 1 }, rectRadius: 0.08 });
    T(s, t, { x: x + 0.05, y: 2.4, w: 1.7, h: 1.0, fontSize: 12, bold: true, align: "center", valign: "middle" });
    T(s, String(k + 1), { x: x + 0.1, y: 3.45, w: 1.6, h: 0.35, fontSize: 12, color: C.acc, align: "center", bold: true });
    T(s, b, { x, y: 4.1, w: 1.8, h: 0.8, fontSize: 13, color: C.mut, align: "center", valign: "top" });
    if (k < 5) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 1.83, y: 2.97, w: 0.2, h: 0.26, fill: { color: C.acc }, line: { color: C.acc } });
  });
  T(s, "Kerangka standar proses data mining (Chapman et al., 2000), diterapkan dari pemahaman masalah sampai aplikasi web.", { x: M, y: 5.5, w: 12, h: 0.6, fontSize: 15, color: C.mut });
  s.addNotes("Metodologi (±1,5 menit). Kami memakai CRISP-DM, enam tahap. Jelaskan singkat setiap tahap dan apa yang dilakukan kelompok di setiap tahap.");
}
function data() {
  const s = base("Data: simulasi + data asli pemain", "Data");
  card(s, M, 1.8, 5.9, 2.4, "Simulasi Monte Carlo", "400 akun virtual · ±314 ribu pull · dibangkitkan dari model Markov (seed 42), jadi memuat asumsi soft pity. Dipakai untuk melatih dan menguji.", C.blue, { bsize: 16 });
  card(s, 6.8, 1.8, 5.9, 2.4, "Data asli (2 akun)", "1.441 pull · 22 S-Rank · anonim. Dipakai untuk menguji model, memeriksa pola soft pity, dan melatih + menguji sendiri (1.209 baris).", C.green, { bsize: 16 });
  T(s, "Cara ambil data asli:", { x: M, y: 4.55, w: 12, h: 0.4, fontSize: 16, bold: true });
  bullets(s, ["Script PowerShell membaca URL riwayat dari cache game di PC (Steam/HoYoPlay) → server HoYoverse", "Upload file UIGF v4 (cocok untuk HP) atau input manual pity", "Pra-pemrosesan: buang duplikat, urutkan per akun, hitung pity & guaranteed, buang segmen pertama yang tidak lengkap"], M, 5.0, 12, 1.8, 15);
  s.addNotes("Data (±1,5 menit). Riwayat satu akun terlalu sedikit untuk melatih model, jadi data latih memakai simulasi Monte Carlo dari model Markov, 400 akun. Karena simulasi dibuat dari model kami sendiri, model yang dilatih di simulasi hanya mempelajari ulang asumsi itu; karena itu data asli sangat penting. Data asli dua akun, 1.441 pull, sudah memenuhi syarat dataset tabel minimal 500 sampai 1000 baris. Data asli dipakai untuk menguji, dan di eksperimen kedua keenam algoritma juga dilatih dan diuji hanya dengan data asli. Jelaskan cara pengambilan data asli lewat script PowerShell yang hanya membaca cache game, dan bahwa authkey tidak disimpan.");
}
function fitur() {
  const s = base("Fitur dan target", "Data preparation");
  table(s, [["Fitur", "Keterangan"], ["pity", "pull sejak S-Rank terakhir (0 – 89)"], ["pity_ratio", "pity ÷ hard pity"], ["guaranteed", "1 jika S berikutnya pasti rate-up"], ["is_wengine", "1 = W-Engine, 0 = Agent"]], M, 1.8, 6.6, [2.0, 4.6], { size: 15, rowH: 0.6 });
  card(s, 7.6, 1.8, 5.1, 2.1, "Tugas A", "Dapat S-Rank di pull berikutnya? Kelas positif ±1,7%.", C.dim, { bsize: 16 });
  card(s, 7.6, 4.15, 5.1, 2.1, "Tugas B (utama)", "Dapat S-Rank dalam 10 pull berikutnya (1x ten-pull)? Kelas positif ±16,6%.", C.acc, { bsize: 16 });
  T(s, "Semua fitur diketahui SEBELUM pull dilakukan → tidak ada kebocoran data.", { x: M, y: 5.2, w: 6.6, h: 0.9, fontSize: 15, color: C.mut, valign: "top" });
  s.addNotes("Fitur dan target (±1,5 menit). Empat fitur sederhana. Dua tugas: tugas A memprediksi pull berikutnya, tugas B memprediksi dalam 10 pull. Tugas B dijadikan utama karena lebih relevan bagi pemain (satu kali ten-pull) dan kelasnya lebih seimbang.");
}
function skenario() {
  const s = base("Skenario evaluasi", "Metode");
  const it = [["Split per akun", "Pull dari satu akun tidak boleh ada di data latih dan uji sekaligus.", C.acc],
    ["Grid search", `Hyperparameter dipilih di ${X.B.tuning.accounts} akun simulasi terpisah (tidak dipakai evaluasi).`, C.pink],
    ["5-fold GroupKFold", "Rata-rata ± simpangan baku, lalu uji t berpasangan terkoreksi.", C.blue],
    ["Uji data asli", "Model diuji di 2 akun asli yang tidak pernah dilihat saat latih.", C.green],
    ["Latih di data asli", "Latih + uji hanya data asli, 5-fold per siklus pity, nested grid search.", C.purple]];
  it.forEach(([t, b, c], k) => card(s, M + k * 2.46, 1.9, 2.3, 3.4, t, b, c, { icon: String(k + 1), bsize: 14, tsize: 17 }));
  T(s, "Pembanding: Baseline (selalu \"tidak S\") dan Markov Chain (acuan teori).", { x: M, y: 5.5, w: 12, h: 0.5, fontSize: 16, color: C.mut });
  s.addNotes("Skenario evaluasi (±1 menit). Pembagian data per akun mencegah kebocoran, karena pull yang berurutan saling berkaitan. Cross-validation lima fold untuk hasil yang stabil, lalu uji akhir di data asli. Hyperparameter setiap algoritma dipilih dengan grid search memakai 100 akun simulasi tambahan yang tidak dipakai untuk evaluasi, jadi tidak ada kebocoran. Perbedaan antar-model diuji dengan uji t berpasangan terkoreksi, supaya kita tahu selisihnya nyata atau hanya kebetulan. Poin kelima adalah eksperimen kedua: semua algoritma dilatih dan diuji hanya dengan data asli, 1.209 baris, dibagi per siklus pity menjadi 5 bagian, dan grid search diulang di dalam setiap bagian. Kami tidak memakai oversampling seperti SMOTE, karena yang dicari adalah angka peluang yang tepat; ketidakseimbangan ditangani lewat pilihan metrik.");
}
function screenshot(title, eyebrow, file, points, notes) {
  const s = base(title, eyebrow);
  img(s, file, M, 1.6, 6.4, 5.25, false);
  bullets(s, points, 7.3, 1.9, 5.4, 4.8, 16);
  s.addNotes(notes);
}
function penutup(text) {
  const s = pres.addSlide(); n++;
  s.background = { color: C.bg };
  T(s, "Terima kasih", { x: M, y: 1.6, w: 12, h: 1.2, fontSize: 54, bold: true, fontFace: HF });
  T(s, text, { x: M, y: 2.9, w: 11, h: 0.8, fontSize: 20, color: C.mut });
  T(s, APP, { x: M, y: 4.1, w: 11, h: 0.6, fontSize: 26, bold: true, color: C.blue });
  T(s, "github.com/tehgeii/project-data-mining", { x: M, y: 4.8, w: 11, h: 0.5, fontSize: 16, color: C.mut });
  T(s, "Kelompok 6 · A11.4502 · Penambangan Data", { x: M, y: 6.5, w: 11, h: 0.4, fontSize: 13, color: C.dim });
  return s;
}

// ===== dek UTS =====
function uts() {
  cover("PROPOSAL PROYEK AKHIR · UTS");
  team(); latar(); alasan(); rumusan();
  { const s = base("Batasan dan tujuan", "Pendahuluan");
    T(s, "Batasan", { x: M, y: 1.8, w: 5.9, h: 0.4, fontSize: 20, bold: true, color: C.acc, fontFace: HF });
    bullets(s, ["Hanya banner Agent & W-Engine terbatas", "Yang diprediksi hanya S-Rank", "Soft pity: estimasi komunitas, diperiksa dengan data asli", "Data asli: akun anggota & teman (anonim)", "Ambil riwayat otomatis: PC Windows"], M, 2.3, 5.9, 4.3, 16);
    T(s, "Tujuan", { x: 6.9, y: 1.8, w: 5.9, h: 0.4, fontSize: 20, bold: true, color: C.blue, fontFace: HF });
    bullets(s, ["Menghitung peluang dengan Markov Chain", "Menggali pola soft pity dari data asli", "Membandingkan 6 algoritma klasifikasi", "Evaluasi yang tepat untuk data tidak seimbang", "Aplikasi web yang nyaman di HP & PC"], 6.9, 2.3, 5.8, 4.3, 16);
    s.addNotes("Batasan dan tujuan (±1,5 menit). Bacakan batasan: hanya dua banner terbatas dan hanya S-Rank. Lalu lima tujuan yang sejalan dengan lima rumusan masalah."); }
  aturan(); markov(); algoritma(); metrik(); crisp(); data(); fitur(); skenario();
  screenshot("Rancangan aplikasi web", "Rancangan", "app_kalkulator_top.png",
    ["Beranda: penjelasan & aturan banner", "Import Data: PowerShell, upload UIGF, input manual, data contoh", "Kalkulator Peluang: Markov Chain + prediksi 6 algoritma", "Statistik Riwayat: pity tiap S, menang 50/50", "Perbandingan Algoritma: metrik, kurva, confusion matrix", "Tema gelap, nyaman di HP"],
    "Rancangan aplikasi (±1,5 menit). Aplikasi dibangun dengan Streamlit, materi deployment di kuliah. Jelaskan enam halaman. Kalau memungkinkan, buka link aplikasinya dan tunjukkan halaman kalkulator secara langsung.");
  { const s = base("Hasil awal prototipe (tugas B)", "Progres");
    chartBars(s, NAMES, [{ name: "Simulasi (5-fold CV)", values: ACC_SIM, color: C.blue }, { name: "Data asli (2 akun)", values: ACC_REAL, color: C.acc }], M, 1.7, 8.4, 5.1, { min: 80, max: 96, title: "Accuracy (%)" });
    card(s, 9.3, 1.8, 3.4, 4.8, "Temuan awal", "Prototipe sudah jalan; pity akun asli sama dengan di game. Model pohon & KNN ±91% (simulasi) dan ±93% (data asli). Data asli juga memperlihatkan lonjakan S Agent mulai pull ke-74, sesuai estimasi soft pity.", C.green, { bsize: 15 });
    s.addNotes("Hasil awal (±2 menit). Prototipe sudah berjalan dan bisa dibuka di HP. Validasi: saat dicek, pity akun asli 70 dari 90 dan 46 dari 80 sama persis dengan di game. Hasil awal tugas B: model pohon dan KNN sekitar 91 persen di simulasi dan 93 persen di data asli, Logistic Regression dan Naive Bayes lebih rendah. Eksperimen latih dan uji dengan data asli saja, 1.209 baris, juga sudah dilakukan: Decision Tree tetap tertinggi sekitar 93 persen. Uji coba grid search membuat Naive Bayes dan KNN membaik, dan uji signifikansi awal menunjukkan selisih antaralgoritma di data asli yang masih sedikit belum bermakna. Analisis awal data asli memperlihatkan laju S Agent hampir nol sampai pull ke-73 lalu melonjak mulai pull ke-74, sesuai estimasi soft pity. Hasil lengkap akan dibahas di laporan akhir."); }
  { const s = base("Jadwal kegiatan", "Rencana");
    table(s, [["Kegiatan", "M1", "M2", "M3", "M4"],
      ["Studi literatur & aturan gacha", "✓", "", "", ""], ["Pengumpulan data & simulasi", "✓", "✓", "", ""],
      ["Pra-pemrosesan & fitur", "", "✓", "", ""], ["Pemodelan 6 algoritma + Markov", "", "✓", "✓", ""],
      ["Evaluasi & uji data asli", "", "", "✓", ""], ["Deployment Streamlit", "", "", "✓", "✓"], ["Laporan & presentasi", "", "", "", "✓"]],
      M, 1.8, 12.1, [6.9, 1.3, 1.3, 1.3, 1.3], { size: 15, rowH: 0.58 });
    s.addNotes("Jadwal (±1 menit). Proyek direncanakan empat minggu. Sebutkan bahwa sebagian besar tahap sudah berjalan: prototipe, data asli, dan pemodelan sudah ada. Sisa pekerjaan: penyempurnaan evaluasi dan laporan akhir."); }
  penutup("Ada pertanyaan? Silakan coba aplikasinya langsung:").addNotes("Penutup (±1 menit). Ucapkan terima kasih, ajak membuka aplikasi lewat link, lalu buka sesi tanya jawab.");
}

// ===== dek UAS =====
function uas() {
  cover("LAPORAN AKHIR PROYEK · UAS");
  team(); latar(); alasan(); rumusan(); aturan(); markov(); algoritma(); metrik(); crisp(); data(); fitur();
  screenshot("Aplikasi: Import Data", "Implementasi", "app_import.png",
    ["URL dari script PowerShell (PC)", "Upload file UIGF v4 (HP)", "Input manual pity (HP)", "Data contoh untuk yang tidak punya game", "authkey tidak disimpan; riwayat hanya ada di sesi browser"],
    "Demo Import Data (±1,5 menit). Tunjukkan tiga cara input. Sebaiknya demo langsung: klik Pakai data contoh. Jelaskan aspek keamanan: authkey hanya dipakai sekali.");
  screenshot("Aplikasi: Kalkulator Peluang", "Implementasi", "app_kalkulator_top.png",
    ["Peluang dapat S / S rate-up dalam N pull (Markov Chain)", "Rata-rata & paling sial sampai S rate-up", "Konversi Polychrome → jumlah pull", "Prediksi 6 algoritma untuk 1 pull & 10 pull"],
    "Demo Kalkulator (±1,5 menit). Ubah pity dan jumlah pull lalu tunjukkan grafik peluang kumulatif berubah. Tunjukkan tabel prediksi enam algoritma dibandingkan dengan Markov.");
  { const s = base("Validasi dengan akun asli", "Hasil");
    stat(s, M, 2.0, 3.8, "70 / 90", "pity Agent dihitung aplikasi = di game");
    stat(s, 4.75, 2.0, 3.8, "46 / 80", "pity W-Engine + guaranteed = di game", C.blue);
    stat(s, 8.9, 2.0, 3.8, "106 / 106", "test otomatis lolos (pytest + GitHub Actions)", C.green);
    T(s, "Pengambilan data, perhitungan pity, dan deteksi 50/50 terbukti benar dengan data game sungguhan (versi Steam).", { x: M, y: 4.6, w: 12, h: 0.9, fontSize: 18, color: C.mut, valign: "top" });
    s.addNotes("Validasi (±1 menit). Saat dicek, angka pity yang dihitung aplikasi untuk akun asli sama persis dengan yang tampil di game. Selain itu 106 test otomatis memastikan perhitungan tidak salah."); }
  { const s = base("Tugas A: jebakan akurasi", "Hasil", C.bg2);
    stat(s, M, 1.9, 4.5, "98,3%", "akurasi model yang SELALU menebak \"tidak dapat S\"");
    table(s, [["Model", "Accuracy", "Bal. Acc.", "ROC-AUC"], ...srows([[cvA, "accuracy"], [cvA, "balanced_accuracy"], [cvA, "roc_auc"]])], 5.6, 1.8, 7.1, [2.9, 1.4, 1.4, 1.4], { size: 13, rowH: 0.48 });
    T(s, "Semua model ±98,3% → akurasi tidak bisa membedakan model. Perbedaan baru terlihat di ROC-AUC & Log Loss.", { x: M, y: 4.2, w: 4.6, h: 2.0, fontSize: 16, color: C.mut, valign: "top" });
    s.addNotes("Tugas A (±1,5 menit). Ini temuan penting. Semua model, bahkan tebakan bodoh, akurasinya 98 persen. Jadi akurasi tidak bisa dipakai sendirian di data tidak seimbang. Itulah alasan tugas B dijadikan tugas utama."); }
  { const s = base("Tugas B: akurasi 6 algoritma", "Hasil");
    chartBars(s, NAMES, [{ name: "Simulasi (5-fold CV)", values: ACC_SIM, color: C.blue }, { name: "Data asli (2 akun)", values: ACC_REAL, color: C.acc }], M, 1.7, 12.1, 4.55, { min: 80, max: 96, title: "Accuracy (%) — dapat S dalam 10 pull" });
    T(s, "Akurasi data asli lebih tinggi karena kelas positifnya lebih sedikit (13,4% vs 16,6%), sehingga baseline ikut naik (86,6% vs 83,4%). Keunggulan di atas baseline sama-sama ±7 poin.", { x: M, y: 6.3, w: 12.1, h: 0.6, fontSize: 14, color: C.mut, valign: "top" });
    s.addNotes("Tugas B (±2 menit). Bacakan grafik. Decision Tree, Random Forest, XGBoost, dan KNN sekitar 91 persen di simulasi dan 93 persen di data asli, hampir sama dengan acuan teori Markov; selisih di antara keempatnya sangat kecil dan tidak signifikan, sehingga setara. Logistic Regression 88,9 persen dan Naive Bayes 89,2 persen setelah grid search; menurut uji signifikansi keduanya nyata lebih rendah. Baseline 83,4 persen. Kalau ditanya kenapa data asli lebih tinggi: kelas positifnya lebih sedikit, jadi baseline-nya juga lebih tinggi; keunggulan di atas baseline sama-sama sekitar 7 poin."); }
  { const s = base("Tugas B: metrik lengkap (cross-validation)", "Hasil");
    table(s, [["Model", "Accuracy", "Bal. Acc.", "F1", "ROC-AUC", "Log Loss"],
      ...srows([[cvB, "accuracy"], [cvB, "balanced_accuracy"], [cvB, "f1"], [cvB, "roc_auc"], [cvB, "log_loss"]])],
      M, 1.8, 12.1, [3.6, 1.7, 1.7, 1.7, 1.7, 1.7], { size: 14, rowH: 0.52, hlRows: [4, 6, 7, 8] });
    s.addNotes("Metrik lengkap (±1,5 menit). Baris kuning adalah empat algoritma terbaik. Decision Tree terbaik di balanced accuracy, ROC-AUC, dan log loss, KNN terbaik di F1, tetapi selisih keempatnya sangat kecil."); }
  { const s = base("Grid search hyperparameter", "Hasil");
    table(s, [["Algoritma", "Terpilih (tugas B)", "Acc. awal → terpilih"],
      ...X.ML.map((n) => [n, X.params(X.B.tuning.models[n].best_params), `${X.num(X.B.tuning.models[n].manual_score)} → ${X.num(X.B.tuning.models[n].best_score)}`])],
      M, 1.8, 8.4, [2.2, 4.0, 2.2], { size: 13, rowH: 0.62, hlRows: [1] });
    card(s, 9.3, 1.8, 3.4, 2.3, "Naive Bayes naik", `${X.pct(X.B.tuning.models["Naive Bayes"].manual_score)} → ${X.pct(X.B.tuning.models["Naive Bayes"].best_score)} di data grid search. Yang lain berubah ≤0,1 poin.`, C.purple, { bsize: 14 });
    card(s, 9.3, 4.3, 3.4, 2.4, "Tanpa kebocoran", `Dipilih di ${X.B.tuning.accounts} akun simulasi terpisah (GroupKFold 4-fold), bukan di data evaluasi.`, C.green, { bsize: 14 });
    s.addNotes(`Grid search (±1,5 menit). Setiap algoritma diberi beberapa pilihan pengaturan, lalu dipilih yang akurasinya paling tinggi di ${X.B.tuning.accounts} akun simulasi tambahan yang tidak dipakai untuk evaluasi. Naive Bayes paling terbantu, naik dari ${X.pct(X.B.tuning.models["Naive Bayes"].manual_score)} menjadi ${X.pct(X.B.tuning.models["Naive Bayes"].best_score)}. Algoritma lain hampir tidak berubah, artinya pengaturan awalnya sudah cocok untuk data simulasi yang besar. Pengaturan terpilih inilah yang dipakai di aplikasi.`); }
  { const s = base("Latih & uji hanya dengan data asli", "Hasil · eksperimen kedua");
    chartBars(s, NAMES, [{ name: "Accuracy (%)", values: ACC_REAL_CV, color: C.green }], M, 1.7, 8.4, 5.1, { min: 80, max: 96, title: `Accuracy (%) — ${X.int(rcv.rows)} baris data asli, 5-fold per siklus pity` });
    card(s, 9.3, 1.8, 3.4, 2.5, "Tetap teratas", `Decision Tree ${P(rcv.scores, "Decision Tree")}, Random Forest ${P(rcv.scores, "Random Forest")}, XGBoost ${P(rcv.scores, "XGBoost")}. Teori Markov ${P(rcv.scores, X.MARKOV)}.`, C.acc, { bsize: 14 });
    card(s, 9.3, 4.5, 3.4, 2.2, "NB & KNN naik", `Naive Bayes ${P(rcv.manual, "Naive Bayes")} → ${P(rcv.scores, "Naive Bayes")}, KNN ${P(rcv.manual, "KNN")} → ${P(rcv.scores, "KNN")} (k = ${kReal[0]}–${kReal[kReal.length - 1]}, bukan 101).`, C.pink, { bsize: 14 });
    s.addNotes(`Eksperimen kedua (±2 menit). Untuk menjawab apakah model hanya bagus di data simulasi, kami melatih dan menguji keenam algoritma hanya dengan data asli: ${X.int(rcv.rows)} baris dari 2 akun, sudah di atas syarat 500 sampai 1000 baris. Data dibagi per siklus pity menjadi 5 bagian, dan grid search diulang di dalam setiap bagian supaya data uji tidak ikut memilih pengaturan. Hasilnya: Decision Tree ${P(rcv.scores, "Decision Tree")}, Random Forest ${P(rcv.scores, "Random Forest")}, XGBoost ${P(rcv.scores, "XGBoost")}, hampir menyamai acuan teori Markov ${P(rcv.scores, X.MARKOV)}. Grid search paling membantu Naive Bayes dan KNN: dengan pengaturan awal keduanya hampir sama dengan baseline, tetapi setelah dipilih ulang naik menjadi ${P(rcv.scores, "Naive Bayes")} dan ${P(rcv.scores, "KNN")}. KNN memilih k antara ${kReal[0]} dan ${kReal[kReal.length - 1]}, karena k = 101 terlalu besar untuk data latih sekitar 970 baris. Pelajarannya: hyperparameter harus disesuaikan dengan ukuran data.`); }
  { const s = base("Uji signifikansi: nyata atau kebetulan?", "Hasil");
    const cell = (sig, n) => (n === sig.best ? ["acuan", "–"] : [X.pts(-sig.rows[n].diff), X.pnum(sig.rows[n].p)]);
    table(s, [["Model", `vs ${sigS.best} (sim.)`, "p", `vs ${sigR.best} (asli)`, "p"],
      ...X.ALL.map((n) => [short(n), ...cell(sigS, n), ...cell(sigR, n)])],
      M, 1.8, 8.4, [2.6, 1.8, 1.2, 1.8, 1.0], { size: 13, rowH: 0.5 });
    card(s, 9.3, 1.8, 3.4, 2.4, "Data simulasi", "Pohon & KNN setara. Naive Bayes & Logistic Regression NYATA lebih rendah (p < 0,001).", C.blue, { bsize: 14 });
    card(s, 9.3, 4.4, 3.4, 2.3, "Data asli", `Hanya baseline yang nyata lebih rendah (p = ${X.pnum(sigR.rows[X.BASELINE].p)}). Selisih antaralgoritma belum signifikan → perlu lebih banyak akun.`, C.green, { bsize: 14 });
    T(s, "Selisih dalam poin persen (negatif = lebih rendah dari acuan). Uji t berpasangan terkoreksi (Nadeau & Bengio, 2003), α = 0,05.", { x: M, y: 6.4, w: 8.4, h: 0.5, fontSize: 12, color: C.dim });
    s.addNotes(`Uji signifikansi (±2 menit). Selisih akurasi yang kecil belum tentu nyata. Kami memakai uji t berpasangan terkoreksi dari Nadeau dan Bengio, yang cocok untuk hasil cross-validation karena data latih antarfold saling tumpang tindih. Di data simulasi, Decision Tree, Random Forest, dan KNN tidak berbeda nyata dari ${sigS.best}, sedangkan Naive Bayes dan Logistic Regression nyata lebih rendah, p kurang dari 0,001. Di data asli, hanya baseline yang nyata lebih rendah dari ${sigR.best}; selisih antaralgoritma, paling besar sekitar 2 poin, belum signifikan karena data asli baru 20 siklus pity. Jadi kami tidak mengklaim Decision Tree pasti yang terbaik di data asli; yang bisa dikatakan, model pohon konsisten di urutan atas.`); }
  { const s = base("Soft pity terlihat di data asli", "Hasil · pola soft pity");
    img(s, "fig_softpity.png", M, 1.7, 8.4, 4.1);
    card(s, 9.3, 1.8, 3.4, 2.4, "Agent", "Hampir 0% sampai pull ke-73, lalu 14% (pull 74–78) dan 38% (79–90). Hampir sama dengan model.", C.acc, { bsize: 14 });
    card(s, 9.3, 4.4, 3.4, 2.3, "Tanpa diberi tahu", "Decision Tree dari data asli saja memisah di pity ±66 (Agent) / ±59 (W-Engine), ±10 pull sebelum soft pity.", C.green, { bsize: 14 });
    T(s, "W-Engine: 4 dari 11 pull mulai pull ke-65 menghasilkan S (36%), lebih tinggi dari model, tetapi datanya masih sedikit.", { x: M, y: 6.1, w: 8.4, h: 0.7, fontSize: 14, color: C.mut, valign: "top" });
    s.addNotes("Pola soft pity (±2 menit). Ini jawaban rumusan kedua sekaligus alasan memakai data mining. Grafik membandingkan laju S per pull di data asli (batang oranye) dengan peluang model Markov (titik hitam). Agent: hampir nol sampai pull ke-73, lalu melonjak 14 persen di pull 74 sampai 78 dan 38 persen sesudahnya, hampir sama dengan model. W-Engine: 4 dari 11 pull setelah pull ke-65 dapat S, lebih tinggi dari model, tetapi datanya masih sedikit. Decision Tree yang dilatih hanya dengan data asli juga memisahkan data di sekitar pity 66, sekitar 10 pull sebelum soft pity, padahal tidak pernah diberi tahu soal soft pity."); }
  { const s = base("Model pohon menemukan soft pity sendiri", "Pembahasan");
    img(s, "fig_kurva.png", M, 1.7, 8.2, 3.6);
    bullets(s, ["Garis putus-putus = peluang teori (Markov)", "Pohon & KNN menempel ke teori, termasuk lonjakan soft pity", "Logistic Regression & Naive Bayes hanya kurva halus → meleset"], M, 5.5, 12, 1.4, 15);
    card(s, 9.2, 1.7, 3.5, 3.6, "Tanpa diberi tahu", "Di data simulasi, Decision Tree memisahkan data di pity_ratio ±0,72, sekitar 10 pull sebelum soft pity.", C.acc, { bsize: 15 });
    s.addNotes("Kurva peluang (±2 menit). Jelaskan grafik: sumbu x pity saat ini, sumbu y peluang dapat S dalam 10 pull. Model pohon dan KNN mengikuti garis teori, termasuk lonjakan tajam. Logistic Regression dan Naive Bayes tidak mampu karena bentuk modelnya halus. Decision Tree menemukan titik soft pity sendiri dari data."); }
  { const s = base("Confusion matrix & feature importance", "Pembahasan");
    img(s, "fig_cm.png", M, 1.8, 7.4, 2.5);
    img(s, "fig_importance.png", 8.3, 1.8, 4.4, 2.5);
    bullets(s, ["Baseline tidak pernah menebak \"dapat S\" → recall 0", "XGBoost menangkap sebagian besar S di sekitar soft pity", "pity_ratio paling penting; guaranteed ≈ 0 (benar menurut aturan game: guaranteed hanya menentukan S mana, bukan kapan)"], M, 4.8, 12, 2.0, 15);
    s.addNotes("Confusion matrix dan fitur (±1,5 menit). Baseline tidak pernah menebak dapat S. Feature importance: pity_ratio paling penting, guaranteed hampir nol. Ini sesuai aturan game, jadi model belajar hal yang benar."); }
  { const s = base("Kesimpulan & saran", "Penutup");
    [["Markov Chain", "Peluang dapat S dalam N pull dihitung langsung dari aturan banner dan dipakai di kalkulator.", C.acc],
      ["Soft pity dari data", "Lonjakan Agent mulai pull ke-74 (W-Engine ±65) terlihat di data asli dan ditemukan Decision Tree.", C.pink],
      ["Algoritma terbaik", "Pohon (DT, RF, XGBoost) & KNN setara terbaik: ±91% simulasi, ±93% data asli. NB & LR nyata lebih rendah. Di data asli saja, selisihnya belum signifikan.", C.blue],
      ["Akurasi saja menipu", "Data tidak seimbang butuh Balanced Acc., F1, ROC-AUC, Log Loss.", C.green],
    ].forEach(([t, b, c], k) => card(s, M + k * 3.07, 1.8, 2.87, 3.8, t, b, c, { icon: String(k + 1), bsize: 14, tsize: 17 }));
    T(s, "Saran: tambah akun data asli (≥5 akun) agar uji signifikansi lebih kuat, coba metrik lain untuk grid search, perjelas soft pity W-Engine, perluas ke banner lain.", { x: M, y: 5.85, w: 12.1, h: 0.8, fontSize: 15, color: C.mut, valign: "top" });
    s.addNotes("Kesimpulan (±1,5 menit). Bacakan empat kesimpulan dan saran pengembangan. Tekankan bahwa soft pity yang tidak diumumkan berhasil ditemukan dari data, dan model pohon tetap terbaik walaupun dilatih hanya dengan data asli. Sebutkan keterbatasan dengan jujur: data latih utama berasal dari simulasi, dan data asli baru dua akun sehingga uji signifikansi di data asli belum cukup kuat untuk memastikan satu algoritma paling unggul."); }
  penutup("Ada pertanyaan? Silakan coba aplikasinya langsung:").addNotes("Penutup (±1 menit). Ucapkan terima kasih, ajak membuka aplikasi, buka sesi tanya jawab.");
}

MODE === "uts" ? uts() : uas();
pres.writeFile({ fileName: OUT }).then(() => console.log("wrote", OUT, n, "slides"));
