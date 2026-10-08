# pages.py <pdf> <headings.json> <out.json>
# Mencari halaman setiap judul bab/subbab dan setiap keterangan tabel/gambar di PDF hasil render,
# lalu menulis nomor halaman yang TERCETAK: romawi untuk halaman depan, angka mulai BAB I.
import json, subprocess, sys, re

pdf, headings_file, out = sys.argv[1:4]
data = json.load(open(headings_file))
H, CAP = data["headings"], data["captions"]
n = int(re.search(r"Pages:\s+(\d+)", subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout).group(1))
norm = lambda s: re.sub(r"\s+", "", s).lower()
pages = [norm(subprocess.run(["pdftotext", "-f", str(i), "-l", str(i), pdf, "-"], capture_output=True, text=True).stdout) for i in range(1, n + 1)]


def roman(k):
    out = ""
    for v, s in [(10, "x"), (9, "ix"), (5, "v"), (4, "iv"), (1, "i")]:
        while k >= v:
            out += s
            k -= v
    return out


# 1) judul (urut), indeks halaman PDF 0-based
found, cur, missing = [], 0, 0
for h in H:
    key = norm(h["find"])
    for i in range(cur, n):
        if "daftarisi" in pages[i] and "...." in pages[i]:
            continue  # halaman daftar isi itu sendiri
        if key in pages[i] and (h["level"] != 1 or not h["text"].startswith("BAB") or norm(h["text"].split(" ")[0] + h["text"].split(" ")[1]) in pages[i]):
            found.append((h, i)); cur = i; break
    else:
        print("NOT FOUND:", h["text"], file=sys.stderr); found.append((h, None)); missing += 1

bab1 = next(i for h, i in found if h["text"].startswith("BAB I ") and i is not None)
label = lambda i: "?" if i is None else (roman(i + 1) if i < bab1 else i - bab1 + 1)
res = {"toc": [{"level": h["level"], "text": h["text"], "page": label(i)} for h, i in found]}

# 2) keterangan tabel/gambar, dicari mulai BAB I (halaman depan berisi daftar yang sama)
for kind in ("tab", "fig"):
    items, cur = [], bab1
    for c in (c for c in CAP if c["kind"] == kind):
        key = norm(c["label"]) + norm(c["text"])[:25]
        for i in range(cur, n):
            if key in pages[i]:
                items.append({"label": c["label"], "page": label(i)}); cur = i; break
        else:
            print("NOT FOUND:", c["label"], c["text"], file=sys.stderr); items.append({"label": c["label"], "page": "?"}); missing += 1
    res[kind] = items

json.dump(res, open(out, "w"), ensure_ascii=False)
print(json.dumps([(e["text"][:30], e["page"]) for e in res["toc"] if e["level"] == 1]),
      f"| {len(res['tab'])} tabel, {len(res['fig'])} gambar | belum ketemu: {missing}")
