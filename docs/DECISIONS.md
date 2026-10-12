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
10. **Slide 4 Wrapped (bulan berasap) memakai warna solid + cahaya bara, bukan foto.** Rencana awal memakai foto lahan; bar chart butuh kontras bersih, jadi foto hanya di slide 1, 2, 3. Slide 5 dan 6 juga solid.
11. **Banner DATA CONTOH berupa pita penuh, bukan pill di atas foto.** Skill melarang pill di atas gambar; pita solid tetap memenuhi syarat banner di seluruh UI dan kartu bagikan.
12. **Garis batas kabupaten di peta memakai layer garis MapLibre (worker), bukan GeoJsonLayer deck.gl; klik dideteksi dengan point-in-polygon (`src/lib/geo.ts`).** GeoJsonLayer menahan main thread sekitar 5 detik pada Lighthouse mobile (TBT 10,8 dtk turun ke sekitar 1,3 dtk setelah diganti).
13. **Modul peta (MapLibre + deck.gl, 473 KB gzip) dimuat terpisah dan ditunda sampai kontrol halaman tampil.** Agar teks halaman dan kontrol muncul lebih dulu. Peta tetap berat; lihat SUMMARY untuk angka Lighthouse jujur.
14. **Data peta dimuat dua tahap** (Kalimantan Tengah dulu, empat provinsi lain sekaligus) agar layer tidak dibangun ulang lima kali.
15. **Gambar OG berformat JPEG (1200x630, sekitar 65 KB)**, bukan PNG (sekitar 480 KB). Cukup untuk X dan Threads, dan folder `dist/og` hanya 3,7 MB untuk 57 gambar.
16. **Pembanding 2025 memakai periode yang sama (1 Januari sampai tanggal data), bukan total setahun 2025.** Perbandingan setahun penuh dengan tahun berjalan menyesatkan.
17. **Ikon memakai `@phosphor-icons/react`** (sesuai skill). Tanda titik kecil pada label kolom footer dipertahankan karena diminta eksplisit pada referensi.
18. **`.btn` didefinisikan di `@layer components`** agar utilitas Tailwind (padding, lebar) bisa menimpanya; versi tanpa layer membuat tombol bagikan meluber.
19. **Angka memakai `lining-nums proportional-nums`**, bukan tabular, karena tabular membuat titik pemisah ribuan melebar ("1 . 777").
20. **Hero memakai adegan parallax orisinal** (`ParallaxScene`, siluet bukit dan pinus dibangkitkan kode di `src/lib/landscape.ts`) terinspirasi gaya lanskap berlapis ala Firewatch. Tidak ada aset atau kode situs lain yang disalin. Parallax scroll dan pointer memakai `useScroll`, `useSpring`, `useTransform`; statis saat reduced motion. Video `hero.mp4`, bila ada, menggantikan adegan.
21. **Performa adegan parallax:** `will-change` pada lima lapisan besar menurunkan performa landing dari 92 ke 59 (TBT 2 dtk); dibuang bersama `mix-blend` dan `shadowBlur` kanvas, skor kembali 89.
22. **Filter kepercayaan FIRMS** juga menolak "low" (format CSV asli memakai kata nominal/low/high, bukan huruf tunggal).
23. **Adegan hero memakai delapan jenis pohon** (pinus, cemara ramping, berdaun lebar, mati, tunggul patah, tumbang, condong, terbakar) plus tiang listrik berkabel dan menara pengawas, dibangkitkan kode (`landscape.ts`). Api pohon terbakar berupa tiga lidah berkedip di SVG terpisah supaya animasi tidak menggambar ulang lapisan besar.
24. **Ikon api di peta adalah WebP animasi 192px (turunan `fire-fire.gif`, 98 KB)**, bukan GIF 480px, karena puluhan ikon animasi sekaligus. Ukuran ikon mengikuti titik panas 7 hari terakhir per kabupaten dan level zoom; titik individual tinggal jejak tipis. Di mode 3D ikon disembunyikan.
25. **Font Burned dipakai hanya untuk wordmark** (hero, nav, footer, bukan teks isi), disubset ke Latin dasar (70 KB woff2 dari 1,1 MB OTF).
26. **Hero memakai lapisan lanskap dan siluet buatan pemilik proyek, bukan SVG buatan saya** (menggantikan keputusan 20 dan 23). `scripts/build-scene.ts` (`npm run scene`) menanam siluet pinus dan pohon mati di punggung bukit tiap lapisan (tinggi tanah dibaca dari kanal alfa), mewarnai siluet sesuai warna lapisan, menempatkan tunggul hangus beserta orangutan di lapisan depan, dan menyimpan WebP 1500/3000 px. Tepi kiri lurus pada `parallax6.png` dipudarkan lewat alfa.
27. **Api pada pohon dihapus; tiang listrik dan matahari buatan saya diganti yang ada di aset.** Aset lapisan sudah memuat tiang listrik berkabel dan piringan matahari, jadi versi SVG saya dibuang agar tidak dobel.
28. **"Pohon yang terbakar" ditafsirkan sebagai tunggul hangus** (`dead-tree-silhouette-6`), tempat orangutan bertengger.
29. **Foto baru:** pemadam (`a844df00...`) di slide luas terbakar, siluet pemadam di slide peringkat dan ajakan "Cek wilayahmu", ilustrasi hutan hangus diubah jadi siluet alfa untuk slide bulan berasap dan tepi bawah ajakan. Foto pemadam beresolusi 1024x576 sehingga sedikit lembut pada layar besar.
