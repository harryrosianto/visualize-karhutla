# Visualize Karhutla

Web app mobile-first untuk kesadaran publik tentang kebakaran hutan dan lahan (karhutla) di seluruh Indonesia 2026: peta titik panas interaktif dan "Karhutla Wrapped" per kabupaten yang mudah dibagikan. Tanpa fitur AI/LLM.

Stack: Vite, React, TypeScript, Tailwind v4, MapLibre GL JS + deck.gl, `motion`, visx, `html-to-image`, React Router.

> **Status data:** selama `public/data/meta.json` berisi `"isSample": true`, seluruh UI menampilkan banner **DATA CONTOH** dan semua angka titik panas, luas terbakar, dan pembanding 2025 adalah fiktif. Hanya batas wilayah yang asli.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
```

Build produksi (juga membuat gambar OG dan HTML statis per rute):

```bash
npm run build
npm run preview    # http://localhost:4173
```

Salin `.env.example` menjadi `.env` dan isi `VITE_SITE_URL` dengan alamat publik (tanpa garis miring akhir). Nilai ini dipakai tautan bagikan, kartu bagikan, dan `og:image`. Tanpa itu, `og:image` menunjuk `http://localhost:4173`.

Skrip lain:

| Perintah | Fungsi |
|---|---|
| `npm run boundaries` | Unduh batas geoBoundaries IDN ADM1/ADM2, saring 514 kabupaten/kota (38 provinsi di tujuh wilayah) ke `public/data/boundaries-*.json` |
| `npm run sample` | Bangkitkan DATA CONTOH deterministik (seed tetap) |
| `npm run firms` | Proses CSV NASA FIRMS di `data/raw/` menjadi data asli |
| `npm run downloads` | Buat CSV dan metadata unduhan di `public/unduh/` (otomatis saat `npm run build`) |
| `npm run scene` | Susun lapisan parallax hero dari `assets-src/scene/` ke `src/assets/scene/` |
| `npm run images` | Optimalkan gambar dari `assets-src/` ke `src/assets/images/` |
| `node scripts/lh-report.mjs <laporan.json>` | Ringkas laporan Lighthouse JSON |

## Mengganti data contoh dengan data asli

1. **Titik panas (NASA FIRMS).** Unduh CSV VIIRS dan/atau MODIS untuk seluruh Indonesia (pilihan area di `scripts/fetch-firms.ts`), 1 Januari 2025 sampai hari ini, dari <https://firms.modaps.eosdis.nasa.gov/download/>. Taruh semua `.csv` di `data/raw/`. Kolom wajib: `latitude`, `longitude`, `acq_date`. Kolom `frp` dan `confidence` dipakai bila ada.
2. **Luas terbakar (SiPongi).** Isi `data/sipongi.json`: `source`, `period`, `retrievedAt`, dan `entries` berupa `{ "kabupatenSlug": "...", "burnedHa": 0 }`. Slug ada di `public/data/kabupaten.json`. Kabupaten tanpa entri tampil "Belum ada data" (bukan angka karangan).
3. Jalankan `npm run firms`. Skrip ini:
   - menyaring titik ke lima provinsi dengan point-in-polygon terhadap batas ADM2,
   - membuang titik berkepercayaan rendah (MODIS < 30, VIIRS `l`),
   - mengagregasi per kabupaten per hari,
   - menghitung pembanding 2025 untuk periode yang sama (1 Januari sampai tanggal data terakhir),
   - menulis ulang `public/data/*` dengan `isSample: false`, sehingga banner DATA CONTOH hilang dengan sendirinya.
4. Jalankan `npm run build`. Tanggal data di seluruh UI mengikuti tanggal akuisisi terbaru di CSV.

Catatan: antarmuka mencakup Januari sampai Oktober; titik panas setelah Oktober tidak dihitung ke grafik bulanan.

## Menambah gambar baru beserta kreditnya

1. Taruh berkas asli (JPG) di `assets-src/` dengan nama kebab-case, mis. `lahan-gambut.jpg`.
2. Tambahkan entri di `scripts/optimize-images.ts` (`IMAGES`) dan nama pada tipe `ImageName` serta objek `ALT` di `src/lib/images.ts` (alt deskriptif dalam Bahasa Indonesia).
3. Jalankan `npm run images`. Hasil AVIF/WebP berbagai lebar muncul di `src/assets/images/`.
4. Pakai komponen `<Picture name="lahan-gambut" />` (lazy secara default, `eager` untuk hero; `decorative` memberi `alt=""`). Selalu beri overlay gelap agar teks lolos kontras WCAG AA.
5. Tambahkan entri di `src/assets/images/credits.json` (`creator`, `source`, `sourceUrl`, `license`, `usedIn`). Isi hanya yang diketahui, kosongkan sisanya dan catat di `docs/TODO.md`. Halaman `/tentang` menampilkan kredit ini otomatis; lisensi kosong tampil "belum diverifikasi".

## Memasang video hero

Taruh `public/media/hero.mp4` (H.264, tanpa suara, disarankan 8 detik loop, lebar 1280 atau 1920, di bawah 4 MB) dan opsional timpa `public/media/hero-poster.jpg`. Hero otomatis memakai video (`autoplay muted loop playsinline`) di atas gambar dengan overlay gelap. Video tidak dipakai bila pengguna memilih `prefers-reduced-motion` atau mode hemat data; gambar tetap tampil sebagai cadangan.

## Struktur

```
data/               sipongi.json, raw/ (CSV FIRMS), boundaries/src (cache unduhan)
docs/               DECISIONS, DEPLOY
scripts/            pipeline data, optimasi gambar, build-og
public/data/        meta, kabupaten, daily-*, hotspots-*, boundaries-* (dimuat per provinsi)
src/components/     Hero, KeyStats, MapTeaser, Footer, map/*, wrapped/*
src/routes/         Landing, MapPage, WrappedPicker, WrappedPage, About
```

## Kualitas

Semua animasi menghormati `prefers-reduced-motion`; semua kontrol bisa dipakai dengan keyboard (peta lewat kotak cari kabupaten, story lewat tombol panah dan spasi).

## Kredit

Data: NASA FIRMS, SiPongi Kemenhut. Batas wilayah: geoBoundaries. Peta dasar: CARTO Dark Matter, data OpenStreetMap contributors. Rincian di `/tentang`.
