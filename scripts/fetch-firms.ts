// Mengunduh titik panas NASA FIRMS (Kalimantan, Sumatra, Papua) lewat API area, per jendela 5 hari, ke data/raw/.
// Butuh MAP_KEY gratis: https://firms.modaps.eosdis.nasa.gov/api/map_key/ (isi FIRMS_MAP_KEY di .env).
// Pakai: npm run fetch-firms [tanggalMulai=2025-01-01] [tanggalAkhir=hari ini]
// Lingkungan: FIRMS_AREAS=kalimantan,sumatra,papua (pilih wilayah), FIRMS_MERGE=1 (gabungkan dengan CSV yang sudah ada, tanpa duplikat).
// Sumber default VIIRS SNPP: arsip standar (SP) untuk data lama + NRT untuk beberapa bulan terakhir, dedup per titik.
import fs from 'node:fs'

try { process.loadEnvFile('.env') } catch { /* .env opsional */ }
const KEY = process.env.FIRMS_MAP_KEY
if (!KEY) {
  console.error('FIRMS_MAP_KEY belum diatur. Minta kunci gratis di https://firms.modaps.eosdis.nasa.gov/api/map_key/ lalu isi di .env.')
  process.exit(1)
}
const SOURCES = (process.env.FIRMS_SOURCES || 'VIIRS_SNPP_SP,VIIRS_SNPP_NRT').split(',')
// kotak pembatas (barat,selatan,timur,utara); titik di luar batas kabupaten dibuang saat pemrosesan (process-firms)
const AREA_BOXES: Record<string, string> = {
  kalimantan: '108.5,-4.5,119.5,4.6',
  sumatra: '94.5,-6.5,109.5,6.2',
  papua: '130.0,-9.5,141.2,0.8',
}
const AREAS = (process.env.FIRMS_AREAS || 'kalimantan,sumatra,papua').split(',').map(x => x.trim()).filter(Boolean)
for (const a of AREAS) if (!AREA_BOXES[a]) { console.error(`Wilayah tidak dikenal: ${a}. Pilihan: ${Object.keys(AREA_BOXES).join(', ')}`); process.exit(1) }
const START = process.argv[2] || '2025-01-01'
const END = process.argv[3] || new Date().toISOString().slice(0, 10)
const WINDOW = 5
const OUT = `data/raw/firms-${SOURCES[0].toLowerCase()}.csv`

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const iso = (d: Date) => d.toISOString().slice(0, 10)

let header = ''
const seen = new Set<string>()
const lines: string[] = []

async function get(url: string, tries = 3): Promise<string> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url)
      const text = await res.text()
      if (res.ok) return text
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        console.error(`\nFIRMS menolak permintaan (HTTP ${res.status}): ${text.slice(0, 160)}. Periksa FIRMS_MAP_KEY di .env.`)
        process.exit(1)
      }
      if (res.status === 429) await sleep(30000)
      else if (i === tries - 1) throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`)
    } catch (e) { if (i === tries - 1) throw e; await sleep(2000 * (i + 1)) }
  }
  return ''
}

if (process.env.FIRMS_MERGE === '1' && fs.existsSync(OUT)) {
  const old = fs.readFileSync(OUT, 'utf8').split(/\r?\n/).filter(Boolean)
  header = old[0]
  const h = header.split(',')
  const iLat = h.indexOf('latitude'), iLon = h.indexOf('longitude'), iDate = h.indexOf('acq_date'), iTime = h.indexOf('acq_time')
  for (const r of old.slice(1)) { const c = r.split(','); const k = `${c[iLat]}|${c[iLon]}|${c[iDate]}|${c[iTime]}`; if (!seen.has(k)) { seen.add(k); lines.push(r) } }
  console.log(`Digabung dengan ${lines.length} titik yang sudah ada.`)
}

let total = lines.length
for (let d = new Date(START + 'T00:00:00Z'); iso(d) <= END; d = new Date(d.getTime() + WINDOW * 864e5)) {
  for (const src of SOURCES) for (const area of AREAS) {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${KEY}/${src}/${AREA_BOXES[area]}/${WINDOW}/${iso(d)}`
    const text = (await get(url)).trim()
    if (!text) continue
    if (!text.startsWith('latitude')) {
      // pesan galat dari API (kunci salah, kuota habis, dsb.)
      console.error(`Respons tak terduga untuk ${src} ${area} ${iso(d)}: ${text.slice(0, 160)}`)
      process.exit(1)
    }
    const rows = text.split(/\r?\n/)
    if (!header) header = rows[0]
    const h = rows[0].split(',')
    const iLat = h.indexOf('latitude'), iLon = h.indexOf('longitude'), iDate = h.indexOf('acq_date'), iTime = h.indexOf('acq_time')
    for (const r of rows.slice(1)) {
      if (!r) continue
      const c = r.split(',')
      const k = `${c[iLat]}|${c[iLon]}|${c[iDate]}|${c[iTime]}`
      if (seen.has(k)) continue
      seen.add(k)
      lines.push(r)
      total++
    }
    await sleep(250)
  }
  process.stdout.write(`\r${iso(d)}  ${total} titik`)
}
if (!header) { console.error('\nTidak ada data yang diterima.'); process.exit(1) }
fs.mkdirSync('data/raw', { recursive: true })
fs.writeFileSync(OUT, [header, ...lines].join('\n') + '\n')
console.log(`\nTersimpan: ${OUT} (${total} titik, ${START} sampai ${END}). Lanjutkan dengan: npm run firms`)
