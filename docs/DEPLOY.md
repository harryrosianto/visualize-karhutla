# Panduan deploy

Situs ini berupa berkas statis (hasil `npm run build` di folder `dist/`), sehingga dapat dihosting di layanan statis mana pun.

## Rekomendasi: Cloudflare Pages (paket gratis)

Menurut pengetahuan penulis, paket gratis Cloudflare Pages mencakup: lalu lintas dan bandwidth berkas statis tanpa batas, domain khusus dengan HTTPS, kompresi Brotli otomatis, dan integrasi Git. Batas yang relevan: 500 build per bulan, 20.000 berkas per situs, dan 25 MiB per berkas. Situs ini berisi sekitar 300 berkas dan berkas terbesarnya (data titik panas) di bawah 5 MiB, sehingga masih jauh dari batas. Batas dapat berubah; periksa dokumentasi Cloudflare sebelum deploy.

### Opsi A: dari repositori Git (disarankan)

Repositori: https://github.com/harryrosianto/visualize-karhutla (cabang `main`).

1. Masuk ke dasbor Cloudflare, menu **Workers & Pages**, lalu **Create application**. Pilih tab **Pages** (pada tampilan terbaru, tautan kecil "Looking to deploy Pages? Get started"), kemudian **Connect to Git**.
2. Hubungkan akun GitHub, pilih repositori `visualize-karhutla`, lalu **Begin setup**.
3. Pengaturan build:
   - Production branch: `main`
   - Framework preset: None
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Buka **Environment variables (advanced)** dan tambahkan untuk **Production** (dan **Preview** bila perlu):
   - `VITE_SITE_URL` = alamat publik tanpa garis miring akhir. Sebelum memakai domain sendiri, isi dengan alamat bawaan Cloudflare, yaitu `https://<nama-proyek>.pages.dev` (nama proyek sama dengan yang dipilih pada langkah 2 atau 3; tampil di bagian atas halaman setelah proyek dibuat).
   - `NODE_VERSION` = `22` (opsional; `.nvmrc` sudah menetapkan 22).
5. Klik **Save and Deploy**. Build pertama berjalan sekitar 1 sampai 3 menit.
6. Jika nama proyek ternyata berbeda dari tebakan pada langkah 4, perbarui `VITE_SITE_URL` pada Settings, Environment variables, lalu **Retry deployment** (variabel ini ditanam saat build).
7. Domain sendiri (opsional): tab **Custom domains**, **Set up a custom domain**. Ubah `VITE_SITE_URL` menjadi domain tersebut dan jalankan ulang deployment.

Setiap push ke `main` otomatis membangun dan menerbitkan ulang situs. `VITE_SITE_URL` wajib benar karena dipakai untuk tautan bagikan, kartu bagikan, `og:image`, dan tag kanonis; jika salah, pratinjau media sosial menunjuk ke alamat yang keliru.

### Opsi B: unggah langsung tanpa Git

```bash
# isi VITE_SITE_URL di .env lebih dulu, lalu:
npm run deploy:cloudflare
```

Perintah ini membangun situs dan menjalankan `wrangler pages deploy`. Login Cloudflare diminta satu kali, dan proyek `visualize-karhutla` dibuat bila belum ada.

### Hasil uji lokal

Konfigurasi diuji dengan emulator Cloudflare (`wrangler pages dev dist`): halaman statis per rute (`/peta/`, `/wrapped/<slug>/`) dilayani dengan meta `og:*` yang benar, alamat yang tidak dikenal jatuh ke aplikasi (HTTP 200), serta header cache dan keamanan terpasang. Jumlah berkas hasil build 216 dan berkas terbesar sekitar 3 MB, jauh di bawah batas Cloudflare.

## Berkas konfigurasi yang sudah disediakan

- `public/_redirects`: mengarahkan semua alamat yang tidak cocok dengan berkas ke `index.html` (routing sisi klien). Halaman statis per rute (`/wrapped/<slug>/`) tetap dilayani langsung, sehingga pratinjau media sosial memuat `og:image` yang benar.
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
