import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'

export type ProvinceId = 'kalbar' | 'kalteng' | 'kalsel' | 'kaltim' | 'kaltara'

export interface Meta {
  isSample: boolean
  generatedAt: string
  dataDate: string
  year: number
  sources: { hotspot: string; burnedArea: string; boundaries: string }
  provinces: { id: ProvinceId; name: string; short: string }[]
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
  /** true untuk entri gabungan seluruh Kalimantan (slug `kalimantan`) */
  isRegion?: boolean
}

export interface Daily { days: string[]; kab: Record<string, number[]> }
export interface Hotspots { lon: number[]; lat: number[]; day: number[]; frp: number[] }
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
export const loadHotspots = (p: ProvinceId) => get<Hotspots>(`hotspots-${p}.json`)
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

/** Entri gabungan seluruh Kalimantan: jumlah dari 56 kabupaten/kota. Pembanding dan luas terbakar hanya dihitung bila lengkap. */
export function buildRegion(kabs: Kab[]): Kab | null {
  if (!kabs.length) return null
  const monthly = Array(10).fill(0)
  kabs.forEach(k => k.monthly.forEach((n, i) => (monthly[i] += n)))
  const complete = <T extends 'total2025' | 'burnedHa'>(key: T) => (kabs.every(k => k[key] !== null) ? kabs.reduce((a, k) => a + (k[key] as number), 0) : null)
  return {
    slug: REGION_SLUG, name: 'Kalimantan', provinceId: 'kalbar', provinceName: 'Lima provinsi', centroid: [114, 0.1],
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
