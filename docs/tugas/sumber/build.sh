#!/bin/bash
# Membuat ulang keempat file tugas di docs/tugas/.
#   bash build.sh            -> proposal, laporan, dan kedua slide
#   bash build.sh proposal   -> hanya proposal UTS (atau: laporan / slide)
# Butuh: Node.js (npm install sekali), LibreOffice (soffice), dan poppler-utils (pdfinfo, pdftotext).
set -e
cd "$(dirname "$0")"
export FIG="$PWD/fig"
OUTDIR="$(cd .. && pwd)"
R="${RENDER_DIR:-$(mktemp -d)}"   # PDF hasil render, hanya untuk menghitung nomor halaman

# Daftar isi, Daftar Tabel, dan Daftar Gambar ditulis statis. Nomor halamannya diambil dari
# hasil render PDF, lalu dokumen dibuat ulang sampai nomor halamannya tidak berubah lagi.
docx() {
  local mode=$1 name=$2 out="$OUTDIR/$2.docx" toc="$R/toc_$1.json"
  render() {
    cp "$out" "$R/$name.docx"; rm -f "$R/$name.pdf"
    soffice --headless --convert-to pdf --outdir "$R" "$R/$name.docx" >/dev/null 2>&1
    test -f "$R/$name.pdf" || { echo "RENDER GAGAL: $name"; exit 1; }
  }
  rm -f "$toc"
  TOC_PAGES="$toc" node gen.js "$mode" "$out" >/dev/null; render
  python3 pages.py "$R/$name.pdf" "$out.headings.json" "$toc"
  for i in 1 2 3; do
    cp "$toc" "$R/prev.json"
    TOC_PAGES="$toc" node gen.js "$mode" "$out" >/dev/null; render
    python3 pages.py "$R/$name.pdf" "$out.headings.json" "$toc"
    cmp -s "$R/prev.json" "$toc" && { echo "stabil: $name.docx ($(pdfinfo "$R/$name.pdf" | awk '/Pages/{print $2}') halaman)"; break; }
  done
  rm -f "$out.headings.json"
}

what=${1:-semua}
[ -d node_modules ] || npm install --silent
if [ "$what" = semua ] || [ "$what" = proposal ]; then docx proposal UTS_Proposal_Kelompok6_A11.4502; fi
if [ "$what" = semua ] || [ "$what" = laporan ]; then docx laporan UAS_Laporan_Akhir_Kelompok6_A11.4502; fi
if [ "$what" = semua ] || [ "$what" = slide ]; then
  node slides.js uts "$OUTDIR/UTS_Slide_Kelompok6_A11.4502.pptx"
  node slides.js uas "$OUTDIR/UAS_Slide_Kelompok6_A11.4502.pptx"
fi
