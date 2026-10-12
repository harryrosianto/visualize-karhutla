# Keputusan

Dicatat saat mengerjakan tanpa pengawasan. Format: keputusan, lalu alasan.

1. **`images (1).jpeg` tidak dipakai.** Resolusi 678x452 terlalu rendah untuk hero/slide 9:16 dan sumber/lisensinya tidak diketahui. Dicatat di `docs/TODO.md`.
2. **Gambar sumber dipindah ke `assets-src/` (di luar `src/`, di-gitignore), bukan `src/assets/images/`.** Brief meminta memindah ke `src/assets/images/` lalu mengoptimalkan; hanya hasil optimasi (AVIF/WebP berbagai lebar, total ~1,2 MB) yang tinggal di `src/assets/images/`. Original 2,9-4 MB tidak ikut build maupun repo.
3. **`floria.PNG` dibiarkan di `src/` tanpa di-import.** Hanya referensi desain, tidak masuk bundle (Vite hanya membundel yang di-import).
4. **Paket `motion` (`motion/react`), bukan `framer-motion`.** Penerus resmi dengan API sama; skill desain juga menyarankannya.
5. **Instrument Serif + Schibsted Grotesk dipakai** karena disebut eksplisit di brief (skill melarang sebagai default, tapi pengecualian merek berlaku).
6. **Provinsi tiap kabupaten ditentukan dari ADM1 + override nama.** geoBoundaries ADM2 tidak punya atribut provinsi dan ADM1 (OSM 2017) belum memuat perubahan batas; Seruyan, Kutai Barat, Mahakam Hulu, Malinau dikoreksi berdasarkan pembagian administratif resmi. Hasil: 14/14/13/10/5 = 56 kabupaten/kota, cocok dengan jumlah resmi.
7. **Data contoh dibuat deterministik (seed tetap)** agar hasil build dan tautan bagikan stabil antar run. Seluruh angka fiktif dan berlabel "DATA CONTOH".
8. **Perbandingan 2025 pada data asli** dihitung dari CSV FIRMS tahun 2025 jika ada di `data/raw/`; jika tidak ada, `total2025 = null` dan UI menulis "pembanding 2025 belum tersedia", bukan angka karangan.
9. **Poin FIRMS berkepercayaan rendah dibuang** (MODIS < 30, VIIRS "l") di `process-firms.ts`; dicatat di halaman Tentang.
