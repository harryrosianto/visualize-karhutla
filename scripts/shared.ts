import fs from 'node:fs'
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson'

export type Island = 'kalimantan' | 'sumatra' | 'papua'
export const ISLANDS: { id: Island; name: string }[] = [
  { id: 'kalimantan', name: 'Kalimantan' },
  { id: 'sumatra', name: 'Sumatra' },
  { id: 'papua', name: 'Papua' },
]

/** adm1: nama ADM1 geoBoundaries (data 2017). Provinsi Papua hasil pemekaran 2022 tidak punya ADM1 sendiri; kabupatennya dipetakan menurut nama (fetch-boundaries). */
export const PROVINCES: { id: string; name: string; short: string; island: Island; adm1?: string }[] = [
  { id: 'kalbar', name: 'Kalimantan Barat', short: 'Kalbar', island: 'kalimantan', adm1: 'West Kalimantan' },
  { id: 'kalteng', name: 'Kalimantan Tengah', short: 'Kalteng', island: 'kalimantan', adm1: 'Central Kalimantan' },
  { id: 'kalsel', name: 'Kalimantan Selatan', short: 'Kalsel', island: 'kalimantan', adm1: 'South Kalimantan' },
  { id: 'kaltim', name: 'Kalimantan Timur', short: 'Kaltim', island: 'kalimantan', adm1: 'East Kalimantan' },
  { id: 'kaltara', name: 'Kalimantan Utara', short: 'Kaltara', island: 'kalimantan', adm1: 'North Kalimantan' },
  { id: 'aceh', name: 'Aceh', short: 'Aceh', island: 'sumatra', adm1: 'Aceh' },
  { id: 'sumut', name: 'Sumatra Utara', short: 'Sumut', island: 'sumatra', adm1: 'North Sumatra' },
  { id: 'sumbar', name: 'Sumatra Barat', short: 'Sumbar', island: 'sumatra', adm1: 'West Sumatra' },
  { id: 'riau', name: 'Riau', short: 'Riau', island: 'sumatra', adm1: 'Riau' },
  { id: 'kepri', name: 'Kepulauan Riau', short: 'Kepri', island: 'sumatra', adm1: 'Riau Islands' },
  { id: 'jambi', name: 'Jambi', short: 'Jambi', island: 'sumatra', adm1: 'Jambi' },
  { id: 'sumsel', name: 'Sumatra Selatan', short: 'Sumsel', island: 'sumatra', adm1: 'South Sumatra' },
  { id: 'babel', name: 'Kepulauan Bangka Belitung', short: 'Babel', island: 'sumatra', adm1: 'Bangka-Belitung Islands' },
  { id: 'bengkulu', name: 'Bengkulu', short: 'Bengkulu', island: 'sumatra', adm1: 'Bengkulu' },
  { id: 'lampung', name: 'Lampung', short: 'Lampung', island: 'sumatra', adm1: 'Lampung' },
  { id: 'papua', name: 'Papua', short: 'Papua', island: 'papua', adm1: 'Papua' },
  { id: 'papbar', name: 'Papua Barat', short: 'Pabar', island: 'papua', adm1: 'West Papua' },
  { id: 'papsel', name: 'Papua Selatan', short: 'Pasel', island: 'papua' },
  { id: 'papteng', name: 'Papua Tengah', short: 'Pateng', island: 'papua' },
  { id: 'pappeg', name: 'Papua Pegunungan', short: 'Papeg', island: 'papua' },
  { id: 'papbarda', name: 'Papua Barat Daya', short: 'Pabarda', island: 'papua' },
]

export const YEAR = 2026

export type KabFeature = Feature<
  Polygon | MultiPolygon,
  { slug: string; name: string; provinceId: string; provinceName: string; centroid: [number, number] }
>

export function loadBoundaries(): Record<string, KabFeature[]> {
  const out: Record<string, KabFeature[]> = {}
  for (const p of PROVINCES) {
    const f = `public/data/boundaries-${p.id}.json`
    if (!fs.existsSync(f)) throw new Error(`${f} belum ada. Jalankan: npm run boundaries`)
    out[p.id] = (JSON.parse(fs.readFileSync(f, 'utf8')) as FeatureCollection).features as KabFeature[]
  }
  return out
}

function inRing(x: number, y: number, ring: Position[]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function inPolygon(x: number, y: number, geom: Polygon | MultiPolygon) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates
  return polys.some(p => inRing(x, y, p[0]) && !p.slice(1).some(h => inRing(x, y, h)))
}

export function bbox(geom: Polygon | MultiPolygon) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
  for (const p of polys)
    for (const [x, y] of p[0]) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
    }
  return [x0, y0, x1, y1] as const
}

export function dayLabels(year: number, lastDate: string) {
  const days: string[] = []
  const end = new Date(lastDate + 'T00:00:00Z')
  for (let d = new Date(Date.UTC(year, 0, 1)); d <= end; d = new Date(d.getTime() + 864e5)) days.push(d.toISOString().slice(0, 10))
  return days
}
