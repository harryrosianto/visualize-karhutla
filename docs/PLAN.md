# Rencana: Visualize Karhutla (salinan rencana yang disetujui, termasuk inventaris gambar)

## Context
Web app mobile-first untuk kesadaran publik soal karhutla Kalimantan 2026: peta titik panas, "Karhutla Wrapped" per kabupaten yang mudah dibagikan, data bersumber. Brief terbaru meminta mode tanpa pengawasan: tidak bertanya, catat keputusan di `docs/`, commit per tahap. Direktori `D:\visualize-karhutla` kosong (bukan repo git; hanya `src/` berisi gambar dan `.claude/skills`). Hari ini 2026-10-12, jadi slider waktu Jan-Okt 2026.

**Design Read:** data-storytelling + peta interaktif untuk audiens mobile Indonesia dari Instagram/X/Threads, bahasa visual dark-ember (referensi footer Floria), tailwind v4 + komponen sendiri. Dial: VARIANCE 7, MOTION 6, DENSITY 4.

**Penyesuaian terhadap skill:** Instrument Serif dan Schibsted Grotesk dipakai karena brief menyebut eksplisit (itu pembenaran merek). Nol em-dash/en-dash di UI. Titik kecil pada label kolom footer dipakai karena diminta di referensi (satu-satunya dekorasi titik). Ikon: `@phosphor-icons/react`. Animasi: paket `motion` (`motion/react`, penerus Framer Motion). Eyebrow maks 1 per 3 seksi. Tidak ada marquee, tidak ada pill di atas gambar, tidak ada kartu fitur kembar 3.

## Inventaris gambar `src/` (akan ditulis ke `docs/PLAN.md`)
| File | Ukuran | Resolusi | Isi | Rencana |
|---|---|---|---|---|
| `floria.PNG` | 168 KB | 1326x419 | Referensi desain footer | Tidak dipakai di build |
| `images (1).jpeg` | 46 KB | 678x452 | Hutan terbakar malam, percikan bara, siluet pohon | **Tidak dipakai** (resolusi rendah, sumber/lisensi tidak diketahui). Dicatat di TODO |
| `matt-howard-eAKDzK4lo4o-unsplash.jpg` | 2,87 MB | 6000x3376 | Kebakaran hutan konifer malam, asap oranye | Hero (poster + fallback), slide 1 Wrapped |
| `pexels-needtofly-87266383-9645399.jpg` | 1,60 MB | 4000x6000 (portrait) | Close-up bara beterbangan, gelap | Slide 2 (titik panas), latar ajakan "Cek wilayahmu" |
| `pexels-vladyslav-dukhin-4070727.jpg` | 3,98 MB | 6720x4480 | Api rumput, pohon gundul, asap tebal pucat | Slide 3 (luas terbakar), slide 4 (bulan berasap), aksen landing; overlay gelap kuat karena terang |

Slide 5 dan 6: warna solid #0C0A09 + cahaya bara CSS (radial buram), bukan foto. Semua alt deskriptif generik (foto bukan lokasi Kalimantan, tidak diklaim sebagai Kalimantan; dijelaskan di `/tentang`).
`credits.json`: field `source`/`license` diisi hanya yang tertera pada nama file (Unsplash/Pexels + nama fotografer dari nama file, ditandai `verified:false`); `images (1).jpeg` dikosongkan. Semua dicatat di `docs/TODO.md`.
Pipeline: `scripts/optimize-images.ts` (sharp) memindah ke `src/assets/images/`, output AVIF+WebP lebar 480/960/1600(/2400 hero) untuk `srcset`. Hero eager + preload; sisanya `loading="lazy"`.

## Struktur folder
```
docs/{PLAN,DECISIONS,TODO,SUMMARY}.md
data/raw/            (CSV FIRMS, gitignored kecuali .gitkeep)
data/sipongi.json    (template kosong: source, period, retrievedAt, entries[])
data/boundaries/     (geoBoundaries IDN ADM1/ADM2, subset Kalimantan)
scripts/{fetch-boundaries,optimize-images,generate-sample,process-firms,build-og}.ts
public/data/         meta.json, kabupaten.json, boundaries-{prov}.json, daily-{prov}.json, hotspots-{prov}.json
public/media/        hero.mp4 (slot), hero-poster.jpg
src/{routes,components,lib,styles,assets/images}
```
Komponen utama: `SiteNav`, `Hero` (video+poster+ember canvas fallback), `KeyStats`, `MapTeaser`, `Footer` (wordmark raksasa samar, kolom berlabel titik), `DataBanner` ("DATA CONTOH"), `SourceNote`, `MapView` (MapLibre + deck.gl `MapboxOverlay`), `TimeSlider`, `ProvinceFilter`, `KabupatenSheet` (panel desktop / bottom sheet mobile, drag), `Sparkline` (visx), `StoryPlayer` + `slides/*`, `KabupatenPicker` (combobox autocomplete), `ShareCard` (1080x1920) + `ShareBar`, `AboutPage`.

## Skema data
- `meta.json`: `{ isSample, generatedAt, dataDate, year, sources:{hotspot, burnedArea, boundaries}, provinces[] }`
- `kabupaten.json`: `[{ slug, name, provinceId, provinceName, centroid, total2026, total2025, monthly[10], peakMonth, burnedHa|null, rankKalimantan }]`
- `daily-{prov}.json`: `{ days:["2026-01-01"...], kab:{slug:[counts per day]} }` (agregasi per kabupaten per hari)
- `hotspots-{prov}.json` (kolom, hemat ukuran): `{ lon:[], lat:[], day:[], frp:[] }`, dimuat bertahap per provinsi
- `sipongi.json`: `{ source, period, retrievedAt, entries:[{ kabupatenSlug, burnedHa }] }`. Kosong = luas terbakar tampil "belum tersedia" atau dari sampel dengan banner.
- Setiap angka di UI membawa `SourceNote` (sumber + tanggal data).

## Data & keputusan
- Sampel: generator deterministik (seed tetap) memakai batas kabupaten asli, musim kemarau Agu-Okt memuncak, label `isSample:true`; banner "DATA CONTOH" di semua halaman dan di kartu bagikan. `process-firms.ts` menimpa file yang sama dengan `isSample:false` (point-in-polygon via `@turf/boolean-point-in-polygon`, indeks bbox untuk kecepatan).
- Batas wilayah: `fetch-boundaries.ts` mengunduh geoBoundaries IDN ADM2 (simplified) dan menyaring 5 provinsi (56 kab/kota). Jika unduhan gagal: berhenti dengan pesan jelas, catat di TODO, tidak mengarang batas; peta tetap jalan dengan titik + centroid kabupaten dari daftar statis.
- Perbandingan 2025 pada data sampel juga sampel (diberi label).

## Urutan kerja (build harus lulus + git commit tiap tahap; `git init` di awal)
0. Scaffold Vite+React+TS, Tailwind v4, `motion`, react-router, maplibre-gl, deck.gl, visx, html-to-image, phosphor; font self-host (@fontsource); `docs/PLAN.md`; optimasi gambar.
1. (a) Skema + generator sampel + `process-firms.ts` + `sipongi.json` template.
2. (b) Landing: hero 2 baris maks, angka kunci, cuplikan peta (statis/ringan), ajakan "Cek wilayahmu" (satu intent CTA, satu label), footer gaya referensi.
3. (c) Peta: Scatterplot menyala (additive blend, merah hanya intensitas tertinggi) <-> HexagonLayer 3D, slider+play harian, filter provinsi, klik kabupaten, sheet detail, muat per provinsi lazy.
4. (d) Wrapped: 6 slide 9:16, progress, auto 5 dtk, tap/hold/swipe/panah, hitung naik angka, picker kabupaten, rute `/wrapped/:slug`.
5. (e) Bagikan: PNG 1080x1920 via html-to-image + `navigator.share({files})` / unduh; tombol X, Threads, salin link; `build-og.ts` (1200x630 per kabupaten, via satori+sharp atau canvas) + HTML statis per rute dengan `og:image`; post-build script.
6. (f) `/tentang`: metodologi, sumber, keterbatasan (VIIRS/MODIS = titik panas bukan luas api, awan, resolusi), kredit gambar dari `credits.json`, kredit data.
7. README + `docs/SUMMARY.md` + DECISIONS/TODO final.

## Kualitas
`prefers-reduced-motion`: ember canvas statis, auto-advance tetap tapi transisi instan, hitung naik langsung final, play peta tanpa animasi halus. Target sentuh >= 44px, fokus terlihat, kontras AA dengan overlay gelap, `min-h-[100dvh]`, pill/radius satu sistem (kontrol pill, panel 16px).

## Verifikasi
- `npm run build` hijau tiap tahap; `tsc --noEmit`.
- Jalankan dev server, cek di browser pane viewport mobile 375x812 dan desktop: landing, `/peta` (toggle, slider, klik kabupaten, bottom sheet), `/wrapped/:slug` (6 slide, tap/swipe/keyboard), `/tentang`.
- Uji share: PNG berukuran 1080x1920 berisi banner sampel, tanggal, sumber, URL.
- Cek OG: file HTML statis per slug memuat `og:image` yang ada.
- Lighthouse mobile (perf >= 85, a11y >= 95); jika tidak tercapai, catat di SUMMARY dengan angka nyata.
- Grep nol em/en-dash di string UI.
