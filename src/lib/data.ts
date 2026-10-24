import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { decodeHotspots, type HotspotData } from './hotspotBin'

export type ProvinceId = string
export type IslandId = 'kalimantan' | 'sumatra' | 'papua' | 'jawa' | 'balinusa' | 'sulawesi' | 'maluku'

export interface Meta {
  isSample: boolean
  generatedAt: string
  dataDate: string
  year: number
  sources: { hotspot: string; burnedArea: string; boundaries: string }
  islands: { id: IslandId; name: string }[]
  /** bounds: [barat, selatan, timur, utara] */
  provinces: { id: ProvinceId; name: string; short: string; island: IslandId; bounds: [number, number, number, number] }[]
  /** luas lahan terbakar tingkat provinsi (ha), dari pemberitaan yang mengutip BNPB/SiPongi */
  burnedArea?: {
    source: string; period: string; retrievedAt: string; note: string
    provinces: Partial<Record<ProvinceId, number>>
    references: { publisher: string; title: string; date?: string; url: string }[]
  } | null
}

export interface Kab {
  slug: string
  name: string
  provinceId: ProvinceId
  provinceName: string
  centroid: [number, number]
  total2026: number
  total2025: number | null
  monthly: number[] // Jan..Okt
  peakMonth: number
  burnedHa: number | null
  rankKalimantan: number
  /** true untuk entri gabungan seluruh wilayah terpantau (slug `kalimantan`, dipertahankan agar tautan lama tetap berlaku) */
  isRegion?: boolean
}

export interface Daily { days: string[]; kab: Record<string, number[]> }
export type Hotspots = HotspotData
export type KabCollection = FeatureCollection<Polygon | MultiPolygon, { slug: string; name: string; provinceId: ProvinceId; centroid: [number, number] }>

const base = import.meta.env.BASE_URL
const cache = new Map<string, Promise<unknown>>()
function get<T>(file: string): Promise<T> {
  let p = cache.get(file)
  if (!p) {
    p = fetch(`${base}data/${file}`).then(r => {
      if (!r.ok) throw new Error(`Gagal memuat ${file} (${r.status})`)
      return r.json()
    })
    p.catch(() => cache.delete(file))
    cache.set(file, p)
  }
  return p as Promise<T>
}

export const loadMeta = () => get<Meta>('meta.json')
export const loadKab = () => get<Kab[]>('kabupaten.json')
export const loadDaily = (p: ProvinceId) => get<Daily>(`daily-${p}.json`)

/** Titik panas per provinsi: biner terkompres (lihat hotspotBin.ts). Server tidak selalu mengompres .bin, jadi berkas dikompres gzip lebih dulu dan dibuka di browser;
 *  bila server sudah membukanya sendiri (Content-Encoding), isinya langsung terbaca. */
export const loadHotspots = (p: ProvinceId): Promise<Hotspots> => {
  const key = `hotspots-${p}.bin.gz`
  let q = cache.get(key) as Promise<Hotspots> | undefined
  if (!q) {
    q = fetch(`${base}data/${key}`).then(async r => {
      if (!r.ok) throw new Error(`Gagal memuat ${key} (${r.status})`)
      let buf = await r.arrayBuffer()
      const head = new Uint8Array(buf, 0, 2)
      if (head[0] === 0x1f && head[1] === 0x8b) {
        if (typeof DecompressionStream === 'undefined') throw new Error('Browser ini belum mendukung pembukaan data terkompres')
        buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
      }
      return decodeHotspots(buf)
    })
    q.catch(() => cache.delete(key))
    cache.set(key, q)
  }
  return q
}
export const loadBoundaries = (p: ProvinceId) => get<KabCollection>(`boundaries-${p}.json`)

export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober']
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt']
export const HA_PER_FIELD = 0.714 // 1 lapangan sepak bola ≈ 0,714 ha

const nf = new Intl.NumberFormat('id-ID')
export const fmt = (n: number) => nf.format(Math.round(n))
export function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
export function sourceLine(meta: Meta, kind: 'hotspot' | 'burnedArea' = 'hotspot') {
  return `Sumber: ${meta.sources[kind]}. Data per ${fmtDate(meta.dataDate)}.`
}

export const REGION_SLUG = 'kalimantan'

/** Entri gabungan seluruh wilayah terpantau: jumlah dari semua kabupaten/kota. Pembanding dan luas terbakar hanya dihitung bila lengkap. */
export function buildRegion(kabs: Kab[]): Kab | null {
  if (!kabs.length) return null
  const monthly = Array(10).fill(0)
  kabs.forEach(k => k.monthly.forEach((n, i) => (monthly[i] += n)))
  const complete = <T extends 'total2025' | 'burnedHa'>(key: T) => (kabs.every(k => k[key] !== null) ? kabs.reduce((a, k) => a + (k[key] as number), 0) : null)
  return {
    slug: REGION_SLUG, name: 'Seluruh wilayah', provinceId: 'kalbar', provinceName: 'Seluruh provinsi terpantau', centroid: [114, 0.1],
    total2026: kabs.reduce((a, k) => a + k.total2026, 0), total2025: complete('total2025'),
    monthly, peakMonth: monthly.indexOf(Math.max(...monthly)), burnedHa: complete('burnedHa'), rankKalimantan: 0, isRegion: true,
  }
}

export interface ProvinceTotal { id: ProvinceId; name: string; short: string; total: number }
export function provinceTotals(kabs: Kab[], meta: Meta): ProvinceTotal[] {
  return meta.provinces
    .map(p => ({ ...p, total: kabs.filter(k => k.provinceId === p.id).reduce((a, k) => a + k.total2026, 0) }))
    .sort((a, b) => b.total - a.total)
}

export interface BurnedInfo { ha: number; scope: 'kabupaten' | 'provinsi' | 'wilayah'; scopeNote: string }

/** Luas lahan terbakar yang tersedia untuk sebuah wilayah: per kabupaten/kota bila ada, jika tidak tingkat provinsi, atau jumlah provinsi untuk seluruh wilayah. */
export function burnedInfo(kab: Kab, meta: Meta): BurnedInfo | null {
  if (kab.burnedHa !== null) return { ha: kab.burnedHa, scope: 'kabupaten', scopeNote: '' }
  const b = meta.burnedArea
  if (!b) return null
  if (kab.isRegion) {
    const vals = Object.values(b.provinces) as number[]
    if (!vals.length) return null
    const missing = meta.provinces.length - vals.length
    return { ha: vals.reduce((a, v) => a + v, 0), scope: 'wilayah', scopeNote: missing ? `jumlah ${vals.length} provinsi; ${missing} provinsi belum tersedia` : `jumlah ${vals.length} provinsi` }
  }
  const ha = b.provinces[kab.provinceId]
  return ha === undefined ? null : { ha, scope: 'provinsi', scopeNote: `data tingkat provinsi; data per kabupaten/kota belum tersedia` }
}

export function burnedSourceLine(meta: Meta) {
  return meta.burnedArea ? `Sumber luas lahan terbakar: ${meta.burnedArea.source}. Periode: ${meta.burnedArea.period}.` : 'Data luas lahan terbakar belum tersedia.'
}
