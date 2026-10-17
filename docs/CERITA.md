# Cerita karhutla

Halaman `/cerita` memuat tiga jenis tulisan: **artikel ilmiah**, **cerita warga terdampak**, dan **opini publik**. Setiap tulisan adalah satu berkas Markdown di `src/content/cerita/<slug>.md`. Slug berkas menjadi alamat `/cerita/<slug>`.

## Format berkas

```markdown
---
judul: Judul tulisan
kategori: warga            # ilmiah | warga | opini
penulis: Nama penulis
tanggal: 2026-10-17        # YYYY-MM-DD, dipakai untuk mengurutkan
wilayah: Kabupaten atau provinsi (opsional)
ringkasan: Satu atau dua kalimat pembuka (opsional, tampil di daftar).
gambar: https://...        # gambar sampul (opsional)
sumber: https://...        # khusus ilmiah: tautan publikasi asli atau DOI
rujukan: Penulis. (Tahun). Judul. Jurnal.   # khusus ilmiah: rujukan lengkap
---

Isi tulisan dalam Markdown. Gunakan `##` untuk subjudul, daftar, dan kutipan.
```

Catatan:
- HTML mentah di dalam isi tidak dirender (ditampilkan sebagai teks); tautan dan gambar hanya `http(s)`.
- **Artikel ilmiah**: tulis ringkasan dan tautan ke publikasi asli. Jangan menyalin seluruh isi bila ada hak cipta penerbit.
- **Cerita warga**: pastikan penulis mengizinkan, dan jangan memuat data pribadi pihak lain.

## Alur kiriman

Pembaca mengirim tulisan lewat formulir isu **Kirim cerita karhutla** (`.github/ISSUE_TEMPLATE/cerita.yml`, label `cerita`) atau DM Threads. Pemelihara meninjau, lalu menambahkan berkas `.md` ke `src/content/cerita/` dan melakukan commit; deploy berjalan otomatis. (Penayangan otomatis dari isu, seperti galeri karya, belum tersedia.)
