import type { Meta, ProvinceId } from '../../lib/data'

export type MapMode = 'titik' | 'hex'
export type Bounds = [number, number, number, number]
/** 'all', id wilayah (kalimantan, sumatra, papua, jawa, balinusa, sulawesi, maluku), atau id provinsi */
export type Filter = string

export interface Resolved {
  /** provinsi terpilih; null berarti semua */
  ids: ProvinceId[] | null
  /** rentang indeks provinsi pada meta.provinces (urutannya dikelompokkan per pulau, jadi berurutan) */
  range: [number, number]
  /** kerangka kamera (barat, selatan, timur, utara) */
  bounds: Bounds
  island: string | null
}

const FALLBACK: Bounds = [94.5, -9.5, 141.2, 6.2]

/** Menerjemahkan filter peta menjadi daftar provinsi, rentang indeks, dan kerangka kamera. */
export function resolveFilter(filter: Filter, meta: Meta | null): Resolved {
  const provs = meta?.provinces ?? []
  const all: Resolved = { ids: null, range: [0, Math.max(0, provs.length - 1)], bounds: unionBounds(provs.map(p => p.bounds)) ?? FALLBACK, island: null }
  if (filter === 'all' || !provs.length) return all
  const chosen = provs.filter(p => p.id === filter || p.island === filter)
  if (!chosen.length) return all
  const idx = chosen.map(p => provs.indexOf(p))
  return {
    ids: chosen.map(p => p.id), range: [Math.min(...idx), Math.max(...idx)],
    bounds: unionBounds(chosen.map(p => p.bounds)) ?? FALLBACK, island: chosen[0].island,
  }
}

function unionBounds(bs: Bounds[]): Bounds | null {
  if (!bs.length) return null
  return [Math.min(...bs.map(b => b[0])), Math.min(...bs.map(b => b[1])), Math.max(...bs.map(b => b[2])), Math.max(...bs.map(b => b[3]))]
}
