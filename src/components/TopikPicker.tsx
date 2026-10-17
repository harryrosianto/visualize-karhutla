import { Plus, X } from '@phosphor-icons/react'
import { useId, useMemo, useState } from 'react'
import { MAKS_TOPIK } from '../content/topik'
import { normTopik, semuaTopik, slugTopik } from '../lib/cerita'

/** Pemilih topik seperti di Medium: pilih dari topik yang sudah ada atau buat topik baru. */
export function TopikPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState('')
  const listId = useId()
  const penuh = value.length >= MAKS_TOPIK
  const sudah = useMemo(() => new Set(value.map(slugTopik)), [value])
  const semua = useMemo(() => semuaTopik(), [])
  const query = normTopik(q)
  const saran = semua.filter(t => !sudah.has(slugTopik(t)) && (!q.trim() || t.toLowerCase().includes(q.trim().toLowerCase()))).slice(0, 10)
  const persis = semua.find(t => slugTopik(t) === slugTopik(query))
  const bisaBuat = !!query && !persis && !sudah.has(slugTopik(query))

  const tambah = (nama: string) => {
    const n = normTopik(nama)
    if (!n || penuh || sudah.has(slugTopik(n))) return
    onChange([...value, persis && slugTopik(persis) === slugTopik(n) ? persis : (semua.find(t => slugTopik(t) === slugTopik(n)) ?? n)])
    setQ('')
  }

  return (
    <div>
      <label htmlFor={`${listId}-input`} className="text-sm font-semibold text-fg">Topik <span className="font-normal text-fg-3">(pilih atau buat sendiri, maksimal {MAKS_TOPIK})</span></label>
      {value.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Topik terpilih">
          {value.map(t => (
            <li key={t} className="inline-flex items-center gap-1 rounded-full bg-ember py-1 pl-4 pr-1 text-sm font-semibold text-ink">
              {t}
              <button type="button" aria-label={`Hapus topik ${t}`} onClick={() => onChange(value.filter(x => x !== t))} className="grid size-7 place-items-center rounded-full hover:bg-ink/15"><X size={14} weight="bold" aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}
      <input id={`${listId}-input`} value={q} disabled={penuh} maxLength={30} placeholder={penuh ? 'Batas topik tercapai' : 'Cari atau ketik topik baru, lalu tekan Enter'}
        onChange={e => { const v = e.target.value; if (v.includes(',')) { tambah(v.replace(/,/g, '')); } else setQ(v) }}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (q.trim()) tambah(persis ?? query) } else if (e.key === 'Backspace' && !q && value.length) onChange(value.slice(0, -1)) }}
        className="mt-2 w-full rounded-panel border border-line bg-ink-3 px-4 py-3 text-fg placeholder:text-fg-3 focus:border-ember focus:outline-none disabled:opacity-60" />
      {!penuh && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Topik yang tersedia">
          {saran.map(t => <button key={t} type="button" onClick={() => tambah(t)} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line px-3 text-sm text-fg-2 hover:border-ember hover:text-fg"><Plus size={12} weight="bold" aria-hidden />{t}</button>)}
          {bisaBuat && <button type="button" onClick={() => tambah(query)} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-ember px-3 text-sm font-semibold text-fg"><Plus size={12} weight="bold" aria-hidden />Buat topik &ldquo;{query}&rdquo;</button>}
        </div>
      )}
    </div>
  )
}
