// Helper pembuat dokumen akademik (Times New Roman 12, spasi 1,5, A4).
const fs = require("fs");
const d = require("docx");
const {
  Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, ImageRun, PageBreak, Footer, PageNumber, TableOfContents,
  LevelFormat, PositionalTab, PositionalTabAlignment, PositionalTabRelativeTo, PositionalTabLeader,
} = d;

const FIG = process.env.FIG;
const FONT = "Times New Roman";
const CONTENT_W = 7938; // 21 cm - 4 cm - 3 cm, dalam DXA

// **tebal**, *miring*
function runs(text, base0 = {}) {
  const base = Object.fromEntries(Object.entries(base0).filter(([, v]) => v !== undefined));
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith("**")) out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}

const P = (text, o = {}) =>
  new Paragraph({
    children: runs(text),
    alignment: o.align ?? AlignmentType.JUSTIFIED,
    indent: o.noIndent ? undefined : { firstLine: 709 },
    spacing: { line: 360, after: 120 },
  });
const Center = (text, o = {}) =>
  new Paragraph({
    children: runs(text, { size: o.size, bold: o.bold }),
    alignment: AlignmentType.CENTER,
    spacing: { line: o.line ?? 360, after: o.after ?? 120, before: o.before ?? 0 },
  });
const Eq = (text) =>
  new Paragraph({ children: [new TextRun({ text, italics: true })], alignment: AlignmentType.CENTER, spacing: { line: 360, after: 120 } });

const HEADINGS = [];
const BAB = (num, title, first = false) => (HEADINGS.push({ level: 1, text: `BAB ${num} ${title.toUpperCase()}`, find: title.toUpperCase() }), [
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    pageBreakBefore: !first,
    spacing: { after: 360, line: 360 },
    children: [new TextRun({ text: `BAB ${num}`, break: 0 }), new TextRun({ text: title.toUpperCase(), break: 1 })],
  }),
]);
const H1plain = (title) => (title !== "Daftar Isi" && HEADINGS.push({ level: 1, text: title.toUpperCase(), find: title.toUpperCase() }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, pageBreakBefore: true, spacing: { after: 360 }, children: [new TextRun(title.toUpperCase())] }));
const H2 = (t) => (HEADINGS.push({ level: 2, text: t, find: t }), new Paragraph({ keepNext: true, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120, line: 360 }, children: [new TextRun(t)] }));
const H3 = (t) => (HEADINGS.push({ level: 3, text: t, find: t }), new Paragraph({ keepNext: true, heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 120, line: 360 }, children: [new TextRun(t)] }));

const Bullets = (items) => items.map((t) => new Paragraph({ numbering: { reference: "bullet", level: 0 }, children: runs(t), alignment: AlignmentType.JUSTIFIED, spacing: { line: 360, after: 60 } }));
let numInstance = 0;
const Numbered = (items) => {
  const inst = ++numInstance;
  return items.map((t) => new Paragraph({ numbering: { reference: "num", level: 0, instance: inst }, children: runs(t), alignment: AlignmentType.JUSTIFIED, spacing: { line: 360, after: 60 } }));
};

const border = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
const borders = { top: border, bottom: border, left: border, right: border };
function TableX(headers, rows, widthsPct, o = {}) {
  const total = o.width ?? CONTENT_W;
  const widths = widthsPct.map((p) => Math.round((p / 100) * total));
  widths[widths.length - 1] = total - widths.slice(0, -1).reduce((a, b) => a + b, 0);
  const size = o.size ?? 20;
  // tabel pendek dijaga tetap utuh di satu halaman (tidak terpotong ke halaman berikutnya)
  const together = rows.length <= 15;
  const cell = (text, i, head, last = false) =>
    new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: head ? { fill: "D9E2F3", type: ShadingType.CLEAR, color: "auto" } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ keepNext: together && !last, keepLines: true, alignment: i === 0 || o.leftAll ? AlignmentType.LEFT : AlignmentType.CENTER, spacing: { line: 276 }, children: runs(String(text), { size, bold: head || undefined }) })],
    });
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r, k) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false, k === rows.length - 1)) })),
    ],
  });
}

let fig = 0, tab = 0, bab = 0;
const setBab = (n) => { bab = n; fig = 0; tab = 0; };
const CAPTIONS = []; // untuk Daftar Tabel & Daftar Gambar
const plain = (t) => t.replace(/\*/g, "");
const TCap = (t) => { tab++; CAPTIONS.push({ kind: "tab", label: `Tabel ${bab}.${tab}`, text: plain(t) }); return new Paragraph({ keepNext: true, keepLines: true, alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, children: runs(`**Tabel ${bab}.${tab}** ${t}`) }); };
function Img(file, caption, widthPx = 560) {
  const buf = fs.readFileSync(`${FIG}/${file}`);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20); // PNG IHDR
  const width = Math.min(widthPx, 560);
  const height = Math.round((h / w) * width);
  const maxH = 700;
  const scale = height > maxH ? maxH / height : 1;
  fig++;
  CAPTIONS.push({ kind: "fig", label: `Gambar ${bab}.${fig}`, text: plain(caption) });
  return [
    new Paragraph({ keepNext: true, alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new ImageRun({ type: "png", data: buf, transformation: { width: Math.round(width * scale), height: Math.round(height * scale) }, altText: { title: caption, description: caption, name: file } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: runs(`**Gambar ${bab}.${fig}** ${caption}`) }),
  ];
}
const Space = () => new Paragraph({ children: [] });
const Break = () => new Paragraph({ children: [new PageBreak()] });

const styles = {
  default: { document: { run: { font: FONT, size: 24 } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: FONT }, paragraph: { spacing: { before: 0, after: 360 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: FONT }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, italics: false, font: FONT }, paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 2 } },
  ],
};
const numbering = {
  config: [
    { reference: "bullet", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: "num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ],
};
const page = { size: { width: 11906, height: 16838 }, margin: { top: 1701, right: 1701, bottom: 1701, left: 2268 } };
const mkFooter = () => new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT] })] })] });
const blankFooter = () => new Footer({ children: [new Paragraph({ children: [] })] });
// Nomor halaman hasil render sebelumnya (lihat build.sh dan pages.py).
const readPages = () => {
  const file = process.env.TOC_PAGES;
  return file && fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
};
// Daftar isi statis: nomor halaman dihitung dari hasil render (lihat build.sh).
const TOC = () => {
  const file = process.env.TOC_PAGES;
  const pages = readPages()?.toc;
  const head = new Paragraph({ alignment: AlignmentType.CENTER, pageBreakBefore: true, spacing: { after: 360 }, children: [new TextRun({ text: "DAFTAR ISI", bold: true, size: 28 })] });
  if (!pages) return [head, new TableOfContents("Daftar Isi", { hyperlink: true, headingStyleRange: "1-3" })];
  return [head, ...pages.map((e) => new Paragraph({
    spacing: { line: 300, after: 40 },
    indent: { left: (e.level - 1) * 440 },
    tabStops: [{ type: d.TabStopType.RIGHT, position: CONTENT_W, leader: "dot" }],
    children: [new TextRun({ text: e.text, bold: e.level === 1 }), new TextRun({ text: "\t" + String(e.page) })],
  }))];
};

// Daftar Tabel / Daftar Gambar. Dipanggil SETELAH isi dokumen dibuat supaya semua keterangan sudah tercatat.
const LIST = (kind) => {
  const title = kind === "tab" ? "DAFTAR TABEL" : "DAFTAR GAMBAR";
  // urutan di daftar isi: sesudah Kata Pengantar, sebelum BAB I
  HEADINGS.splice(HEADINGS.findIndex((h) => h.text.startsWith("BAB ")), 0, { level: 1, text: title, find: title });
  const pages = readPages()?.[kind];
  const items = CAPTIONS.filter((c) => c.kind === kind);
  const head = new Paragraph({ heading: d.HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, pageBreakBefore: true, spacing: { after: 360 }, children: [new TextRun(title)] });
  return [head, ...items.map((c, i) => new Paragraph({
    spacing: { line: 300, after: 60 },
    indent: { left: 1134, hanging: 1134 },
    tabStops: [{ type: d.TabStopType.RIGHT, position: CONTENT_W, leader: "dot" }],
    children: [new TextRun(`${c.label} ${c.text}`), new TextRun({ text: "\t" + String(pages?.[i]?.page ?? 0) })],
  }))];
};

module.exports = { HEADINGS, CAPTIONS, LIST, mkFooter, blankFooter, d, P, Center, Eq, BAB, H1plain, H2, H3, Bullets, Numbered, TableX, TCap, Img, Space, Break, styles, numbering, page, TOC, setBab, runs, CONTENT_W };
