# Worker: kiriman karya warga tanpa akun GitHub

`worker/index.ts` dijalankan di Cloudflare (nama proyek `visualize-karhutla`) dan menangani `POST /api/submit`. Selain itu Worker meneruskan semua permintaan ke aset situs.

## Alur

1. Formulir di halaman `/templat` mengirim `multipart/form-data` (judul, kreator, tautan opsional, gambar, dua pernyataan, token Turnstile).
2. Worker memeriksa asal permintaan, captcha Turnstile, kolom jebakan bot, panjang teks, dan **tanda tangan berkas** (PNG, JPG, WebP, GIF; maksimal 5 MB dan 6 berkas).
3. Gambar disimpan ke repositori terpisah `harryrosianto/visualize-karhutla-v01` (folder `uploads/`) lewat Contents API.
4. Worker membuat isu berlabel `templat` di repositori utama dengan format yang sama seperti formulir isu, sehingga alur persetujuan (label `setujui-templat`) tidak berubah.

Karya tetap **tidak tayang** sebelum pemelihara memasang label `setujui-templat`.

## Pemasangan (sekali saja)

1. **Token GitHub (fine-grained)**: GitHub, Settings, Developer settings, Fine-grained tokens. Repositori: `visualize-karhutla` dan `visualize-karhutla-v01`. Izin: *Issues: Read and write* dan *Contents: Read and write*. Atur masa berlaku, lalu salin tokennya.
2. **Turnstile**: dasbor Cloudflare, Turnstile, Add widget. Hostname: `harryrosianto.github.io` dan `visualize-karhutla.<akun>.workers.dev`. Mode *Managed*. Catat *Site key* (publik) dan *Secret key*.
3. **Secret Worker**: dasbor Cloudflare, Workers, `visualize-karhutla`, Settings, Variables and Secrets, tambahkan sebagai *Secret*:
   - `GITHUB_TOKEN` = token langkah 1
   - `TURNSTILE_SECRET` = secret key langkah 2

   (atau: `npx wrangler secret put GITHUB_TOKEN` dan `npx wrangler secret put TURNSTILE_SECRET`)
4. **Kunci situs untuk build**: pada repositori GitHub, Settings, Secrets and variables, Actions, tab *Variables*, buat `TURNSTILE_SITEKEY` = site key langkah 2. Jika situs juga di-build di Cloudflare, buat variabel build `VITE_TURNSTILE_SITEKEY` dengan nilai yang sama.
5. Deploy ulang situs (GitHub Pages dan Cloudflare). Selama `TURNSTILE_SITEKEY` kosong, formulir unggah langsung disembunyikan dan hanya jalur GitHub dan DM yang tampil.

## Pengujian lokal

Buat `.dev.vars` (sudah di-gitignore) berisi `GITHUB_TOKEN` dan `TURNSTILE_SECRET`, lalu jalankan `npx wrangler dev`. Untuk uji tanpa menyentuh GitHub, arahkan `GITHUB_API` dan `TURNSTILE_VERIFY_URL` ke server tiruan lewat `--var`. Kunci uji Turnstile: site key `1x00000000000000000000AA`, secret key `1x0000000000000000000000000000000AA` (selalu lolos).

## Keamanan dan batasan

- Token hanya ada di Worker (secret), tidak pernah di kode klien.
- Teks pengirim dibersihkan (tanpa HTML; `@` dan `#angka` dinetralkan agar tidak memicu notifikasi atau rujukan di GitHub).
- Tidak ada pembatasan laju per alamat IP selain Turnstile dan validasi. Jika terjadi banjir kiriman, tambahkan Rate Limiting Cloudflare pada rute `/api/submit` di dasbor (WAF, Rate limiting rules).
- Gambar bermasalah dapat dihapus dari repositori unggahan tanpa menyentuh repositori utama.
