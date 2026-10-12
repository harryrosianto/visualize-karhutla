# Ringkasan hasil kerja

Dikerjakan tanpa pengawasan sesuai rencana di `docs/PLAN.md`. Enam tahap, masing-masing satu commit git (`git log --oneline`), `npm run build` hijau di setiap tahap.

## Yang sudah jadi

- **Data (tahap a).** Batas 56 kabupaten/kota di lima provinsi (14/14/13/10/5) diunduh dari geoBoundaries lewat `npm run boundaries`. Generator DATA CONTOH deterministik (`npm run sample`) menghasilkan 37.745 titik fiktif. `scripts/process-firms.ts` siap untuk CSV FIRMS asli. `data/sipongi.json` berupa templat kosong.
- **Landing `/` (b).** Hero bergaya referensi (wordmark tebal dengan titik oranye, tagline serif miring, percikan bara kanvas, slot video `public/media/hero.mp4`), angka kunci, cuplikan peta ringan (kanvas 2D), ajakan "Cek wilayahmu" dengan pencarian autocomplete, footer ala referensi.
- **Peta `/peta` (c).** Titik panas menyala (ScatterplotLayer, titik lama memudar 21 hari, merah hanya untuk persentil 95 FRP), mode Kepadatan 3D (HexagonLayer), slider Jan-Okt dengan tombol putar harian, filter lima provinsi, klik kabupaten membuka panel detail (total, sparkline bulanan, bulan puncak, peringkat, tombol "Lihat Wrapped"), bottom sheet yang bisa digeser di mobile, kotak cari kabupaten sebagai jalur keyboard.
- **Wrapped `/wrapped/:slug` (d).** Story 9:16 enam slide: progress, auto-advance 5 detik, ketuk kiri/kanan, tahan untuk jeda, geser, tombol panah dan spasi, tombol jeda dan tutup, angka naik, transisi halus. Pemilih kabupaten di `/wrapped` dan di landing.
- **Berbagi (e).** Kartu 1080x1920 dirender di luar layar begitu slide rangkuman tampil (terverifikasi: PNG 1080x1920, memuat tanggal data, sumber, URL, dan DATA CONTOH). Tombol "Bagikan ke Story" (`navigator.share({files})`, unduh jika tidak didukung), X, Threads, salin link. Skrip `build-og.ts` menghasilkan 57 gambar OG 1200x630 dan HTML statis per rute (`dist/wrapped/<slug>/index.html`) dengan `og:image` dan `twitter:card`.
- **Tentang `/tentang` (f).** Metodologi, sumber, keterbatasan, kredit gambar dari `credits.json`, kredit data.
- README (menjalankan, mengganti data, menambah gambar, memasang video) serta `docs/DECISIONS.md` (19 keputusan) dan `docs/TODO.md`.

## Lighthouse mobile (build produksi, `vite preview`, Lighthouse 12, simulasi 4G lambat)

| Halaman | Performa | Aksesibilitas | Best practices | LCP | TBT |
|---|---|---|---|---|---|
| `/` | 92 | 100 | 100 | 2,8 dtk | 100 ms |
| `/peta` | **63** | 100 | 100 | 3,1 dtk | 1.300 ms |
| `/wrapped/barito-utara` | 94 | 100 | 100 | 2,7 dtk | 80 ms |
| `/wrapped` | 92 | 100 | 100 | 2,6 dtk | 180 ms |
| `/tentang` | 95 | 100 | 100 | 2,5 dtk | 50 ms |

**Target performa 85 tidak tercapai di `/peta` (63).** Sebelum perbaikan skornya 34 (TBT 10,8 dtk). Perbaikan: garis batas pindah dari deck.gl ke layer garis MapLibre, klik via point-in-polygon, modul peta dipecah dan ditunda, muat data dua tahap. Sisa TBT berasal dari inisialisasi deck.gl dan shader pada WebGL perangkat lunak di headless Chrome; di GPU nyata kemungkinan lebih baik tetapi belum diuji. Target aksesibilitas 95 tercapai di semua halaman.

## Belum diuji atau belum bisa dipastikan

- Berbagi di perangkat nyata: `navigator.share({files})` tidak bisa dipicu di lingkungan ini; yang terverifikasi hanya pembuatan PNG. Tombol X dan Threads belum dibuka (hanya URL intent yang disusun).
- Video hero belum diuji dengan berkas `.mp4` sungguhan (hanya jalur fallback gambar).
- `process-firms.ts` hanya diuji dengan CSV sintetis 7 baris (filter provinsi, pembuangan kepercayaan rendah, pembanding periode sama). Belum dengan CSV FIRMS besar; waktu proses pada jutaan baris belum diukur.
- Swipe sentuh asli dan tekan-tahan belum diuji di layar sentuh (ketuk kiri/kanan dan panah sudah).
- Mode `prefers-reduced-motion` diimplementasikan tetapi belum dicek manual di browser.
- Lisensi tiga foto belum diverifikasi (nama pencipta dan platform hanya dari nama berkas); `images (1).jpeg` tidak dipakai. Rincian di `docs/TODO.md`.

## Perlu tindakan Anda

Lihat `docs/TODO.md`: unduh CSV FIRMS ke `data/raw/` lalu `npm run firms`; isi `data/sipongi.json`; verifikasi lisensi foto dan tautan SiPongi; set `VITE_SITE_URL` di `.env` sebelum deploy; (opsional) taruh `hero.mp4`.
