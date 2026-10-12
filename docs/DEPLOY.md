# Panduan deploy

Situs ini berupa berkas statis (hasil `npm run build` di folder `dist/`), sehingga dapat dihosting di layanan statis mana pun.

## Rekomendasi: Cloudflare Pages (paket gratis)

Menurut pengetahuan penulis, paket gratis Cloudflare Pages mencakup: lalu lintas dan bandwidth berkas statis tanpa batas, domain khusus dengan HTTPS, kompresi Brotli otomatis, dan integrasi Git. Batas yang relevan: 500 build per bulan, 20.000 berkas per situs, dan 25 MiB per berkas. Situs ini berisi sekitar 300 berkas dan berkas terbesarnya (data titik panas) di bawah 5 MiB, sehingga masih jauh dari batas. Batas dapat berubah; periksa dokumentasi Cloudflare sebelum deploy.

### Opsi A: dari repositori Git (disarankan)

1. Dorong repositori ke GitHub atau GitLab. Pastikan `public/data/` ikut ter-commit (sudah demikian).
2. Di dasbor Cloudflare: Workers & Pages, Create, Pages, Connect to Git.
3. Pengaturan build:
   - Framework preset: None
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Variabel lingkungan: `NODE_VERSION` = `22` dan `VITE_SITE_URL` = alamat publik tanpa garis miring akhir (mis. `https://karhutla.contoh.id`)
4. Setelah build pertama selesai, tambahkan domain khusus pada tab Custom domains.

`VITE_SITE_URL` wajib diisi sebelum build pertama. Nilai ini dipakai untuk tautan bagikan, kartu bagikan, `og:image`, dan tag kanonis. Jika kosong, tautan menunjuk ke `http://localhost:4173`.

### Opsi B: unggah langsung tanpa Git

```bash
npm run build
npx wrangler pages deploy dist --project-name visualize-karhutla
```

Perintah ini meminta login Cloudflare satu kali. Atur `VITE_SITE_URL` di berkas `.env` lokal sebelum `npm run build`.

## Berkas konfigurasi yang sudah disediakan

- `public/_redirects`: mengarahkan semua alamat yang tidak cocok dengan berkas ke `index.html` (routing sisi klien). Halaman statis per rute (`/wrapped/<slug>/`) tetap dilayani langsung, sehingga pratinjau media sosial memuat `og:image` yang benar.
- `public/_headers`: cache panjang untuk `/assets/*` (nama berkas berhash), satu jam untuk `/data/*` dan `/unduh/*`, satu hari untuk `/og/*`.
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
