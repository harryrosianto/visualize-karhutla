// Memproses CSV NASA FIRMS (VIIRS/MODIS) dari data/raw/*.csv menjadi agregasi per kabupaten per hari.
// Menimpa file contoh di public/data/ dengan isSample:false.
// Kolom yang dibaca: latitude, longitude, acq_date, frp (opsional), confidence (opsional).
// Titik MODIS dengan confidence < 30 dan VIIRS confidence 'l' (low) dibuang.
import fs from 'node:fs'
import path from 'node:path'
import { ISLANDS, PROVINCES, YEAR, bbox, dayLabels, inPolygon, loadBoundaries } from './shared'

const RAW = 'data/raw'
const files = fs.existsSync(RAW) ? fs.readdirSync(RAW).filter(f => f.toLowerCase().endsWith('.csv')) : []
if (!files.length) {
  console.error('Tidak ada CSV di data/raw/. Unduh dari https://firms.modaps.eosdis.nasa.gov/download/ (Kalimantan, Sumatra, Papua; tahun 2025-2026), atau jalankan npm run fetch-firms.')
  process.exit(1)
}

const bnd = loadBoundaries()
const kabs = PROVINCES.flatMap(p => bnd[p.id].map(f => ({ f, box: bbox(f.geometry) })))

const pts = new Map<string, { lon: number[]; lat: number[]; day: string[]; frp: number[] }>()
const prev = new Map<string, string[]>() // slug -> "MM-DD" titik tahun lalu
const dailyKey = new Map<string, Map<string, number>>() // slug -> tanggal -> n
let maxDate = ''
let read = 0, kept = 0
const sats = new Set<string>()

function* rows(file: string) {
  const text = fs.readFileSync(path.join(RAW, file), 'utf8').split(/\r?\n/)
  const head = text[0].split(',').map(s => s.trim())
  const ix = (n: string) => head.indexOf(n)
  const iSat = ix('satellite'), iLat = ix('latitude'), iLon = ix('longitude'), iDate = ix('acq_date'), iFrp = ix('frp'), iConf = ix('confidence')
  if (iLat < 0 || iLon < 0 || iDate < 0) throw new Error(`${file}: kolom latitude/longitude/acq_date tidak ditemukan`)
  for (let i = 1; i < text.length; i++) {
    if (!text[i]) continue
    const c = text[i].split(',')
    yield { lat: +c[iLat], lon: +c[iLon], date: c[iDate], frp: iFrp >= 0 ? +c[iFrp] : 0, conf: iConf >= 0 ? c[iConf] : '', sat: iSat >= 0 ? c[iSat] : '' }
  }
}

for (const file of files) {
  for (const r of rows(file)) {
    read++
    if (r.sat) sats.add(r.sat)
    if (r.conf === 'l' || r.conf === 'low' || (/^\d+$/.test(r.conf) && +r.conf < 30)) continue
    const yr = Number(r.date.slice(0, 4))
    if (yr !== YEAR && yr !== YEAR - 1) continue
    const hit = kabs.find(k => r.lon >= k.box[0] && r.lon <= k.box[2] && r.lat >= k.box[1] && r.lat <= k.box[3] && inPolygon(r.lon, r.lat, k.f.geometry))
    if (!hit) continue
    kept++
    const slug = hit.f.properties.slug
    if (yr === YEAR - 1) { const l = prev.get(slug) ?? []; l.push(r.date.slice(5)); prev.set(slug, l); continue }
    if (r.date > maxDate) maxDate = r.date
    const prov = hit.f.properties.provinceId
    const b = pts.get(prov) ?? { lon: [], lat: [], day: [], frp: [] }
    b.lon.push(Math.round(r.lon * 1e3) / 1e3); b.lat.push(Math.round(r.lat * 1e3) / 1e3); b.day.push(r.date); b.frp.push(r.frp || 0)
    pts.set(prov, b)
    const dm = dailyKey.get(slug) ?? new Map<string, number>()
    dm.set(r.date, (dm.get(r.date) ?? 0) + 1)
    dailyKey.set(slug, dm)
  }
}
if (!maxDate) { console.error(`Tidak ada titik tahun ${YEAR} di dalam provinsi yang dicakup.`); process.exit(1) }
console.log(`baris dibaca ${read}, dipertahankan ${kept}, tanggal data terakhir ${maxDate}`)

const SAT: Record<string, string> = { N: 'VIIRS Suomi NPP', N20: 'VIIRS NOAA-20', N21: 'VIIRS NOAA-21', T: 'MODIS Terra', A: 'MODIS Aqua', Terra: 'MODIS Terra', Aqua: 'MODIS Aqua' }
const satLabel = sats.size ? [...sats].map(x => SAT[x] ?? x).join(' + ') : 'VIIRS/MODIS'
const days = dayLabels(YEAR, maxDate)
const dayIdx = new Map(days.map((d, i) => [d, i]))
const kabOut: any[] = []
const sip = JSON.parse(fs.readFileSync('data/sipongi.json', 'utf8'))
const burned = new Map<string, number>((sip.entries ?? []).map((e: any) => [e.kabupatenSlug, e.burnedHa]))
const lastMonth = Number(maxDate.slice(5, 7))
// pembanding hanya periode yang sama: 1 Januari sampai MM-DD tanggal data terakhir
const md = maxDate.slice(5)
const count2025 = new Map<string, number>([...prev].map(([slug, l]) => [slug, l.filter(d => d <= md).length]))

for (const p of PROVINCES) {
  const b = pts.get(p.id) ?? { lon: [], lat: [], day: [], frp: [] }
  fs.writeFileSync(`public/data/hotspots-${p.id}.json`, JSON.stringify({ lon: b.lon, lat: b.lat, day: b.day.map(d => dayIdx.get(d)!), frp: b.frp }))
  const kab: Record<string, number[]> = {}
  for (const f of bnd[p.id]) {
    const slug = f.properties.slug
    const dm = dailyKey.get(slug)
    const daily = days.map(d => dm?.get(d) ?? 0)
    kab[slug] = daily
    const monthly: number[] = Array(10).fill(0)
    daily.forEach((n, i) => { const m = Number(days[i].slice(5, 7)) - 1; if (m < 10) monthly[m] += n }) // UI mencakup Januari sampai Oktober
    const total = monthly.reduce((a, c) => a + c, 0)
    kabOut.push({
      slug, name: f.properties.name, provinceId: p.id, provinceName: p.name, centroid: f.properties.centroid,
      total2026: total, total2025: prev.size ? count2025.get(slug) ?? 0 : null,
      monthly, peakMonth: monthly.indexOf(Math.max(...monthly)),
      burnedHa: burned.has(slug) ? burned.get(slug) : null, rankKalimantan: 0,
    })
  }
  fs.writeFileSync(`public/data/daily-${p.id}.json`, JSON.stringify({ days, kab }))
}
;[...kabOut].sort((a, b) => b.total2026 - a.total2026).forEach((k, i) => { kabOut.find(x => x.slug === k.slug).rankKalimantan = i + 1 })
fs.writeFileSync('public/data/kabupaten.json', JSON.stringify(kabOut))
fs.writeFileSync('public/data/meta.json', JSON.stringify({
  isSample: false, generatedAt: new Date().toISOString(), dataDate: maxDate, year: YEAR,
  sources: {
    hotspot: `NASA FIRMS (${satLabel})`,
    burnedArea: sip.entries?.length || sip.provinces?.length ? `${sip.source}, periode ${sip.period}` : 'belum tersedia',
    boundaries: 'geoBoundaries IDN ADM1/ADM2 (CC BY 3.0 IGO)',
  },
  islands: ISLANDS,
  provinces: PROVINCES.map(p => {
    // batas tampilan provinsi: [barat, selatan, timur, utara]
    const bs = bnd[p.id].map(f => bbox(f.geometry))
    const bounds = [Math.min(...bs.map(b => b[0])), Math.min(...bs.map(b => b[1])), Math.max(...bs.map(b => b[2])), Math.max(...bs.map(b => b[3]))].map(n => Math.round(n * 100) / 100)
    return { id: p.id, name: p.name, short: p.short, island: p.island, bounds }
  }),
  // luas lahan terbakar tingkat provinsi dari pemberitaan (lihat data/sipongi.json); kosong bila belum diisi
  burnedArea: sip.provinces?.length ? {
    source: sip.source, period: sip.period, retrievedAt: sip.retrievedAt, note: sip.note ?? '',
    provinces: Object.fromEntries(sip.provinces.map((p: any) => [p.provinceId, p.burnedHa])),
    references: sip.references ?? [],
  } : null,
  lastMonth,
}, null, 1))
console.log('selesai:', kabOut.length, 'kabupaten')
