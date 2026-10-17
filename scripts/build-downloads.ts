// Membuat berkas unduhan di public/unduh/ dari data teragregasi: CSV per kabupaten/kota, CSV harian, dan metadata JSON.
// Berjalan otomatis sebelum build. Nama berkas diawali "CONTOH-" selama data contoh dipakai.
import fs from 'node:fs'

const meta = JSON.parse(fs.readFileSync('public/data/meta.json', 'utf8'))
const kabs: any[] = JSON.parse(fs.readFileSync('public/data/kabupaten.json', 'utf8'))
const prefix = meta.isSample ? 'CONTOH-' : ''
const status = meta.isSample ? 'contoh' : 'asli'
const OUT = 'public/unduh'
fs.mkdirSync(OUT, { recursive: true })
for (const f of fs.readdirSync(OUT)) fs.unlinkSync(`${OUT}/${f}`)

const q = (s: string) => `"${s.replace(/"/g, '""')}"`
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober']

const header = ['slug', 'kabupaten_kota', 'provinsi', 'titik_panas_2026', 'titik_panas_2025_periode_sama', ...MONTHS.map(m => `titik_panas_${m}_2026`), 'bulan_puncak', 'peringkat_kalimantan', 'luas_terbakar_kabupaten_ha', 'luas_terbakar_provinsi_ha', 'status_data']
const rows = kabs.map(k => [
  q(k.slug), q(k.name), q(k.provinceName), k.total2026, k.total2025 ?? '', ...k.monthly, q(BULAN[k.peakMonth]), k.rankKalimantan, k.burnedHa ?? '', meta.burnedArea?.provinces?.[k.provinceId] ?? '', status,
].join(','))
fs.writeFileSync(`${OUT}/${prefix}titik-panas-kabupaten-2026.csv`, [header.join(','), ...rows].join('\n') + '\n')

const daily: string[] = ['tanggal,slug,kabupaten_kota,provinsi,jumlah_titik_panas,status_data']
const bySlug = new Map(kabs.map(k => [k.slug, k]))
for (const p of meta.provinces) {
  const d = JSON.parse(fs.readFileSync(`public/data/daily-${p.id}.json`, 'utf8'))
  for (const [slug, arr] of Object.entries<number[]>(d.kab)) {
    const k = bySlug.get(slug)
    arr.forEach((n, i) => { if (n > 0) daily.push([d.days[i], q(slug), q(k.name), q(k.provinceName), n, status].join(',')) })
  }
}
fs.writeFileSync(`${OUT}/${prefix}titik-panas-harian-2026.csv`, daily.join('\n') + '\n')

fs.writeFileSync(`${OUT}/${prefix}metadata.json`, JSON.stringify({
  judul: 'Titik panas kebakaran hutan dan lahan di wilayah terpantau menurut kabupaten/kota, 2026',
  status_data: status,
  tanggal_data: meta.dataDate,
  dibuat: new Date().toISOString(),
  sumber: meta.sources,
  berkas: [`${prefix}titik-panas-kabupaten-2026.csv`, `${prefix}titik-panas-harian-2026.csv`],
  catatan: [
    'Titik panas adalah indikator kebakaran, bukan ukuran luas lahan terbakar.',
    'Tanggal menggunakan tanggal akuisisi FIRMS dalam waktu UTC.',
    'titik_panas_2025_periode_sama: 1 Januari sampai tanggal yang sama pada tahun 2025; kosong bila tidak tersedia.',
    'luas_terbakar_kabupaten_ha kosong karena data per kabupaten/kota belum tersedia.',
    meta.burnedArea ? `luas_terbakar_provinsi_ha (nilai provinsi diulang pada setiap kabupaten/kota): ${meta.burnedArea.source}; periode ${meta.burnedArea.period}. Kosong bila provinsi tidak dilaporkan (Kalimantan Utara).` : 'luas_terbakar_provinsi_ha belum tersedia.',
    'Batas wilayah: geoBoundaries (ADM2), CC BY 3.0 IGO.',
    meta.isSample ? 'DATA CONTOH: seluruh angka titik panas bersifat fiktif dan tidak boleh dikutip sebagai fakta.' : 'Data turunan; rujuk NASA FIRMS dan SiPongi untuk sumber asli.',
  ],
}, null, 2) + '\n')
console.log(`unduhan: ${prefix}* (${rows.length} kabupaten/kota, ${daily.length - 1} baris harian)`)
