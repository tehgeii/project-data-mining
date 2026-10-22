#!/bin/bash
# Membuat ulang keempat file tugas di docs/tugas/.
#   bash build.sh            -> proposal, laporan (docx + pdf), dan kedua slide
#   bash build.sh proposal   -> hanya proposal UTS (atau: laporan / slide)
# Proposal dibuat oleh proposal.js (format contoh dosen, tanpa daftar isi);
# laporan dibuat oleh gen.js (dengan daftar isi, daftar tabel, dan daftar gambar).
# Butuh: Node.js (npm install sekali), LibreOffice (soffice), dan poppler-utils (pdfinfo, pdftotext).
set -e
cd "$(dirname "$0")"
export FIG="$PWD/fig"
OUTDIR="$(cd .. && pwd)"
R="${RENDER_DIR:-$(mktemp -d)}"   # tempat render PDF (LibreOffice)

render() {
  local name=$1
  cp "$OUTDIR/$name.docx" "$R/$name.docx"; rm -f "$R/$name.pdf"
  soffice --headless --convert-to pdf --outdir "$R" "$R/$name.docx" >/dev/null 2>&1
  test -f "$R/$name.pdf" || { echo "RENDER GAGAL: $name"; exit 1; }
}
pages() { pdfinfo "$R/$1.pdf" | awk '/Pages/{print $2}'; }

proposal() {
  local name=UTS_Proposal_Kelompok6_A11.4502
  node proposal.js "$OUTDIR/$name.docx" >/dev/null; render "$name"
  echo "selesai: $name.docx ($(pages "$name") halaman)"
  cp "$R/$name.pdf" "$OUTDIR/$name.pdf"
}

# Daftar isi, Daftar Tabel, dan Daftar Gambar ditulis statis. Nomor halamannya diambil dari
# hasil render PDF, lalu dokumen dibuat ulang sampai nomor halamannya tidak berubah lagi.
laporan() {
  local name=UAS_Laporan_Akhir_Kelompok6_A11.4502 toc="$R/toc_laporan.json"
  local out="$OUTDIR/$name.docx"
  rm -f "$toc"
  TOC_PAGES="$toc" node gen.js "$out" >/dev/null; render "$name"
  python3 pages.py "$R/$name.pdf" "$out.headings.json" "$toc"
  for i in 1 2 3; do
    cp "$toc" "$R/prev.json"
    TOC_PAGES="$toc" node gen.js "$out" >/dev/null; render "$name"
    python3 pages.py "$R/$name.pdf" "$out.headings.json" "$toc"
    cmp -s "$R/prev.json" "$toc" && { echo "stabil: $name.docx ($(pages "$name") halaman)"; break; }
  done
  # PDF hasil render terakhir = isi docx yang sama persis, ikut disimpan untuk dikumpulkan
  cp "$R/$name.pdf" "$OUTDIR/$name.pdf"
  rm -f "$out.headings.json"
}

what=${1:-semua}
[ -d node_modules ] || npm install --silent
if [ "$what" = semua ] || [ "$what" = proposal ]; then proposal; fi
if [ "$what" = semua ] || [ "$what" = laporan ]; then laporan; fi
if [ "$what" = semua ] || [ "$what" = slide ]; then
  node slides.js uts "$OUTDIR/UTS_Slide_Kelompok6_A11.4502.pptx"
  node slides.js uas "$OUTDIR/UAS_Slide_Kelompok6_A11.4502.pptx"
fi
