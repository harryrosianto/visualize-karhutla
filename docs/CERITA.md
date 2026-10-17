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

Ada tiga jalur, semuanya berujung pada isu GitHub berlabel `cerita` yang ditinjau pemelihara:

1. **Menulis langsung di situs** (`/cerita/tulis`, tanpa akun): penyunting bergaya Medium (judul, blok teks, tombol + untuk gambar, judul bagian, kutipan, daftar, pemisah; menu format saat teks diblok; draf tersimpan otomatis). Saat dikirim, Worker (`POST /api/cerita`) menyimpan gambar ke repositori unggahan dan membuat isu `[Cerita] ...` dengan isi Markdown.
2. **Formulir isu GitHub** "Kirim cerita karhutla" (`.github/ISSUE_TEMPLATE/cerita.yml`).
3. **DM Threads**: ditambahkan manual oleh pemelihara.

### Menyetujui

Persiapan sekali: buat label `cerita` dan `setujui-cerita` pada repositori. Setelah meninjau isu, pasang label `setujui-cerita`. Alur `.github/workflows/approve-cerita.yml` lalu menjalankan `scripts/approve-cerita.ts`: mengubah isu menjadi `src/content/cerita/<slug>.md`, mengunduh dan mengoptimalkan gambar ke `public/cerita/<slug>/`, melakukan commit, memicu deploy, dan menutup isu. Gambar dari host selain GitHub dibuang, dan HTML mentah tidak pernah dirender.

Jalur DM tidak otomatis: tambahkan berkas `.md` sesuai format di atas lalu commit.
