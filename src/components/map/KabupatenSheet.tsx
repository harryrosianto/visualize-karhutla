import { ArrowRight, X } from '@phosphor-icons/react'
import { motion, useDragControls, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { aqiLevel, useAirQuality } from '../../lib/airQuality'
import { MONTHS, fmt, type Kab } from '../../lib/data'
import { useData } from '../../lib/DataContext'
import { SourceNote } from '../SourceNote'
import { Sparkline } from '../Sparkline'

/** Perkiraan kualitas udara saat ini di titik pusat kabupaten/kota (model, bukan pengukuran stasiun). */
function AirQualityBlock({ lon, lat }: { lon: number; lat: number }) {
  const { status, data } = useAirQuality(lon, lat)
  const lvl = data ? aqiLevel(data.aqi) : null
  return (
    <section aria-label="Kualitas udara" className="mt-5 border-t border-line pt-5">
      <h3 className="text-xs text-fg-3">Kualitas udara saat ini (perkiraan model)</h3>
      {status === 'loading' && <p role="status" className="mt-2 text-sm text-fg-3">Memuat kualitas udara...</p>}
      {status === 'error' && <p className="mt-2 text-sm text-fg-3">Data kualitas udara belum dapat dimuat saat ini.</p>}
      {data && lvl && (
        <>
          <p className="mt-1 flex items-center gap-2 text-lg font-bold text-fg">
            <i aria-hidden className="size-3 shrink-0 rounded-full" style={{ background: lvl.color }} />
            <span>{lvl.label}</span>
          </p>
          <p className="mt-0.5 text-sm text-fg-2 num">US AQI {Math.round(data.aqi)} · PM2,5 {fmt(data.pm25)} · PM10 {fmt(data.pm10)} µg/m³ · pukul {data.time.slice(11, 16)} WIB</p>
        </>
      )}
      <p className="mt-2 text-xs leading-relaxed text-fg-3">
        Perkiraan model CAMS untuk titik pusat wilayah, bukan hasil pengukuran stasiun, sehingga bisa meleset, terutama saat asap tebal. US AQI diambil dari polutan terburuk (bukan hanya PM2,5), dan skalanya bukan ISPU.
        {' '}<a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noopener noreferrer" className="underline decoration-ember underline-offset-4 hover:text-fg">Data: Open-Meteo</a>
      </p>
    </section>
  )
}

/** Panel detail kabupaten: kartu di kanan pada desktop, bottom sheet yang bisa digeser pada mobile. */
export function KabupatenSheet({ kab, onClose }: { kab: Kab; onClose: () => void }) {
  const reduce = useReducedMotion()
  const drag = useDragControls()
  const closeBtn = useRef<HTMLButtonElement>(null)
  const { meta, kabs } = useData()
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [kab.slug, onClose])

  const delta = kab.total2025 ? ((kab.total2026 - kab.total2025) / kab.total2025) * 100 : null

  return (
    <motion.aside
      key={kab.slug}
      role="dialog" aria-label={`Detail ${kab.name}`}
      initial={reduce ? false : mobile ? { y: '100%' } : { x: 40, opacity: 0 }}
      animate={mobile ? { y: 0 } : { x: 0, opacity: 1 }}
      exit={reduce ? undefined : mobile ? { y: '100%' } : { x: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 32 }}
      drag={mobile ? 'y' : false} dragListener={false} dragControls={drag} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
      onDragEnd={(_, i) => { if (i.offset.y > 90 || i.velocity.y > 500) onClose() }}
      className="absolute inset-x-0 bottom-0 z-20 max-h-[72dvh] overflow-y-auto rounded-t-[1.25rem] border border-line bg-ink-2 p-5 pb-8 shadow-[0_-24px_60px_-24px_rgb(154_52_18/0.55)] md:inset-x-auto md:bottom-36 md:right-6 md:top-20 md:max-h-none md:w-[380px] md:rounded-panel"
    >
      <div onPointerDown={e => mobile && drag.start(e)} className="-mx-5 -mt-5 mb-2 flex h-8 cursor-grab touch-none items-center justify-center md:hidden" aria-hidden>
        <span className="h-1.5 w-10 rounded-full bg-line" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-fg-3">{kab.provinceName}</p>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-fg">{kab.name}</h2>
        </div>
        <button ref={closeBtn} onClick={onClose} aria-label="Tutup detail" className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-fg-2 hover:text-fg">
          <X size={20} weight="bold" aria-hidden />
        </button>
      </div>

      <p className="mt-6 text-6xl font-extrabold leading-none tracking-tighter text-fg num">{fmt(kab.total2026)}<span className="text-ember">.</span></p>
      <p className="mt-1 text-sm text-fg-2">titik panas sejak 1 Januari 2026</p>
      {delta !== null && (
        <p className="mt-1 text-sm text-fg-2">{delta >= 0 ? 'Meningkat' : 'Menurun'} {fmt(Math.abs(delta))}% dibandingkan {fmt(kab.total2025!)} titik pada periode yang sama tahun 2025{meta?.isSample ? ' (contoh)' : ''}.</p>
      )}

      <div className="mt-6">
        <Sparkline values={kab.monthly} peak={kab.peakMonth} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5">
        <div><dt className="text-xs text-fg-3">Bulan puncak</dt><dd className="mt-1 text-lg font-bold text-fg">{MONTHS[kab.peakMonth]}</dd></div>
        <div><dt className="text-xs text-fg-3">Peringkat di seluruh wilayah</dt><dd className="mt-1 text-lg font-bold text-fg num">#{kab.rankKalimantan} dari {kabs.length}</dd></div>
      </dl>

      <AirQualityBlock lon={kab.centroid[0]} lat={kab.centroid[1]} />

      <Link to={`/wrapped/${kab.slug}`} className="btn btn-primary mt-6 w-full">Lihat <span translate="no">Karhutla Wrapped</span> <ArrowRight size={18} weight="bold" aria-hidden /></Link>
      <SourceNote className="mt-4" />
    </motion.aside>
  )
}
