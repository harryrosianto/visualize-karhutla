import fs from 'node:fs'
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson'

export const PROVINCES = [
  { id: 'kalbar', name: 'Kalimantan Barat', short: 'Kalbar' },
  { id: 'kalteng', name: 'Kalimantan Tengah', short: 'Kalteng' },
  { id: 'kalsel', name: 'Kalimantan Selatan', short: 'Kalsel' },
  { id: 'kaltim', name: 'Kalimantan Timur', short: 'Kaltim' },
  { id: 'kaltara', name: 'Kalimantan Utara', short: 'Kaltara' },
] as const

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
