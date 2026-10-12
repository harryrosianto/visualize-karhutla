// Menyalin worker MapLibre ke public/vendor agar dilayani apa adanya.
// Mengimpor berkas ini lewat bundler gagal: paket maplibre-gl menandai dirinya bebas efek samping, sehingga
// impor "kosong" terhapus dan worker produksi menjadi berkas 0 byte (peta dasar tidak pernah tampil).
import fs from 'node:fs'
fs.mkdirSync('public/vendor', { recursive: true })
fs.copyFileSync('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', 'public/vendor/maplibre-gl-worker.mjs')
console.log('worker maplibre disalin ke public/vendor')
