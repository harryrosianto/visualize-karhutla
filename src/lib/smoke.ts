import { useEffect, useState } from 'react'
import { ASAP_URL } from './site'

/** Grid PM2,5 (µg/m³) hasil model CAMS untuk seluruh Indonesia, dari Worker (/api/asap). Urutan nilai: baris dari lintang selatan ke utara, tiap baris dari barat ke timur. */
export interface SmokeGrid { time: string | null; lat0: number; lon0: number; step: number; nx: number; ny: number; pm25: (number | null)[] }

let cache: Promise<SmokeGrid> | null = null
export function loadSmoke(): Promise<SmokeGrid> {
  if (!cache) {
    cache = fetch(ASAP_URL).then(async r => {
      if (!r.ok) throw new Error(String(r.status))
      const g = (await r.json()) as SmokeGrid
      if (!Array.isArray(g.pm25) || g.pm25.length !== g.nx * g.ny) throw new Error('format')
      return g
    })
    cache.catch(() => { cache = null })
  }
  return cache
}

/** Skala warna: transparan untuk udara bersih, lalu hijau, kuning, jingga, merah, ungu, marun (batas mengikuti kategori US AQI untuk PM2,5). */
export const SMOKE_STOPS: { v: number; c: [number, number, number]; a: number; label?: string }[] = [
  { v: 0, c: [74, 222, 128], a: 0 },
  { v: 15, c: [74, 222, 128], a: 0, label: '15' },
  { v: 25, c: [74, 222, 128], a: 0.2, label: '25' },
  { v: 35, c: [250, 204, 21], a: 0.5, label: '35' },
  { v: 55, c: [251, 146, 60], a: 0.62, label: '55' },
  { v: 150, c: [239, 68, 68], a: 0.72, label: '150' },
  { v: 250, c: [168, 85, 247], a: 0.8, label: '250' },
  { v: 400, c: [127, 29, 29], a: 0.88, label: '400+' },
]
export const smokeCss = () => `linear-gradient(to right, ${SMOKE_STOPS.map((s, i) => `rgba(${s.c.join(',')},${Math.max(s.a, 0.12)}) ${(i / (SMOKE_STOPS.length - 1)) * 100}%`).join(', ')})`

function colorAt(v: number): [number, number, number, number] {
  if (v <= SMOKE_STOPS[0].v) return [0, 0, 0, 0]
  for (let i = 1; i < SMOKE_STOPS.length; i++) {
    const a = SMOKE_STOPS[i - 1], b = SMOKE_STOPS[i]
    if (v <= b.v) {
      const t = (v - a.v) / (b.v - a.v)
      return [a.c[0] + (b.c[0] - a.c[0]) * t, a.c[1] + (b.c[1] - a.c[1]) * t, a.c[2] + (b.c[2] - a.c[2]) * t, (a.a + (b.a - a.a) * t) * 255]
    }
  }
  const l = SMOKE_STOPS[SMOKE_STOPS.length - 1]
  return [l.c[0], l.c[1], l.c[2], l.a * 255]
}

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
const invMercY = (y: number) => (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * (180 / Math.PI)
const smooth = (t: number) => t * t * (3 - 2 * t)

/** Menggambar grid menjadi gambar gradasi halus. Piksel disusun merata pada sumbu Mercator supaya pas saat dipasang pada peta web. */
export function renderSmoke(g: SmokeGrid, pxPerDeg = 12): { url: string; coordinates: [[number, number], [number, number], [number, number], [number, number]] } {
  const lat1 = g.lat0 + (g.ny - 1) * g.step, lon1 = g.lon0 + (g.nx - 1) * g.step
  const w = Math.round((lon1 - g.lon0) * pxPerDeg)
  const y0 = mercY(g.lat0), y1 = mercY(lat1)
  const h = Math.round(((y1 - y0) * 180) / Math.PI * pxPerDeg)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(w, h)
  // nilai kosong diisi dari tetangga terdekat agar tidak ada lubang
  const val = (ix: number, iy: number) => {
    const v = g.pm25[iy * g.nx + ix]
    if (v !== null) return v
    for (let r = 1; r < 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = ix + dx, y = iy + dy
      if (x >= 0 && y >= 0 && x < g.nx && y < g.ny && g.pm25[y * g.nx + x] !== null) return g.pm25[y * g.nx + x]!
    }
    return 0
  }
  for (let py = 0; py < h; py++) {
    const lat = invMercY(y1 - ((py + 0.5) / h) * (y1 - y0))
    const fy = Math.min(g.ny - 1.0001, Math.max(0, (lat - g.lat0) / g.step))
    const iy = Math.floor(fy), ty = smooth(fy - iy)
    for (let px = 0; px < w; px++) {
      const fx = Math.min(g.nx - 1.0001, Math.max(0, (px / w) * (g.nx - 1)))
      const ix = Math.floor(fx), tx = smooth(fx - ix)
      const v = (val(ix, iy) * (1 - tx) + val(ix + 1, iy) * tx) * (1 - ty) + (val(ix, iy + 1) * (1 - tx) + val(ix + 1, iy + 1) * tx) * ty
      const [r, gr, b, a] = colorAt(v)
      const o = (py * w + px) * 4
      img.data[o] = r; img.data[o + 1] = gr; img.data[o + 2] = b; img.data[o + 3] = a
    }
  }
  ctx.putImageData(img, 0, 0)
  return { url: canvas.toDataURL('image/png'), coordinates: [[g.lon0, lat1], [lon1, lat1], [lon1, g.lat0], [g.lon0, g.lat0]] }
}

/** Waktu data (UTC dari model) dalam WIB, untuk legenda. */
export function smokeTimeWib(time: string | null) {
  if (!time) return ''
  const d = new Date(time + ':00Z')
  if (isNaN(+d)) return ''
  const w = new Date(+d + 7 * 3600e3)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${w.getUTCDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][w.getUTCMonth()]} ${w.getUTCFullYear()}, pukul ${p(w.getUTCHours())}.${p(w.getUTCMinutes())} WIB`
}

export function useSmoke(enabled: boolean) {
  const [s, setS] = useState<{ status: 'idle' | 'loading' | 'ok' | 'error'; grid?: SmokeGrid }>({ status: 'idle' })
  useEffect(() => {
    if (!enabled) return
    let alive = true
    setS(p => (p.grid ? p : { status: 'loading' }))
    loadSmoke().then(grid => alive && setS({ status: 'ok', grid })).catch(() => alive && setS({ status: 'error' }))
    return () => { alive = false }
  }, [enabled])
  return s
}
