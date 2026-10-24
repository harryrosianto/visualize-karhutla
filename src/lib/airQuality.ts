import { useEffect, useState } from 'react'

export interface AirQuality { pm25: number; pm10: number; aqi: number; time: string }

/** Kategori skala US AQI (0-500). Skala ini dipakai karena itulah yang disediakan sumber data; ISPU resmi Indonesia memakai ambang yang berbeda. */
export const AQI_LEVELS = [
  { max: 50, label: 'Baik', color: '#4ade80' },
  { max: 100, label: 'Sedang', color: '#facc15' },
  { max: 150, label: 'Tidak sehat bagi kelompok sensitif', color: '#fb923c' },
  { max: 200, label: 'Tidak sehat', color: '#f87171' },
  { max: 300, label: 'Sangat tidak sehat', color: '#c084fc' },
  { max: Infinity, label: 'Berbahaya', color: '#be123c' },
] as const

export const aqiLevel = (aqi: number) => AQI_LEVELS.find(l => aqi <= l.max)!

const cache = new Map<string, Promise<AirQuality>>()

/** Perkiraan kualitas udara saat ini (model CAMS lewat Open-Meteo) pada satu koordinat; gagal dengan tenang bila jaringan atau layanan bermasalah. */
function fetchAir(lon: number, lat: number): Promise<AirQuality> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`
  let p = cache.get(key)
  if (!p) {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=pm2_5,pm10,us_aqi&timezone=Asia%2FJakarta`
    p = fetch(url).then(async r => {
      if (!r.ok) throw new Error(String(r.status))
      const j = await r.json()
      const c = j?.current
      if (typeof c?.pm2_5 !== 'number' || typeof c?.pm10 !== 'number' || typeof c?.us_aqi !== 'number') throw new Error('format')
      return { pm25: c.pm2_5, pm10: c.pm10, aqi: c.us_aqi, time: String(c.time) }
    })
    p.catch(() => cache.delete(key))
    cache.set(key, p)
  }
  return p
}

export function useAirQuality(lon: number, lat: number) {
  const [state, setState] = useState<{ status: 'loading' | 'ok' | 'error'; data?: AirQuality }>({ status: 'loading' })
  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    fetchAir(lon, lat).then(d => alive && setState({ status: 'ok', data: d })).catch(() => alive && setState({ status: 'error' }))
    return () => { alive = false }
  }, [lon, lat])
  return state
}
