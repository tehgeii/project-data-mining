// node slides.js uts|uas <out.pptx>
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const MODE = process.argv[2], OUT = process.argv[3];
const FIG = process.env.FIG;
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.title = "ZZZ Gacha Predictor";

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
const ACC_SIM = [83.4, 91.1, 85.7, 91.1, 88.9, 91.1, 91.1, 91.1];
const ACC_REAL = [86.6, 93.5, 87.5, 93.5, 91.1, 93.3, 93.3, 93.4];
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
function rumusan() {
  const s = base("Rumusan masalah", "Masalah");
  const items = [
    ["1", "Menghitung peluang", "Berapa peluang dapat S-Rank / S-Rank rate-up dalam N pull dari pity dan status guaranteed?"],
    ["2", "Algoritma terbaik", "Dari Naive Bayes, KNN, Logistic Regression, Decision Tree, Random Forest, dan XGBoost, mana yang paling akurat?"],
    ["3", "Evaluasi yang tepat", "Bagaimana menilai model pada data yang sangat tidak seimbang?"],
    ["4", "Mudah diakses", "Bagaimana menyajikannya dalam web yang nyaman di HP dan PC?"],
  ];
  items.forEach(([i, t, b], k) => card(s, M + k * 3.07, 1.9, 2.87, 4.4, t, b, [C.acc, C.blue, C.green, C.purple][k], { icon: i }));
  s.addNotes("Rumusan masalah (±1,5 menit). Bacakan empat rumusan masalah. Yang kedua adalah inti tugas: membandingkan enam algoritma. Naive Bayes, KNN, dan Decision Tree sesuai materi kuliah; Logistic Regression, Random Forest, dan XGBoost sebagai pembanding tambahan.");
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
  const s = base("Markov Chain: peluang yang eksak", "Landasan teori");
  img(s, "fig_markov.png", M, 1.75, 6.0, 2.3);
  img(s, "fig_hazard.png", M, 4.3, 6.0, 2.5);
  T(s, [
    { text: "Peluang S di pull ke-n hanya bergantung pada pity → cocok dimodelkan Markov Chain.", options: { bullet: { indent: 18 }, breakLine: true } },
    { text: "h(n) = rate dasar, lalu naik k per pull setelah soft pity, dan = 1 di hard pity.", options: { bullet: { indent: 18 }, breakLine: true } },
    { text: "k dicari dengan metode biseksi supaya rata-rata = rate gabungan resmi (k ≈ 5,3% Agent, 5,5% W-Engine).", options: { bullet: { indent: 18 }, breakLine: true } },
    { text: "Hasil: peluang pasti dapat S / S rate-up dalam N pull, tanpa simulasi.", options: { bullet: { indent: 18 } } },
  ], { x: 7.1, y: 1.9, w: 5.6, h: 4.8, fontSize: 16, valign: "top", paraSpaceAfter: 12 });
  s.addNotes("Markov Chain (±1,5 menit). State adalah pity saat ini. Setiap pull, dengan peluang h kita dapat S dan kembali ke pity 0; jika tidak, pity naik satu. Grafik bawah menunjukkan peluang per pull: datar 0,6 persen lalu melonjak setelah soft pity sampai 100 persen di hard pity. Kenaikan per pull dicari dengan metode biseksi agar rata-ratanya sama dengan rate gabungan resmi. Markov Chain ini dipakai di kalkulator dan sebagai batas teori pembanding algoritma.");
}
function algoritma() {
  const s = base("Enam algoritma klasifikasi yang dibandingkan", "Landasan teori");
  const a = [
    ["Naive Bayes", "Probabilistik, asumsi fitur saling bebas & berdistribusi normal.", C.purple],
    ["KNN", "Menebak dari 101 data latih terdekat (fitur dinormalisasi).", C.pink],
    ["Logistic Regression", "Kurva sigmoid dari kombinasi linear fitur.", C.blue],
    ["Decision Tree", "Aturan jika–maka yang mudah dibaca (max depth 6).", C.acc],
    ["Random Forest", "150 pohon acak, hasil dirata-rata (bagging).", C.red],
    ["XGBoost", "300 pohon berurutan memperbaiki kesalahan (boosting).", C.green],
  ];
  a.forEach(([t, b, c], k) => card(s, M + (k % 3) * 4.1, 1.8 + Math.floor(k / 3) * 2.45, 3.9, 2.25, t, b, c, { tsize: 20, bsize: 15 }));
  s.addNotes("Algoritma (±2 menit). Jelaskan singkat keenam algoritma. Naive Bayes, KNN, dan Decision Tree adalah materi kuliah. Logistic Regression sebagai model linear sederhana. Random Forest dan XGBoost adalah ensemble pohon. Ditambah dua pembanding: baseline yang selalu menebak tidak dapat S, dan Markov Chain sebagai batas teori.");
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
  card(s, M, 1.8, 5.9, 2.4, "Simulasi Monte Carlo", "400 akun virtual · ±314 ribu pull · dibangkitkan dari model Markov (seed 42). Dipakai untuk melatih dan menguji.", C.blue, { bsize: 16 });
  card(s, 6.8, 1.8, 5.9, 2.4, "Data asli (2 akun)", "1.441 pull · 22 S-Rank · anonim. Dipakai untuk menguji model, dan dalam eksperimen kedua untuk melatih + menguji sendiri (1.209 baris).", C.green, { bsize: 16 });
  T(s, "Cara ambil data asli:", { x: M, y: 4.55, w: 12, h: 0.4, fontSize: 16, bold: true });
  bullets(s, ["Script PowerShell membaca URL riwayat dari cache game di PC (Steam/HoYoPlay) → server HoYoverse", "Upload file UIGF v4 (cocok untuk HP) atau input manual pity", "Pra-pemrosesan: buang duplikat, urutkan per akun, hitung pity & guaranteed, buang segmen pertama yang tidak lengkap"], M, 5.0, 12, 1.8, 15);
  s.addNotes("Data (±1,5 menit). Riwayat satu akun terlalu sedikit untuk melatih model, jadi data latih memakai simulasi Monte Carlo dari model Markov, 400 akun. Data asli dua akun, 1.441 pull, sudah memenuhi syarat dataset tabel minimal 500 sampai 1000 baris. Data asli dipakai untuk menguji, dan di eksperimen kedua keenam algoritma juga dilatih dan diuji hanya dengan data asli. Jelaskan cara pengambilan data asli lewat script PowerShell yang hanya membaca cache game, dan bahwa authkey tidak disimpan.");
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
    ["5-fold GroupKFold", "Rata-rata ± simpangan baku dari 5 percobaan.", C.blue],
    ["Uji data asli", "Model diuji di 2 akun asli yang tidak pernah dilihat saat latih.", C.green],
    ["Latih di data asli", "Eksperimen kedua: latih + uji hanya data asli, 5-fold per siklus pity.", C.purple]];
  it.forEach(([t, b, c], k) => card(s, M + k * 3.07, 2.0, 2.87, 3.2, t, b, c, { icon: String(k + 1), bsize: 15 }));
  T(s, "Pembanding: Baseline (selalu \"tidak S\") dan Markov Chain (batas teori).", { x: M, y: 5.5, w: 12, h: 0.5, fontSize: 16, color: C.mut });
  s.addNotes("Skenario evaluasi (±1 menit). Pembagian data per akun mencegah kebocoran, karena pull yang berurutan saling berkaitan. Cross-validation lima fold untuk hasil yang stabil, lalu uji akhir di data asli. Eksperimen keempat: semua algoritma dilatih dan diuji hanya dengan data asli, 1.209 baris, dibagi per siklus pity menjadi 5 bagian, supaya hasil tidak bergantung pada data simulasi.");
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
  team(); latar(); rumusan();
  { const s = base("Batasan dan tujuan", "Pendahuluan");
    T(s, "Batasan", { x: M, y: 1.8, w: 5.9, h: 0.4, fontSize: 20, bold: true, color: C.acc, fontFace: HF });
    bullets(s, ["Hanya banner Agent & W-Engine terbatas", "Yang diprediksi hanya S-Rank", "Soft pity memakai estimasi komunitas", "Data asli: akun anggota & teman (anonim)", "Ambil riwayat otomatis: PC Windows"], M, 2.3, 5.9, 4.3, 16);
    T(s, "Tujuan", { x: 6.9, y: 1.8, w: 5.9, h: 0.4, fontSize: 20, bold: true, color: C.blue, fontFace: HF });
    bullets(s, ["Model Markov Chain untuk peluang eksak", "Membandingkan 6 algoritma klasifikasi", "Evaluasi yang tepat untuk data tidak seimbang", "Aplikasi web yang nyaman di HP & PC"], 6.9, 2.3, 5.8, 4.3, 16);
    s.addNotes("Batasan dan tujuan (±1,5 menit). Bacakan batasan: hanya dua banner terbatas dan hanya S-Rank. Lalu empat tujuan yang sejalan dengan rumusan masalah."); }
  aturan(); markov(); algoritma(); metrik(); crisp(); data(); fitur(); skenario();
  screenshot("Rancangan aplikasi web", "Rancangan", "app_kalkulator_top.png",
    ["Beranda: penjelasan & aturan banner", "Import Data: PowerShell, upload UIGF, input manual, data contoh", "Kalkulator Peluang: Markov Chain + prediksi 6 algoritma", "Statistik Riwayat: pity tiap S, menang 50/50", "Perbandingan Algoritma: metrik, kurva, confusion matrix", "Tema gelap, nyaman di HP"],
    "Rancangan aplikasi (±1,5 menit). Aplikasi dibangun dengan Streamlit, materi deployment di kuliah. Jelaskan enam halaman. Kalau memungkinkan, buka link aplikasinya dan tunjukkan halaman kalkulator secara langsung.");
  { const s = base("Hasil awal prototipe (tugas B)", "Progres");
    chartBars(s, NAMES, [{ name: "Simulasi (5-fold CV)", values: ACC_SIM, color: C.blue }, { name: "Data asli (2 akun)", values: ACC_REAL, color: C.acc }], M, 1.7, 8.4, 5.1, { min: 80, max: 96, title: "Accuracy (%)" });
    card(s, 9.3, 1.8, 3.4, 4.8, "Temuan awal", "Prototipe sudah jalan. Pity akun asli yang dihitung aplikasi sama persis dengan di game. Model pohon & KNN ±91% (simulasi) dan ±93% (data asli). Latih di data asli saja: Decision Tree ±93%.", C.green, { bsize: 15 });
    s.addNotes("Hasil awal (±2 menit). Prototipe sudah berjalan dan bisa dibuka di HP. Validasi: saat dicek, pity akun asli 70 dari 90 dan 46 dari 80 sama persis dengan di game. Hasil awal tugas B: model pohon dan KNN sekitar 91 persen di simulasi dan 93 persen di data asli, Logistic Regression dan Naive Bayes lebih rendah. Eksperimen latih dan uji dengan data asli saja, 1.209 baris, juga sudah dilakukan: Decision Tree tetap tertinggi sekitar 93 persen. Hasil lengkap akan dibahas di laporan akhir."); }
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
  team(); latar(); rumusan(); aturan(); markov(); algoritma(); metrik(); crisp(); data(); fitur();
  screenshot("Aplikasi: Import Data", "Implementasi", "app_import.png",
    ["URL dari script PowerShell (PC)", "Upload file UIGF v4 (HP)", "Input manual pity (HP)", "Data contoh untuk yang tidak punya game", "authkey tidak disimpan; riwayat hanya ada di sesi browser"],
    "Demo Import Data (±1,5 menit). Tunjukkan tiga cara input. Sebaiknya demo langsung: klik Pakai data contoh. Jelaskan aspek keamanan: authkey hanya dipakai sekali.");
  screenshot("Aplikasi: Kalkulator Peluang", "Implementasi", "app_kalkulator_top.png",
    ["Peluang dapat S / S rate-up dalam N pull (Markov Chain, eksak)", "Rata-rata & paling sial sampai S rate-up", "Konversi Polychrome → jumlah pull", "Prediksi 6 algoritma untuk 1 pull & 10 pull"],
    "Demo Kalkulator (±1,5 menit). Ubah pity dan jumlah pull lalu tunjukkan grafik peluang kumulatif berubah. Tunjukkan tabel prediksi enam algoritma dibandingkan dengan Markov.");
  { const s = base("Validasi dengan akun asli", "Hasil");
    stat(s, M, 2.0, 3.8, "70 / 90", "pity Agent dihitung aplikasi = di game");
    stat(s, 4.75, 2.0, 3.8, "46 / 80", "pity W-Engine + guaranteed = di game", C.blue);
    stat(s, 8.9, 2.0, 3.8, "87 / 87", "test otomatis lolos (pytest + GitHub Actions)", C.green);
    T(s, "Pengambilan data, perhitungan pity, dan deteksi 50/50 terbukti benar dengan data game sungguhan (versi Steam).", { x: M, y: 4.6, w: 12, h: 0.9, fontSize: 18, color: C.mut, valign: "top" });
    s.addNotes("Validasi (±1 menit). Angka pity yang dihitung aplikasi untuk akun asli sama persis dengan yang tampil di game. Selain itu 87 test otomatis memastikan perhitungan tidak salah."); }
  { const s = base("Tugas A: jebakan akurasi", "Hasil", C.bg2);
    stat(s, M, 1.9, 4.5, "98,3%", "akurasi model yang SELALU menebak \"tidak dapat S\"");
    table(s, [["Model", "Accuracy", "Bal. Acc.", "ROC-AUC"],
      ["Baseline", "0,9828", "0,5000", "0,5000"], ["Markov (teori)", "0,9830", "0,5184", "0,7890"], ["Naive Bayes", "0,9829", "0,5007", "0,7563"],
      ["KNN", "0,9829", "0,5150", "0,7728"], ["Logistic Regression", "0,9828", "0,5000", "0,7578"], ["Decision Tree", "0,9830", "0,5136", "0,7889"],
      ["Random Forest", "0,9830", "0,5151", "0,7877"], ["XGBoost", "0,9829", "0,5162", "0,7862"]], 5.6, 1.8, 7.1, [2.9, 1.4, 1.4, 1.4], { size: 13, rowH: 0.48 });
    T(s, "Semua model ±98,3% → akurasi tidak bisa membedakan model. Perbedaan baru terlihat di ROC-AUC & Log Loss.", { x: M, y: 4.2, w: 4.6, h: 2.0, fontSize: 16, color: C.mut, valign: "top" });
    s.addNotes("Tugas A (±1,5 menit). Ini temuan penting. Semua model, bahkan tebakan bodoh, akurasinya 98 persen. Jadi akurasi tidak bisa dipakai sendirian di data tidak seimbang. Itulah alasan tugas B dijadikan tugas utama."); }
  { const s = base("Tugas B: akurasi 6 algoritma", "Hasil");
    chartBars(s, NAMES, [{ name: "Simulasi (5-fold CV)", values: ACC_SIM, color: C.blue }, { name: "Data asli (2 akun)", values: ACC_REAL, color: C.acc }], M, 1.7, 12.1, 5.1, { min: 80, max: 96, title: "Accuracy (%) — dapat S dalam 10 pull" });
    s.addNotes("Tugas B (±2 menit). Bacakan grafik. Decision Tree, Random Forest, XGBoost, dan KNN sekitar 91 persen di simulasi dan 93 persen di data asli, hampir sama dengan batas teori Markov. Logistic Regression 88,9 persen, Naive Bayes 85,7 persen, baseline 83,4 persen. Urutannya sama di simulasi dan data asli."); }
  { const s = base("Tugas B: metrik lengkap (cross-validation)", "Hasil");
    table(s, [["Model", "Accuracy", "Bal. Acc.", "F1", "ROC-AUC", "Log Loss"],
      ["Baseline", "0,8337", "0,5000", "0,0000", "0,5000", "2,6804"], ["Markov (teori)", "0,9108", "0,7601", "0,6658", "0,8110", "0,2811"],
      ["Naive Bayes", "0,8572", "0,7569", "0,5855", "0,7810", "0,3844"], ["KNN", "0,9107", "0,7598", "0,6654", "0,8072", "0,2866"],
      ["Logistic Regression", "0,8888", "0,6675", "0,5010", "0,7895", "0,3625"], ["Decision Tree", "0,9108", "0,7614", "0,6671", "0,8117", "0,2814"],
      ["Random Forest", "0,9108", "0,7612", "0,6669", "0,8102", "0,2816"], ["XGBoost", "0,9108", "0,7604", "0,6661", "0,8098", "0,2816"]],
      M, 1.8, 12.1, [3.6, 1.7, 1.7, 1.7, 1.7, 1.7], { size: 14, rowH: 0.52, hlRows: [4, 6, 7, 8] });
    s.addNotes("Metrik lengkap (±1,5 menit). Baris kuning adalah empat algoritma terbaik. Decision Tree terbaik di balanced accuracy, F1, ROC-AUC, dan log loss, walau selisihnya kecil dengan Random Forest, XGBoost, dan KNN."); }
  { const s = base("Latih & uji hanya dengan data asli", "Hasil · eksperimen kedua");
    chartBars(s, NAMES, [{ name: "Accuracy (%)", values: [86.6, 93.7, 87.9, 87.4, 90.7, 93.1, 93.0, 92.2], color: C.green }], M, 1.7, 8.4, 5.1, { min: 80, max: 96, title: "Accuracy (%) — 1.209 baris data asli, 5-fold per siklus pity" });
    card(s, 9.3, 1.8, 3.4, 2.5, "Tetap konsisten", "Decision Tree 93,1%, Random Forest 93,0%, XGBoost 92,2%: urutan sama seperti di simulasi.", C.acc, { bsize: 14 });
    card(s, 9.3, 4.5, 3.4, 2.2, "KNN turun", "k = 101 terlalu besar untuk ±970 baris latih → hampir selalu menebak mayoritas.", C.pink, { bsize: 14 });
    s.addNotes("Eksperimen kedua (±2 menit). Untuk menjawab apakah model hanya bagus di data simulasi, kami melatih dan menguji keenam algoritma hanya dengan data asli: 1.209 baris dari 2 akun, sudah di atas syarat 500 sampai 1000 baris. Data dibagi per siklus pity menjadi 5 bagian. Hasilnya: Decision Tree 93,1 persen, Random Forest 93,0 persen, XGBoost 92,2 persen, urutannya sama seperti di simulasi dan hampir menyamai batas teori Markov 93,7 persen. Logistic Regression 90,7 persen dan Naive Bayes 87,9 persen. KNN turun ke 87,4 persen karena nilai k = 101 terlalu besar untuk data sekecil ini, jadi KNN hampir selalu menebak kelas mayoritas. Pelajarannya: hyperparameter harus disesuaikan dengan ukuran data."); }
  { const s = base("Model pohon menemukan soft pity sendiri", "Pembahasan");
    img(s, "fig_kurva.png", M, 1.7, 8.2, 3.6);
    bullets(s, ["Garis putus-putus = peluang teori (Markov)", "Pohon & KNN menempel ke teori, termasuk lonjakan soft pity", "Logistic Regression & Naive Bayes hanya kurva halus → meleset"], M, 5.5, 12, 1.4, 15);
    card(s, 9.2, 1.7, 3.5, 3.6, "Tanpa diberi tahu", "Decision Tree memisahkan data di pity_ratio ±0,72, sekitar 10 pull sebelum soft pity.", C.acc, { bsize: 15 });
    s.addNotes("Kurva peluang (±2 menit). Jelaskan grafik: sumbu x pity saat ini, sumbu y peluang dapat S dalam 10 pull. Model pohon dan KNN mengikuti garis teori, termasuk lonjakan tajam. Logistic Regression dan Naive Bayes tidak mampu karena bentuk modelnya halus. Decision Tree menemukan titik soft pity sendiri dari data."); }
  { const s = base("Confusion matrix & feature importance", "Pembahasan");
    img(s, "fig_cm.png", M, 1.8, 7.4, 2.5);
    img(s, "fig_importance.png", 8.3, 1.8, 4.4, 2.5);
    bullets(s, ["Baseline tidak pernah menebak \"dapat S\" → recall 0", "XGBoost menangkap sebagian besar S di sekitar soft pity", "pity_ratio paling penting; guaranteed ≈ 0 (benar menurut aturan game: guaranteed hanya menentukan S mana, bukan kapan)"], M, 4.8, 12, 2.0, 15);
    s.addNotes("Confusion matrix dan fitur (±1,5 menit). Baseline tidak pernah menebak dapat S. Feature importance: pity_ratio paling penting, guaranteed hampir nol. Ini sesuai aturan game, jadi model belajar hal yang benar."); }
  { const s = base("Kesimpulan & saran", "Penutup");
    card(s, M, 1.8, 3.9, 3.6, "Markov Chain", "Peluang dapat S dalam N pull bisa dihitung eksak dan dipakai di kalkulator.", C.acc, { icon: "1", bsize: 15 });
    card(s, 4.7, 1.8, 3.9, 3.6, "Algoritma terbaik", "Decision Tree, Random Forest, XGBoost konsisten terbaik: ±91% simulasi, ±93% data asli, juga saat dilatih di data asli saja.", C.blue, { icon: "2", bsize: 15 });
    card(s, 8.8, 1.8, 3.9, 3.6, "Akurasi saja menipu", "Data tidak seimbang butuh Balanced Acc., F1, ROC-AUC, Log Loss.", C.green, { icon: "3", bsize: 15 });
    T(s, "Saran: tambah akun data asli, sesuaikan hyperparameter (k pada KNN) dengan grid search, estimasi soft pity dari data, perluas ke banner lain.", { x: M, y: 5.7, w: 12, h: 0.8, fontSize: 15, color: C.mut, valign: "top" });
    s.addNotes("Kesimpulan (±1,5 menit). Bacakan tiga kesimpulan dan saran pengembangan. Tekankan bahwa model pohon tetap terbaik walaupun dilatih hanya dengan data asli. Sebutkan keterbatasan: soft pity masih estimasi dan data asli baru dua akun."); }
  penutup("Ada pertanyaan? Silakan coba aplikasinya langsung:").addNotes("Penutup (±1 menit). Ucapkan terima kasih, ajak membuka aplikasi, buka sesi tanya jawab.");
}

MODE === "uts" ? uts() : uas();
pres.writeFile({ fileName: OUT }).then(() => console.log("wrote", OUT, n, "slides"));
