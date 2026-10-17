# Cerita karhutla

Halaman `/cerita` memuat tulisan warga, peneliti, dan masyarakat tentang karhutla: artikel ilmiah, cerita warga terdampak, opini, dan lainnya. Tulisan dikelompokkan dengan **topik**: penulis memilih dari topik bawaan (`src/content/topik.ts`, misalnya Kesehatan dan asap, Lahan gambut, Satwa liar, Kebijakan dan hukum) atau membuat topik sendiri, hingga 5 topik per tulisan.

Setiap tulisan adalah satu berkas Markdown di `src/content/cerita/<slug>.md`. Slug berkas menjadi alamat `/cerita/<slug>`.

## Format berkas

```markdown
---
judul: Judul tulisan
topik: Lahan gambut, Cerita warga     # dipisah koma, maksimal 5
penulis: Nama penulis
tautan: https://...        # portofolio atau media sosial penulis (opsional)
foto: 3                    # nomor avatar bawaan (1-9) atau cerita/<slug>/penulis.webp
tanggal: 2026-10-17        # YYYY-MM-DD, dipakai untuk mengurutkan
wilayah: Kabupaten atau provinsi (opsional)
ringkasan: Satu atau dua kalimat pembuka (opsional, tampil di daftar).
gambar: cerita/<slug>/1.webp   # gambar sampul (opsional)
sumber: https://...        # tautan sumber atau rujukan (opsional)
rujukan: Penulis. (Tahun). Judul. Jurnal.   # rujukan lengkap (opsional)
---

Isi tulisan dalam Markdown. Gunakan `##` untuk subjudul, daftar, dan kutipan.
```

Catatan:
- `ringkasan` dan `gambar` (sampul) hanya tampil di daftar cerita; halaman baca memuat judul, penulis, isi, dan topik. Gambar yang ingin tampil di halaman baca harus ada di dalam isi Markdown.
- HTML mentah di dalam isi tidak dirender (ditampilkan sebagai teks); tautan hanya `http(s)` atau `mailto`, dan gambar hanya milik situs di bawah `cerita/`.
- Tulisan berbasis publikasi: tulis ringkasan dengan kata-kata sendiri dan sertakan tautan; jangan menyalin seluruh isi yang berhak cipta.
- Cerita warga: pastikan penulis mengizinkan, dan jangan memuat data pribadi pihak lain.
- Foto profil: bila penulis tidak mengunggah, dipakai salah satu dari sembilan avatar hewan bawaan (`src/assets/avatars/`, desain Freepik; dibuat ulang dengan `npx tsx scripts/build-avatars.ts`).

## Alur kiriman

Penulis menulis langsung di situs: `/cerita/tulis` (tanpa akun). Penyunting tulisan: judul, blok teks, tombol + untuk gambar, judul bagian, kutipan, daftar, pemisah; menu format saat teks diblok; draf tersimpan otomatis. Di bagian "Sebelum terbit" penulis memilih topik, mengisi nama, tautan portofolio atau media sosial (opsional), dan memilih avatar atau mengunggah foto profil (opsional). Saat dikirim, Worker (`POST /api/cerita`) menyimpan gambar ke repositori unggahan dan membuat isu `[Cerita] ...` berlabel `cerita` di repositori utama.

### Menyetujui

Persiapan sekali: buat label `cerita` dan `setujui-cerita` pada repositori. Setelah meninjau isu, pasang label `setujui-cerita`. Alur `.github/workflows/approve-cerita.yml` lalu menjalankan `scripts/approve-cerita.ts`: mengubah isu menjadi `src/content/cerita/<slug>.md`, mengunduh dan mengoptimalkan gambar serta foto profil ke `public/cerita/<slug>/`, melakukan commit, memicu deploy, dan menutup isu. Gambar dari host selain GitHub dibuang, dan HTML mentah tidak pernah dirender. Bila foto dan avatar tidak ada, dipilih avatar bawaan secara acak.
