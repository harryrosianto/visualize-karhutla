import type { ProvinceId } from '../../lib/data'

export type MapMode = 'titik' | 'hex'
export type Bounds = [number, number, number, number]

/** Kerangka pandangan per provinsi (lon0, lat0, lon1, lat1), hanya untuk zoom kamera. */
export const BOUNDS: Record<'all' | ProvinceId, Bounds> = {
  all: [108.7, -4.3, 119.3, 4.5],
  kalbar: [108.8, -3.1, 114.3, 2.1],
  kalteng: [110.6, -3.7, 115.9, 0.8],
  kalsel: [114.3, -4.3, 116.7, -1.2],
  kaltim: [113.8, -2.6, 119.1, 2.6],
  kaltara: [114.6, 1.8, 118.2, 4.5],
}
