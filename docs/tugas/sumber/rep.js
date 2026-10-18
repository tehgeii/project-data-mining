// Angka hasil pelatihan untuk proposal, laporan, dan slide, dibaca dari models/report.json
// supaya tidak perlu disalin manual setiap kali model dilatih ulang.
const fs = require("fs");
const path = require("path");

const REPORT = process.env.REPORT || path.join(__dirname, "../../../models/report.json");
const R = JSON.parse(fs.readFileSync(REPORT, "utf8"));
const A = R.tasks.next_pull;
const B = R.tasks.next_10;

const BASELINE = "Baseline: selalu tebak 'tidak S'";
const MARKOV = "Markov Chain (teori)";
const ML = ["Naive Bayes", "KNN", "Logistic Regression", "Decision Tree", "Random Forest", "XGBoost"];
const ALL = [BASELINE, MARKOV, ...ML];
const LABEL = { [BASELINE]: "Baseline (selalu \"tidak S\")" };
const label = (n) => LABEL[n] ?? n;

// format Indonesia: 0,9108 · 1.209 · 93,1%
const num = (x, dec = 4) => x.toLocaleString("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const int = (n) => n.toLocaleString("id-ID");
const pct = (x, dec = 1) => `${num(x * 100, dec)}%`;
const bold = (s, on) => (on ? `**${s}**` : s);

// nilai rata-rata (cross-validation) atau nilai tunggal (data uji)
const val = (scores, name, key) => {
  const v = scores[name][key];
  return typeof v === "number" ? v : v.mean;
};

// nama algoritma dengan nilai terbaik (setelah dibulatkan seperti yang ditampilkan)
function best(scores, key, dec = 4, lower = false) {
  const shown = ML.map((n) => [n, Number(val(scores, n, key).toFixed(dec))]);
  const target = lower ? Math.min(...shown.map(([, v]) => v)) : Math.max(...shown.map(([, v]) => v));
  return new Set(shown.filter(([, v]) => v === target).map(([n]) => n));
}

// baris tabel: kolom berupa { scores, key, dec, lower, std, plain }
function rows(cols, names = ALL) {
  const winners = cols.map((c) => (c.plain ? new Set() : best(c.scores, c.key, c.dec ?? 4, c.lower)));
  return names.map((n) => [
    label(n),
    ...cols.map((c, i) => {
      let s = num(val(c.scores, n, c.key), c.dec ?? 4);
      if (c.std) s += ` ± ${num(c.scores[n][c.key].std, c.dec ?? 4)}`;
      return bold(s, winners[i].has(n));
    }),
  ]);
}

// ---------- hyperparameter ----------
const PARAM = {
  var_smoothing: "var_smoothing",
  kneighborsclassifier__n_neighbors: "k",
  logisticregression__C: "C",
  max_depth: "max_depth",
  min_samples_leaf: "min_samples_leaf",
  learning_rate: "learning_rate",
};
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
function pval(v) {
  if (typeof v !== "number") return String(v);
  if (v !== 0 && Math.abs(v) < 0.01) {
    const e = Math.round(Math.log10(Math.abs(v)));
    if (Math.abs(v - 10 ** e) < 1e-12) return `10${String(e).replace(/./g, (c) => SUP[c])}`;
  }
  return v.toLocaleString("id-ID", { maximumFractionDigits: 4 });
}
const params = (p) => Object.entries(p).map(([k, v]) => `${PARAM[k] ?? k} = ${pval(v)}`).join(", ");
const grid = (name) => Object.entries(B.tuning.grids[name])
  .map(([k, vs]) => `${PARAM[k] ?? k} ∈ {${vs.map(pval).join("; ")}}`).join("; ");

// ---------- uji signifikansi ----------
const pnum = (p) => (p < 0.001 ? "< 0,001" : num(p, 3));
// selisih akurasi dalam poin persen: "+0,58", "−1,63", "0,00"
const pts = (d) => {
  const s = num(Math.abs(d) * 100, 2);
  return s === num(0, 2) ? s : `${d > 0 ? "+" : "−"}${s}`;
};

module.exports = { R, A, B, BASELINE, MARKOV, ML, ALL, label, num, int, pct, bold, val, best, rows, params, grid, pnum, pts, PARAM };
