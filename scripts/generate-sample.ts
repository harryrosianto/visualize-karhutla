// Generator DATA CONTOH. Semua angka di sini FIKTIF dan ditandai isSample:true.
// Hanya batas kabupaten yang asli (geoBoundaries). Jangan dipakai sebagai klaim fakta.
import fs from 'node:fs'
import zlib from 'node:zlib'
import { encodeHotspots } from '../src/lib/hotspotBin'
import { PROVINCES, YEAR, bbox, dayLabels, inPolygon, loadBoundaries } from './shared'

const DATA_DATE = '2026-10-12'

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20261012)
const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand())
const poisson = (l: number) => {
  if (l > 40) return Math.max(0, Math.round(l + Math.sqrt(l) * gauss()))
  const L = Math.exp(-l)
  let k = 0, p = 1
  do { k++; p *= rand() } while (p > L)
  return k - 1
}

// pengali musiman per bulan (Jan..Okt); Agustus-Oktober memuncak
const SEASON = [0.18, 0.14, 0.2, 0.28, 0.45, 0.8, 1.3, 2.4, 3.6, 2.2]
const seasonAt = (label: string) => {
  const m = Number(label.slice(5, 7)) - 1
  const f = Number(label.slice(8, 10)) / 31
  const a = SEASON[m], b = SEASON[Math.min(9, m + 1)]
  return a + (b - a) * f
}
const PROV_BIAS: Record<string, number> = { kalbar: 1.1, kalteng: 1.8, kalsel: 0.9, kaltim: 0.7, kaltara: 0.3 }

const bnd = loadBoundaries()
const days = dayLabels(YEAR, DATA_DATE)
const kabOut: any[] = []
const meta = {
  isSample: true,
  generatedAt: new Date().toISOString(),
  dataDate: DATA_DATE,
  year: YEAR,
  sources: {
    hotspot: 'DATA CONTOH (fiktif), pengganti NASA FIRMS VIIRS/MODIS',
    burnedArea: 'DATA CONTOH (fiktif), pengganti SiPongi Kemenhut',
    boundaries: 'geoBoundaries IDN ADM1/ADM2 (CC BY 3.0 IGO)',
  },
  provinces: PROVINCES.map(p => ({ id: p.id, name: p.name, short: p.short })),
}

for (const p of PROVINCES) {
  const lon: number[] = [], lat: number[] = [], day: number[] = [], frp: number[] = []
  const kabDaily: Record<string, number[]> = {}
  for (const f of bnd[p.id]) {
    const [x0, y0, x1, y1] = bbox(f.geometry)
    const pick = (cx?: number, cy?: number, s = 0): [number, number] => {
      for (let i = 0; i < 60; i++) {
        const x = cx === undefined ? x0 + rand() * (x1 - x0) : cx + gauss() * s
        const y = cy === undefined ? y0 + rand() * (y1 - y0) : cy + gauss() * s
        if (inPolygon(x, y, f.geometry)) return [x, y]
      }
      return f.properties.centroid
    }
    const centers = Array.from({ length: 2 + Math.floor(rand() * 4) }, () => pick())
    const area = (x1 - x0) * (y1 - y0)
    const weight = (0.35 + rand() * 1.1) * PROV_BIAS[p.id] * Math.min(2.2, 0.5 + area * 3.2) * 0.8
    const burst: number[] = new Array(days.length).fill(1)
    for (let b = 0; b < 4; b++) {
      const s = Math.floor(rand() * days.length), len = 3 + Math.floor(rand() * 6)
      for (let i = s; i < Math.min(days.length, s + len); i++) burst[i] = 2.5 + rand() * 2
    }
    const daily: number[] = []
    for (let d = 0; d < days.length; d++) {
      const n = poisson(weight * seasonAt(days[d]) * burst[d] * (0.6 + rand() * 0.8))
      daily.push(n)
      for (let i = 0; i < n; i++) {
        const c = centers[Math.floor(rand() * centers.length)]
        const [x, y] = pick(c[0], c[1], 0.06 + rand() * 0.1)
        lon.push(Math.round(x * 1e3) / 1e3)
        lat.push(Math.round(y * 1e3) / 1e3)
        day.push(d)
        frp.push(Math.round((4 + rand() ** 2 * 90) * 10) / 10)
      }
    }
    kabDaily[f.properties.slug] = daily
  }
  fs.writeFileSync(`public/data/hotspots-${p.id}.bin.gz`, zlib.gzipSync(encodeHotspots({ lon, lat, day, frp }, days.length), { level: 9 }))
  fs.writeFileSync(`public/data/daily-${p.id}.json`, JSON.stringify({ days, kab: kabDaily }))
  for (const f of bnd[p.id]) {
    const daily = kabDaily[f.properties.slug]
    const monthly: number[] = Array(10).fill(0)
    daily.forEach((n, i) => { monthly[Number(days[i].slice(5, 7)) - 1] += n })
    const total = monthly.reduce((a, b) => a + b, 0)
    kabOut.push({
      slug: f.properties.slug, name: f.properties.name, provinceId: p.id, provinceName: p.name,
      centroid: f.properties.centroid, total2026: total,
      total2025: Math.round(total * (0.55 + rand() * 1.1)),
      monthly, peakMonth: monthly.indexOf(Math.max(...monthly)),
      burnedHa: Math.round(total * (2.5 + rand() * 9)), rankKalimantan: 0,
    })
  }
}

// luas terbakar nyata dari data/sipongi.json menimpa angka contoh jika sudah diisi
const sip = JSON.parse(fs.readFileSync('data/sipongi.json', 'utf8'))
if (sip.entries?.length) {
  const bySlug = new Map<string, number>(sip.entries.map((e: any) => [e.kabupatenSlug, e.burnedHa]))
  for (const k of kabOut) if (bySlug.has(k.slug)) k.burnedHa = bySlug.get(k.slug)
}
;[...kabOut].sort((a, b) => b.total2026 - a.total2026).forEach((k, i) => { kabOut.find(x => x.slug === k.slug).rankKalimantan = i + 1 })
fs.writeFileSync('public/data/kabupaten.json', JSON.stringify(kabOut))
fs.writeFileSync('public/data/meta.json', JSON.stringify(meta, null, 1))
console.log('kabupaten', kabOut.length, 'total titik', kabOut.reduce((a, k) => a + k.total2026, 0))
