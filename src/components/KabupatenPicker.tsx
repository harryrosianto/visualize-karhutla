import { MagnifyingGlass } from '@phosphor-icons/react'
import { useId, useMemo, useRef, useState } from 'react'
import { useData } from '../lib/DataContext'
import type { Kab } from '../lib/data'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '')

interface Props { onSelect: (k: Kab) => void; label?: string; hideLabel?: boolean; autoFocus?: boolean; initial?: string }

/** Combobox pencarian kabupaten/kota dengan autocomplete (ARIA 1.2, navigasi panah/enter/escape). */
export function KabupatenPicker({ onSelect, label = 'Telusuri wilayah', hideLabel, autoFocus, initial = '' }: Props) {
  const { kabs, region, error } = useData()
  const id = useId()
  const [q, setQ] = useState(initial)
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const list = useRef<HTMLUListElement>(null)

  const results = useMemo(() => {
    const n = norm(q.trim())
    const all = region ? [region, ...kabs] : kabs
    const pool = n ? all.filter(k => norm(k.name).includes(n) || norm(k.provinceName).includes(n)) : all
    return pool.slice(0, 8)
  }, [q, kabs, region])

  const choose = (k: Kab) => { setQ(k.name); setOpen(false); onSelect(k) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi(h => Math.min(results.length - 1, h + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(0, h - 1)) }
    else if (e.key === 'Enter' && open && results[hi]) { e.preventDefault(); choose(results[hi]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative w-full max-w-xl">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-2 block text-sm font-semibold text-fg'}>{label}</label>
      <div className="relative">
        <MagnifyingGlass aria-hidden size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-3" />
        <input
          id={id} role="combobox" aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list"
          aria-activedescendant={open && results[hi] ? `${id}-${results[hi].slug}` : undefined}
          autoComplete="off" autoFocus={autoFocus} value={q} disabled={!!error}
          onChange={e => { setQ(e.target.value); setOpen(true); setHi(0) }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)} onKeyDown={onKey}
          placeholder="Ketik nama kabupaten/kota"
          className="h-14 w-full rounded-full border border-fg-3/60 bg-ink/80 pl-12 pr-5 text-base text-fg placeholder:text-fg-3 focus:border-ember focus:outline-none"
        />
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-fg-2">Data belum dapat dimuat. Silakan muat ulang halaman.</p>}
      {open && !error && (
        <ul ref={list} id={`${id}-list`} role="listbox" aria-label="Hasil pencarian"
          className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-panel border border-line bg-ink-2 p-1 shadow-[0_20px_50px_-20px_rgb(154_52_18/0.5)]">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-fg-2">Wilayah tidak ditemukan. Gunakan nama lain, misalnya "Kapuas".</li>}
          {results.map((k, i) => (
            <li key={k.slug} id={`${id}-${k.slug}`} role="option" aria-selected={i === hi}
              onMouseDown={e => { e.preventDefault(); choose(k) }} onMouseEnter={() => setHi(i)}
              className={`flex min-h-[48px] cursor-pointer items-center justify-between gap-3 rounded-xl px-4 text-base ${i === hi ? 'bg-ink-3 text-fg' : 'text-fg-2'}`}>
              <span>{k.name}</span><span className="text-xs text-fg-3">{k.provinceName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
