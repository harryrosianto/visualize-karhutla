import { AnimatePresence, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { KabupatenPicker } from '../components/KabupatenPicker'
import { Legend, ProvinceChips, TimeDock, type Filter } from '../components/map/MapControls'
import { KabupatenSheet } from '../components/map/KabupatenSheet'
import { BOUNDS, MapView, type MapMode } from '../components/map/MapView'
import { PROVS, useMapData } from '../components/map/useMapData'
import { SourceNote } from '../components/SourceNote'
import { useData } from '../lib/DataContext'
import type { Kab } from '../lib/data'

export default function MapPage() {
  const { kabs, meta } = useData()
  const { merged, loaded, total, error, retry } = useMapData()
  const reduce = !!useReducedMotion()
  const [mode, setMode] = useState<MapMode>('titik')
  const [filter, setFilter] = useState<Filter>('all')
  const [day, setDay] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [sel, setSel] = useState<string | null>(null)
  const [fitKey, setFitKey] = useState(0)
  const [flyTo, setFlyTo] = useState<{ lon: number; lat: number; key: number } | null>(null)
  const lastDay = merged ? merged.days.length - 1 : 0
  const inited = useRef(false)

  // mulai dari hari terakhir (kumulatif penuh) begitu data pertama tiba
  useEffect(() => {
    if (merged && !inited.current) { inited.current = true; setDay(merged.days.length - 1) }
  }, [merged])

  // animasi harian; dengan reduced motion loncat 7 hari per langkah
  useEffect(() => {
    if (!playing || !merged) return
    const step = reduce ? 7 : 1
    const id = window.setInterval(() => {
      setDay(d => {
        if (d >= lastDay) { setPlaying(false); return lastDay }
        return Math.min(lastDay, d + step)
      })
    }, reduce ? 600 : 70)
    return () => window.clearInterval(id)
  }, [playing, reduce, merged, lastDay])

  const togglePlay = () => {
    if (!playing && day >= lastDay) setDay(0)
    setPlaying(p => !p)
  }

  const kab: Kab | undefined = useMemo(() => kabs.find(k => k.slug === sel), [kabs, sel])
  const onFilter = (f: Filter) => { setFilter(f); setFitKey(k => k + 1) }
  const close = useCallback(() => setSel(null), [])
  const select = useCallback((slug: string) => setSel(slug), [])

  const { today, cumulative } = useMemo(() => {
    if (!merged) return { today: 0, cumulative: 0 }
    const ids = filter === 'all' ? PROVS : [filter]
    let t = 0, c = 0
    for (const p of ids) { t += merged.daily[p]?.[day] ?? 0; c += merged.cum[p]?.[day] ?? 0 }
    return { today: t, cumulative: c }
  }, [merged, filter, day])

  const bounds = BOUNDS[filter]
  return (
    <section className="relative h-[calc(100dvh-var(--banner-h,0px))] min-h-[560px] overflow-hidden bg-ink">
      <h1 className="sr-only">Peta titik panas Kalimantan 2026</h1>
      <MapView
        merged={merged} mode={mode} day={day} filter={filter} selectedSlug={sel} onSelect={select}
        fitBounds={bounds} fitKey={fitKey} flyTo={flyTo} reduceMotion={reduce}
      />

      <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex flex-col gap-2 px-4 md:px-8">
        <div className="pointer-events-auto max-w-sm">
          <KabupatenPicker hideLabel label="Cari kabupaten atau kota" onSelect={k => { setSel(k.slug); if (filter !== 'all' && filter !== k.provinceId) setFilter('all'); setFlyTo({ lon: k.centroid[0], lat: k.centroid[1], key: Date.now() }) }} />
        </div>
        <div className="pointer-events-auto">
          <ProvinceChips provinces={meta?.provinces ?? []} value={filter} onChange={onFilter} />
        </div>
        <div role="status" aria-live="polite" className="pointer-events-none text-xs text-fg-2">
          {error ? '' : loaded < total ? `Memuat data provinsi ${loaded} dari ${total}...` : ''}
        </div>
      </div>

      {error && (
        <div role="alert" className="absolute left-1/2 top-1/2 z-20 w-[min(90%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-panel border border-line bg-ink-2 p-6 text-center">
          <p className="text-lg font-bold text-fg">Data peta belum bisa dimuat</p>
          <p className="mt-2 text-sm text-fg-2">Periksa koneksi, lalu coba lagi.</p>
          <button type="button" onClick={retry} className="btn btn-primary mt-5">Coba lagi</button>
        </div>
      )}

      {!merged && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" role="status">
          <div className="h-2 w-40 animate-pulse rounded-full bg-ink-3" />
          <span className="sr-only">Memuat peta</span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 px-4 pb-7 md:px-8 md:pb-7">
        {merged && (
          <div className={`pointer-events-auto w-full max-w-3xl ${kab ? 'max-md:hidden' : ''}`}>
            <TimeDock days={merged.days} day={day} onDay={d => { setDay(d); setPlaying(false) }} playing={playing} onPlay={togglePlay}
              today={today} cumulative={cumulative} mode={mode} onMode={setMode} />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-panel bg-ink/80 px-3 py-2">
              <Legend mode={mode} />
              <SourceNote />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>{kab && <KabupatenSheet kab={kab} onClose={close} />}</AnimatePresence>
    </section>
  )
}
