# TODO (butuh input pemilik proyek)

## Data asli
- [ ] Unduh CSV NASA FIRMS (VIIRS SNPP/NOAA-20 dan/atau MODIS) untuk Kalimantan, 2025-01-01 sampai hari ini, taruh di `data/raw/`, lalu `npm run firms`.
- [ ] Isi `data/sipongi.json` (luas terbakar per kabupaten) dari SiPongi Kemenhut: `source`, `period`, `retrievedAt`, `entries`. Lalu jalankan `npm run firms` (atau `npm run sample` jika masih memakai data contoh) agar angka luas terbakar masuk ke `kabupaten.json`.
- [ ] Selama dua langkah di atas belum dilakukan, seluruh UI menampilkan banner "DATA CONTOH".

## Gambar dan lisensi
- [ ] `images (1).jpeg` (asal: `src/`, 678x452): sumber dan lisensi tidak diketahui; tidak dipakai di app. Jika ingin dipakai, isi `credits.json` dan taruh resolusi lebih tinggi.
- [ ] `hero-forest-night.jpg` (nama asli: `matt-howard-eAKDzK4lo4o-unsplash.jpg`): nama berkas menunjukkan Unsplash oleh Matt Howard. Lisensi Unsplash belum diverifikasi; `credits.json` menandainya `verified:false`. Cek halaman fotonya.
- [ ] `embers-closeup.jpg` (nama asli: `pexels-needtofly-87266383-9645399.jpg`): nama berkas menunjukkan Pexels oleh needtofly. Belum diverifikasi.
- [ ] `grass-fire-smoke.jpg` (nama asli: `pexels-vladyslav-dukhin-4070727.jpg`): nama berkas menunjukkan Pexels oleh Vladyslav Dukhin. Belum diverifikasi.
- [ ] Ketiga foto bukan lokasi Kalimantan (belum ada keterangan lokasi). Halaman Tentang menyebutnya sebagai ilustrasi.

## Media
- [ ] Video hero: taruh `public/media/hero.mp4` (lihat README). Saat ini hero memakai poster gambar.

## Verifikasi tambahan
- [ ] Tautan SiPongi (`https://sipongi.menlhk.go.id/`) di footer dan `/tentang` belum dicek ulang setelah perubahan nama kementerian. Pastikan alamat terbaru.
- [ ] Kutipan geoBoundaries (Runfola dkk. 2020) dan kalimat pengakuan NASA FIRMS di `/tentang` ditulis dari ingatan dan pedoman umum; cocokkan dengan format kutipan resmi masing-masing.
- [ ] Kinerja halaman `/peta` di perangkat nyata belum diuji. Di Lighthouse mobile (CPU 4x lebih lambat, WebGL perangkat lunak) skornya jauh di bawah target; lihat `docs/SUMMARY.md`.
- [ ] Pembaruan titik panas: untuk data asli, pertimbangkan memangkas `hotspots-*.json` (kini kolom lon/lat/hari/FRP) bila berkas melewati sekitar 1 MB per provinsi.

## Data asli (cara tercepat)
1. Daftar kunci gratis: https://firms.modaps.eosdis.nasa.gov/api/map_key/ lalu isi `FIRMS_MAP_KEY` di `.env`.
2. `npm run fetch-firms` (unduh 2025-01-01 sampai hari ini, VIIRS SNPP), lalu `npm run firms`.
3. Isi `data/sipongi.json` secara manual, lalu `npm run firms` lagi.
Catatan: data asli jauh lebih besar dari contoh (7 hari terakhir saja sudah sekitar 29 ribu titik di Kalimantan), jadi `hotspots-*.json` bisa beberapa MB; lihat butir pemangkasan di atas.

## Aset yang diberikan pemilik proyek (lisensi belum diketahui)
- [ ] Font `Burned.otf` (wordmark): pencipta dan lisensi web-embedding belum diverifikasi. Subset woff2 (`src/assets/fonts/burned-latin.woff2`) ikut ter-commit; berkas OTF asli tidak (di-gitignore, salinan di `assets-src/`). Pastikan lisensinya mengizinkan penyematan di web.
- [ ] Animasi api `fire-fire.gif` (ikon peta): sumber dan lisensi belum diketahui. Dipakai sebagai `src/assets/media/fire.webp`.
- [ ] `src/Downloads/` berisi seluruh folder Downloads pribadi. Sudah di-gitignore dan tidak pernah di-commit, tapi sebaiknya dipindahkan keluar dari proyek.
- [ ] Aset yang ditambahkan pemilik proyek pada 12 Okt 2026 (`parallax*.png`, siluet pohon, `orangutan.webp`, `fly bird.png`, foto pemadam `a844df00...`, `forest-fire-3694495...`, ilustrasi hutan hangus): pencipta, sumber, dan lisensi belum diketahui. Semua tercatat di `credits.json` dan halaman Tentang sebagai belum diverifikasi. Berkas mentah dipindah ke `assets-src/` (di-gitignore).
