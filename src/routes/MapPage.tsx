import { AnimatePresence, useReducedMotion } from 'motion/react'
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Info, LinkSimple, MagnifyingGlass } from '@phosphor-icons/react'
import { KabupatenPicker } from '../components/KabupatenPicker'
import { Legend, ProvinceChips, TimeDock, type Filter } from '../components/map/MapControls'
import { KabupatenSheet } from '../components/map/KabupatenSheet'
import { BOUNDS, type MapMode } from '../components/map/mapTypes'
import { PROVS, useMapData } from '../components/map/useMapData'
import { SourceNote } from '../components/SourceNote'
import { useData } from '../lib/DataContext'
import type { Kab } from '../lib/data'
import { siteUrl } from '../lib/share'

// MapLibre + deck.gl (sekitar 1,9 MB) dimuat terpisah supaya kontrol dan teks halaman tampil lebih dulu
const MapView = lazy(() => import('../components/map/MapView'))

const FILTERS = ['kalbar', 'kalteng', 'kalsel', 'kaltim', 'kaltara']

export default function MapPage() {
  // keadaan tampilan disimpan di URL agar dapat dibagikan: ?provinsi=&tanggal=&mode=3d&kabupaten=
  const [params, setParams] = useSearchParams()
  const initial = useRef({
    filter: (FILTERS.includes(params.get('provinsi') ?? '') ? params.get('provinsi') : 'all') as Filter,
    mode: (params.get('mode') === '3d' ? 'hex' : 'titik') as MapMode,
    date: params.get('tanggal'),
    kab: params.get('kabupaten'),
  })
  const { kabs, meta } = useData()
  const { merged, loaded, total, error, retry } = useMapData()
  const reduce = !!useReducedMotion()
  const [mode, setMode] = useState<MapMode>(initial.current.mode)
  const [filter, setFilter] = useState<Filter>(initial.current.filter)
  const [day, setDay] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [sel, setSel] = useState<string | null>(initial.current.kab)
  const [fitKey, setFitKey] = useState(initial.current.filter === 'all' ? 0 : 1)
  const [flyTo, setFlyTo] = useState<{ lon: number; lat: number; key: number } | null>(null)
  const lastDay = merged ? merged.days.length - 1 : 0
  const inited = useRef(false)
  // beri browser kesempatan mengecat kontrol dan banner sebelum modul peta (berat) dievaluasi
  const [mapGo, setMapGo] = useState(false)
  useEffect(() => {
    if (!meta) return
    const t = window.setTimeout(() => setMapGo(true), 900)
    return () => window.clearTimeout(t)
  }, [meta])

  // mulai dari hari terakhir (kumulatif penuh) begitu data pertama tiba
  useEffect(() => {
    if (merged && !inited.current) {
      inited.current = true
      const i = initial.current.date ? merged.days.indexOf(initial.current.date) : -1
      setDay(i >= 0 ? i : merged.days.length - 1)
    }
  }, [merged])

  // tulis keadaan ke URL (tanpa menambah riwayat); selama animasi diputar, tanggal tidak ditulis
  useEffect(() => {
    if (!merged || !inited.current || playing) return
    const p = new URLSearchParams()
    if (filter !== 'all') p.set('provinsi', filter)
    if (mode === 'hex') p.set('mode', '3d')
    if (day !== merged.days.length - 1) p.set('tanggal', merged.days[day])
    if (sel) p.set('kabupaten', sel)
    setParams(p, { replace: true })
  }, [merged, filter, mode, day, sel, playing, setParams])

  const [copied, setCopied] = useState(false)
  // mobile: pencarian dan keterangan dilipat agar peta tidak tertutup
  const [searchOpen, setSearchOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const copyView = async () => {
    const url = `${siteUrl()}/peta${params.toString() ? '?' + params.toString() : ''}`
    try { await navigator.clipboard.writeText(url) } catch { window.prompt('Salin tautan tampilan peta:', url); return }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2500)
  }

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
      <h1 className="sr-only">Peta titik panas 2026</h1>
      {mapGo && <Suspense fallback={<div className="absolute inset-0 bg-ink" />}>
      <MapView
        merged={merged} mode={mode} day={day} filter={filter} selectedSlug={sel} onSelect={select}
        fitBounds={bounds} fitKey={fitKey} flyTo={flyTo} reduceMotion={reduce}
      />
      </Suspense>}

      <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex flex-col gap-2 px-4 md:px-8">
        <div className={`pointer-events-auto max-w-sm ${searchOpen ? '' : 'max-md:hidden'}`}>
          <KabupatenPicker hideLabel label="Cari kabupaten atau kota" onSelect={k => { setSearchOpen(false); setSel(k.slug); if (filter !== 'all' && filter !== k.provinceId) setFilter('all'); setFlyTo({ lon: k.centroid[0], lat: k.centroid[1], key: Date.now() }) }} />
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button type="button" onClick={() => setSearchOpen(o => !o)} aria-expanded={searchOpen} aria-label="Cari kabupaten atau kota"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-ink-2/90 text-fg-2 hover:text-fg md:hidden">
            <MagnifyingGlass size={20} weight="bold" aria-hidden />
          </button>
          <ProvinceChips provinces={meta?.provinces ?? []} value={filter} onChange={onFilter} />
        </div>
        <div role="status" aria-live="polite" className="pointer-events-none text-xs text-fg-2">
          {error ? '' : loaded < total ? `Memuat data provinsi (${loaded} dari ${total})...` : ''}
        </div>
      </div>

      {error && (
        <div role="alert" className="absolute left-1/2 top-1/2 z-20 w-[min(90%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-panel border border-line bg-ink-2 p-6 text-center">
          <p className="text-lg font-bold text-fg">Data peta belum dapat dimuat</p>
          <p className="mt-2 text-sm text-fg-2">Periksa sambungan internet, kemudian coba kembali.</p>
          <button type="button" onClick={retry} className="btn btn-primary mt-5">Muat ulang</button>
        </div>
      )}

      {!merged && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" role="status">
          <div className="h-2 w-40 animate-pulse rounded-full bg-ink-3" />
          <span className="sr-only">Memuat peta</span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 px-4 pb-6 md:px-8 md:pb-7">
        {merged && (
          <div className={`pointer-events-auto w-full max-w-3xl ${kab ? 'max-md:hidden' : ''}`}>
            <TimeDock days={merged.days} day={day} onDay={d => { setDay(d); setPlaying(false) }} playing={playing} onPlay={togglePlay}
              today={today} cumulative={cumulative} mode={mode} onMode={setMode} />
            <button type="button" onClick={() => setInfoOpen(o => !o)} aria-expanded={infoOpen}
              className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink/80 px-4 text-xs font-semibold text-fg-2 hover:text-fg md:hidden">
              <Info size={16} weight="bold" aria-hidden />Keterangan dan sumber
            </button>
            <div className={`mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-panel bg-ink/80 px-3 py-2 ${infoOpen ? '' : 'max-md:hidden'}`}>
              <Legend mode={mode} />
              <button type="button" onClick={copyView} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-fg-2 hover:text-fg"><LinkSimple size={16} weight="bold" aria-hidden />Salin tautan tampilan</button>
              <SourceNote />
              <p role="status" aria-live="polite" className="w-full text-xs text-fg">{copied ? 'Tautan tampilan peta disalin.' : ''}</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>{kab && <KabupatenSheet kab={kab} onClose={close} />}</AnimatePresence>
    </section>
  )
}
