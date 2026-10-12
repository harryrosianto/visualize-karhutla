import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'

type KabF = Feature<Polygon | MultiPolygon, { slug: string }>

function inRing(x: number, y: number, ring: Position[]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const boxCache = new WeakMap<object, [number, number, number, number]>()
function box(f: KabF) {
  let b = boxCache.get(f)
  if (b) return b
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
  for (const p of polys) for (const [x, y] of p[0]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
  b = [x0, y0, x1, y1]
  boxCache.set(f, b)
  return b
}

/** Slug kabupaten yang memuat titik (lon, lat), atau null. Memakai bbox sebelum uji poligon. */
export function pickKabupaten(lon: number, lat: number, features: KabF[]): string | null {
  for (const f of features) {
    const [x0, y0, x1, y1] = box(f)
    if (lon < x0 || lon > x1 || lat < y0 || lat > y1) continue
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    if (polys.some(p => inRing(lon, lat, p[0]) && !p.slice(1).some(h => inRing(lon, lat, h)))) return f.properties.slug
  }
  return null
}
