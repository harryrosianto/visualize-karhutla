import { useEffect, useMemo, useState } from 'react'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import { loadBoundaries, loadDaily, loadHotspots, type Daily, type Hotspots, type KabCollection, type ProvinceId } from '../../lib/data'

export const PROVS: ProvinceId[] = ['kalbar', 'kalteng', 'kalsel', 'kaltim', 'kaltara']
// urutan muat bertahap: provinsi terbesar dulu agar peta cepat terisi
const LOAD_ORDER: ProvinceId[] = ['kalteng', 'kalbar', 'kalsel', 'kaltim', 'kaltara']

interface Part { hot: Hotspots; daily: Daily; bnd: KabCollection }

export interface Merged {
  n: number
  position: Float32Array // lon,lat
  filter: Float32Array // hari, indeks provinsi
  color: Uint8Array // rgba
  frp: Float32Array
  days: string[]
  /** akumulasi titik per provinsi per hari */
  cum: Partial<Record<ProvinceId, number[]>>
  daily: Partial<Record<ProvinceId, number[]>>
  /** akumulasi titik per kabupaten per hari (untuk tooltip) */
  kabCum: Record<string, number[]>
  boundaries: { type: 'FeatureCollection'; features: Feature<Polygon | MultiPolygon, any>[] }
}

const ORANGE = [249, 115, 22]
const RED = [239, 68, 68]

export function useMapData() {
  const [parts, setParts] = useState<Partial<Record<ProvinceId, Part>>>({})
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        // dua tahap: provinsi terbesar dulu, sisanya sekaligus (menghindari rebuild layer berulang)
        const load = async (p: ProvinceId) => ({ p, part: { hot: await loadHotspots(p), daily: await loadDaily(p), bnd: await loadBoundaries(p) } })
        const first = await load(LOAD_ORDER[0])
        if (!alive) return
        setParts({ [first.p]: first.part })
        const rest = await Promise.all(LOAD_ORDER.slice(1).map(load))
        if (!alive) return
        setParts(prev => ({ ...prev, ...Object.fromEntries(rest.map(r => [r.p, r.part])) }))
      } catch (e: any) {
        if (alive) setError(String(e?.message ?? e))
      }
    })()
    return () => { alive = false }
  }, [attempt])

  const loaded = Object.keys(parts).length

  const merged = useMemo<Merged | null>(() => {
    const present = PROVS.filter(p => parts[p])
    if (!present.length) return null
    const n = present.reduce((a, p) => a + parts[p]!.hot.lon.length, 0)
    const position = new Float32Array(n * 2), filter = new Float32Array(n * 2), color = new Uint8Array(n * 4), frp = new Float32Array(n)
    let o = 0
    for (const p of present) {
      const { hot } = parts[p]!
      const pi = PROVS.indexOf(p)
      for (let i = 0; i < hot.lon.length; i++, o++) {
        position[o * 2] = hot.lon[i]; position[o * 2 + 1] = hot.lat[i]
        filter[o * 2] = hot.day[i]; filter[o * 2 + 1] = pi
        frp[o] = hot.frp[i]
      }
    }
    // merah hanya untuk intensitas tertinggi (persentil 95 FRP)
    const sorted = Float32Array.from(frp).sort()
    const thr = n ? sorted[Math.floor(n * 0.95)] : Infinity
    for (let i = 0; i < n; i++) {
      const c = frp[i] >= thr && thr > 0 ? RED : ORANGE
      color[i * 4] = c[0]; color[i * 4 + 1] = c[1]; color[i * 4 + 2] = c[2]; color[i * 4 + 3] = 255
    }
    const days = parts[present[0]]!.daily.days
    const daily: Merged['daily'] = {}, cum: Merged['cum'] = {}
    for (const p of present) {
      const arr = new Array(days.length).fill(0)
      for (const k of Object.values(parts[p]!.daily.kab)) k.forEach((v, i) => { arr[i] += v })
      daily[p] = arr
      let s = 0
      cum[p] = arr.map(v => (s += v))
    }
    const kabCum: Record<string, number[]> = {}
    for (const p of present) for (const [slug, arr] of Object.entries(parts[p]!.daily.kab)) {
      let acc = 0
      kabCum[slug] = arr.map(v => (acc += v))
    }
    const boundaries = { type: 'FeatureCollection' as const, features: present.flatMap(p => parts[p]!.bnd.features) }
    return { n, position, filter, color, frp, days, cum, daily, kabCum, boundaries }
  }, [parts])

  return { merged, loaded, total: PROVS.length, error, retry: () => { setError(null); setAttempt(a => a + 1) } }
}
