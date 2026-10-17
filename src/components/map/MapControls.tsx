import { Pause, Play } from '@phosphor-icons/react'
import { MONTHS_SHORT, fmt, fmtDate } from '../../lib/data'
import type { Meta } from '../../lib/data'
import type { Filter, MapMode } from './mapTypes'

const chip = (on: boolean) =>
  `inline-flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors ${on ? 'border-ember bg-ember text-ink' : 'border-line bg-ink-2/90 text-fg-2 hover:text-fg'}`

/** Dua baris: pulau, lalu provinsi pada pulau yang dipilih. */
export function ProvinceChips({ meta, value, onChange }: { meta: Meta | null; value: Filter; onChange: (f: Filter) => void }) {
  if (!meta) return <div className="min-h-[44px] flex-1" />
  const prov = meta.provinces.find(p => p.id === value)
  const island = prov?.island ?? (meta.islands.some(i => i.id === value) ? value : null)
  const here = island ? meta.provinces.filter(p => p.island === island) : []
  const row = 'flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none]'
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div role="group" aria-label="Filter pulau" className={row}>
        {[{ id: 'all', name: 'Semua' }, ...meta.islands].map(i => (
          <button key={i.id} type="button" aria-pressed={island === null ? i.id === 'all' : i.id === island} onClick={() => onChange(i.id)} className={chip(island === null ? i.id === 'all' : i.id === island)}>{i.name}</button>
        ))}
      </div>
      {here.length > 0 && (
        <div role="group" aria-label="Filter provinsi" className={row}>
          <button type="button" aria-pressed={value === island} onClick={() => onChange(island!)} className={chip(value === island)}>Semua provinsi</button>
          {here.map(p => (
            <button key={p.id} type="button" aria-pressed={value === p.id} onClick={() => onChange(p.id)} className={chip(value === p.id)}>{p.short}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ModeToggle({ value, onChange }: { value: MapMode; onChange: (m: MapMode) => void }) {
  const opts: { id: MapMode; label: string }[] = [{ id: 'titik', label: 'Titik panas' }, { id: 'hex', label: 'Kepadatan 3D' }]
  return (
    <div role="radiogroup" aria-label="Mode tampilan" className="inline-flex rounded-full border border-line bg-ink p-1">
      {opts.map(o => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
          className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition-colors ${value === o.id ? 'bg-ember text-ink' : 'text-fg-2 hover:text-fg'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

interface DockProps {
  days: string[]; day: number; onDay: (d: number) => void; playing: boolean; onPlay: () => void
  today: number; cumulative: number; mode: MapMode; onMode: (m: MapMode) => void
}

export function TimeDock({ days, day, onDay, playing, onPlay, today, cumulative, mode, onMode }: DockProps) {
  const max = Math.max(0, days.length - 1)
  const label = days[day] ? fmtDate(days[day]) : ''
  // posisi awal tiap bulan sebagai penanda di bawah slider
  const ticks = MONTHS_SHORT.map((m, i) => ({ m, i, at: days.findIndex(d => d.slice(5, 7) === String(i + 1).padStart(2, '0')) })).filter(t => t.at >= 0)
  return (
    <section aria-label="Garis waktu" className="rounded-panel border border-line bg-ink-2/95 p-3 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onPlay} aria-label={playing ? 'Jeda animasi' : 'Putar animasi penyebaran'}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-ember text-ink transition-transform active:scale-95">
            {playing ? <Pause size={22} weight="fill" aria-hidden /> : <Play size={22} weight="fill" aria-hidden />}
          </button>
          <div>
            <p className="text-base font-bold leading-tight text-fg num md:text-lg" aria-live="polite">{label}</p>
            <p className="text-xs text-fg-2 num">
              {today > 0 ? `${fmt(today)} titik panas pada hari tersebut` : 'Tidak terdapat titik panas pada hari tersebut'}; kumulatif {fmt(cumulative)} sejak 1 Januari
            </p>
          </div>
        </div>
        <ModeToggle value={mode} onChange={onMode} />
      </div>
      <div className="mt-1 md:mt-3">
        <label htmlFor="time-range" className="sr-only">Tanggal</label>
        <input id="time-range" type="range" min={0} max={max} value={day} onChange={e => onDay(Number(e.target.value))}
          aria-valuetext={label} className="ember-range h-11 w-full cursor-pointer" />
        <div className="relative -mt-1 h-4 text-[11px] text-fg-3" aria-hidden>
          {ticks.map(t => (
            <span key={t.m} className={`absolute -translate-x-1/2 ${t.i % 3 === 0 ? '' : 'max-sm:hidden'}`} style={{ left: `${(t.at / Math.max(1, max)) * 100}%` }}>{t.m}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Legend({ mode }: { mode: MapMode }) {
  return (
    <div className="flex items-center gap-4 text-xs text-fg-2">
      {mode === 'titik' ? (
        <>
          <span className="flex items-center gap-1.5"><i aria-hidden className="size-2.5 rounded-full bg-ember" />Titik panas</span>
          <span className="flex items-center gap-1.5"><i aria-hidden className="size-2.5 rounded-full bg-hot" />Intensitas tertinggi (persentil ke-95)</span>
        </>
      ) : (
        <span>Semakin tinggi dan terang kolom, semakin padat titik panas.</span>
      )}
    </div>
  )
}
