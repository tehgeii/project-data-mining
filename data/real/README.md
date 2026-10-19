# Data asli (anonim)

Taruh file **dataset anonim (.csv)** hasil tombol *Dataset anonim* di halaman
Import Data ke folder ini, satu file per akun, misalnya `akun01.csv`.

- File `.csv` aman di-commit (tanpa UID, nama item, dan waktu; ID akun berupa kode acak
  seperti `akun01`, bukan turunan UID).
- File `.json` (UIGF) juga bisa dibaca skrip pelatihan, tetapi **tidak ikut
  di-commit** (lihat `.gitignore`) karena berisi UID pemain.
- Jangan simpan akun yang sama dua kali (misalnya .json dan .csv sekaligus).
- Kalau akun yang sama diekspor ulang (riwayatnya bertambah), **ganti** file lamanya,
  jangan ditambah sebagai file baru. Kode ID di setiap ekspor selalu acak, jadi cocokkan
  dari urutan S-Rank (pity saat dapat S) setelah S pertama.

Setelah menambah data: `python scripts/train_models.py`, lalu commit
`data/real/*.csv` dan folder `models/`.
