# Panduan deploy

Situs ini berupa berkas statis (hasil `npm run build` di folder `dist/`), sehingga dapat dihosting di layanan statis mana pun.

## Rekomendasi: Cloudflare Pages (paket gratis)

Menurut pengetahuan penulis, paket gratis Cloudflare Pages mencakup: lalu lintas dan bandwidth berkas statis tanpa batas, domain khusus dengan HTTPS, kompresi Brotli otomatis, dan integrasi Git. Batas yang relevan: 500 build per bulan, 20.000 berkas per situs, dan 25 MiB per berkas. Situs ini berisi sekitar 300 berkas dan berkas terbesarnya (data titik panas) di bawah 5 MiB, sehingga masih jauh dari batas. Batas dapat berubah; periksa dokumentasi Cloudflare sebelum deploy.

### Opsi A: dari repositori Git (Workers Builds, disarankan)

Repositori: https://github.com/harryrosianto/visualize-karhutla (cabang `main`). Dasbor Cloudflare terbaru menerbitkan situs statis sebagai Worker dengan aset statis, dikonfigurasi lewat `wrangler.jsonc` di akar repositori (sudah disediakan).

1. Dasbor Cloudflare, **Workers & Pages**, **Create application**, **Import a repository**. Pilih repositori `visualize-karhutla`.
2. Nama proyek harus **sama** dengan `name` pada `wrangler.jsonc`, yaitu `visualize-karhutla`. Jika memakai nama lain, ubah `name` di berkas itu.
3. Pengaturan build:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy` (bawaan)
   - Root directory: kosong
4. Tambahkan **Build variables**: `VITE_SITE_URL` = alamat publik tanpa garis miring akhir, yaitu `https://visualize-karhutla.<subdomain-akun>.workers.dev` (subdomain akun terlihat pada tab Settings proyek, bagian Domains & Routes, setelah deploy pertama). `NODE_VERSION` tidak perlu diisi karena `.nvmrc` menetapkan 22.
5. Simpan dan deploy. Build pertama berjalan sekitar 1 sampai 3 menit. Jika `VITE_SITE_URL` belum benar, perbaiki variabelnya lalu jalankan ulang build (variabel ini ditanam saat build).
6. Domain sendiri (opsional): Settings, Domains & Routes, Add, Custom domain. Ubah `VITE_SITE_URL` menjadi domain tersebut dan bangun ulang.

Setiap push ke `main` otomatis membangun dan menerbitkan ulang situs. `VITE_SITE_URL` wajib benar karena dipakai untuk tautan bagikan, kartu bagikan, `og:image`, dan tag kanonis.

### Opsi B: unggah langsung tanpa Git

```bash
# isi VITE_SITE_URL di .env lebih dulu, lalu:
npm run deploy:cloudflare
```

Perintah ini membangun situs dan menjalankan `wrangler deploy`. Login Cloudflare diminta satu kali.

### Hasil uji lokal

Konfigurasi diuji dengan `wrangler deploy --dry-run` dan `wrangler dev`: 284 berkas aset terbaca; halaman statis per rute (`/peta/`, `/wrapped/<slug>/`) dilayani dengan meta `og:*` yang benar; alamat yang tidak dikenal jatuh ke aplikasi (HTTP 200, `not_found_handling: single-page-application`); serta aturan header cache dan keamanan terbaca. Berkas terbesar sekitar 3 MB, jauh di bawah batas 25 MiB per aset.

### Jika memakai Cloudflare Pages klasik

Pages klasik tidak memakai `wrangler.jsonc` ini. Gunakan build command `npm run build`, output `dist`, dan tambahkan berkas `public/_redirects` berisi `/*    /index.html   200` untuk routing sisi klien.

## Berkas konfigurasi yang sudah disediakan

- `wrangler.jsonc`: mengarahkan Cloudflare ke folder `dist` dan mengatur routing sisi klien. Halaman statis per rute (`/wrapped/<slug>/`) tetap dilayani langsung, sehingga pratinjau media sosial memuat `og:image` yang benar.
- `public/_headers`: cache panjang untuk `/assets/*` (nama berkas berhash), satu jam untuk `/data/*` dan `/unduh/*`, satu hari untuk `/og/*`; serta header keamanan dasar (`nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- `.nvmrc`: versi Node untuk build.

## Pembaruan data

Data bersifat statis pada saat build. Untuk memperbarui:

```bash
npm run fetch-firms     # butuh FIRMS_MAP_KEY di .env
npm run firms
git add public/data && git commit -m "pembaruan data" && git push
```

Cloudflare Pages akan membangun ulang situs secara otomatis setelah push. Kunci `FIRMS_MAP_KEY` hanya dibutuhkan di komputer lokal, bukan di Cloudflare.

## Alternatif

| Layanan | Catatan |
|---|---|
| Netlify | Paket gratis dengan batas bandwidth bulanan; `_redirects` dan `_headers` yang sama berlaku. |
| GitHub Pages | Gratis untuk repositori publik; tidak mendukung `_redirects`, sehingga rute Wrapped memerlukan `404.html` sebagai cadangan (salin `dist/index.html` menjadi `dist/404.html`). |
| Vercel | Paket gratis (Hobby) ditujukan untuk penggunaan non-komersial; tambahkan `vercel.json` berisi rewrite ke `/index.html`. |

## GitHub Pages (opsional)

Berkas `.github/workflows/pages.yml` membangun dan menerbitkan situs setiap kali ada push ke cabang `main`.

1. Dorong repositori ke GitHub. Di Settings, Pages, pilih sumber "GitHub Actions".
2. Tidak perlu variabel tambahan: alamat (`https://<akun>.github.io/<repositori>`) dan base path (`/<repositori>/`) terisi otomatis oleh workflow. Untuk domain khusus, buat variabel repositori `SITE_URL` (alamat publik, tanpa garis miring akhir); `SITE_BASE` boleh dikosongkan.
3. Push; situs terbit pada alamat tersebut.

Catatan: pada GitHub Pages, halaman statis tiap rute (`/wrapped/<slug>/`) dilayani langsung sehingga pratinjau media sosial berfungsi; alamat lain yang tidak dikenal memakai `404.html` (salinan `index.html`) sehingga status HTTP-nya 404 meski halaman tetap tampil. Kuota lunak GitHub Pages: situs 1 GB dan bandwidth sekitar 100 GB per bulan.
