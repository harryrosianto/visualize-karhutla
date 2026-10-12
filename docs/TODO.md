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
